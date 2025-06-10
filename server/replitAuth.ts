import { Issuer, Strategy, TokenSet, UserinfoResponse } from "openid-client";
import passport from "passport";
import session from "express-session";
import MemoryStore from "memorystore";
import { Express, RequestHandler } from "express";
import { storage } from "./storage";
import memoize from "lodash.memoize";

const getIssuer = memoize(async () => {
  console.log('🔍 Discovering Replit OIDC issuer...');
  const issuer = await Issuer.discover("https://replit.com");
  console.log('✅ OIDC Issuer discovered:', issuer.metadata);
  return issuer;
});

const getOidcClient = memoize(
  async (domain: string) => {
    console.log(`🔧 Creating OIDC client for domain: ${domain}`);
    const issuer = await getIssuer();
    return new issuer.Client({
      client_id: process.env.REPL_ID!,
      client_secret: process.env.REPLIT_CLIENT_SECRET,
      redirect_uris: [`https://${domain}/api/callback`],
      response_types: ['code'],
    });
  },
  { maxAge: 3600 * 1000, normalizer: args => args[0] }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 semana
  const MemStore = MemoryStore(session);
  const sessionStore = new MemStore({
    checkPeriod: sessionTtl,
  });

  console.log('📦 Configurando session store com TTL:', sessionTtl);

  return session({
    secret: process.env.SESSION_SECRET || "granduvale-secret-key-for-development",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: sessionTtl,
      sameSite: process.env.NODE_ENV === 'production' ? 'lax' : 'lax',
    },
    name: 'granduvale.session',
  });
}

function updateUserSession(user: any, tokens: TokenSet) {
  console.log('🔄 Updating user session with new tokens');
  user.claims = tokens.claims();
  user.id_token = tokens.id_token;
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = tokens.expires_at;
  console.log('✅ User session updated. Expires at:', new Date((tokens.expires_at || 0) * 1000).toISOString());
}

async function upsertUser(userInfo: UserinfoResponse, claims: any) {
  const subject = userInfo.sub || claims?.sub;
  if (!subject) {
    console.error("❌ Error: Missing subject (sub) in userinfo and claims.");
    throw new Error("Missing user subject");
  }

  console.log('👤 Upserting user:', {
    subject,
    email: userInfo.email || claims?.email,
    name: userInfo.name || claims?.name
  });

  await storage.upsertUser({
    id: subject,
    email: userInfo.email || claims?.email,
    firstName: userInfo.given_name || claims?.given_name || userInfo.name?.split(' ')[0] || claims?.name?.split(' ')[0],
    lastName: userInfo.family_name || claims?.family_name || userInfo.name?.split(' ').slice(1).join(' ') || claims?.name?.split(' ').slice(1).join(' '),
    profileImageUrl: userInfo.picture || claims?.picture,
  });

  console.log('✅ User upserted successfully');
}

export async function setupAuth(app: Express) {
  console.log('🔧 Setting up authentication...');

  // Verificar variáveis de ambiente necessárias
  const requiredEnvVars = ['REPL_ID', 'REPLIT_DOMAINS'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:', missingVars);
    throw new Error(`Missing environment variables: ${missingVars.join(', ')}`);
  }

  console.log('✅ Environment variables check passed');
  console.log('🌍 Replit domains:', process.env.REPLIT_DOMAINS);
  console.log('🆔 Repl ID:', process.env.REPL_ID);
  console.log('🔒 Has client secret:', !!process.env.REPLIT_CLIENT_SECRET);
  console.log('🔑 Has session secret:', !!process.env.SESSION_SECRET);

  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const issuer = await getIssuer();

  const verify = async (
    tokenset: TokenSet,
    userinfo: UserinfoResponse,
    done: (err: any, user?: any) => void
  ) => {
    try {
      console.log('✅ OAuth callback - verifying user:', userinfo.sub);
      const user: any = { ...userinfo };
      updateUserSession(user, tokenset);
      await upsertUser(userinfo, tokenset.claims());
      console.log('✅ User verification completed successfully');
      return done(null, user);
    } catch (err) {
      console.error("❌ Error during user verification or upsert:", err);
      return done(err);
    }
  };

  // Configurar strategies para cada domínio
  const domains = process.env.REPLIT_DOMAINS!.split(",");
  console.log('🔧 Setting up passport strategies for domains:', domains);

  for (const domain of domains) {
    const client = await getOidcClient(domain);
    const params = {
      scope: "openid email profile offline_access",
    };

    passport.use(
      `replitauth:${domain}`,
      new Strategy(
        {
          client,
          params,
          passReqToCallback: false,
          usePKCE: 'S256',
        },
        verify
      )
    );

    console.log(`✅ Strategy configured for domain: ${domain}`);
  }

  passport.serializeUser((user: Express.User, cb) => {
    console.log('📦 Serializing user:', (user as any)?.sub || 'unknown');
    cb(null, user);
  });

  passport.deserializeUser((user: Express.User, cb) => {
    console.log('📋 Deserializing user:', (user as any)?.sub || 'unknown');
    cb(null, user);
  });

  // Rotas de autenticação
  app.get("/api/login", (req, res, next) => {
    console.log('🚪 Login initiated from:', req.get('Referer') || 'direct');

    // Store the original URL in session to redirect after login
    if (req.query.returnTo) {
      req.session.returnTo = req.query.returnTo as string;
      console.log('📍 Return URL from query:', req.session.returnTo);
    } else if (req.get('Referer') && !req.get('Referer')?.includes('/api/login') && !req.get('Referer')?.includes('/api/callback')) {
      const refererUrl = new URL(req.get('Referer')!);
      if (refererUrl.hostname === req.hostname) {
        req.session.returnTo = refererUrl.pathname + refererUrl.search + refererUrl.hash;
        console.log('📍 Return URL from referer:', req.session.returnTo);
      }
    } else if (req.originalUrl && !req.originalUrl.startsWith("/api/")) {
      req.session.returnTo = req.originalUrl;
      console.log('📍 Return URL from original:', req.session.returnTo);
    }

    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    const redirectPath = req.session.returnTo || "/";
    console.log('🔄 OAuth callback - redirecting to:', redirectPath);
    delete req.session.returnTo;

    passport.authenticate(`replitauth:${req.hostname}`, {
      successRedirect: redirectPath,
      failureRedirect: "/api/login?error=auth_failed",
      failureFlash: true,
    })(req, res, next);
  });

  app.get("/api/logout", async (req, res, next) => {
    console.log('🚪 Logout initiated for user:', (req.user as any)?.sub || 'unknown');
    const idToken = (req.user as any)?.id_token;

    req.logout((err) => {
      if (err) {
        console.error("❌ Error during logout:", err);
        return next(err);
      }

      req.session.destroy(async (sessionErr) => {
        if (sessionErr) {
          console.error("❌ Error destroying session:", sessionErr);
          return next(sessionErr);
        }

        try {
          if (idToken) {
            const client = await getOidcClient(req.hostname);
            const endSessionUrl = client.endSessionUrl({
              id_token_hint: idToken,
              post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
            });
            console.log('🔄 Redirecting to Replit logout:', endSessionUrl);
            res.redirect(endSessionUrl);
          } else {
            console.log('🔄 No ID token, redirecting to home');
            res.redirect(`${req.protocol}://${req.hostname}`);
          }
        } catch (e) {
          console.error("❌ Error building end session URL:", e);
          res.redirect(`${req.protocol}://${req.hostname}`);
        }
      });
    });
  });

  console.log('✅ Authentication setup completed');
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const startTime = Date.now();

  // Debug detalhado
  console.log('🔍 Auth Check:', {
    method: req.method,
    url: req.originalUrl,
    hostname: req.hostname,
    sessionID: req.sessionID?.substring(0, 8) + '...',
    userAgent: req.get('User-Agent')?.substring(0, 50) + '...',
    timestamp: new Date().toISOString()
  });

  // Development bypass
  if (process.env.NODE_ENV === 'development') {
    console.log('🔧 Development mode: Using mock user');
    req.user = {
      claims: {
        sub: 'dev-user-1',
        email: 'admin@dev.local',
        given_name: 'Admin',
        family_name: 'User',
        picture: null
      }
    };
    return next();
  }

  if (req.isAuthenticated() && req.user) {
    const user = req.user as any;
    const now = Math.floor(Date.now() / 1000);

    console.log('👤 User authenticated:', {
      sub: user.sub || user.claims?.sub,
      hasExpiration: !!user.expires_at,
      expiresAt: user.expires_at ? new Date(user.expires_at * 1000).toISOString() : 'never',
      currentTime: new Date(now * 1000).toISOString(),
      isExpired: user.expires_at ? now >= user.expires_at : false,
      hasRefreshToken: !!user.refresh_token
    });

    // Verificar se token ainda é válido
    if (user.expires_at && now < user.expires_at) {
      console.log(`✅ Token válido por mais ${Math.floor((user.expires_at - now) / 60)} minutos`);
      console.log(`⏱️  Auth check completed in ${Date.now() - startTime}ms`);
      return next();
    }

    // Token expirou, tentar refresh
    const refreshToken = user.refresh_token;
    if (refreshToken) {
      console.log('🔄 Token expirado, tentando refresh...');
      try {
        const client = await getOidcClient(req.hostname);
        const tokenSet = await client.refresh(refreshToken);

        updateUserSession(req.user, tokenSet);
        req.login(req.user, err => {
          if (err) {
            console.error("❌ Error after token refresh:", err);
            return next(err);
          }
          console.log('✅ Token refreshed successfully');
          console.log(`⏱️  Auth check completed in ${Date.now() - startTime}ms`);
          return next();
        });
      } catch (error: any) {
        console.error("❌ Failed to refresh token:", error.message);
        const isApiRequest = req.headers.accept?.includes("application/json");

        req.logout(() => {
          req.session.destroy((err) => {
            if (err) {
              console.error("❌ Error destroying session during token refresh failure:", err);
            }

            if (isApiRequest) {
              res.status(401).json({
                error: "session_expired",
                message: "Your session has expired. Please log in again.",
                details: error.message
              });
            } else {
              res.redirect("/api/login");
            }
          });
        });
      }
    } else {
      console.log('❌ No refresh token available');
      const isApiRequest = req.headers.accept?.includes("application/json");

      req.logout(() => {
        req.session.destroy((err) => {
          if (err) {
            console.error("❌ Error destroying session due to no refresh token:", err);
          }

          if (isApiRequest) {
            res.status(401).json({ 
              error: "authentication_required", 
              message: "Authentication required. No refresh token." 
            });
          } else {
            if (req.originalUrl && !req.originalUrl.startsWith("/api/")) {
              req.session.returnTo = req.originalUrl;
            }
            res.redirect("/api/login");
          }
        });
      });
    }
  } else {
    console.log('❌ User not authenticated');
    const isApiRequest = req.headers.accept?.includes("application/json");

    if (isApiRequest) {
      res.status(401).json({ 
        error: "authentication_required", 
        message: "Authentication required." 
      });
    } else {
      if (req.originalUrl && !req.originalUrl.startsWith("/api/")) {
        req.session.returnTo = req.originalUrl;
      }
      res.redirect("/api/login");
    }
  }

  console.log(`⏱️  Auth check completed in ${Date.now() - startTime}ms`);
};