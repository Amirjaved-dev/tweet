import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { registerRoutes as registerApiRoutes } from "./routes/index";
import { canGenerateThread } from "./db/storage";
import { config } from "./config";
import healthRouter from "./routes/health";
import testRouter from "./routes/test";

export async function registerRoutes(app: Express): Promise<Server> {
  // Register API routes from the routes directory
  const httpServer = await registerApiRoutes(app);
  
  // Register health check route
  app.use('/api/health', healthRouter);
  
  // Register test route
  app.use('/api/test', testRouter);
  
  // Basic user endpoints
  app.get("/api/user", async (req, res) => {
    res.json({ user: null });
  });

  app.post("/api/register", async (req, res) => {
    res.json({ message: "Registration not available in demo mode" });
  });

  app.post("/api/login", async (req, res) => {
    res.json({ message: "Login not available in demo mode" });
  });

  app.post("/api/logout", (req, res) => {
    res.json({ message: "Logout successful" });
  });

  // Usage endpoint for checking thread limits
  app.get("/api/usage", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      
      if (!userId) {
        return res.status(200).json({
          used: 0,
          limit: config.dailyThreadLimitFree,
          resetTime: getNextDayResetTime(),
          plan: "free"
        });
      }
      
      // Get user's subscription and usage data
      const { canGenerate, remaining } = await canGenerateThread(userId);
      
      // Determine if user is on free or pro plan
      // This is a simplification - in a real app, you would query the subscription table
      const isPro = remaining > config.dailyThreadLimitFree;
      const plan = isPro ? "pro" : "free";
      
      // Calculate daily limit based on plan
      const limit = plan === "pro" ? config.dailyThreadLimitPro : config.dailyThreadLimitFree;
      
      // Calculate used threads
      const used = limit - remaining;
      
      res.json({
        used,
        limit,
        resetTime: getNextDayResetTime(),
        plan
      });
    } catch (error) {
      console.error("Error fetching usage data:", error);
      res.status(500).json({ error: "Failed to fetch usage data" });
    }
  });

  return httpServer;
}

// Helper function to get the reset time (midnight tonight)
function getNextDayResetTime(): number {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow.getTime();
}