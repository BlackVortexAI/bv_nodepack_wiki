# BV NodePack Repository Audit

Status: **Approved as audit working basis; no cleanup authorization**
Audit date: 2026-08-24
Audit mode: read-only source inspection
Documentation workspace: `X:\bv_node_wiki`
Source: `X:\Stability Matrix\Data\Packages\ComfyUI 2026-06\custom_nodes\bv_nodepack`
## Executive result
The source contains a coherent production NodePack, substantial tests, public examples,
reusable documentation, internal research, publishing workspaces, and generated local
artifacts. Florian has selected this V3 branch as the **development documentation baseline**. It is not yet an approved public stable-release baseline.

The inspected source was the development branch `codex/regional-context-v3` at
`6a14adb57e00a8fb04c4b6af88b053c675e8ccfc`. `pyproject.toml` reports `0.18.2`, but the
local repository has no Git tags. The worktree contains a modified tracked test and multiple
untracked research, publishing, configuration-backup, and prototype items. No release is
therefore identified as the approved public stable release.

No source file was changed, staged, moved, deleted, or committed during this audit.

## Scope

The audit covered all 461 tracked files at the inspected commit, root metadata, production
Python and JavaScript, TypeScript/React sources, tests, schemas, scripts, examples, workflows,
assets, documentation, ADRs, specs, research, publishing material, local artifacts, licensing,
and third-party notices.

## Repository state

| Property | Observed value | Consequence |
| --- | --- | --- |
| Branch | `codex/regional-context-v3` | Development branch; not stable documentation truth |
| HEAD | `6a14adb57e00a8fb04c4b6af88b053c675e8ccfc` | Audit snapshot only |
| Declared version | `0.18.2` | Must match an approved published release |
| Git tags | none locally | No immutable release identity established |
| Modified tracked file | `tests/ui_control_integration.test.mjs` | Status says modified; content diff was empty, consistent with line-ending metadata drift |
| Untracked content | publishing packages, research notes, UI prototypes, disabled Codex config | Must not be silently promoted |
| Pages workflow | none | Expected before framework/readiness approval |
| Registry workflow | `.github/workflows/publish.yml` | Keep separate from Pages |
| Validation workflow | `.github/workflows/validate.yml` | Python, frontend, typecheck, build, bundle-diff checks |

## Classification register

Recommendations only. `Move/Archive` and `Remove` require a later approved focused diff.

### Keep

| Path/group | Reason |
| --- | --- |
| `__init__.py`, `py/` | Production backend and primary contract evidence |
| `ui/src/` and UI build configuration | Production frontend/BV UI evidence; docs must remain entry-point isolated |
| `js/` | Shipped frontend bundle validated by CI |
| `data/`, `schemas/` | Runtime data and public machine-readable contracts |
| `node_list.json` | Inventory seed with 58 registered names, including internal/M0 nodes |
| `pyproject.toml` | Package identity, version, Registry metadata and current URLs |
| `LICENSE`, `THIRD_PARTY_NOTICES.md` | License/provenance surface, subject to findings below |
| `.github/workflows/publish.yml` | Existing NodePack Registry publication path |
| `.github/workflows/validate.yml` | Existing production validation path |
| `tests/` | Regression evidence, not automatic public proof |
| `scripts/` | Reproducible workflow/example support |
| `examples/` | Public candidates, subject to stable-release reproduction |
| `workflows/workflow_AST_with_pipe.png` | Workflow-PNG candidate; import/metadata verification required |
| `docs/adr/`, `docs/specs/` | Architecture/contract evidence; not direct copy material |
| `docs/assets/brand/`, `docs/assets/registry/` | Brand/Registry assets with recorded provenance |
| `.gitignore` | Excludes ordinary generated and local-only material |

### Review

| Path/group | Required review |
| --- | --- |
| `README.md` | 91,977-byte secondary source; copied here as an explicitly marked draft |
| `CONTEXT.md` | Decide current architectural guidance versus internal context |
| Tracked `docs/*.md` guides | Rewrite against approved stable runtime; do not migrate verbatim |
| `docs/assets/regional/`, `docs/screenshots/` | Stable UI state, crop, naming, role, alt text, visual readiness |
| `docs/examples/`, `examples/images/` | Schema, dependencies, metadata, public safety, reproduced execution |
| Tracked `docs/research/` | Unverified research/handoff pointers only |
| `docs/regional-editor-mvp.md` | Likely historical; decide archive state |
| `docs/assets/bv-nodepack-hero.svg`, `docs/assets/publishing/` | Brand direction, ownership and current use |
| `THIRD_PARTY_NOTICES.md` Krea section | Contains `Copyright (c) 2026 YOUR_NAME`; correct from authoritative upstream before publication |
| `data/completion/bv_default_tags.csv` | Confirm redistribution obligations of underlying source datasets |
| `pyproject.toml` Documentation URL | Points to native Wiki; change only after approved live Pages |
| Registry raw-GitHub icon/banner URLs | Acceptable Registry metadata, not normal Pages runtime dependencies |

### Move/Archive candidates

| Path/group | Proposed handling |
| --- | --- |
| Superseded tracked `docs/research/` and historical specs | Private archive or later clearly deprecated public area after item review |
| `docs/regional-editor-mvp.md` | Archive if superseded by a verified guide |
| Untracked `ui/prototypes/` | Preserve as visual research outside production source |
| Untracked `docs/publishing/civitai*` trees/ZIPs | External-publishing archive, separate from canonical Pages |
| Untracked dated research notes | Private research unless rewritten from verified stable evidence |

### Remove candidates

| Path/group | Reason/precondition |
| --- | --- |
| `__pycache__/`, `*.pyc` | Generated Python cache; approved cleanup only |
| `ui/node_modules/`, `ui/dist/`, coverage/cache output | Reproducible generated output; approved cleanup only |
| `comfy-test.log`, `comfy-test-error.log` | Ignored local test logs |
| `.abacusai/` | Large local tool/cache material; verify no evidence before cleanup |
| `.codex-disabled-20260822/` | Machine-specific config backup; inspect for secrets before removal |
| `.codex-test` | Empty local tool artifact; confirm ownership first |

Nothing in these groups was moved or removed.

## Workflow readiness

Candidate workflows exist for Regional prompting, Prompt AST, Smart Pipe, Subgraph UI,
Control Center, latent utilities, Regional V3 feasibility and the Detailer loop. Before Pages
publication each still requires stable-release loading, dependency declaration, wiring and
parameter verification, successful execution, output/persistence checks, PNG import, JSON
semantic equivalence and screenshots tied to that exact state.

## Licensing findings

- Repository license: GPL-3.0.
- Microsoft Fluent Emoji provenance and MIT text are recorded for cyclone derivatives.
- Derived Anima regional code includes an MIT notice.
- The Krea notice still contains the placeholder `YOUR_NAME`: publication blocker.
- Completion tag-data provenance is disclosed, but source-dataset terms remain unresolved.
- Untracked ZIPs/images need item-level provenance and secret/path inspection before reuse.

## README baseline

The source README was first copied byte-for-byte; both SHA-256 values matched:

`1CB2F4B0F969FFFEC93B586D40581EB992C3AE23A3B28F8F4C48AE82EEDE0B04`

The workspace copy now has a prominent draft warning and snapshot metadata. Its body remains
available for gradual maintenance. It is intentionally not shortened to the final target yet:
the plan allows replacement only after Pages is live and verified. Current relative asset
links remain unresolved here and are tracked as draft debt.

## Documentation-readiness assessment

| Requirement | State | Gap |
| --- | --- | --- |
| Development target identified | **Selected** | `codex/regional-context-v3`; follow the moving branch during V3 development |
| Published target stable release identified | **Pending** | Freeze and verify an immutable V3 release before publication |
| Node classifications known | **Partial** | 58 names found; public/internal/deprecated classification unfinished |
| Node contracts stable | **Unapproved** | Active Regional V3 commits on audit date |
| UI behavior/terminology stable | **Unapproved** | Active V3/UI work and untracked prototypes |
| Starter workflows run | **Unverified** | No approved target release |
| Screenshot UI visually ready | **Unapproved** | Existing/prototype screenshots require review |
| Compatibility/changelog reviewed | **Unverified** | README is secondary evidence |


## Per-file classification register

The regenerable per-file register is maintained in
[`audit/source-file-classification.csv`](audit/source-file-classification.csv), with usage and
cycle-update guidance in [`audit/README.md`](audit/README.md). Every current source file except
`.git` internals has its own classification, Git state, snapshot metadata, and current comment.
Regeneration proposes a new audit state; it never authorizes cleanup.

## Decisions required

1. Audit classifications are approved as a working basis; future cycle diffs may amend individual rows.
2. Explicitly authorize the framework spike against the moving V3 development baseline,
   overriding the current plan requirement that this phase wait for a published stable release.
3. Before public content claims or publication, identify an immutable V3 release and grant
   final documentation readiness for it.

Until then, framework spike, visual prototype, React/MDX foundation, capture tooling, asset
migration, cleanup, remote configuration, push and deployment remain out of scope.
