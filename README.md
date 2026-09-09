# BV Node Pack Documentation

English documentation source for BV Node Pack 1.4.3.

The site covers installation, core concepts, complete public-node reference,
task-oriented guides, workflow recipes, UI behavior, compatibility, migration,
troubleshooting, and support. 62 of the 64 public nodes have reviewed Nord
screenshots from the 1.3.0 capture pass; 56 have reviewed connection diagrams,
four have no applicable native connection example and two retain explicit
capture limitations. The two nodes added in 1.4.0 (BV Image Dimensions,
BV Reference Registry) and the four nodes whose ports changed since 1.3.0
(BV Regional Krea 2 Attention, BV Regional Native Conditioning, BV Regional
Prompt, BV Remote LLM Provider) still await a 1.4.x capture pass. These diagrams
are not executed workflow recipes. Optional missing guide artwork is omitted from
reader pages; the asset manifest retains all 23 missing assets and workflows.

Each content page declares the release it was verified against (`appliesTo`).
Pages may trail the documentation target until they are re-checked; they may
never claim a release newer than the target.

## Local preview

Run `start-wiki-local.cmd` or:

```powershell
npm ci
npm run wiki:dev
```

Local preview is optional. The command prints the local URL and does not deploy
or upload anything.

Local URL: `http://localhost:5174/bv_nodepack_wiki/`

The production base path is `/bv_nodepack_wiki/`, matching the GitHub Pages
project path.

## Validate

```powershell
npm run build
npm run validate
```

Regenerate the runtime-derived node contracts from a local BV Node Pack checkout:

```powershell
npm run generate:contracts -- --source "C:\path\to\bv_nodepack" --generated-date YYYY-MM-DD
```

The generator requires Python and the source checkout's runtime dependencies.
When needed, add `--comfy-root "C:\path\to\ComfyUI"` to resolve ComfyUI imports.
`asset-overrides.json` is authoritative for reviewed node and connection assets;
full regeneration validates their original PNG hashes and workflow metadata.
It is a separate maintainer snapshot step and is not part of the GitHub Pages
build. The documentation target comes from `documentation-target.json`; the
generated contract records the selected package checkout's own source version.
No machine-specific source path is stored in this repository.

Validation checks runtime-derived public-node coverage, stable asset IDs, MDX
page coverage, internal links, asset-manifest coverage, and materialized routes.
It consumes the committed contract and asset snapshots; it does not regenerate
them or deploy the site.

## GitHub Pages deployment

GitHub Actions is the regular production build and deployment path. A push to
the Wiki repository's `main` branch, or a manual workflow dispatch, runs:

1. a fresh checkout of this Wiki repository;
2. Node.js 22 setup and `npm ci`;
3. `npm run build` to create `dist`;
4. `npm run validate` to gate the materialized documentation;
5. upload of `dist` as the GitHub Pages artifact; and
6. deployment through the `github-pages` environment.

The Pages workflow neither checks out the BV Node Pack runtime repository nor
regenerates contracts or assets. `src/generated/*.json` and `public/assets/**`
are committed, reviewed snapshot inputs. `dist/` is an ephemeral CI artifact.

## Content status

- Target documentation version: 1.4.3
- Public node reference pages: committed snapshots generated from an explicitly
  selected BV Node Pack checkout
- Screenshot and workflow status: tracked in `src/generated/asset-manifest.json`
- Deployment: configured through GitHub Actions and GitHub Pages

`captured`, `reviewed`, `optimized`, and `approved` are distinct asset states.
A structurally valid workflow or screenshot is never treated as visual approval.

Internal planning, audit material, and maintainer handoffs are intentionally
kept outside this publication repository.
