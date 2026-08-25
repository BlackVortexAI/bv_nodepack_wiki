import {defineConfig} from "vite";
import react from "@vitejs/plugin-react";
import mdx from "@mdx-js/rollup";

export default defineConfig({
  base: "/bv_nodepack_wiki/",
  plugins: [mdx(), react()],
  build: {outDir: "dist", emptyOutDir: true},
});
