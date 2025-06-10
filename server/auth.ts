import session from "express-session";
import MemoryStore from "memorystore";
import { Express, RequestHandler } from "express";

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const MemStore = MemoryStore(session);
  const sessionStore = new MemStore({
    checkPeriod: sessionTtl,
  });

  console.log('📦 Setting up session store');

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

export async function setupAuth(app: Express) {
  console.log('🔧 Setting up basic session management...');

  app.set("trust proxy", 1);
  app.use(getSession());
  
  // Simple auth routes that return unauthenticated status
  app.get("/api/auth/user", (req, res) => {
    res.status(401).json({ 
      message: "Authentication disabled", 
      authenticated: false 
    });
  });
  
  app.get("/api/login", (req, res) => {
    res.status(503).json({ 
      message: "Authentication service disabled" 
    });
  });
  
  app.get("/api/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Error destroying session:", err);
      }
      res.redirect("/");
    });
  });
  
  console.log('✅ Basic session setup completed (authentication disabled)');
}

// Middleware that allows all requests to pass through
export const isAuthenticated: RequestHandler = async (req, res, next) => {
  console.log('📊 Authentication middleware bypassed (auth disabled)');
  next();
};