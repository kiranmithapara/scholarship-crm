import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "path";
// Vite config - React 19 + TS + path aliases (@/ -> src/)
export default defineConfig({
    plugins: [react(), tsconfigPaths()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    server: {
        port: 5173,
        // Local dev me backend proxy - production me VITE_API_URL env se hit hota hai
        proxy: {
            "/api": {
                target: "http://localhost:5000",
                changeOrigin: true,
            },
            "/uploads": {
                target: "http://localhost:5000",
                changeOrigin: true,
            },
        },
    },
    build: {
        outDir: "dist",
        sourcemap: false, // production build me sourcemap off (security + size)
        chunkSizeWarningLimit: 1000,
        rollupOptions: {
            output: {
                // Manual chunking - vendor libs alag chunk me, better caching
                manualChunks: {
                    "react-vendor": ["react", "react-dom", "react-router-dom"],
                    "form-vendor": ["react-hook-form", "@hookform/resolvers", "zod"],
                    "ui-vendor": ["framer-motion", "lucide-react"],
                    "chart-vendor": ["recharts"],
                },
            },
        },
    },
});
