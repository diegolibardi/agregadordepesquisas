import axios from "axios";
import type {
  AggregationResponse,
  HistoryResponse,
  CandidateOut,
  InstituteOut,
  PollOut,
  ScraperRunOut,
} from "@/types/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const ADMIN_KEY = process.env.NEXT_PUBLIC_ADMIN_KEY ?? "";

export const apiClient = axios.create({
  baseURL: `${API_BASE}/api/v1`,
  headers: { "Content-Type": "application/json" },
});

const adminClient = axios.create({
  baseURL: `${API_BASE}/api/v1`,
  headers: {
    "Content-Type": "application/json",
    "X-Admin-Key": ADMIN_KEY,
  },
});

// ---- Public endpoints ----

export async function getAggregation(
  electionType: string,
  round: number = 1
): Promise<AggregationResponse> {
  const { data } = await apiClient.get(`/aggregation/${electionType}`, {
    params: { round },
  });
  return data;
}

export async function getAggregationHistory(
  electionType: string,
  round: number = 1
): Promise<HistoryResponse> {
  const { data } = await apiClient.get(`/aggregation/${electionType}/history`, {
    params: { round },
  });
  return data;
}

export async function getPolls(params: {
  election_type?: string;
  round?: number;
  institute_id?: number;
  candidate_id?: number;
  date_from?: string;
  date_to?: string;
  page?: number;
  page_size?: number;
}): Promise<PollOut[]> {
  const { data } = await apiClient.get("/polls", { params });
  return data;
}

export async function getPoll(id: number): Promise<PollOut> {
  const { data } = await apiClient.get(`/polls/${id}`);
  return data;
}

export async function getCandidates(params?: {
  election_type?: string;
  active_only?: boolean;
}): Promise<CandidateOut[]> {
  const { data } = await apiClient.get("/candidates", { params });
  return data;
}

export async function getCandidateTrend(
  id: number,
  electionType: string,
  round: number = 1
) {
  const { data } = await apiClient.get(`/candidates/${id}/trend`, {
    params: { election_type: electionType, round },
  });
  return data;
}

export async function getInstitutes(activeOnly = false): Promise<InstituteOut[]> {
  const { data } = await apiClient.get("/institutes", {
    params: { active_only: activeOnly },
  });
  return data;
}

export function getExportUrl(format: "csv" | "json", params: Record<string, unknown>) {
  const qs = new URLSearchParams(
    Object.entries(params)
      .filter(([, v]) => v != null)
      .map(([k, v]) => [k, String(v)])
  ).toString();
  return `${API_BASE}/api/v1/export/polls.${format}?${qs}`;
}

// ---- Admin endpoints ----

export async function adminCreateInstitute(data: unknown) {
  const { data: res } = await adminClient.post("/admin/institutes", data);
  return res;
}

export async function adminUpdateInstitute(id: number, data: unknown) {
  const { data: res } = await adminClient.put(`/admin/institutes/${id}`, data);
  return res;
}

export async function adminDeleteInstitute(id: number) {
  await adminClient.delete(`/admin/institutes/${id}`);
}

export async function adminCreateCandidate(data: unknown) {
  const { data: res } = await adminClient.post("/admin/candidates", data);
  return res;
}

export async function adminUpdateCandidate(id: number, data: unknown) {
  const { data: res } = await adminClient.put(`/admin/candidates/${id}`, data);
  return res;
}

export async function adminCreatePoll(data: unknown) {
  const { data: res } = await adminClient.post("/admin/polls", data);
  return res;
}

export async function adminUpdatePoll(id: number, data: unknown) {
  const { data: res } = await adminClient.put(`/admin/polls/${id}`, data);
  return res;
}

export async function adminDeletePoll(id: number) {
  await adminClient.delete(`/admin/polls/${id}`);
}

export async function adminTriggerScraper(instituteId?: number) {
  const { data } = await adminClient.post("/admin/scraper/run", null, {
    params: { institute_id: instituteId },
  });
  return data;
}

export async function adminGetScraperRuns(limit = 50): Promise<ScraperRunOut[]> {
  const { data } = await adminClient.get("/admin/scraper/runs", {
    params: { limit },
  });
  return data;
}

export async function adminRecomputeAggregation(electionType: string, round: number) {
  const { data } = await adminClient.post("/admin/aggregation/recompute", null, {
    params: { election_type: electionType, round },
  });
  return data;
}
