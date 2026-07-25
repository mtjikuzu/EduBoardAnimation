import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { startMcpServer } from "./excalidraw/mcpServer";
import { startRenderWorker } from "./queue/renderQueue";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// Startup background services (non-blocking — failures don't crash the server)
(async () => {
  try {
    startMcpServer();
  } catch (err) {
    logger.warn({ err }, "Failed to start MCP server — Excalidraw agent tools unavailable");
  }
  try {
    startRenderWorker();
  } catch (err) {
    logger.warn({ err }, "Failed to start render worker — queue processing unavailable");
  }
})();

export default app;
