export interface AggregatedStanding {
  candidate_id: number;
  candidate_name: string;
  party: string;
  color_hex: string | null;
  aggregated_pct: number;
  poll_count: number;
  computed_at: string;
}

export interface AggregationResponse {
  election_type: string;
  round: number;
  standings: AggregatedStanding[];
  last_poll_date: string | null;
}

export interface TrendPoint {
  poll_date: string;
  percentage: number;
  poll_id: number;
  institute_name: string;
  sample_size: number | null;
}

export interface CandidateTrend {
  candidate_id: number;
  candidate_name: string;
  party: string;
  color_hex: string | null;
  data_points: TrendPoint[];
}

export interface HistoryResponse {
  election_type: string;
  round: number;
  candidates: CandidateTrend[];
}

export interface PollResultOut {
  id: number;
  candidate_id: number;
  percentage: number;
  margin_of_error: number | null;
  is_spontaneous: boolean;
  created_at: string;
}

export interface PollOut {
  id: number;
  institute_id: number;
  institute_name: string | null;
  election_type: string;
  round: number;
  poll_date: string;
  fieldwork_start: string | null;
  fieldwork_end: string | null;
  published_date: string | null;
  sample_size: number | null;
  margin_of_error: number | null;
  confidence_level: number | null;
  methodology: string | null;
  source_url: string | null;
  raw_data_url: string | null;
  tse_registered: string | null;
  notes: string | null;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  results: PollResultOut[];
}

export interface CandidateOut {
  id: number;
  name: string;
  slug: string;
  party: string;
  party_number: number | null;
  election_type: string;
  photo_url: string | null;
  color_hex: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InstituteOut {
  id: number;
  name: string;
  slug: string;
  credibility_score: number;
  website_url: string | null;
  source_urls: string[] | null;
  scraper_type: string;
  scraper_config: Record<string, unknown> | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ScraperRunOut {
  id: number;
  institute_id: number | null;
  institute_name: string | null;
  started_at: string;
  finished_at: string | null;
  status: string;
  polls_found: number;
  polls_imported: number;
  error_message: string | null;
}
