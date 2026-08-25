import {defineConfig} from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({base:"/bv_node_wiki/",plugins:[react()],build:{outDir:"dist",emptyOutDir:true}});
