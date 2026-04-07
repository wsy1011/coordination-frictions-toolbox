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

export type HeadlineMetrics = {
  events: number;
  transitions: number;
  threshold: number;
  expected_wait1: number;
  expected_wait_total: number;
  low_eff_share: number;
  state4_share: number;
};

export type ScenarioRecord = {
  scenario: string;
  expected_wait1: number;
  expected_wait_total?: number;
  low_eff_share?: number;
  state4_share?: number;
  delta_wait1?: number;
  delta_wait_total?: number;
  delta_low_eff_share?: number;
  delta_state4_share?: number;
  p90_wait1?: number;
  delta_p90_wait1?: number;
  high_wait_prob?: number;
  delta_high_wait_prob?: number;
  budget_k?: number;
};

export type BaselineOverview = {
  headline: HeadlineMetrics;
  state_shares: Record<string, number>;
  top_risks: Array<{
    lock_id: number;
    lock_name: string;
    corridor: string;
    queue_risk_score: number;
    queue_rank: number;
  }>;
  proxy_stats: Record<string, { mean?: number; p50?: number; p75?: number; p90?: number }>;
  scenarios: ScenarioRecord[];
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

export type RankingRecord = {
  cur_lock_id: number;
  lock_name: string;
  corridor: string;
  queue_rank: number;
  structural_rank: number;
  queue_risk_score: number;
  structural_risk_score: number;
};

export type RankingsResponse = {
  queue: RankingRecord[];
  structural: RankingRecord[];
};

export type SimulationSelection = {
  policy_family: string;
  allocation_family: string;
  budget_k: number;
  scenario: string;
};

export type SimulationImpactLock = {
  lock_id: number;
  lock_name: string;
  baseline_wait1_min: number;
  policy_wait1_min: number;
  delta_wait1_min: number;
  priority_rank: number;
};

export type SimulationResponse = {
  selection: SimulationSelection;
  summary: ScenarioRecord & Record<string, number | string>;
  impact_locks: SimulationImpactLock[];
  ranked_locks: Array<{
    lock_id: number;
    lock_name: string;
    corridor: string;
    queue_rank: number;
    structural_rank: number;
    queue_risk_score: number;
    structural_risk_score: number;
  }>;
};

export type ExportResponse = {
  title: string;
  content_type: string;
  content: string;
};

