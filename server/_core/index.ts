import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { handleWebhook } from "../stripe";
import { updateUserSubscription } from "../db";
import { serveStatic, setupVite } from "./vite";
import { registerUploadRoutes } from "../uploadRoute";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  registerUploadRoutes(app);
  // ── Stripe Webhook ─────────────────────────────────────
  app.post("/api/webhook/stripe", express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'] as string;
    let event;

    try {
      event = await handleWebhook(req.body, sig);
      
      // 處理支付成功
      if (event && event.type === 'checkout.session.completed') {
        const session = event.data.object as any;
        const userOpenId = session.metadata.userOpenId;
        
        // 延長 1 年訂閱
        const expiresAt = new Date();
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
        
        await updateUserSubscription(userOpenId, {
          subscriptionStatus: 'active',
          subscriptionExpiresAt: expiresAt,
          stripeCustomerId: session.customer as string,
        });
        
        console.log(`[Stripe] Subscription activated for user: ${userOpenId}`);
      }
      
      res.json({ received: true });
    } catch (err: any) {
      console.error(`[Stripe] Webhook Error: ${err.message}`);
      res.status(400).send(`Webhook Error: ${err.message}`);
    }
  });

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
