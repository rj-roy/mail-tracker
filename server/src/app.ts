import express from "express";
import cors from "cors";
import trackedEmailRoutes from "./routes/tracked-email.routes.js";
import pixelRoutes from "./routes/pixel.routes.js";
import authRoutes from "./routes/auth.routes.js";
import sendRoutes from "./routes/send.routes.js";
import { errorHandler } from "./middleware/error-handler.js";
import { sessionMiddleware } from "./middleware/session.js";

const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json());
app.use(sessionMiddleware);

app.get("/health", (_req, res) => {
  res.json({
    success: true,
    message: "Mail Tracker API is running",
  });
});

app.use("/api", trackedEmailRoutes);
app.use("/api", sendRoutes);
app.use("/", authRoutes);
app.use("/", pixelRoutes);

app.use(errorHandler);

export default app;
