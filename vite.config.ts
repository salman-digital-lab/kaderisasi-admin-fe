import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import envCompatible from "vite-plugin-env-compatible";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), envCompatible()],
  preview: {
    port: 3005,
    strictPort: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router-dom", "zustand"],
          antd: ["antd"],
          tiptap: [
            "@tiptap/react",
            "@tiptap/starter-kit",
            "@tiptap/extension-link",
            "@tiptap/extension-placeholder",
            "@tiptap/extension-text-align",
            "@tiptap/extension-underline",
          ],
          "dnd-kit": ["@dnd-kit/core", "@dnd-kit/sortable"],
          utils: ["axios", "dayjs", "ahooks"],
        },
      },
    },
  },
});
