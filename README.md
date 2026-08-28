# BV Node Pack Documentation

English documentation source for BV Node Pack 1.1.

The site covers installation, core concepts, complete public-node reference,
task-oriented guides, workflow recipes, UI behavior, compatibility, migration,
troubleshooting, and support. Images and workflows remain explicit placeholders
until they pass the review queue.

## Local preview

Run `start-wiki-local.cmd` or:

```powershell
npm install
npm run wiki:dev
```

The command prints the local URL. Nothing is deployed or uploaded.

Local URL: `http://localhost:5174/bv_nodepack_wiki/`

The production base path is `/bv_nodepack_wiki/`, matching the intended
GitHub Pages project path. Repository and deployment configuration remain
outside this local documentation task.

## Validate

```powershell
npm run build
npm run validate
```

Regenerate the runtime-derived node contracts from a local BV Node Pack checkout:

```powershell
npm run generate:contracts -- --source "C:\path\to\bv_nodepack"
```

The generator requires Python and the source checkout's runtime dependencies.
No machine-specific source path is stored in this repository.

Validation checks runtime-derived public-node coverage, stable asset IDs, MDX
page coverage, internal links, asset-manifest coverage, and materialized routes.

## Content status

- Target documentation version: 1.1.0
- Public node reference pages: generated from the current runtime
- Screenshot and workflow status: tracked in `src/generated/asset-manifest.json`
- Deployment: intentionally not configured

`captured`, `reviewed`, `optimized`, and `approved` are distinct asset states.
A structurally valid workflow or screenshot is never treated as visual approval.

Internal planning, audit material, and maintainer handoffs are intentionally
kept outside this publication repository.
