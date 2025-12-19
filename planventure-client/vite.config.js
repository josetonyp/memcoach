import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: path.join(__dirname, "../client"),
  },
  esbuild: {
    loader: "jsx",
    include: /src\/.*\.[jt]sx?$/, //include both .js and .jsx
  },
  optimizeDeps: {
    include: ["@emotion/styled"],
    esbuild: {
      loader: {
        ".js": "jsx",
        ".jsx": "jsx",
      },
    },
  },
});
