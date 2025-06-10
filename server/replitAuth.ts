import { Issuer, Strategy, type TokenSet, type UserinfoResponse, type Client } from 'openid-client';
import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import MemoryStore from "memorystore";
import { storage } from "./storage";

// Extend Session interface to include returnTo
declare module 'express-session' {
  interface SessionData {
    returnTo?: string;
  }
}



if (!process.env.REPLIT_DOMAINS) {
  throw new Error("Variável de ambiente REPLIT_DOMAINS não fornecida");
}

const getIssuer = memoize(
  async () => {
    return await Issuer.discover(process.env.ISSUER_URL ?? "https://replit.com/oidc");
  },
  { maxAge: 3600 * 1000 }
);

const getOidcClient = memoize(
  async (domain: string) => {
    const issuer = await getIssuer();
    return new issuer.Client({
      client_id: process.env.REPL_ID!,
      client_secret: process.env.REPLIT_CLIENT_SECRET, // Assuming you have a client secret
      redirect_uris: [`https://${domain}/api/callback`],
      response_types: ['code'],
      // id_token_signed_response_alg: 'RS256', // Default is RS256, adjust if needed
    });
  },
  { maxAge: 3600 * 1000, normalizer: args => args[0] } // Normalize by domain
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 semana
  const MemStore = MemoryStore(session);
  const sessionStore = new MemStore({
    checkPeriod: sessionTtl, // prune expired entries every 7 days
  });
  return session({
    secret: process.env.SESSION_SECRET || "granduvale-secret-key-for-development",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: TokenSet
) {
  user.claims = tokens.claims();
  user.id_token = tokens.id_token;
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = tokens.expires_at;
}

async function upsertUser(
  userInfo: UserinfoResponse,
  claims: any // claims can be used as a fallback
) {
  const subject = userInfo.sub || claims?.sub;
  if (!subject) {
    console.error("Error: Missing subject (sub) in userinfo and claims.");
    // Decide if you want to throw an error or handle it differently
    // For now, we'll let it proceed, but it might cause issues downstream
  }
  await storage.upsertUser({
    id: subject,
    email: userInfo.email || claims?.email,
    firstName: userInfo.given_name || claims?.given_name || userInfo.name?.split(' ')[0] || claims?.name?.split(' ')[0],
    lastName: userInfo.family_name || claims?.family_name || userInfo.name?.split(' ').slice(1).join(' ') || claims?.name?.split(' ').slice(1).join(' '),
    profileImageUrl: userInfo.picture || claims?.picture,
  });
}

export async function setupAuth(app: Express) {
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
      const user: any = { ...userinfo }; // Store userinfo directly
      updateUserSession(user, tokenset);
      await upsertUser(userinfo, tokenset.claims()); // Pass both userinfo and claims
      return done(null, user);
    } catch (err) {
      console.error("Error during user verification or upsert:", err);
      return done(err);
    }
  };

  for (const domain of process.env.REPLIT_DOMAINS!.split(",")) {
    const client = await getOidcClient(domain);
    const params = {
      // client_id: process.env.REPL_ID!, // Already in client
      // redirect_uri: `https://${domain}/api/callback`, // Already in client
      scope: "openid email profile offline_access",
      // response_type: 'code', // Already in client
      // usePKCE: 'S256', // Default for the library, but can be explicit
    };

    passport.use(
      `replitauth:${domain}`,
      new Strategy(
        {
          client,
          params,
          passReqToCallback: false, // We are not using req in verify
          usePKCE: 'S256',
        },
        verify
      )
    );
  }

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    // Store the original URL in session to redirect after login
    if (req.query.returnTo) {
      req.session.returnTo = req.query.returnTo as string;
    } else if (req.get('Referer') && !req.get('Referer')?.includes('/api/login') && !req.get('Referer')?.includes('/api/callback')) {
      // Fallback to Referer header if not an API call internal redirect
       const refererUrl = new URL(req.get('Referer')!);
       if (refererUrl.hostname === req.hostname) { // Only redirect to same hostname
         req.session.returnTo = refererUrl.pathname + refererUrl.search + refererUrl.hash;
       }
    } else if (req.originalUrl && !req.originalUrl.startsWith("/api/")) {
       req.session.returnTo = req.originalUrl;
    }


    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent", // Replit might not use prompt, but it's a common OIDC param
      // scope is already defined in the strategy params
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    const redirectPath = req.session.returnTo || "/";
    delete req.session.returnTo; // Clean up session

    passport.authenticate(`replitauth:${req.hostname}`, {
      successRedirect: redirectPath,
      failureRedirect: "/api/login?error=auth_failed", // Add error query param
      failureFlash: true, // Optional: if you want to use connect-flash for messages
    })(req, res, next);
  });

  app.get("/api/logout", async (req, res, next) => {
    const idToken = (req.user as any)?.id_token;
    req.logout((err) => {
      if (err) {
        console.error("Error during logout:", err);
        return next(err);
      }
      req.session.destroy(async (sessionErr) => {
        if (sessionErr) {
          console.error("Error destroying session:", sessionErr);
          return next(sessionErr);
        }
        try {
          const client = await getOidcClient(req.hostname);
          const endSessionUrl = client.endSessionUrl({
            id_token_hint: idToken,
            post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
          });
          res.redirect(endSessionUrl);
        } catch (e) {
          console.error("Error building end session URL:", e);
          res.redirect(`${req.protocol}://${req.hostname}`); // Fallback redirect
        }
      });
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  if (req.isAuthenticated() && req.user) {
    const user = req.user as any;
    const now = Math.floor(Date.now() / 1000);

    if (user.expires_at && now < user.expires_at) {
      return next();
    }

    // Token has expired or is missing, try to refresh
    const refreshToken = user.refresh_token;
    if (refreshToken) {
      try {
        const client = await getOidcClient(req.hostname);
        const tokenSet = await client.refresh(refreshToken);

        updateUserSession(req.user, tokenSet);
        // req.login is used by passport to update the session with the new user object
        req.login(req.user, err => {
          if (err) {
            console.error("Error after token refresh, relogging user:", err);
            return next(err);
          }
          return next();
        });
      } catch (error: any) {
        console.error("Failed to refresh token:", error.message, error.stack);
        // Determine if it's an API request
        const isApiRequest = req.headers.accept?.includes("application/json");
        req.logout(() => { // Log out the user as refresh failed
            req.session.destroy((err) => {
                if (err) {
                    console.error("Error destroying session during token refresh failure:", err);
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
      // No refresh token available
      const isApiRequest = req.headers.accept?.includes("application/json");
      req.logout(() => { // Log out the user
        req.session.destroy((err) => {
            if (err) {
                console.error("Error destroying session due to no refresh token:", err);
            }
            if (isApiRequest) {
                res.status(401).json({ error: "authentication_required", message: "Authentication required. No refresh token." });
            } else {
                // Store original URL before redirecting to login
                if (req.originalUrl && !req.originalUrl.startsWith("/api/")) {
                    req.session.returnTo = req.originalUrl;
                }
                res.redirect("/api/login");
            }
        });
      });
    }
  } else {
    // Not authenticated at all
    const isApiRequest = req.headers.accept?.includes("application/json");
    if (isApiRequest) {
      res.status(401).json({ error: "authentication_required", message: "Authentication required." });
    } else {
       // Store original URL before redirecting to login
       if (req.originalUrl && !req.originalUrl.startsWith("/api/")) {
         req.session.returnTo = req.originalUrl;
       }
      res.redirect("/api/login");
    }
  }
};