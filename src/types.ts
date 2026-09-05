export type Port = {
  name: string;
  type: string;
  dynamic?: boolean;
  initiallyHidden?: boolean;
  legacy?: boolean;
  legacyGuidance?: string;
};
export type NodeContract = {
  name: string;
  slug: string;
  description: string;
  category: string;
  section: string;
  status: "stable" | "experimental" | "deprecated";
  legacyPorts: boolean;
  inputs: Record<string, Port[]>;
  outputs: Port[];
  inputError?: string | null;
};
export type AssetType = "node" | "connection" | "configuration" | "workflow" | "result";
export type AssetEntry = {
  id: string;
  page: string;
  type: AssetType;
  status: "missing" | "captured" | "reviewed" | "optimized" | "approved" | "not-applicable" | "blocked";
  instructions: string;
  path?: string;
  aiGeneratedReviewRequired?: boolean;
  workflowEmbedded?: boolean;
  sha256?: string;
  caption?: string;
};
export type PageInfo = {path: string; title: string; summary: string; section: string; hidden?: boolean};
