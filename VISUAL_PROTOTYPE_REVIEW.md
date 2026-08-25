# Visual Prototype Review

Status: **Awaiting Florian's visual approval**
Date: 2026-08-24
Prototype: `spikes/visual-prototype`
Baseline: `codex/regional-context-v3`
Publication status: **Local development draft — never publish**

## Prototype question

Which information hierarchy should become the BV NodePack documentation shell?

All three variants expose the same representative content and are switchable on one route
through `?variant=A|B|C`. Use `page=home|reference|guide` or the floating selector.

## Variants

### A — Workbench

Persistent nested tree on the left, documentation canvas in the center, and on-page table of
contents on the right.

- Strongest fit for a large node reference and advanced-user lookup.
- Makes hierarchy, current location, and neighboring contracts continuously visible.
- Highest desktop information density without feeling like a control panel.
- Mobile collapses navigation and TOC, leaving the document as the primary surface.
- Risk: the three-column frame can feel constrained on medium-width laptops.

### B — Atlas

Horizontal task navigation with a wide editorial canvas and a small contextual topic dock.

- Strongest home/guide reading rhythm and most approachable standard-user entry.
- Gives screenshots, workflows, and explanatory prose the most breathing room.
- Weakest representation of a deep 58-node reference hierarchy.
- Risk: users may depend too heavily on search because the full tree is not continuously visible.

### C — Index

Compact icon rail, dense nested index, and a tool-like contract workspace.

- Strongest relationship to BV's application/tool surfaces.
- Efficient for expert users moving repeatedly between node contracts.
- The most distinctive identity, but also the most visually "application-like".
- Risk: the double navigation rail competes with long-form learning content.

## Luna's provisional review

Recommended direction: **A — Workbench as the structural base**, with two selective imports:

1. use B's wider, calmer content treatment for Home, Getting Started, and long Node Guides;
2. use C's compact mode only as an optional narrow navigation treatment, not as the default
   desktop shell.

This hybrid preserves the plan's nested tree and advanced discoverability while giving guided
content enough space. Keep `#1345B7` restricted to focus, selection, primary actions, and small
anchors. Do not use blue as a large surface fill. Semantic warning/status colors remain separate.

This is a source/layout review, not completed rendered-browser QA. The in-app browser could not
start because its Windows sandbox helper failed during setup. Florian's own rendered review is
therefore required before the production foundation begins.

## Coverage

- Home with six system cards
- expanded nested navigation
- Node Reference with metadata and contract table
- Node Guide with typed connection placeholder
- Workflow Preview with accessible dialog/lightbox affordance
- local PNG/JSON download placeholders
- Known Issue callout
- local search results across nodes, guides, systems, and errors
- breadcrumbs, previous/next navigation, and on-page TOC
- desktop layouts and a shared mobile breakpoint
- visible V3 development status and zero stable/publication claims

## Verification

- `npm run prototype:visual:build`: passed
- Vite 8.2.2 build: 18 modules, 14.28 KB CSS, 208.73 KB JavaScript
- all nine `variant × page` query combinations returned HTTP 200
- GitHub Pages base path: `/bv_node_wiki/`
- required source markers for search, dialog, downloads, placeholders, Known Issue, and mobile
  breakpoint: present
- rendered visual/browser QA: pending due browser sandbox failure

## How to review

Run:

```powershell
npm run prototype:visual:dev
```

Open:

```text
http://127.0.0.1:5174/bv_node_wiki/?variant=A&page=home
```

Use the floating control or left/right arrow keys to switch variants. Review all three pages in
each variant. Arrow keys are ignored while search/input controls are focused.

## Decision requested

Choose one of:

1. approve A unchanged;
2. approve the recommended hybrid: A shell + B content widths + optional compact C navigation;
3. name another combination of specific elements;
4. reject all three and state the missing direction.

Approval authorizes rewriting the chosen decision into the isolated production React/MDX
foundation. It does not authorize publication, push, deployment, or README replacement.
