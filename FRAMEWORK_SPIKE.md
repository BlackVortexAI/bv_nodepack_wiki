# Framework Spike Decision

Status: **Development decision — Custom Vite + React + MDX selected**
Date: 2026-08-24
Baseline: `codex/regional-context-v3` at `6a14adb57e00a8fb04c4b6af88b053c675e8ccfc`
Publication status: **Not approved; local development only**

## Question

Which foundation best supports complete BV UI ownership, strict isolation, nested docs
navigation, fully local search, GitHub Pages repository paths, schema validation, build
simplicity, small output, security, and maintainability?

Compared candidates:

1. isolated custom Vite 8 + React 19 + MDX 3 application;
2. Docusaurus 3.10 classic docs preset.

Both throwaway prototypes live under `spikes/` and build independently from the NodePack.
No workflow, remote, deployment, push, or publication configuration was created.

## Decision

Use **custom Vite + React + MDX** for the production foundation.

Docusaurus is stronger out of the box for static docs routing, generated nested sidebars,
breadcrumbs, previous/next navigation, table of contents, canonical metadata, and broken-link
checks. Those advantages do not compensate for the BV-specific costs:

- exact BV shell ownership would require broad theme replacement/swizzling;
- official search support is Algolia DocSearch, conflicting with the fully local/no-external-runtime requirement;
- custom metadata validation and the Shot Manifest still require BV-owned build tooling;
- the measured dependency surface is much larger;
- the current Docusaurus dependency tree reports unresolved audit findings;
- the shipped client output is materially larger before implementing BV-owned search and layouts.

The custom foundation requires us to own route generation, navigation/search indexing,
metadata validation, SEO output, breadcrumbs, previous/next links, and link checking. Those
are already explicit project requirements and benefit from one coherent BV-owned content
manifest rather than framework adapters plus swizzled theme internals.

## Measurements

Measurements are from the representative local spikes on Node 24.19.0 and npm 11.17.0.
They compare prototypes, not final production bundles.

| Criterion | Custom Vite + MDX | Docusaurus classic |
| --- | ---: | ---: |
| Successful measured build | 1.535 s total; Vite phase 149 ms | 6.269 s total |
| Static output | 6 files / 243,318 bytes | 25 files / 658,425 bytes |
| JavaScript output | 1 file / 239,582 bytes | 15 files / 531,791 bytes |
| CSS output | 2,176 bytes | 79,009 bytes |
| Resolved dependency paths | 192 | 1,281 |
| Workspace npm audit | 0 findings | 24 findings: 6 moderate, 18 high |
| Repository base path | Verified in generated asset URLs | Verified in generated canonical and asset URLs |
| Static representative routes | Verified via explicit route materialization | Generated natively |
| Nested docs navigation | BV-owned generator still required | Native sidebar model |
| Fully local search | Small local proof works; generated index required | Not in core official path; official support targets Algolia |
| Custom metadata schema | Zod proof works during build | Additional BV validation layer required |
| Exact BV UI ownership | Direct | Theme overrides/swizzling required |

The audit finding is dependency-tree evidence, not a claim that the generated static site is
immediately exploitable. Docusaurus' current tree includes advisories through `image-size`,
`serialize-javascript`, `webpack-dev-server`, `sockjs`, and `uuid`; several report no automatic
fix at the selected current version. No `npm audit fix` was run.

## Prototype findings

### Custom Vite + MDX

- MDX component mapping, BV-owned callouts/placeholders, Zod metadata parsing, local search,
  responsive shell variants, and repository base-path rewriting all worked.
- Vite alone emits an SPA entry, so the spike adds an explicit post-build static-route step.
- Production must replace the hardcoded route list with the validated content manifest and
  emit route-specific HTML metadata rather than copying one generic shell.
- Direct HTTP checks against the corrected development server returned 200 for variants A/C.

### Docusaurus

- Docs-only mode, MDX, nested sidebar, table of contents, canonical metadata, sitemap, and
  strict broken-link checking worked.
- The first SSG attempt correctly rejected browser-only `location` usage; adapting the page to
  the Docusaurus router fixed SSR.
- The next build correctly rejected missing home links; adding an explicit root document fixed it.
- The final production build generated root, Node Guide, Node Reference, and prototype routes.
- Local dev-server subroute HTTP checks were inconsistent in this environment even though the
  static route files were generated and the production build passed. Treat this as unresolved
  spike evidence, not a production defect conclusion.

## Browser QA limitation

The in-app browser connection could not start because the Windows sandbox helper remained in
its known failed refresh state after local Git initialization. No alternative browser automation
was substituted. Builds, generated files, base paths, route files, and local HTTP responses were
verified directly. Full visual browser QA remains mandatory for the separate visual prototype.

## Sources

- [Vite static deployment and GitHub Pages](https://vite.dev/guide/static-deploy.html)
- [Vite build base path](https://vite.dev/guide/build.html)
- [Docusaurus deployment](https://docusaurus.io/docs/deployment)
- [Docusaurus docs and docs-only mode](https://docusaurus.io/docs/docs-introduction/)
- [Docusaurus sidebars](https://docusaurus.io/docs/sidebar)
- [Docusaurus search](https://docusaurus.io/docs/search)
- [Docusaurus swizzling CLI](https://docusaurus.io/docs/cli)

## Production foundation requirements carried forward

1. Generate the content manifest from schema-validated MDX frontmatter.
2. Generate nested navigation, breadcrumbs, previous/next links, on-page TOC, and local search
   from the same manifest.
3. Materialize every stable versionless route and route-specific SEO metadata at build time.
4. Validate links, anchors, approved imports/components, assets, downloads, node coverage,
   screenshot IDs, workflow metadata, changelog order, and compatibility references.
5. Keep docs dependencies and entry points entirely inside the Wiki repository.
6. Preserve the GitHub Pages base path as configuration, not hardcoded content behavior.
7. Do not carry throwaway variant code into the production foundation.

## Next gate

Build the separate representative visual prototype on the selected custom foundation, perform
Luna's visual review, and present the genuinely uncertain variants to Florian. The production
React/MDX foundation begins only after Florian's visual approval.
