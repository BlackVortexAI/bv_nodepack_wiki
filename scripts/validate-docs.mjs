import {access, readFile, readdir} from "node:fs/promises";
import {resolve} from "node:path";

const root = resolve(import.meta.dirname, "..");
const contracts = JSON.parse(await readFile(resolve(root, "src/generated/node-contracts.json"), "utf8"));
const manifest = JSON.parse(await readFile(resolve(root, "src/generated/asset-manifest.json"), "utf8"));
const errors = [];
const unique = (values, label) => {
  const duplicates = values.filter((value, index) => values.indexOf(value) !== index);
  if (duplicates.length) errors.push(`${label} contains duplicates: ${[...new Set(duplicates)].join(", ")}`);
};

unique(contracts.nodes.map(node => node.name), "Node names");
unique(contracts.nodes.map(node => node.slug), "Node slugs");
unique(manifest.assets.map(asset => asset.id), "Asset IDs");

if (contracts.targetVersion !== "1.2.0") errors.push(`Unexpected target version ${contracts.targetVersion}`);
if (contracts.nodes.length !== 61) errors.push(`Expected 61 public nodes, found ${contracts.nodes.length}`);
if (contracts.nodes.some(node => node.internal || node.status === "internal")) errors.push("Public contracts contain internal nodes");

for (const node of contracts.nodes) {
  const page = `/node-reference/${node.slug}`;
  for (const type of ["node", "connection"]) {
    if (!manifest.assets.some(asset => asset.page === page && asset.type === type)) errors.push(`${page} is missing a ${type} asset`);
  }
  const ports = [...Object.values(node.inputs).flat(), ...node.outputs];
  if (node.legacyPorts && !ports.some(port => port.legacy)) errors.push(`${page} declares legacy ports without marking the affected ports`);
  if (ports.some(port => port.dynamic && !port.initiallyHidden && !port.dynamicDescription)) errors.push(`${page} has a dynamic input without an initial visibility state or stable description`);
}
if (manifest.assets.some(asset => asset.type === "legacy")) errors.push("Legacy-only screenshot assets are redundant with the full technical node exports");
for (const asset of manifest.assets) {
  const depictsWorkflow = ["connection", "workflow"].includes(asset.type)
    || (asset.type === "configuration" && /graph|workflow|wiring/i.test(asset.instructions));
  if (depictsWorkflow && !asset.aiGeneratedReviewRequired) errors.push(`${asset.id} is missing the AI/manual-review notice flag`);
}
const fixedRoutes = ["", "getting-started/installation", "getting-started/quick-start", "concepts/regional-v3", "concepts/workflow-identity", "node-reference", "node-guides/regional-v3", "node-guides/lut-library", "node-guides/lora-library", "node-guides/detailer-loop", "node-guides/smart-pipes", "node-guides/prompt-processing", "node-guides/remote-llm-provider", "node-guides/workflow-control", "node-guides/subgraph-interface", "node-guides/latent-utilities", "workflow-recipes", "workflow-recipes/verification", "ui-guide", "ui-guide/image-export", "compatibility", "migration/upgrading-to-1-0", "migration/deprecated-nodes", "troubleshooting", "troubleshooting/known-issues", "support/reporting-issues", "reference/glossary", "reference/changelog", "reference/acknowledgements"];
const routes = [...fixedRoutes, ...contracts.nodes.map(node => `node-reference/${node.slug}`)];
const routeSet = new Set(routes.map(route => `/${route}`.replace(/\/$/, "") || "/"));
for (const route of routes) {
  try { await access(resolve(root, "dist", route, "index.html")); }
  catch { errors.push(`Missing static route /${route}`); }
}

const contentFiles = await walk(resolve(root, "content"));
const contentSlugs = [];
for (const file of contentFiles.filter(file => file.endsWith(".mdx"))) {
  const source = await readFile(file, "utf8");
  const slug = source.match(/slug:\s*["']([^"']+)["']/)?.[1];
  if (!slug) errors.push(`${file} has no exported meta slug`);
  else contentSlugs.push(slug);
  for (const match of source.matchAll(/\]\((\/bv_nodepack_wiki)?(\/[^)#\s]+)(?:#[^)]+)?\)/g)) {
    const target = match[2].replace(/\/$/, "") || "/";
    if (!routeSet.has(target)) errors.push(`${file} links to unknown route ${target}`);
  }
}
unique(contentSlugs, "MDX slugs");
const contentRequired = fixedRoutes
  .map(route => `/${route}`.replace(/\/$/, "") || "/")
  .filter(route => !["/", "/node-reference"].includes(route));
for (const route of contentRequired) if (!contentSlugs.includes(route)) errors.push(`${route} has no MDX content page`);

if (errors.length) {
  console.error(errors.map(error => `- ${error}`).join("\n"));
  process.exit(1);
}
console.log(`Validated ${contracts.nodes.length} nodes, ${manifest.assets.length} assets, and ${routes.length} static routes.`);

async function walk(directory) {
  const entries = await readdir(directory, {withFileTypes: true});
  const files = [];
  for (const entry of entries) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else files.push(path);
  }
  return files;
}
