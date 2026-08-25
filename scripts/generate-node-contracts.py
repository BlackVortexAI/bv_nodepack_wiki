from __future__ import annotations

import argparse
import importlib
import json
import re
import sys
from pathlib import Path


def slugify(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


def value_type(value: object) -> str:
    if isinstance(value, (list, tuple)) and value:
        first = value[0]
        if isinstance(first, (list, tuple)):
            return "choice: " + " | ".join(str(item) for item in first)
        return str(first)
    return str(value)


def collapse_ports(ports: list[dict[str, str]]) -> list[dict[str, str]]:
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
            plain.append({"name": f"{prefix}{numbers[0]:03d} … {prefix}{numbers[-1]:03d}", "type": type_name, "dynamic": True})
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


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--assets", required=True, type=Path)
    args = parser.parse_args()

    source = args.source.resolve()
    comfy_root = source.parents[1]
    sys.path.insert(0, str(comfy_root))
    package = importlib.import_module("custom_nodes.bv_nodepack")
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
                {"name": key, "type": value_type(value)} for key, value in values.items()
            ])
        output_types = list(getattr(cls, "RETURN_TYPES", ()) or ())
        output_names = list(getattr(cls, "RETURN_NAMES", ()) or output_types)
        outputs = collapse_ports([
            {"name": str(output_names[index] if index < len(output_names) else output_type), "type": str(output_type)}
            for index, output_type in enumerate(output_types)
        ])
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
        if node["legacyPorts"]:
            assets.append({
                "id": f"{base}--legacy--debug-visible",
                "page": f"/node-reference/{base}",
                "type": "legacy",
                "status": "missing",
                "instructions": f"Second screenshot of {node['name']} with Enable BV Regional Legacy Debug Mode active. Match the default screenshot framing and expose only the deprecated ports.",
            })

    assets.extend([
        {"id": "installation--configuration--manager-search", "page": "/getting-started/installation", "type": "configuration", "status": "missing", "instructions": "ConfigUI Manager search result for BV Node Pack, showing the installed package identity without unrelated personal paths."},
        {"id": "quick-start--connection--seed-latent", "page": "/getting-started/quick-start", "type": "connection", "status": "missing", "instructions": "Neutral canvas showing BV Seed connected to the smallest meaningful deterministic starter path and BV Empty Latent Random Ratio configured to 1024x1024 with only 1:1 enabled."},
        {"id": "regional-v3-concept--configuration--architecture", "page": "/concepts/regional-v3", "type": "configuration", "status": "missing", "instructions": "Documentation-native architecture graphic: authoring document -> typed provider links -> scoped capability composition -> executor. Distinguish collector, configuration owner, and executor."},
        {"id": "workflow-identity--configuration--scope", "page": "/concepts/workflow-identity", "type": "configuration", "status": "missing", "instructions": "Documentation-native graph-scope graphic comparing a valid same-root provider link, a valid same-Subgraph-definition link, and a rejected cross-workflow lookup."},
        {"id": "regional-v3-guide--configuration--editor", "page": "/node-guides/regional-v3", "type": "configuration", "status": "missing", "instructions": "Regional Editor with Global, Background, and two named regions. English UI, 1024x1024 canvas, simple non-sensitive prompts, no Legacy Debug ports."},
        {"id": "regional-v3-guide--connection--minimal", "page": "/node-guides/regional-v3", "type": "connection", "status": "missing", "instructions": "Minimal Regional V3 authoring-to-executor graph using BV Regional Prompt and one compatible consumer; persisted provider links visible where applicable."},
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
        {"id": "regional-v3-quick-start--workflow--embedded", "page": "/node-guides/regional-v3", "type": "workflow", "status": "missing", "instructions": "Verified 1024x1024 Regional V3 starter workflow. Freeze a visually accepted per-workflow seed; export lossless PNG with embedded workflow JSON and matching extracted JSON."},
        {"id": "detailer-loop--workflow--embedded", "page": "/node-guides/detailer-loop", "type": "workflow", "status": "missing", "instructions": "Two-job Regional Detailer workflow using BV Detector Registry and Impact SEGS. Requires successful execution and output review before embedded PNG export."},
        {"id": "upgrading-to-1-0--configuration--legacy-debug", "page": "/migration/upgrading-to-1-0", "type": "configuration", "status": "missing", "instructions": "ConfigUI Settings screenshot showing Enable BV Regional Legacy Debug Mode and the Ctrl+Alt+B shortcut. English UI, dark theme, tightly cropped."},
        {"id": "documentation-home--result--regional", "page": "/", "type": "result", "status": "missing", "instructions": "Approved representative BV Regional result for the documentation home hero. No embedded workflow required; confirm provenance and model attribution."},
    ])

    wiki_root = args.assets.resolve().parents[2]
    asset_folders = {
        "node": "nodes",
        "connection": "connections",
        "configuration": "configuration",
        "legacy": "legacy",
        "workflow": "workflows",
        "result": "results",
    }
    for asset in assets:
        stem = asset["id"].split("--", 1)[0]
        relative_path = Path("assets") / asset_folders[asset["type"]] / f"{stem}.png"
        if (wiki_root / "public" / relative_path).is_file():
            asset["status"] = "captured"
            asset["path"] = f"/{relative_path.as_posix()}"

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps({"targetVersion": "1.0.0", "generated": "2026-08-25", "nodes": nodes}, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    args.assets.parent.mkdir(parents=True, exist_ok=True)
    args.assets.write_text(json.dumps({"generated": "2026-08-25", "assets": assets}, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")



if __name__ == "__main__":
    main()
