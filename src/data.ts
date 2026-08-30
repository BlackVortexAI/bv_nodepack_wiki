import contractData from "./generated/node-contracts.json";
import assetData from "./generated/asset-manifest.json";
import type {AssetEntry, NodeContract, PageInfo} from "./types";

export const targetVersion = contractData.targetVersion;
export const nodes = contractData.nodes as unknown as NodeContract[];
export const publicNodes = nodes;
export const assets = assetData.assets as AssetEntry[];

export const pages: PageInfo[] = [
  {path: "/", title: "BV Node Pack 1.2", summary: "Visual regional prompting and deep workflow tools for ComfyUI.", section: "Home"},
  {path: "/getting-started/installation", title: "Installation", summary: "Install, update, and verify BV Node Pack.", section: "Getting Started"},
  {path: "/getting-started/quick-start", title: "Quick Start", summary: "Create a deterministic first workflow.", section: "Getting Started"},
  {path: "/concepts/regional-v3", title: "Regional V3", summary: "Understand persisted context, collectors, resources, and scoped capabilities.", section: "Core Concepts"},
  {path: "/concepts/workflow-identity", title: "Workflow Identity", summary: "Stable IDs, graph scope, persistence, and copying.", section: "Core Concepts"},
  {path: "/node-reference", title: "Node Reference", summary: "Complete runtime-derived reference grouped by authoring task.", section: "Node Reference"},
  {path: "/node-guides/regional-v3", title: "Build a Regional V3 Workflow", summary: "Wire authoring, resources, capabilities, and execution.", section: "Node Guides"},
  {path: "/node-guides/lut-library", title: "Use the LUT Library", summary: "Choose built-ins, manage workflow LUTs, and test catalog channels.", section: "Node Guides"},
  {path: "/node-guides/lora-library", title: "Use the LoRA Library", summary: "Collect local LoRAs and select workflow-scoped resources.", section: "Node Guides"},
  {path: "/node-guides/detailer-loop", title: "Build a Regional Detailer Loop", summary: "Process Detailer regions sequentially with optional detector refinement.", section: "Node Guides"},
  {path: "/node-guides/smart-pipes", title: "Build with Smart Pipes", summary: "Carry and merge typed workflow state by stable slot identity.", section: "Node Guides"},
  {path: "/node-guides/prompt-processing", title: "Build a Structured Prompt Pipeline", summary: "Encode, filter, inspect, and decode prompt categories.", section: "Node Guides"},
  {path: "/node-guides/remote-llm-provider", title: "Configure a Remote LLM Provider", summary: "Configure hosted or local OpenAI-compatible providers without storing credentials in workflows.", section: "Node Guides"},
  {path: "/node-guides/workflow-control", title: "Build Deterministic Workflow Controls", summary: "Apply persistent active, bypass, and mute states to named stages.", section: "Node Guides"},
  {path: "/node-guides/subgraph-interface", title: "Design a Subgraph Interface", summary: "Project a readable, scoped control surface from a Subgraph definition.", section: "Node Guides"},
  {path: "/node-guides/latent-utilities", title: "Build Reproducible Latent Utilities", summary: "Freeze seed and latent structure while allowing reviewed visual exceptions.", section: "Node Guides"},
  {path: "/workflow-recipes", title: "Workflow Recipes", summary: "Focused, verified workflows and explicit dependencies.", section: "Workflow Recipes"},
  {path: "/workflow-recipes/verification", title: "Workflow Verification", summary: "Structural and visual gates for downloadable JSON and embedded PNG recipes.", section: "Workflow Recipes"},
  {path: "/ui-guide", title: "BV UI Guide", summary: "Windows, dialogs, persistence, keyboard behavior, and notifications.", section: "BV UI Guide"},
  {path: "/ui-guide/image-export", title: "Export Graph and BV UI Images", summary: "Create deterministic PNGs of graphs, selections, Subgraphs, and BV interfaces.", section: "BV UI Guide"},
  {path: "/compatibility", title: "Compatibility", summary: "Verified, experimental, known-issue, and unsupported boundaries.", section: "Compatibility"},
  {path: "/migration/upgrading-to-1-0", title: "Upgrading to 1.0", summary: "Automatic migration, temporary legacy ports, and deprecated nodes.", section: "Compatibility"},
  {path: "/troubleshooting", title: "Troubleshooting", summary: "Installation, missing nodes, graph scope, models, and UI issues.", section: "Troubleshooting"},
  {path: "/troubleshooting/known-issues", title: "Known Issues", summary: "Confirmed limitations, affected paths, and practical workarounds.", section: "Troubleshooting"},
  {path: "/support/reporting-issues", title: "Reporting Issues", summary: "Prepare a reproducible BV Node Pack bug report without leaking secrets.", section: "Support"},
  {path: "/reference/glossary", title: "Glossary", summary: "Canonical terms used throughout BV Node Pack documentation.", section: "Reference"},
  {path: "/reference/changelog", title: "Changelog", summary: "Complete BV Node Pack version history with source and reconstruction boundaries.", section: "Reference"},
  {path: "/reference/acknowledgements", title: "Acknowledgements", summary: "Projects and integrations that support documented BV workflows.", section: "Reference"},
  {path: "/migration/deprecated-nodes", title: "Deprecated Nodes", summary: "Replacement paths and temporary compatibility guarantees.", section: "Compatibility"},
];

export const nodePages: PageInfo[] = publicNodes.map(node => ({
  path: `/node-reference/${node.slug}`,
  title: node.name,
  summary: node.description,
  section: node.section,
}));

export const searchablePages = [...pages.filter(page => !page.hidden), ...nodePages];
export const nodeBySlug = new Map(nodes.map(node => [node.slug, node]));
export const assetsForPage = (path: string) => assets.filter(asset => asset.page === path);
