import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  base: "/memcoach/",
  plugins: [react()],
  build: {
    outDir: path.join(__dirname, "../docs"),
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
