import {readFile, writeFile} from "node:fs/promises";
import {extname, resolve} from "node:path";
import {fileURLToPath} from "node:url";

const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const textChunkTypes = new Set(["tEXt", "zTXt", "iTXt"]);

export function pngContainsEmbeddedWorkflow(buffer) {
  if (buffer.length < pngSignature.length || !buffer.subarray(0, pngSignature.length).equals(pngSignature)) return false;
  let offset = pngSignature.length;
  while (offset + 12 <= buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString("ascii", offset + 4, offset + 8);
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    if (dataEnd + 4 > buffer.length) return false;
    if (textChunkTypes.has(type)) {
      const keywordEnd = buffer.indexOf(0, dataStart);
      if (keywordEnd >= dataStart && keywordEnd < dataEnd) {
        const keyword = buffer.toString("latin1", dataStart, keywordEnd).toLowerCase();
        if (keyword === "workflow") return true;
      }
    }
    offset = dataEnd + 4;
  }
  return false;
}

export async function assetContainsEmbeddedWorkflow(file) {
  if (extname(file).toLowerCase() !== ".png") return false;
  return pngContainsEmbeddedWorkflow(await readFile(file));
}

async function sync() {
  const root = resolve(import.meta.dirname, "..");
  const manifestFile = resolve(root, "src/generated/asset-manifest.json");
  const manifest = JSON.parse(await readFile(manifestFile, "utf8"));
  let embedded = 0;
  let imageOnly = 0;
  for (const asset of manifest.assets) {
    if (!asset.path) {
      delete asset.workflowEmbedded;
      continue;
    }
    const file = resolve(root, "public", asset.path.replace(/^\//, ""));
    asset.workflowEmbedded = await assetContainsEmbeddedWorkflow(file);
    if (asset.workflowEmbedded) embedded += 1;
    else imageOnly += 1;
  }
  await writeFile(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  console.log(`Synchronized workflow metadata for ${embedded + imageOnly} assets: ${embedded} embedded, ${imageOnly} image-only.`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await sync();
