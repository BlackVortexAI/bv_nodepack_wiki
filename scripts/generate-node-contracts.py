from __future__ import annotations

import argparse
import hashlib
import importlib
import json
import re
import sys
import tomllib
from pathlib import Path


def slugify(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


def png_contains_embedded_workflow(path: Path) -> bool:
    if path.suffix.lower() != ".png":
        return False
    data = path.read_bytes()
    signature = b"\x89PNG\r\n\x1a\n"
    if not data.startswith(signature):
        return False
    offset = len(signature)
    while offset + 12 <= len(data):
        length = int.from_bytes(data[offset:offset + 4], "big")
        chunk_type = data[offset + 4:offset + 8]
        data_start = offset + 8
        data_end = data_start + length
        if data_end + 4 > len(data):
            return False
        if chunk_type in {b"tEXt", b"zTXt", b"iTXt"}:
            keyword = data[data_start:data_end].split(b"\0", 1)[0].lower()
            if keyword == b"workflow":
                return True
        offset = data_end + 4
    return False


def value_type(value: object) -> str:
    if isinstance(value, (list, tuple)) and value:
        first = value[0]
        if isinstance(first, (list, tuple)):
            return "choice: " + " | ".join(str(item) for item in first)
        return str(first)
    return str(value)


def contract_input(node_name: str, input_name: str, value: object) -> dict[str, object]:
    if node_name == "BV LUT Loader" and input_name == "lut_name" and isinstance(value, (list, tuple)) and value:
        choices = value[0]
        if isinstance(choices, (list, tuple)):
            stable = [
                str(choice) for choice in choices
                if str(choice).startswith("Built-in: ") or str(choice) == "Download more LUTs…"
            ]
            return {
                "name": input_name,
                "type": "choice: " + " | ".join(stable),
                "dynamic": True,
                "dynamicDescription": "built-ins | discovered .cube files | Download more LUTs…",
            }
    return {"name": input_name, "type": value_type(value)}


def collapse_ports(ports: list[dict[str, str]]) -> list[dict[str, object]]:
    families: dict[tuple[str, str], list[int]] = {}
    plain: list[dict[str, str]] = []
    for port in ports:
        match = re.match(r"^(.*?)(\d{3})$", port["name"])
        if not match:
            plain.append(port)
            continue
        key = (match.group(1), port["type"])
        families.setdefault(key, []).append(int(match.group(2)))
    for (prefix, type_name), numbers in families.items():
        numbers.sort()
        if len(numbers) >= 4:
            plain.append({
                "name": f"{prefix}{numbers[0]:03d} … {prefix}{numbers[-1]:03d}",
                "type": type_name,
                "dynamic": True,
                "initiallyHidden": True,
            })
        else:
            plain.extend({"name": f"{prefix}{number:03d}", "type": type_name} for number in numbers)
    return plain


def section(category: str, name: str) -> str:
    if "__hidden__" in category:
        return "Development"
    if "Deprecated" in category:
        return "Deprecated & Migration"
    if "/regional/detailer" in category or "Detailer" in name or "Detector" in name:
        return "Detailer"
    if "/regional" in category:
        return "Regional Prompting"
    if "/prompting" in category:
        return "Prompt Processing"
    if "/pipe" in category:
        return "Pipes & Workflow Data"
    if "/subgraph" in category:
        return "Subgraph Interface"
    if "/latent" in category:
        return "Latent & Utilities"
    if "/control" in category:
        return "Workflow Control"
    return "Utilities"


def mark_legacy_port(ports: list[dict[str, object]], name: str, guidance: str) -> None:
    for port in ports:
        if port["name"] == name:
            port["legacy"] = True
            port["legacyGuidance"] = guidance
            return


def apply_asset_overrides(assets: list[dict[str, object]], wiki_root: Path) -> None:
    """Apply reviewed captures without replacing retained historical assets."""
    overrides_path = wiki_root / "asset-overrides.json"
    if not overrides_path.is_file():
        return
    overrides = json.loads(overrides_path.read_text(encoding="utf-8"))["assets"]
    by_id = {asset["id"]: asset for asset in assets}
    if unknown := set(overrides) - set(by_id):
        raise ValueError(f"Unknown asset overrides: {sorted(unknown)}")
    for asset_id, override in overrides.items():
        asset = by_id[asset_id]
        status = override["status"]
        if status not in {"approved", "not-applicable", "blocked"}:
            raise ValueError(f"Invalid override status: {asset_id}")
        for key in ("path", "workflowEmbedded", "sha256", "caption"):
            asset.pop(key, None)
        asset.update(status=status, instructions=override["instructions"], aiGeneratedReviewRequired=False)
        if status != "approved":
            if override.get("path"):
                raise ValueError(f"Unavailable asset must not have a path: {asset_id}")
            continue
        relative = Path(override["path"].removeprefix("/"))
        expected_folder = "nodes" if asset["type"] == "node" else "connections"
        if relative.is_absolute() or relative.parts[:2] != ("assets", expected_folder) or ".." in relative.parts:
            raise ValueError(f"Invalid asset path: {asset_id}")
        path = wiki_root / "public" / relative
        if hashlib.sha256(path.read_bytes()).hexdigest() != override["sha256"]:
            raise ValueError(f"Reviewed asset hash mismatch: {asset_id}")
        if not png_contains_embedded_workflow(path):
            raise ValueError(f"Reviewed capture lacks workflow metadata: {asset_id}")
        asset.update(path=override["path"], sha256=override["sha256"], workflowEmbedded=True)
        if override.get("caption"):
            asset["caption"] = override["caption"]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", type=Path)
    parser.add_argument("--assets-only", action="store_true", help="Refresh reviewed assets without importing or changing node contracts.")
    parser.add_argument("--comfy-root", type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--assets", required=True, type=Path)
    parser.add_argument("--target-version")
    parser.add_argument("--generated-date", required=True)
    args = parser.parse_args()

    wiki_root = Path(__file__).resolve().parent.parent
    documentation_target = json.loads((wiki_root / "documentation-target.json").read_text(encoding="utf-8"))
    target_version = documentation_target["targetVersion"]
    if args.target_version and args.target_version != target_version:
        parser.error(f"--target-version {args.target_version} does not match documentation target {target_version}")

    if args.assets_only:
        manifest = json.loads(args.assets.read_text(encoding="utf-8"))
        apply_asset_overrides(manifest["assets"], wiki_root)
        manifest["generated"] = args.generated_date
        args.assets.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        return
    if args.source is None:
        parser.error("--source is required unless --assets-only is used")
    source = args.source.resolve()
    source_version = tomllib.loads((source / "pyproject.toml").read_text(encoding="utf-8"))["project"]["version"]
    # Import the checkout as a package regardless of whether it lives below a
    # ComfyUI/custom_nodes tree or in an isolated Git worktree. An isolated
    # worktree can use the host runtime supplied through --comfy-root.
    if args.comfy_root:
        sys.path.insert(0, str(args.comfy_root.resolve()))
    sys.path.insert(0, str(source.parent))
    package = importlib.import_module(source.name)
    descriptions = json.loads((source / "node_list.json").read_text(encoding="utf-8"))

    nodes = []
    legacy_consumers = {
        "BV Regional Native Conditioning",
        "BV Regional SDXL Attention",
        "BV Regional Z-Image Attention",
        "BV Regional FLUX.2 Klein 9B Attention",
        "BV Regional Krea 2 Attention",
        "BV Regional Anima Conditioning",
    }
    legacy_nodes = legacy_consumers | {"BV Regional Prompt", "BV Regional Detailer Plan"}
    for name, cls in package.NODE_CLASS_MAPPINGS.items():
        category = str(getattr(cls, "CATEGORY", ""))
        raw_inputs = {}
        input_error = None
        try:
            raw_inputs = cls.INPUT_TYPES()
        except Exception as error:  # pragma: no cover - generator diagnostics
            input_error = str(error)
        inputs = {}
        for group, values in raw_inputs.items():
            if not isinstance(values, dict):
                continue
            inputs[group] = collapse_ports([
                contract_input(name, key, value) for key, value in values.items()
            ])
        output_types = list(getattr(cls, "RETURN_TYPES", ()) or ())
        output_names = list(getattr(cls, "RETURN_NAMES", ()) or output_types)
        outputs = collapse_ports([
            {"name": str(output_names[index] if index < len(output_names) else output_type), "type": str(output_type)}
            for index, output_type in enumerate(output_types)
        ])
        if name in legacy_consumers:
            mark_legacy_port(inputs.get("optional", []), "lora_registry", "Use Regional V3 resource providers.")
            mark_legacy_port(inputs.get("optional", []), "lora_bindings", "Use the BV_REGIONAL context input.")
        elif name == "BV Regional Detailer Plan":
            mark_legacy_port(inputs.get("optional", []), "detector_registry", "Use Regional V3 detector resource providers.")
        elif name == "BV Regional Prompt":
            mark_legacy_port(outputs, "lora_bindings", "Use the BV_REGIONAL context output and V3 capability editors.")
        internal = category == "__hidden__" or name.endswith("(internal)")
        deprecated = "Deprecated" in category
        experimental = bool(getattr(cls, "EXPERIMENTAL", False))
        if internal:
            continue
        status = "deprecated" if deprecated else "experimental" if experimental else "stable"
        nodes.append({
            "name": name,
            "slug": slugify(name.replace("(internal)", "")),
            "description": descriptions.get(name) or str(getattr(cls, "DESCRIPTION", "")) or f"Reference contract for {name}.",
            "category": category,
            "section": section(category, name),
            "status": status,
            "legacyPorts": name in legacy_nodes,
            "inputs": inputs,
            "outputs": outputs,
            "inputError": input_error,
        })
    nodes.sort(key=lambda node: (node["section"], node["name"]))

    assets = []
    for node in nodes:
        base = node["slug"]
        assets.extend([
            {
                "id": f"{base}--node--default",
                "page": f"/node-reference/{base}",
                "type": "node",
                "status": "missing",
                "instructions": f"Transparent export of {node['name']} in its default newly-created state. Show the title, widgets, and normal public ports; no selection outline or cursor.",
            },
            {
                "id": f"{base}--connection--minimal",
                "page": f"/node-reference/{base}",
                "type": "connection",
                "status": "missing",
                "instructions": f"Minimal meaningful ConfigUI wiring centered on {node['name']}. Use a neutral dark canvas and only the smallest required upstream/downstream context.",
            },
        ])
    for slug, name in [
        ("bv-subgraph-heading", "BV Subgraph Heading"),
        ("bv-subgraph-spacer", "BV Subgraph Spacer"),
        ("bv-subgraph-divider", "BV Subgraph Divider"),
        ("bv-dynamic-combo", "BV Dynamic Combo"),
    ]:
        assets.append({
            "id": f"{slug}--subgraph--minimal",
            "page": f"/node-reference/{slug}",
            "type": "connection",
            "status": "missing",
            "instructions": f"Inside view of a minimal Subgraph definition centered on {name}, including the projected interface wiring.",
        })
    assets.extend([
        {"id": "installation-current--configuration--manager-search", "page": "/getting-started/installation", "type": "configuration", "status": "missing", "instructions": "Current Nodes Manager search result showing BV-NodePack 1.0.0. Retained across releases as UI orientation; it does not verify the current BV Node Pack release."},
        {"id": "installation-legacy--configuration--manager-search", "page": "/getting-started/installation", "type": "configuration", "status": "missing", "instructions": "Legacy ComfyUI Manager search result showing BV-NodePack 1.0.0. Retained for older ComfyUI installations as UI orientation; it does not verify the current BV Node Pack release."},
        {"id": "quick-start--connection--seed-latent", "page": "/getting-started/quick-start", "type": "connection", "status": "missing", "instructions": "Complete 1024x1024 Anima example showing BV Seed connected to BV Empty Latent Random Ratio with only 1:1 enabled, followed by the prompt, sampler, decode, and saved output path.", "aiGeneratedReviewRequired": False},
        {"id": "regional-v3-concept--configuration--architecture", "page": "/concepts/regional-v3", "type": "configuration", "status": "approved", "instructions": "Documentation-native architecture graphic showing Root-to-Subgraph, Subgraph-to-Root, and sibling Subgraph Registry DG routes inside one owning workflow. Separate domain IDs from bvDgSenderId transport identity, show native typed boundary links, and retain the hard no-cross-workflow boundary.", "extension": "svg", "aiGeneratedReviewRequired": False},
        {"id": "workflow-identity--configuration--scope", "page": "/concepts/workflow-identity", "type": "configuration", "status": "approved", "instructions": "Documentation-native graph-scope graphic comparing a valid same-root provider link, a valid same-Subgraph-definition link, and a rejected cross-workflow lookup. Stable executable IDs are contrasted with presentation-only labels and ordering.", "extension": "svg", "aiGeneratedReviewRequired": False},
        {"id": "regional-v3-guide--workflow--native-exclusive", "page": "/node-guides/regional-v3", "type": "workflow", "status": "captured", "filename": "regional-v3-guide--native-exclusive.png", "instructions": "Selection export of a complete 1024x1024 Illustrious example using BV LoRA Registry, BV Regional Prompt, BV Regional Native Conditioning in exclusive mode, KSampler, VAE Decode, and BV Regional Save Send. Contains an embedded workflow and requires the listed third-party checkpoint, embeddings, and LoRAs.", "aiGeneratedReviewRequired": False},
        {"id": "regional-v3-guide--configuration--editor", "page": "/node-guides/regional-v3", "type": "configuration", "status": "captured", "filename": "regional-v3-guide--editor.png", "instructions": "BV Regional Editor showing two named generation regions, their spatial masks, Global prompts, and a region-scoped Fern LoRA Registry assignment alongside the generated 1024x1024 example.", "aiGeneratedReviewRequired": False},
        {"id": "lut-library-guide--workflow--hdr-color-boost", "page": "/node-guides/lut-library", "type": "workflow", "status": "captured", "filename": "lut-library-guide--hdr-color-boost.png", "instructions": "Importable direct-application example showing Load Image, BV LUT Loader set to Built-in: HDR Color Boost, BV Apply LUT at strength 1.00, and side-by-side source and result previews. Replace the referenced test-character input image after import when it is unavailable locally.", "aiGeneratedReviewRequired": False},
        {"id": "lut-library-guide--configuration--stable-catalog", "page": "/node-guides/lut-library", "type": "configuration", "status": "captured", "filename": "lut-library-guide--stable-catalog.png", "instructions": "BV Download Manager showing the Stable LUT catalog v1 snapshot with search, availability filters, source and license links, download actions, and catalog refresh. The PNG intentionally embeds the underlying HDR Color Boost example workflow rather than the manager window itself.", "aiGeneratedReviewRequired": False},
        {"id": "lora-library-registry--configuration--named-stacks", "page": "/node-guides/lora-library", "type": "configuration", "status": "captured", "instructions": "BV LoRA Registry showing two enabled named stacks, one local LoRA assignment per stack, and the saved workflow-owned registry state. Fern and Frieren are examples and are not included with BV Node Pack. The PNG intentionally embeds the underlying example workflow rather than the open Registry window itself.", "aiGeneratedReviewRequired": False},
        {"id": "lora-library-catalog--configuration--filtered-selection", "page": "/node-guides/lora-library", "type": "configuration", "status": "captured", "instructions": "Add LoRA catalog filtered to two local example resources, showing directory facets, model metadata, safe preview images, the mature-or-unrated preview preference, and the target stack. Fern and Frieren are examples and are not included with BV Node Pack. The PNG intentionally embeds the underlying example workflow rather than the open catalog window itself.", "aiGeneratedReviewRequired": False},
        {"id": "detailer-loop-guide--connection--minimal", "page": "/node-guides/detailer-loop", "type": "connection", "status": "missing", "instructions": "Minimal two-job Detailer loop graph from BV Regional Detailer Plan through Start, Job Resolver, one processing placeholder, and End. Hidden expansion nodes must not be manually placed."},
        {"id": "detailer-loop-guide--configuration--detectors", "page": "/node-guides/detailer-loop", "type": "configuration", "status": "missing", "instructions": "BV Detector Registry and Regional Detailer configuration showing two stable detector resources without exposing private model paths."},
        {"id": "smart-pipes-guide--configuration--slots", "page": "/node-guides/smart-pipes", "type": "configuration", "status": "missing", "instructions": "BV Smart Pipe editor with a small set of clearly named typed slots and stable identity; avoid project-specific names."},
        {"id": "smart-pipes-guide--connection--merge", "page": "/node-guides/smart-pipes", "type": "connection", "status": "missing", "instructions": "Two Smart Pipe branches merging in explicit order, with one deliberate conflict explained by the surrounding guide."},
        {"id": "prompt-processing-guide--connection--pipeline", "page": "/node-guides/prompt-processing", "type": "connection", "status": "missing", "instructions": "Minimal structured prompt graph from BV Prompt Encode through category filtering and AST display to BV Prompt Decode. Use distinct neutral marker text per category."},
        {"id": "workflow-control-guide--configuration--matrix", "page": "/node-guides/workflow-control", "type": "configuration", "status": "missing", "instructions": "BV Control Center configured for two clearly named stages, showing active, bypass, and mute choices without unrelated workflow content."},
        {"id": "workflow-control-guide--connection--stages", "page": "/node-guides/workflow-control", "type": "connection", "status": "missing", "instructions": "Small graph with two controlled stages and an observable output path. Make target association and safe bypass behavior visually clear."},
        {"id": "subgraph-interface-guide--configuration--surface", "page": "/node-guides/subgraph-interface", "type": "configuration", "status": "missing", "instructions": "Parent graph showing two instances of one Subgraph definition with headings, divider, spacer, and a small set of projected controls. Use distinct values per instance."},
        {"id": "latent-utilities-guide--configuration--fixed", "page": "/node-guides/latent-utilities", "type": "configuration", "status": "missing", "instructions": "BV Seed with one workflow-specific fixed value and BV Empty Latent Random Ratio constrained to 1024x1024 and 1:1. Do not present the seed as a global recommendation."},
        {"id": "workflow-verification--configuration--gates", "page": "/workflow-recipes/verification", "type": "configuration", "status": "missing", "instructions": "Documentation-native checklist graphic separating structural verification from optional visual approval, converging on publication approval."},
        {"id": "prompt-processing--workflow--embedded", "page": "/node-guides/prompt-processing", "type": "workflow", "status": "missing", "instructions": "Prompt AST workflow with distinct category markers and two filtering branches. Export matching JSON and lossless embedded-workflow PNG after structural verification."},
        {"id": "workflow-control--workflow--embedded", "page": "/node-guides/workflow-control", "type": "workflow", "status": "missing", "instructions": "Two-stage workflow demonstrating active, safe bypass, and mute states with an observable deterministic output. Verify copying and reload behavior."},
        {"id": "subgraph-interface--workflow--embedded", "page": "/node-guides/subgraph-interface", "type": "workflow", "status": "missing", "instructions": "One Subgraph definition used by two parent instances with distinct projected values. Export only after identity and persistence checks pass."},
        {"id": "latent-utilities--workflow--embedded", "page": "/node-guides/latent-utilities", "type": "workflow", "status": "missing", "instructions": "Deterministic BV Seed and BV Empty Latent Random Ratio example. Use 1024x1024 and 1:1 unless a documented model constraint requires an approved exception."},
        {"id": "ui-guide--configuration--window-states", "page": "/ui-guide", "type": "configuration", "status": "missing", "instructions": "BV-owned editor demonstrated in workspace, floating, minimized, and switching states. Use one neutral example workflow and default interface size."},
        {"id": "ui-guide--configuration--notifications", "page": "/ui-guide", "type": "configuration", "status": "missing", "instructions": "Tightly cropped BV notification examples for migration summary, unresolved provider, and Legacy Debug state. Compose from real UI captures only."},
        {"id": "detailer-loop--workflow--embedded", "page": "/node-guides/detailer-loop", "type": "workflow", "status": "missing", "instructions": "Two-job Regional Detailer workflow using BV Detector Registry and Impact SEGS. Requires successful execution and output review before embedded PNG export."},
        {"id": "upgrading-to-1-0--configuration--legacy-debug", "page": "/migration/upgrading-to-1-0", "type": "configuration", "status": "missing", "instructions": "ConfigUI Settings screenshot showing Enable BV Regional Legacy Debug Mode and the Ctrl+Alt+B shortcut. English UI, dark theme, tightly cropped."},
        {"id": "documentation-home--result--regional", "page": "/", "type": "result", "status": "missing", "instructions": "Approved representative BV Regional result for the documentation home hero. No embedded workflow required; confirm provenance and model attribution."},
    ])

    wiki_root = args.assets.resolve().parents[2]
    asset_folders = {
        "node": "nodes",
        "connection": "connections",
        "configuration": "configuration",
        "workflow": "workflows",
        "result": "results",
    }
    for asset in assets:
        stem = asset["id"].split("--", 1)[0]
        extension = asset.pop("extension", "png")
        filename = asset.pop("filename", None)
        if filename is None:
            filename = f"{asset['id']}.{extension}" if asset["id"].endswith("--subgraph--minimal") else f"{stem}.{extension}"
        relative_path = Path("assets") / asset_folders[asset["type"]] / filename
        asset_path = wiki_root / "public" / relative_path
        if asset_path.is_file():
            if asset["status"] not in {"reviewed", "optimized", "approved"}:
                asset["status"] = "captured"
            asset["path"] = f"/{relative_path.as_posix()}"
            asset["workflowEmbedded"] = png_contains_embedded_workflow(asset_path)
        instructions = asset["instructions"].lower()
        asset["aiGeneratedReviewRequired"] = asset.get("aiGeneratedReviewRequired", (
            asset["type"] in {"connection", "workflow"}
            or (asset["type"] == "configuration" and any(term in instructions for term in ("graph", "workflow", "wiring")))
        ))

    apply_asset_overrides(assets, wiki_root)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps({"targetVersion": target_version, "sourceVersion": source_version, "generated": args.generated_date, "nodes": nodes}, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    args.assets.parent.mkdir(parents=True, exist_ok=True)
    args.assets.write_text(json.dumps({"generated": args.generated_date, "assets": assets}, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")



if __name__ == "__main__":
    main()
