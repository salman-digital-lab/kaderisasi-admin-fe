import { defineConfig, mergeConfig } from "vite";
import config from "../../vite.config";
export default mergeConfig(
  config,
  defineConfig({
    base: "./",
    build: {
      outDir: "tests/browser/dist",
      rollupOptions: { input: "tests/browser/certificate.html" },
    },
  }),
);
