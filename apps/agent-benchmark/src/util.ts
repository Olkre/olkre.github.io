import { agentVersions, runs, tests } from "./data";
import type { AgentVersion, EvalRun, EvalTest } from "./types";

export const versionById = (id: string): AgentVersion => agentVersions.find((v) => v.id === id)!;
export const testById = (id: string): EvalTest => tests.find((t) => t.id === id)!;
export const runsForTest = (testId: string): EvalRun[] => runs.filter((r) => r.testId === testId);
export const runFor = (testId: string, versionId: string): EvalRun | undefined =>
  runs.find((r) => r.testId === testId && r.agentVersionId === versionId);

/** Approximate cost in USD from token counts and the version's per-million prices. */
export function runCost(run: EvalRun): number {
  const m = versionById(run.agentVersionId).modelDetails;
  return (run.inputTokens * m.inputPrice + run.outputTokens * m.outputPrice) / 1_000_000;
}

export const criteriaPassed = (run: EvalRun) => run.criteria.filter((c) => c.passed).length;

export interface Summary {
  runs: number;
  passRate: number;
  criteriaRate: number;
  avgLatencyMs: number;
  avgCost: number;
  totalCost: number;
  avgTokens: number;
  toolCalls: number;
  toolErrors: number;
}

export function summarize(list: EvalRun[]): Summary {
  const n = list.length || 1;
  const crit = list.reduce((s, r) => s + r.criteria.length, 0) || 1;
  const totalCost = list.reduce((s, r) => s + runCost(r), 0);
  return {
    runs: list.length,
    passRate: list.filter((r) => r.status === "passed").length / n,
    criteriaRate: list.reduce((s, r) => s + criteriaPassed(r), 0) / crit,
    avgLatencyMs: list.reduce((s, r) => s + r.latencyMs, 0) / n,
    avgCost: totalCost / n,
    totalCost,
    avgTokens: list.reduce((s, r) => s + r.inputTokens + r.outputTokens, 0) / n,
    toolCalls: list.reduce((s, r) => s + r.toolCalls.length, 0),
    toolErrors: list.reduce((s, r) => s + r.toolCalls.filter((t) => t.status === "error").length, 0),
  };
}

export const fmtMs = (ms: number) => (ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${Math.round(ms)}ms`);
export const fmtCost = (usd: number) => (usd < 0.01 ? `$${usd.toFixed(4)}` : `$${usd.toFixed(3)}`);
export const fmtPct = (x: number) => `${Math.round(x * 100)}%`;
export const fmtNum = (x: number) => Math.round(x).toLocaleString("en-US");
export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "UTC" }) + " UTC";
