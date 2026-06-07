import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dns from "dns";

// Keep DNS resolution stable in sandbox environments
dns.setDefaultResultOrder("ipv4first");

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON parsing support
  app.use(express.json());

  // API router
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Proxy Endpoint for WorkoutX (bypasses browser CORS block)
  app.get("/api/workoutx", async (req, res) => {
    const q = req.query.q as string;
    if (!q) {
      return res.status(400).json({ error: "Query parameter 'q' is required" });
    }
    const WORKOUTX_API_KEY = "wx_2f5e7d97345de8a1af152ca4bc65f17f969d18997ef865004f66cf18";
    const targetUrl = `https://workoutxapp.com/api/v1/exercises/name/${encodeURIComponent(q)}`;

    try {
      const resp = await fetch(targetUrl, {
        headers: {
          "x-api-key": WORKOUTX_API_KEY,
        },
      });
      if (resp.ok) {
        const data = await resp.json();
        return res.json(data);
      } else {
        return res.status(resp.status).json({ error: "Failed to fetch from WorkoutX" });
      }
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // Proxy Endpoint for GIFs to bypass hotlink block via server side loading
  app.get("/api/gif-proxy", async (req, res) => {
    const url = req.query.url as string;
    if (!url) {
      return res.status(400).json({ error: "URL parameter required" });
    }
    try {
      const resp = await fetch(url, {
        headers: {
          "Referer": "", // clear referer to bypass hotlinking
        },
      });
      if (resp.ok) {
        const buffer = await resp.arrayBuffer();
        res.setHeader("Content-Type", "image/gif");
        res.setHeader("Cache-Control", "public, max-age=86400"); // Cache for 1 day
        return res.send(Buffer.from(buffer));
      } else {
        return res.status(resp.status).send(`Failed to load GIF: ${resp.status}`);
      }
    } catch (err: any) {
      return res.status(500).send(`Error: ${err.message}`);
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite dev middleware mounted successfully.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Gym - Gemini back-end proxy running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
