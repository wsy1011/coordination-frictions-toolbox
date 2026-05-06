import type { LocalizedText } from "@/lib/locale";

export type LockPoint = {
  lock_id: number;
  lock_name: string;
  node_type: string;
  official_route: string;
  macro_corridor: string;
  gateway_type: string;
  observed_events: number;
  route_verified: number;
  notes?: string;
  longitude?: number;
  latitude?: number;
  has_geometry: boolean;
  display_order: number;
  is_public_visible: boolean;
};

export type CorridorMeta = {
  macro_corridor: string;
  lock_count: number;
  visible_points: number;
  total_events: number;
};

export type NetworkEdge = {
  source_id: number;
  target_id: number;
  source_name: string;
  target_name: string;
  section: string;
  edge_type: string;
  macro_corridor: string;
  weight: number;
  source_lon?: number | null;
  source_lat?: number | null;
  target_lon?: number | null;
  target_lat?: number | null;
};

export type NetworkResponse = {
  nodes: LockPoint[];
  edges: NetworkEdge[];
};

export type HeadlineEvidence = {
  administrative_rows: number;
  pressure_covariate_rows: number;
  mean_pre_dispatch_burden_min: number;
  median_pre_dispatch_burden_min: number;
  p75_pre_dispatch_burden_min: number;
  mean_local_queue_pressure: number;
  mean_corridor_pressure: number;
  grouped_co2_cells: number;
  mean_grouped_co2_million_g: number;
  co2_fe_r2: number;
  co2_calibrator_r2: number;
};

export type SampleLayer = {
  layer: string;
  count: number;
  unit: string;
  role: string;
};

export type AisStateRule = {
  state: string;
  rule: string;
  role: string;
};

export type HazardContrast = {
  panel: string;
  contrast: string;
  change_pct: number;
  ci: string;
};

export type Co2Model = {
  spec: string;
  pre_dispatch_burden_coef: number;
  local_queue_pressure_coef: number;
  corridor_pressure_coef: number;
  direction_sensitive_pressure_coef: number;
  groups: number;
  r2: number;
};

export type CounterfactualGain = {
  rule_id: string;
  rule: string;
  allocation: "uniform" | "targeted";
  mean_burden_reduction_min: number;
  p90_burden_reduction_min: number;
};

export type PolicyRule = {
  rule_id: string;
  rule: string;
  policy_objective: string;
  governance_level: string;
  instrument: string;
  metric: string;
};

export type GeographicHeterogeneity = {
  grouping: string;
  category: string;
  event_rows: number;
  mean_pre_dispatch_burden_min: number;
  mean_corridor_pressure: number;
};

export type PriorityTarget = {
  rank: number;
  lock_id: number;
  region: string;
  gateway: boolean;
  mean_burden_min: number;
  p90_burden_min: number;
  exposure_cp: number;
  sensitivity: number;
};

export type FigureAsset = {
  id: string;
  title: string;
  path: string;
  role: string;
};

export type PaperEvidence = {
  headline: HeadlineEvidence;
  sample_layers: SampleLayer[];
  ais_state_rules: AisStateRule[];
  hazard_contrasts: HazardContrast[];
  co2_models: Co2Model[];
  counterfactual_gains: CounterfactualGain[];
  policy_rules: PolicyRule[];
  geographic_heterogeneity: GeographicHeterogeneity[];
  priority_targets: PriorityTarget[];
  figures: FigureAsset[];
};

export type InitialDashboardData = {
  corridors: CorridorMeta[];
  network: NetworkResponse;
  evidence: PaperEvidence;
};

export type LocalizedFigure = FigureAsset & {
  localizedTitle?: LocalizedText;
};
