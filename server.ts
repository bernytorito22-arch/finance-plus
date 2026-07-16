import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { resolveAnalyze } from "./src/utils/analyzeInsight";

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

app.use(express.json());

const apiKey = process.env.GEMINI_API_KEY;
if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
  console.log("GEMINI_API_KEY found. AI insights enabled via REST.");
} else {
  console.log(
    "No valid GEMINI_API_KEY environment variable found. Falling back to local smart insights."
  );
}

app.post("/api/analyze", async (req, res) => {
  try {
    const result = await resolveAnalyze(req.body, apiKey);
    return res.json(result);
  } catch (err) {
    console.error("Failed to analyze expenses:", err);
    return res.status(500).json({
      insight: "No pudimos analizar ahora. Intenta de nuevo.",
      savingGoal: "Revisa tus gastos del mes",
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
