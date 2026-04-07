export const SITE_TITLE = "Lock-Side Coordination Frictions Demo";
export const SITE_DESCRIPTION =
  "An interactive bilingual policy sandbox for the paper on lock-side coordination frictions, connected spillovers, and fixed-budget governance designs.";

export const AUTHOR_NAME = "Suyang Wang";
export const AUTHOR_EMAIL = "wangsuyang@hhu.edu.cn";

export const IS_STATIC_MODE = process.env.NEXT_PUBLIC_STATIC_MODE === "true";
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
