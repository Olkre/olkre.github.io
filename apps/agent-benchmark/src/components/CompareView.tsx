import { useMemo, useState } from "react";
import { agentVersions, runs, tests } from "../data";
import { criteriaPassed, fmtCost, fmtMs, fmtNum, fmtPct, runCost, runFor, summarize, type Summary } from "../util";
import { Delta, StatusBadge } from "./common";

type MetricKey = keyof Pick<Summary, "passRate" | "criteriaRate" | "avgLatencyMs" | "avgCost" | "totalCost" | "avgTokens" | "toolErrors">;

const METRICS: { key: MetricKey; label: string; fmt: (n: number) => string; lowerIsBetter?: boolean }[] = [
  { key: "passRate", label: "Tests passed", fmt: fmtPct },
  { key: "criteriaRate", label: "Criteria met", fmt: fmtPct },
  { key: "avgLatencyMs", label: "Avg time", fmt: fmtMs, lowerIsBetter: true },
  { key: "avgCost", label: "Avg cost / run", fmt: fmtCost, lowerIsBetter: true },
  { key: "totalCost", label: "Total cost", fmt: fmtCost, lowerIsBetter: true },
  { key: "avgTokens", label: "Avg tokens", fmt: fmtNum, lowerIsBetter: true },
  { key: "toolErrors", label: "Tool errors", fmt: fmtNum, lowerIsBetter: true },
];

const categories = ["All", ...Array.from(new Set(tests.map((t) => t.category)))];

export function CompareView({ onOpenRun }: { onOpenRun: (id: string) => void }) {
  const [selected, setSelected] = useState<string[]>(agentVersions.map((v) => v.id));
  const [baseline, setBaseline] = useState(agentVersions[0].id);
  const [category, setCategory] = useState("All");
  const [cellMetric, setCellMetric] = useState<"latency" | "cost" | "criteria">("criteria");

  const columns = agentVersions.filter((v) => selected.includes(v.id));
  const visibleTests = tests.filter((t) => category === "All" || t.category === category);
  const summaries = useMemo(() => {
    const ids = new Set(tests.filter((t) => category === "All" || t.category === category).map((t) => t.id));
    const out: Record<string, Summary> = {};
    for (const v of agentVersions) out[v.id] = summarize(runs.filter((r) => r.agentVersionId === v.id && ids.has(r.testId)));
    return out;
  }, [category]);

  const toggle = (id: string) =>
    setSelected((s) => {
      if (s.includes(id)) return s.length > 1 ? s.filter((x) => x !== id) : s;
      return agentVersions.map((v) => v.id).filter((x) => s.includes(x) || x === id);
    });

  const effectiveBaseline = selected.includes(baseline) ? baseline : columns[0].id;
  const base = summaries[effectiveBaseline];

  return (
    <div className="compare">
      <div className="card controls">
        <div>
          <h3>Agent versions</h3>
          <div className="chips">
            {agentVersions.map((v) => (
              <label key={v.id} className={`chip toggle ${selected.includes(v.id) ? "on" : ""}`}>
                <input type="checkbox" checked={selected.includes(v.id)} onChange={() => toggle(v.id)} />
                {v.label}
              </label>
            ))}
          </div>
        </div>
        <div className="control-row">
          <label>
            <span className="muted small">Baseline</span>
            <select value={effectiveBaseline} onChange={(e) => setBaseline(e.target.value)}>
              {columns.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="muted small">Category</span>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="muted small">Show in cells</span>
            <select value={cellMetric} onChange={(e) => setCellMetric(e.target.value as typeof cellMetric)}>
              <option value="criteria">Criteria met</option>
              <option value="latency">Time</option>
              <option value="cost">Est. cost</option>
            </select>
          </label>
        </div>
      </div>

      <div className="card">
        <h2>Summary</h2>
        <div className="table-wrap">
          <table className="data compare-table">
            <thead>
              <tr>
                <th>Metric</th>
                {columns.map((v) => (
                  <th key={v.id} className="num">
                    {v.label}
                    {v.id === effectiveBaseline && <span className="chip tiny">baseline</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="meta-row">
                <td>Model</td>
                {columns.map((v) => (
                  <td key={v.id} className="num">
                    <code className="small">{v.modelDetails.model}</code>
                    <div className="muted small">
                      temp {v.modelDetails.temperature} · ${v.modelDetails.inputPrice}/${v.modelDetails.outputPrice} per M
                    </div>
                  </td>
                ))}
              </tr>
              <tr className="meta-row">
                <td>Prompt</td>
                {columns.map((v) => (
                  <td key={v.id} className="num">
                    <code className="small">{v.promptVersion}</code>
                    <div className="muted small">{v.changeNote}</div>
                  </td>
                ))}
              </tr>
              {METRICS.map((m) => {
                const vals = columns.map((v) => summaries[v.id][m.key]);
                const bestVal = m.lowerIsBetter ? Math.min(...vals) : Math.max(...vals);
                return (
                  <tr key={m.key}>
                    <td>{m.label}</td>
                    {columns.map((v) => {
                      const val = summaries[v.id][m.key];
                      return (
                        <td key={v.id} className={`num ${columns.length > 1 && val === bestVal ? "best-cell" : ""}`}>
                          <strong>{m.fmt(val)}</strong>
                          {v.id !== effectiveBaseline && (
                            <div>
                              <Delta value={val - base[m.key]} format={m.fmt} lowerIsBetter={m.lowerIsBetter} />
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="row-between wrap">
          <h2>By test</h2>
          <span className="muted small">Click a cell to open the run.</span>
        </div>
        <div className="table-wrap">
          <table className="data matrix">
            <thead>
              <tr>
                <th>Test</th>
                {columns.map((v) => (
                  <th key={v.id}>{v.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleTests.map((t) => {
                const baseRun = runFor(t.id, effectiveBaseline);
                return (
                  <tr key={t.id}>
                    <td>
                      <code className="muted small">{t.id}</code>
                      <div>{t.name}</div>
                      <div className="muted small">
                        {t.parameters.profileKind} · {t.parameters.location} · {t.parameters.businessUnit}
                      </div>
                    </td>
                    {columns.map((v) => {
                      const r = runFor(t.id, v.id);
                      if (!r) return <td key={v.id} className="muted small">Not run</td>;
                      const regressed = baseRun && v.id !== effectiveBaseline && rank(r.status) < rank(baseRun.status);
                      const improved = baseRun && v.id !== effectiveBaseline && rank(r.status) > rank(baseRun.status);
                      return (
                        <td key={v.id} className={`cell ${regressed ? "regressed" : ""} ${improved ? "improved" : ""}`}>
                          <button className="cell-btn" onClick={() => onOpenRun(r.id)}>
                            <StatusBadge status={r.status} />
                            <span className="small">
                              {cellMetric === "criteria" && `${criteriaPassed(r)}/${r.criteria.length} criteria`}
                              {cellMetric === "latency" && fmtMs(r.latencyMs)}
                              {cellMetric === "cost" && fmtCost(runCost(r))}
                            </span>
                            {baseRun && v.id !== effectiveBaseline && cellMetric === "latency" && (
                              <Delta value={r.latencyMs - baseRun.latencyMs} format={fmtMs} lowerIsBetter />
                            )}
                            {baseRun && v.id !== effectiveBaseline && cellMetric === "cost" && (
                              <Delta value={runCost(r) - runCost(baseRun)} format={fmtCost} lowerIsBetter />
                            )}
                            {regressed && <span className="flag bad">regressed</span>}
                            {improved && <span className="flag good">improved</span>}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const rank = (s: string) => (s === "passed" ? 2 : s === "partial" ? 1 : 0);
