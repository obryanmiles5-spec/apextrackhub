import "dotenv/config";
import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { trackEvent } from "./src/lib/tracking";

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "shipments_db.json");

// Dynamic JSON database directory tracking
const loadShipmentsFromDb = (): any[] => {
  if (!fs.existsSync(DB_FILE)) {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify([]), "utf-8");
    } catch (err) {
      console.error("Critical: Failed to initialize shipments database file:", err);
    }
    return [];
  }
  try {
    const data = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(data) || [];
  } catch (err) {
    console.error("Warning: Error reading shipments from database file, using empty default:", err);
    return [];
  }
};

const saveShipmentsToDb = (shipments: any[]) => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(shipments, null, 2), "utf-8");
  } catch (err) {
    console.error("Critical: Error writing shipments to database file:", err);
  }
};

async function start() {
  app.use(express.json({ limit: "15mb" }));

  // API Endpoints for unified logistics data tracking
  app.get("/api/shipments", async (req, res) => {
    try {
      const list = loadShipmentsFromDb();
      // Track read action silently
      trackEvent("read_shipments_db", { count: list.length }).catch(() => {});
      res.json(list);
    } catch (err) {
      res.status(500).json({ error: "Failed to read database records" });
    }
  });

  app.post("/api/shipments", async (req, res) => {
    try {
      const updatedList = req.body;
      if (!Array.isArray(updatedList)) {
        return res.status(400).json({ error: "Payload must be an array of shipments" });
      }
      saveShipmentsToDb(updatedList);
      // Track write action
      trackEvent("write_shipments_db", { count: updatedList.length }).catch(() => {});
      res.json(updatedList);
    } catch (err) {
      res.status(500).json({ error: "Failed to update database records" });
    }
  });

  // Central tracking proxy endpoint for client-side analytics telemetry
  app.post("/api/track", async (req, res) => {
    try {
      const { event_name, event_data } = req.body;
      if (!event_name) {
        return res.status(400).json({ error: "event_name is required in payload" });
      }
      const result = await trackEvent(event_name, event_data);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err?.message || String(err) });
    }
  });

  // Vite integration middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Logistics Server] Active on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error("Critical failure during server startup:", err);
});
