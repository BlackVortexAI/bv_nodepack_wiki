import {readFile, mkdir, writeFile} from "node:fs/promises";
import {resolve} from "node:path";

const root = resolve(import.meta.dirname, "..");
const dist = resolve(root, "dist");
const template = await readFile(resolve(dist, "index.html"), "utf8");
const contracts = JSON.parse(await readFile(resolve(root, "src/generated/node-contracts.json"), "utf8"));

const routes = [
  ["/", "BV Node Pack Documentation", "BV Node Pack 1.0 documentation for ComfyUI."],
  ["/getting-started/installation", "Installation", "Install, update, and verify BV Node Pack."],
  ["/getting-started/quick-start", "Quick Start", "Create a deterministic first BV Node Pack workflow."],
  ["/concepts/regional-v3", "Regional V3", "Persisted contexts, collectors, resources, and scoped capabilities."],
  ["/concepts/workflow-identity", "Workflow Identity", "Stable IDs, graph scope, persistence, and copying."],
  ["/node-reference", "Node Reference", "Complete BV Node Pack node reference grouped by task."],
  ["/node-guides/regional-v3", "Build a Regional V3 Workflow", "Wire Regional V3 authoring, resources, capabilities, and execution."],
  ["/node-guides/detailer-loop", "Build a Regional Detailer Loop", "Process Regional Detailer jobs sequentially."],
  ["/node-guides/smart-pipes", "Build with Smart Pipes", "Carry and merge typed workflow state."],
  ["/node-guides/prompt-processing", "Build a Structured Prompt Pipeline", "Encode, filter, inspect, and decode structured prompt categories."],
  ["/node-guides/workflow-control", "Build Deterministic Workflow Controls", "Apply persistent states to deliberate workflow stages."],
  ["/node-guides/subgraph-interface", "Design a Subgraph Interface", "Project a readable and scoped Subgraph control surface."],
  ["/node-guides/latent-utilities", "Build Reproducible Latent Utilities", "Use deterministic seed and constrained latent settings."],
  ["/workflow-recipes", "Workflow Recipes", "Verified BV Node Pack workflow recipes."],
  ["/workflow-recipes/verification", "Workflow Verification", "Structural and visual publication gates for workflow recipes."],
  ["/ui-guide", "BV UI Guide", "BV-owned windows, dialogs, persistence, and keyboard behavior."],
  ["/ui-guide/image-export", "Export Graph and BV UI Images", "Create deterministic PNGs of graphs, selections, Subgraphs, and BV interfaces."],
  ["/compatibility", "Compatibility", "BV Node Pack compatibility boundaries."],
  ["/migration/upgrading-to-1-0", "Upgrading to 1.0", "Automatic migration and temporary compatibility features."],
  ["/troubleshooting", "Troubleshooting", "Diagnose BV Node Pack installation, graph, model, and UI problems."],
  ["/troubleshooting/known-issues", "Known Issues", "Confirmed BV Node Pack limitations and workarounds."],
  ["/support/reporting-issues", "Reporting Issues", "Prepare a reproducible BV Node Pack bug report."],
  ["/reference/glossary", "Glossary", "Canonical BV Node Pack 1.0 terminology."],
  ["/reference/changelog", "Changelog", "The four most recent BV Node Pack release entries and their verification state."],
  ["/reference/acknowledgements", "Acknowledgements", "Projects and integrations used by documented BV workflows."],
  ["/migration/deprecated-nodes", "Deprecated Nodes", "Replacement paths and temporary compatibility guarantees."],
  ...contracts.nodes.map(node => [`/node-reference/${node.slug}`, node.name, node.description]),
];

for (const [route, title, description] of routes) {
  let html = template
    .replace("<title>BV Node Pack Documentation</title>", `<title>${escapeHtml(title)} · BV Node Pack</title>`)
    .replace('content="BV Node Pack 1.0 documentation for ComfyUI."', `content="${escapeHtml(description)}"`);
  const target = route === "/" ? resolve(dist, "index.html") : resolve(dist, route.slice(1), "index.html");
  await mkdir(resolve(target, ".."), {recursive: true});
  await writeFile(target, html, "utf8");
}

await writeFile(resolve(dist, "404.html"), template, "utf8");
console.log(`Materialized ${routes.length} static documentation routes.`);

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"})[character]);
}
