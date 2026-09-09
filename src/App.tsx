import {useEffect, useMemo, useRef, useState} from "react";
import {assets, assetsForPage, contractSnapshotDate, nodeBySlug, nodes, pages, publicNodes, searchablePages, targetReleaseLabel, targetReleaseState, targetVersion} from "./data";
import {contentBySlug} from "./mdx";
import type {AssetEntry, NodeContract, PageInfo, Port} from "./types";

const BASE = "/bv_nodepack_wiki";
const cleanPath = () => {
  const path = location.pathname.replace(new RegExp(`^${BASE}`), "") || "/";
  return path.length > 1 ? path.replace(/\/$/, "") : path;
};
const hrefFor = (path: string) => `${BASE}${path === "/" ? "/" : path}`;

function useRoute() {
  const [path, setPath] = useState(cleanPath);
  useEffect(() => {
    const pop = () => setPath(cleanPath());
    addEventListener("popstate", pop);
    return () => removeEventListener("popstate", pop);
  }, []);
  const go = (next: string) => {
    history.pushState({}, "", hrefFor(next));
    setPath(next);
    scrollTo({top: 0, behavior: "instant"});
  };
  return {path, go};
}

function Link({to, go, children, className}: {to: string; go: (path: string) => void; children: React.ReactNode; className?: string}) {
  return <a className={className} href={hrefFor(to)} onClick={event => {event.preventDefault(); go(to);}}>{children}</a>;
}

const navGroups = [
  ["Getting Started", pages.filter(page => page.section === "Getting Started")],
  ["Core Concepts", pages.filter(page => page.section === "Core Concepts")],
  ["Node Guides", pages.filter(page => page.section === "Node Guides")],
  ...["Regional Prompting", "Detailer", "Prompt Processing", "Pipes & Workflow Data", "Workflow Control", "Subgraph Interface", "Latent & Utilities", "Utilities", "Deprecated & Migration"].map(section => [section, publicNodes.filter(node => node.section === section).map(node => ({path: `/node-reference/${node.slug}`, title: node.name}))]),
  ["More", pages.filter(page => ["Workflow Recipes", "BV UI Guide", "Compatibility", "Troubleshooting", "Support", "Reference"].includes(page.section))],
] as [string, {path: string; title: string}[]][];

function StatusPill({status}: {status: string}) {
  return <span className={`status-pill ${status}`}>{status}</span>;
}

function WorkflowPill({embedded}: {embedded?: boolean}) {
  const state = embedded === true
    ? {className: "embedded", label: "Workflow embedded", title: "Contains embedded ComfyUI workflow metadata. Drag the image into ComfyUI to load it."}
    : embedded === false
      ? {className: "image-only", label: "Image only", title: "No embedded ComfyUI workflow metadata. This asset is documentation only."}
      : {className: "unknown", label: "Import status unknown", title: "This asset has not yet been checked for embedded ComfyUI workflow metadata."};
  return <span className={`workflow-pill ${state.className}`} title={state.title}>{state.label}</span>;
}

function Header({go, onMenu, documentationStatus}: {go: (path: string) => void; onMenu: () => void; documentationStatus: string}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return searchablePages.slice(0, 7);
    return searchablePages.filter(page => `${page.title} ${page.summary} ${page.section}`.toLowerCase().includes(normalized)).slice(0, 10);
  }, [query]);
  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        (document.querySelector("#wiki-search") as HTMLInputElement)?.focus();
      }
    };
    addEventListener("keydown", shortcut);
    return () => removeEventListener("keydown", shortcut);
  }, []);
  return <header className="topbar">
    <button className="mobile-menu" onClick={onMenu} aria-label="Open documentation navigation">☰</button>
    <Link to="/" go={go} className="brand"><span>✦</span><b>BV Node Pack</b></Link>
    <div className="product-context">Documentation <StatusPill status={documentationStatus} /></div>
    <div className="search-box">
      <span aria-hidden="true">⌕</span>
      <input id="wiki-search" value={query} onFocus={() => setOpen(true)} onChange={event => {setQuery(event.target.value); setOpen(true);}} placeholder="Search nodes, guides, errors…" aria-label="Search documentation" />
      <kbd>Ctrl K</kbd>
      {open && <div className="search-results" role="dialog" aria-label="Search results">
        <div className="search-title"><b>Local search</b><button onClick={() => setOpen(false)} aria-label="Close search">×</button></div>
        {results.map(result => <button key={result.path} onClick={() => {go(result.path); setOpen(false); setQuery("");}}><small>{result.section}</small><b>{result.title}</b><span>{result.summary}</span></button>)}
        {!results.length && <p>No matching documentation.</p>}
        <footer>No analytics · Index stays local</footer>
      </div>}
    </div>
  </header>;
}

function Sidebar({path, go, open, close, documentationStatus}: {path: string; go: (path: string) => void; open: boolean; close: () => void; documentationStatus: string}) {
  return <aside className={`sidebar ${open ? "open" : ""}`}>
    <div className="sidebar-head"><small>DOCUMENTATION</small><button onClick={close} aria-label="Close navigation">×</button></div>
    <nav aria-label="Documentation tree">
      <Link to="/" go={go} className={path === "/" ? "active nav-home" : "nav-home"}>▤ Overview</Link>
      {navGroups.map(([label, items]) => items.length > 0 && <details key={label} open={["Getting Started", "Node Guides", "Regional Prompting"].includes(label) || items.some(item => item.path === path)}>
        <summary>{label}<span>{items.length}</span></summary>
        {items.map(item => <Link key={item.path} to={item.path} go={next => {go(next); close();}} className={path === item.path ? "active" : ""}>{item.title}</Link>)}
      </details>)}
    </nav>
    <footer><b>Target {targetVersion}</b><span>{targetReleaseLabel} · Documentation {documentationStatus.replaceAll("-", " ")}</span></footer>
  </aside>;
}

function Toc({items, documentationStatus, appliesTo}: {items: string[]; documentationStatus: string; appliesTo?: string}) {
  return <aside className="toc"><b>On this page</b>{items.map(item => <a key={item} href={`#${item.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}>{item}</a>)}<hr/><small>Target</small><code>BV Node Pack {targetVersion}</code><small>Release</small><span>{targetReleaseLabel}</span>{appliesTo && <><small>Page verified against</small><code>BV Node Pack {appliesTo}</code></>}<small>Documentation</small><span>{documentationStatus.replaceAll("-", " ")}</span></aside>;
}

function Layout({path, go, children, toc = []}: {path: string; go: (path: string) => void; children: React.ReactNode; toc?: string[]}) {
  const [menu, setMenu] = useState(false);
  const meta = contentBySlug.get(path)?.meta;
  const documentationStatus = meta?.documentationStatus ?? "under-review";
  const appliesTo = typeof meta?.appliesTo === "string" ? meta.appliesTo : undefined;
  return <div className="shell"><a href="#content" className="skip">Skip to content</a><Header go={go} onMenu={() => setMenu(true)} documentationStatus={documentationStatus}/><Sidebar path={path} go={go} open={menu} close={() => setMenu(false)} documentationStatus={documentationStatus}/><main id="content">{children}</main>{toc.length > 0 && <Toc items={toc} documentationStatus={documentationStatus} appliesTo={appliesTo}/>} {menu && <button className="scrim" onClick={() => setMenu(false)} aria-label="Close navigation overlay"/>}</div>;
}

function AssetImage({src, alt, assetId}: {src: string; alt: string; assetId: string}) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const open = () => dialogRef.current?.showModal();
  const close = () => dialogRef.current?.close();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const restoreFocus = () => triggerRef.current?.focus();
    dialog.addEventListener("close", restoreFocus);
    return () => dialog.removeEventListener("close", restoreFocus);
  }, []);

  return <>
    <button ref={triggerRef} className="asset-image-button" type="button" onClick={open} aria-label={`Enlarge image: ${assetId}`}>
      <img src={src} alt={alt}/>
      <span className="asset-zoom-hint" aria-hidden="true">⌕</span>
    </button>
    <dialog ref={dialogRef} className="image-lightbox" aria-label={`Enlarged image: ${assetId}`} onKeyDown={event => {if (event.key === "Escape") {event.preventDefault(); close();}}} onClick={event => {if (event.target === event.currentTarget) close();}}>
      <div className="image-lightbox-panel">
        <header>
          <code>{assetId}</code>
          <div>
            <a href={src} target="_blank" rel="noreferrer">Open original</a>
            <button type="button" onClick={close} aria-label="Close enlarged image">×</button>
          </div>
        </header>
        <img src={src} alt={alt}/>
      </div>
    </dialog>
  </>;
}

function AssetPlaceholder({asset}: {asset: AssetEntry}) {
  if (asset.status === "not-applicable" || asset.status === "blocked") return <figure className={`asset-placeholder ${asset.type}`} data-asset-id={asset.id}>
    <div className="placeholder-content"><b>{asset.status === "not-applicable" ? "No connection example needed" : "Connection example unavailable"}</b><p>{asset.instructions}</p></div>
    <figcaption><code>{asset.id}</code><span>{asset.status === "not-applicable" ? "Not applicable" : "Blocked"}</span></figcaption>
  </figure>;
  if (asset.path) return <figure className={`asset-capture ${asset.type}`} data-asset-id={asset.id}>
    <AssetImage src={hrefFor(asset.path)} alt={asset.instructions} assetId={asset.id}/>
    <figcaption>
      <div className="asset-caption"><code>{asset.id}</code><div className="asset-badges"><StatusPill status={asset.status}/><WorkflowPill embedded={asset.workflowEmbedded}/></div></div>
      {asset.caption && <p>{asset.caption}</p>}
      {asset.aiGeneratedReviewRequired && <p className="asset-review-warning">AI-generated documentation graphic — manual review required.</p>}
    </figcaption>
  </figure>;
  return <figure className={`asset-placeholder ${asset.type}`} data-asset-id={asset.id}>
    <div className="placeholder-grid"/><span className="asset-type">{asset.type}</span>
    <div className="placeholder-content"><span className="placeholder-icon">◇</span><b>Asset pending</b><p>{asset.instructions}</p></div>
    <figcaption><code>{asset.id}</code><span>{asset.status}</span></figcaption>
  </figure>;
}

function PageTitle({eyebrow, title, lede, status = "under-review"}: {eyebrow: string; title: string; lede: string; status?: string}) {
  return <header className="page-title"><p className="eyebrow">{eyebrow}</p><div><h1>{title}</h1><StatusPill status={status}/></div><p>{lede}</p></header>;
}

function Home({go}: {go: (path: string) => void}) {
  const hero = assets.find(asset => asset.id === "regional-v3-guide--configuration--editor")!;
  const systems = [
    ["Regional Prompting", "Author regions, compose capabilities, and execute through native or model-specific backends.", "/node-guides/regional-v3"],
    ["Detailer", "Run ordered region jobs with optional detector refinement and accumulated image state.", "/node-guides/detailer-loop"],
    ["Smart Pipes", "Carry and merge typed workflow state while retaining stable slot identity.", "/node-guides/smart-pipes"],
    ["Prompt Processing", "Encode, filter, inspect, and decode structured prompt categories.", "/node-reference/bv-prompt-encode"],
    ["Subgraph Interface", "Project headings, dividers, spacers, and controlled values into Subgraphs.", "/node-reference/bv-subgraph-heading"],
    ["Workflow Control", "Apply deterministic activate, mute, and bypass states to named graph stages.", "/node-reference/bv-control-center"],
  ];
  return <article className="home">
    <section className="hero"><div><p className="eyebrow">BV NODE PACK · COMFYUI</p><h1>Deep workflow tools.<br/><em>Clear spatial intent.</em></h1><p>Build maintainable regional, detailer, prompt, pipe, Subgraph, and workflow-control systems around stable persisted contracts.</p><div className="hero-actions"><Link to="/getting-started/quick-start" go={go} className="primary">Start building →</Link><Link to="/node-guides/regional-v3" go={go}>Regional V3 guide</Link></div></div><AssetPlaceholder asset={hero}/></section>
    <section><div className="section-heading"><div><p className="eyebrow">SYSTEMS</p><h2>Choose the workflow problem first</h2></div><p>Guides are organized by intent. Node contracts remain available when you need exact ports and behavior.</p></div><div className="system-grid">{systems.map(([title, description, path], index) => <button key={title} onClick={() => go(path)}><span className="card-number">0{index + 1}</span><span className="card-icon">◇</span><h3>{title}</h3><p>{description}</p><b>Open system →</b></button>)}</div></section>
    <section className="release-band"><div><i/><span>Documentation target</span><b>BV Node Pack {targetVersion}</b><small>{targetReleaseState.replaceAll("-", " ")} · {targetReleaseLabel}</small></div><div><span>Reference coverage</span><b>{publicNodes.length} public nodes</b></div><div><span>Node screenshots</span><b>{assets.filter(asset => asset.type === "node" && asset.status === "approved" && asset.path).length}</b></div></section>
  </article>;
}

function PortTable({ports, group}: {ports: Port[]; group: string}) {
  if (!ports.length) return <p className="empty-state">No {group.toLowerCase()} ports.</p>;
  const availability = (port: Port) => {
    if (port.legacy) return <span className="port-availability legacy"><b>Legacy compatibility</b><small>{port.legacyGuidance}</small></span>;
    if (port.initiallyHidden) return <span className="port-availability dynamic"><b>Dynamic range</b><small>Technically present, but hidden until configured or connected.</small></span>;
    if (group.toLowerCase() === "hidden") return <span className="port-availability hidden"><b>System-injected</b><small>Used internally during execution and not shown as a connectable canvas port.</small></span>;
    return <span>{group}</span>;
  };
  return <div className="port-table"><div><b>Name</b><b>Type</b><b>Availability</b></div>{ports.map(port => <div key={`${group}-${port.name}`}><code>{port.name}</code><code>{port.type}</code>{availability(port)}</div>)}</div>;
}

function NodePage({node}: {node: NodeContract}) {
  const pagePath = `/node-reference/${node.slug}`;
  const pageAssets = assetsForPage(pagePath);
  const inputGroups = Object.entries(node.inputs);
  const statusText = node.status === "deprecated" ? "Deprecated compatibility node. Prefer the replacement described below." : node.status === "experimental" ? "Experimental: behavior and results may change between releases." : `Included in the BV Node Pack ${targetVersion} documentation target. ${targetReleaseLabel}; runtime and visual evidence remains scoped to the verification stated on each page.`;
  return <article className="doc">
    <PageTitle eyebrow={`${node.section} · Node reference`} title={node.name} lede={node.description} status={node.status}/>
    <div className="facts"><span><small>Product status</small><b>{node.status}</b></span><span><small>Target</small><b>{targetVersion}</b></span><span><small>Category</small><b>{node.section}</b></span><span><small>Contract snapshot</small><b>{contractSnapshotDate}</b></span></div>
    <aside className={`callout ${node.status}`}><b>{node.status === "stable" ? "Release verification pending" : node.status}</b><p>{statusText}</p></aside>
    <section id="overview"><h2>Overview</h2><p>{node.description}</p><p>This reference is generated from the registered runtime class and then reviewed as user documentation. Saved workflow identity depends on the node class name, not the visible title.</p></section>
    {pageAssets.filter(asset => asset.type === "node").map(asset => <AssetPlaceholder key={asset.id} asset={asset}/>)}
    <section id="inputs"><h2>Inputs</h2>{inputGroups.map(([group, ports]) => <div key={group}><h3>{group[0].toUpperCase() + group.slice(1)}</h3><PortTable ports={ports} group={group}/></div>)}</section>
    <section id="outputs"><h2>Outputs</h2><PortTable ports={node.outputs} group="Output"/></section>
    <section id="behavior"><h2>Behavior</h2><p>{behaviorFor(node)}</p></section>
    <section id="minimal-connections"><h2>Minimal connections</h2><p>Connect only the required upstream values and the downstream consumer needed for the task. Add optional providers or advanced controls after the minimal path executes successfully.</p>{pageAssets.filter(asset => asset.type === "connection").map(asset => <AssetPlaceholder key={asset.id} asset={asset}/>)}</section>
    {node.legacyPorts && <details className="legacy-block"><summary>Legacy compatibility ports</summary><div><h2>Deprecated Regional ports</h2><p>Every affected port is marked <b>Legacy compatibility</b> in the input or output table above. The exported node image may show these ports because the export extension includes the complete technical port surface.</p><p>In normal ComfyUI use, newly created nodes hide them. Existing connected ports remain visible, and <b>BV Regional Legacy Debug Mode</b> or <kbd>Ctrl</kbd> + <kbd>Alt</kbd> + <kbd>B</kbd> reveals them for diagnosis.</p><p>The compatibility surface is scheduled for removal after <b>25 October 2026</b>. Open, save, reload, and execute important 0.x workflows before that date.</p></div></details>}
    {node.status === "deprecated" && <section id="replacement"><h2>Replacement</h2><p>{replacementFor(node.name)}</p></section>}
    <section id="limitations"><h2>Known limitations</h2><p>{limitationsFor(node)}</p></section>
    <section id="related"><h2>Related documentation</h2><ul><li><a href={hrefFor("/getting-started/quick-start")}>Quick Start</a></li><li><a href={hrefFor("/compatibility")}>Compatibility</a></li>{node.section.includes("Regional") && <li><a href={hrefFor("/concepts/regional-v3")}>Regional V3 concept</a></li>}</ul></section>
  </article>;
}

function behaviorFor(node: NodeContract) {
  if (node.status === "deprecated") return "The node remains registered for existing workflows during the compatibility window. It is not the recommended choice for new workflows.";
  if (node.section === "Regional Prompting") return "The node reads or transforms the persisted BV_REGIONAL contract. Runtime resources remain connected through ordinary typed ConfigUI links and resolve only inside the same concrete graph.";
  if (node.section === "Detailer") return "The node participates in an ordered detailer plan. Job identity, accumulated image state, region masks, and optional detector resources remain explicit throughout the loop.";
  if (node.section === "Pipes & Workflow Data") return "The node preserves stable slot identity across configuration, inheritance, branching, workflow reload, and Subgraph use.";
  return "The node evaluates from its serialized widget values and connected inputs. Keep values deterministic when the node is used in a reproducible documentation workflow.";
}
function limitationsFor(node: NodeContract) {
  if (node.slug === "bv-regional-krea-2-attention") return <>Experimental output may change. The <code>multipass_legacy</code> regional-LoRA path can fail in ComfyUI WeightHooks with quantized models, including an <code>AttributeError</code> for <code>weight_scale</code>. As checked on 6 September 2026, <a href="https://github.com/Comfy-Org/ComfyUI/issues/14382">ComfyUI #14382</a> remains open. The related fixes are still open and unmerged: <a href="https://github.com/Comfy-Org/ComfyUI/pull/14413">#14413</a> addresses synthetic quantization keys, <a href="https://github.com/Comfy-Org/ComfyUI/pull/15532">#15532</a> addresses setter-backed WeightHooks, and <a href="https://github.com/Comfy-Org/ComfyUI/pull/15533">#15533</a> addresses offloaded Hook weights. The closed <a href="https://github.com/BlackVortexAI/bv_nodepack/issues/4">BV report #4</a> records this failure; its closure does not establish an upstream fix. These reports do not establish a fix for every Krea model or quantization variant.</>;
  if (node.status === "experimental") return "Experimental output may change. Compare results with an unchanged seed, model, sampler, resolution, and workflow before adopting it for quality-sensitive work.";
  if (node.status === "deprecated") return "Compatibility is temporary. The node may be removed after 25 October 2026; migrate and resave important workflows first.";
  if (node.name.includes("Remote LLM")) return "Provider availability, model behavior, rate limits, and structured-output support are controlled by the selected service. API keys are stored separately from workflow JSON.";
  return "A valid port contract does not guarantee model compatibility or visual quality. Follow the relevant guide and compatibility entry for task-specific constraints.";
}
function replacementFor(name: string) {
  if (name === "BV Pipe" || name === "BV Pipe Config") return "Use BV Smart Pipe and BV Smart Pipe Merge. They preserve named values through stable slot IDs and explicit merge order.";
  if (name === "BV Latent Random Aspect Ratio") return "Use BV Empty Latent Random Ratio for deterministic latent creation. Configure a single 1:1 ratio for documentation workflows unless the model requires another resolution.";
  return "Use the current 1.0 node family described in the related guide.";
}

function StandardPage({path, go}: {path: string; go: (path: string) => void}) {
  const page = pages.find(item => item.path === path);
  if (!page) return <NotFound go={go}/>;
  const pageAssets = assetsForPage(path);
  if (path === "/node-reference") return <NodeReference go={go}/>;
  const contentModule = contentBySlug.get(path);
  const Content = contentModule?.default;
  return <article className="doc"><PageTitle eyebrow={page.section} title={page.title} lede={page.summary} status={contentModule?.meta.documentationStatus ?? "under-review"}/><div className="mdx-content">{Content ? <Content/> : contentFor(path, go)}</div>{pageAssets.filter(asset => asset.status !== "missing").map(asset => <AssetPlaceholder key={asset.id} asset={asset}/>)}</article>;
}

function contentFor(path: string, go: (path: string) => void) {
  if (path === "/getting-started/quick-start") return <><section><h2>Build a deterministic first graph</h2><ol><li>Add <b>BV Seed</b> and select a fixed value for this workflow.</li><li>Add <b>BV Empty Latent Random Ratio</b>, choose 1024 resolution, and enable only 1:1.</li><li>Connect the resulting latent to the sampler path required by your model.</li><li>Save, reload, and confirm the same dimensions and effective seed.</li></ol></section><section><h2>Continue by task</h2><div className="link-cards"><button onClick={() => go("/node-guides/regional-v3")}>Regional V3</button><button onClick={() => go("/node-guides/detailer-loop")}>Detailer Loop</button><button onClick={() => go("/node-guides/smart-pipes")}>Smart Pipes</button></div></section></>;
  if (path === "/concepts/workflow-identity") return <><section><h2>Stable identity</h2><p>Node titles, visual order, and slot position are presentation details. Persisted document, region, collector, resource, and slot IDs remain the executable identity.</p></section><section><h2>Copy and Subgraphs</h2><p>Copy complete provider/consumer groups when resource relationships must survive. An isolated consumer never searches another workflow, root graph, or Subgraph for a similarly named provider.</p></section></>;
  if (path === "/node-guides/regional-v3") return <><section><h2>Goal</h2><p>Create a two-region 1024×1024 workflow, optionally assign independent LoRA resources, and execute it through one compatible Regional backend.</p></section><section><h2>Steps</h2><ol><li>Add <b>BV Regional Prompt</b> and author Global, Background, and two named regions.</li><li>Choose either <b>BV Regional Native Conditioning</b> or one exactly compatible model-specific backend for this pass.</li><li>For LoRAs, configure named stacks in <b>BV LoRA Registry</b> and select them through the Regional capability editor.</li><li>Keep all providers inside the same owning workflow; only manual and Legacy Collector chains remain graph-local.</li><li>Save, reload, reopen the editor, and run an uncached comparison.</li></ol></section><aside className="callout warning"><b>Model boundary</b><p>Native Conditioning is a generic masked-conditioning path, not a promise of maximum spatial fidelity or image quality. Compare composition modes and compatible model-specific backends with unchanged inputs.</p></aside></>;
  if (path === "/node-guides/detailer-loop") return <><section><h2>Goal</h2><p>Process every enabled Detailer or Both region sequentially while retaining earlier image changes.</p></section><section><h2>Minimal wiring</h2><ol><li>Connect BV Regional Prompt to BV Regional Detailer Plan.</li><li>Optionally connect BV Detector Registry as a V3 resource provider.</li><li>Connect the plan and initial image to BV Detailer Loop Start.</li><li>Resolve each job with BV Detailer Loop Job Resolver.</li><li>Use the direct region mask or detector-gated Impact SEGS.</li><li>Send the processed image to BV Detailer Loop End.</li></ol></section><p>The four hidden expansion nodes are implementation details and must not be placed or rewired manually.</p></>;
  if (path === "/node-guides/smart-pipes") return <><section><h2>Goal</h2><p>Grow typed workflow state without binding behavior to visible slot position.</p></section><section><h2>Configure and merge</h2><ol><li>Add BV Smart Pipe and open its editor.</li><li>Create named slots; each receives a stable identity.</li><li>Connect values or inherit an upstream Smart Pipe.</li><li>Use BV Smart Pipe Merge for ordered branches.</li><li>Resolve intentional conflicts by source order; later divergent writes win.</li></ol></section></>;
  if (path === "/workflow-recipes") return <><section><h2>Publication rule</h2><p>A recipe becomes verified only after load, dependency, wiring, execution, output, persistence, PNG import, and JSON-equivalence checks pass against the documented release.</p></section><section><h2>Planned recipes</h2><ul><li>Regional V3 starter</li><li>Model-specific Regional Attention examples</li><li>Two-job Regional Detailer loop</li><li>Smart Pipe branching and merge</li><li>Prompt AST filtering</li><li>Subgraph interface controls</li></ul></section></>;
  if (path === "/ui-guide") return <><section><h2>BV windows</h2><p>BV-owned editors support workspace, floating, minimized, and switching behavior. Window identity is scoped by workflow and concrete node identity.</p></section><section><h2>Persistence</h2><p>Product data belongs in the workflow. Local appearance and window preferences remain outside serialized workflow JSON unless they are part of the node contract.</p></section><section><h2>Notifications</h2><p>Migration summaries, unresolved providers, validation fallbacks, and legacy wiring remain visible. Do not treat a warning as successful execution.</p></section></>;
  if (path === "/compatibility") return <><section><h2>Status vocabulary</h2><ul><li><b>Verified:</b> reproduced against the named release and environment.</li><li><b>Experimental:</b> available, but behavior or results may change.</li><li><b>Known Issue:</b> supported path with a documented limitation or workaround.</li><li><b>Unsupported:</b> outside the validated architecture.</li></ul></section><section><h2>Current boundary</h2><p>Model-specific Attention nodes require the exact compatible architecture. Impact integration is required only for detector loading and the documented SEGS path. The core regional document and mask contracts remain package-neutral.</p></section></>;
  if (path === "/migration/upgrading-to-1-0") return <><section><h2>Automatic migration</h2><p>Supported 0.x documents and configurations migrate in memory when loaded. Opening never overwrites a workflow file. After a successful migration, save once, reload, and run an uncached execution.</p></section><section><h2>Temporary compatibility surface</h2><p>Legacy Regional ports are hidden on newly created nodes. Existing connected ports remain visible, and the Legacy Debug Mode reveals them for diagnosis. Compatibility features are scheduled for removal after <b>25 October 2026</b>.</p></section><section><h2>Before the removal date</h2><ol><li>Keep an unchanged copy of important workflows.</li><li>Open each workflow with BV Node Pack 1.0.0.</li><li>Review the migration summary and any legacy warning.</li><li>Save, reload, and execute it once.</li><li>Replace deprecated BV Pipe and latent nodes with their documented successors.</li></ol></section></>;
  if (path === "/troubleshooting") return <><section><h2>Nodes are missing</h2><p>Restart ConfigUI, hard-refresh the browser, and inspect the startup log. A browser refresh cannot repair a failed Python import.</p></section><section><h2>Collector or resource is unresolved</h2><p>Confirm the persisted provider link exists in the same concrete graph. Re-select by collector and resource identity; never repair by matching a title or slot number.</p></section><section><h2>Workflow changed after update</h2><p>Keep the original file, capture the migration summary, save to a new filename, reload, and compare with an uncached run using identical model, seed, sampler, and resolution.</p></section><section><h2>Report a bug</h2><p>Include BV Node Pack version, ConfigUI version, exact node names, complete error report, minimal workflow, dependency versions, and reproduction steps. Remove API keys and personal paths.</p></section></>;
  return <section><h2>Content in progress</h2><p>This page has a verified structural purpose but still requires focused review for the BV Node Pack {targetVersion} documentation target.</p></section>;
}

function NodeReference({go}: {go: (path: string) => void}) {
  const sections = [...new Set(publicNodes.map(node => node.section))];
  return <article className="doc"><PageTitle eyebrow="Reference" title="Node Reference" lede="All public nodes registered by the current runtime, grouped by authoring task."/>{sections.map(section => <section key={section}><h2>{section}</h2><div className="link-cards">{publicNodes.filter(node => node.section === section).map(node => <button key={node.slug} onClick={() => go(`/node-reference/${node.slug}`)}><b>{node.name}</b><span>{node.description}</span></button>)}</div></section>)}</article>;
}

function NotFound({go}: {go: (path: string) => void}) {return <article className="doc"><PageTitle eyebrow="404" title="Documentation route not found" lede="The requested route is not part of the current local manifest."/><button className="primary-button" onClick={() => go("/")}>Return to overview</button></article>}

export function App() {
  const {path, go} = useRoute();
  const node = path.startsWith("/node-reference/") ? nodeBySlug.get(path.split("/").pop() || "") : undefined;
  const toc = node ? ["Overview", "Inputs", "Outputs", "Behavior", "Minimal connections", "Known limitations", "Related documentation"] : [];
  return <Layout path={path} go={go} toc={toc}>{path === "/" ? <Home go={go}/> : node ? <NodePage node={node}/> : <StandardPage path={path} go={go}/>}</Layout>;
}
