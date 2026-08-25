import {mkdir,readFile,writeFile} from "node:fs/promises";
import {resolve} from "node:path";

const routes=[
  "node-reference/regional-prompting/bv-regional-prompt",
  "node-guides/regional-prompting"
];
const dist=resolve(import.meta.dirname,"..","dist");
const html=await readFile(resolve(dist,"index.html"),"utf8");
for(const route of routes){
  const target=resolve(dist,route);
  await mkdir(target,{recursive:true});
  await writeFile(resolve(target,"index.html"),html);
}
await writeFile(resolve(dist,"404.html"),html);
