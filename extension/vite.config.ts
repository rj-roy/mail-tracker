import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { copyFileSync } from "node:fs";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

function copyManifest() {
  return {
    name: "copy-manifest",
    closeBundle() {
      copyFileSync(
        resolve(__dirname, "manifest.json"),
        resolve(__dirname, "dist/manifest.json")
      );
    },
  };
}

export default defineConfig({
  plugins: [react(), copyManifest()],

  build: {
    outDir: "dist",
    emptyOutDir: true,

    rollupOptions: {
      input: {
        popup: resolve(__dirname, "popup.html"),
        background: resolve(__dirname, "src/background/index.ts"),
        content: resolve(__dirname, "src/content/index.ts"),
      },

      output: {
        entryFileNames: (chunk) => {
          if (chunk.name === "background") {
            return "background.js";
          }

          if (chunk.name === "content") {
            return "content.js";
          }

          return "assets/[name].js";
        },
      },
    },
  },
});
