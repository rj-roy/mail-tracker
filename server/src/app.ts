import express from "express";
import cors from "cors";
import trackedEmailRoutes from "./routes/tracked-email.routes.js";
import pixelRoutes from "./routes/pixel.routes.js";
import { errorHandler } from "./middleware/error-handler.js";

const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({
    success: true,
    message: "Mail Tracker API is running",
  });
});

app.use("/api", trackedEmailRoutes);
app.use("/", pixelRoutes);

app.use(errorHandler);

export default app;
