import "dotenv/config";
import app from "./app.js";
import { connectDatabase } from "./config/database.js";
import { createIndexes } from "./config/indexes.js";

const PORT = Number(process.env.PORT) || 5000;

async function bootstrap() {
  try {
    await connectDatabase();
    await createIndexes();

    app.listen(PORT, () => {
      console.log(`Mail Tracker API running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

bootstrap();
