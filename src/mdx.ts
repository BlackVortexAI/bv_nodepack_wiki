import type {ComponentType} from "react";

type ContentModule = {default: ComponentType; meta: {slug: string; title: string; documentationStatus?: string; appliesTo?: string}};
const modules = import.meta.glob<ContentModule>("../content/**/*.mdx", {eager: true});

export const contentBySlug = new Map(
  Object.values(modules).filter(module => module.meta?.slug).map(module => [module.meta.slug, module]),
);
