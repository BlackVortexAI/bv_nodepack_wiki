# Framework Spike

Status: **Throwaway development prototype — never publish**

Question: Which foundation gives BV NodePack the best combination of complete BV UI
control, production-bundle isolation, nested navigation, fully local search, GitHub Pages
base-path support, schema validation, build simplicity, bundle size, and maintainability?

Candidates:

- `custom-vite-mdx`: isolated Vite + React + MDX application.
- `docusaurus`: Docusaurus classic preset with BV-owned page components and CSS.

Both prototypes use the same representative content and expose three deliberately different
technical shell variants through `?variant=A`, `?variant=B`, and `?variant=C`. These variants
only test theming/layout control; they are not the separate visual-approval prototype.

Run:

```powershell
npm run spike:custom:dev
npm run spike:docusaurus:dev
npm run spike:build
```
