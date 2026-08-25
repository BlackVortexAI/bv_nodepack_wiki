/// <reference types="vite/client" />

declare module "*.mdx" {
  import type {ComponentType} from "react";
  export const meta: {title: string; slug: string; category: string; documentationStatus: string; [key: string]: unknown};
  const MDXContent: ComponentType;
  export default MDXContent;
}
