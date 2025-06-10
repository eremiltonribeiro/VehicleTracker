import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    // TODO: Implement structured logging for production
    console.error(`[Unhandled Error] ${ _req.method } ${_req.originalUrl}:`, err);

    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    // Ensure response is sent only if headers haven't already been sent
    if (!res.headersSent) {
      res.status(status).json({ message });
    }
    // Do not call _next(err) with the error again if you've handled the response.
    // If you want to delegate to further error handlers (e.g. default Express handler in some cases),
    // then you might call _next(err), but typically for a final handler, you just send the response.
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  
  const startServer = (portToTry: number) => {
    server.listen(portToTry, "0.0.0.0", () => {
      log(`serving on port ${portToTry} (http://0.0.0.0:${portToTry})`);
    });
  };
  
  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      const nextPort = port + 1;
      console.log(`Port ${port} is busy, trying ${nextPort}`);
      startServer(nextPort);
    } else {
      console.error('Server error:', err);
      throw err;
    }
  });
  
  startServer(port);
})();
