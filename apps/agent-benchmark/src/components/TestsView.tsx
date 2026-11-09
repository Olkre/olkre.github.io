import { useMemo, useState } from "react";
import { tests } from "../data";
import type { EvalRun } from "../types";
import { criteriaPassed, fmtCost, fmtDate, fmtMs, fmtNum, fmtPct, runCost, runsForTest, summarize, versionById } from "../util";
import { CriteriaBar, StatusBadge, ToolCallList } from "./common";

export function TestsView({ onOpenRun }: { onOpenRun: (id: string) => void }) {
  const [query, setQuery] = useState("");
  const [selectedTestId, setSelectedTestId] = useState(tests[0].id);
  const [checked, setChecked] = useState<string[]>([]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return tests;
    return tests.filter((t) =>
      [t.id, t.name, t.category, t.parameters.businessUnit, t.parameters.location, t.parameters.profileKind].some((s) => s.toLowerCase().includes(q)),
    );
  }, [query]);

  const test = tests.find((t) => t.id === selectedTestId)!;
  const testRuns = runsForTest(test.id);
  const compared = testRuns.filter((r) => checked.includes(r.id));

  const selectTest = (id: string) => {
    setSelectedTestId(id);
    setChecked([]);
  };
  const toggle = (id: string) => setChecked((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));

  return (
    <div className="tests-layout">
      <aside className="test-list">
        <input className="search" placeholder="Search tests, BU, location…" value={query} onChange={(e) => setQuery(e.target.value)} />
        <ul>
          {filtered.map((t) => {
            const s = summarize(runsForTest(t.id));
            return (
              <li key={t.id}>
                <button className={t.id === selectedTestId ? "active" : ""} onClick={() => selectTest(t.id)}>
                  <span className="row-between">
                    <code className="muted small">{t.id}</code>
                    <span className="muted small">{t.category}</span>
                  </span>
                  <span className="test-name">{t.name}</span>
                  <span className="pass-meter" aria-label={`${fmtPct(s.passRate)} of runs passed`}>
                    <span style={{ width: fmtPct(s.passRate) }} />
                  </span>
                  <span className="muted small">{fmtPct(s.passRate)} of runs passed</span>
                </button>
              </li>
            );
          })}
          {filtered.length === 0 && <li className="muted small pad">No tests match.</li>}
        </ul>
      </aside>

      <section className="test-detail">
        <div className="card">
          <div className="row-between wrap">
            <div>
              <code className="muted">{test.id}</code>
              <h1>{test.name}</h1>
              <p className="muted">{test.description}</p>
            </div>
            <span className="chip">{test.category}</span>
          </div>

          <div className="detail-grid">
            <div>
              <h3>Success criteria</h3>
              <ol className="criteria">
                {test.successCriteria.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ol>
              <h3>Expected tools</h3>
              <div className="chips">
                {test.expectedTools.length ? test.expectedTools.map((t) => <code key={t} className="chip mono">{t}</code>) : <span className="muted small">None: the agent should answer without tools.</span>}
              </div>
            </div>
            <div>
              <h3>Parameters</h3>
              <dl className="params">
                <dt>Profile kind</dt>
                <dd>{test.parameters.profileKind}</dd>
                <dt>Location</dt>
                <dd>{test.parameters.location}</dd>
                <dt>Business unit</dt>
                <dd>{test.parameters.businessUnit}</dd>
                <dt>Language</dt>
                <dd>{test.parameters.language}</dd>
                <dt>Channel</dt>
                <dd>{test.parameters.channel}</dd>
                {Object.entries(test.parameters.extra ?? {}).map(([k, v]) => (
                  <Param key={k} k={k} v={v} />
                ))}
              </dl>
            </div>
          </div>

          <h3>Sample prompt</h3>
          <blockquote className="prompt">{test.samplePrompt}</blockquote>
        </div>

        <div className="card">
          <div className="row-between wrap">
            <h2>Runs</h2>
            <span className="muted small">Tick two or more runs to compare them side by side.</span>
          </div>
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th />
                  <th>Run</th>
                  <th>Agent version</th>
                  <th>Model</th>
                  <th>Result</th>
                  <th>Criteria</th>
                  <th className="num">Time</th>
                  <th className="num">Tokens in / out</th>
                  <th className="num">Est. cost</th>
                  <th className="num">Tools</th>
                </tr>
              </thead>
              <tbody>
                {testRuns.map((r) => {
                  const v = versionById(r.agentVersionId);
                  return (
                    <tr key={r.id} className={checked.includes(r.id) ? "selected" : ""}>
                      <td>
                        <input type="checkbox" aria-label={`Compare ${r.id}`} checked={checked.includes(r.id)} onChange={() => toggle(r.id)} />
                      </td>
                      <td>
                        <button className="link" onClick={() => onOpenRun(r.id)}>
                          {r.id}
                        </button>
                        <div className="muted small">{fmtDate(r.startedAt)}</div>
                      </td>
                      <td>{v.label}</td>
                      <td>
                        <code className="small">{v.modelDetails.model}</code>
                      </td>
                      <td>
                        <StatusBadge status={r.status} />
                      </td>
                      <td>
                        <CriteriaBar run={r} /> <span className="muted small">{criteriaPassed(r)}/{r.criteria.length}</span>
                      </td>
                      <td className="num">{fmtMs(r.latencyMs)}</td>
                      <td className="num">
                        {fmtNum(r.inputTokens)} / {fmtNum(r.outputTokens)}
                      </td>
                      <td className="num">{fmtCost(runCost(r))}</td>
                      <td className="num">{r.toolCalls.length}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {compared.length >= 2 && <SideBySide runs={compared} criteria={test.successCriteria} onClear={() => setChecked([])} />}
      </section>
    </div>
  );
}

function Param({ k, v }: { k: string; v: string }) {
  const label = k.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
  return (
    <>
      <dt>{label}</dt>
      <dd>{v}</dd>
    </>
  );
}

function SideBySide({ runs, criteria, onClear }: { runs: EvalRun[]; criteria: string[]; onClear: () => void }) {
  const best = {
    latency: Math.min(...runs.map((r) => r.latencyMs)),
    cost: Math.min(...runs.map(runCost)),
  };
  return (
    <div className="card">
      <div className="row-between">
        <h2>Side by side</h2>
        <button className="ghost" onClick={onClear}>
          Clear selection
        </button>
      </div>
      <div className="sbs" style={{ gridTemplateColumns: `repeat(${runs.length}, minmax(260px, 1fr))` }}>
        {runs.map((r) => {
          const v = versionById(r.agentVersionId);
          return (
            <div key={r.id} className="sbs-col">
              <div className="row-between">
                <strong>{v.label}</strong>
                <StatusBadge status={r.status} />
              </div>
              <div className="muted small">
                {r.id} · <code>{v.modelDetails.model}</code> · temp {v.modelDetails.temperature} · {v.promptVersion}
              </div>
              <div className="metrics">
                <Metric label="Time" value={fmtMs(r.latencyMs)} best={r.latencyMs === best.latency} />
                <Metric label="Est. cost" value={fmtCost(runCost(r))} best={runCost(r) === best.cost} />
                <Metric label="Tokens" value={fmtNum(r.inputTokens + r.outputTokens)} />
              </div>
              <h4>Response</h4>
              <div className="response">{r.response}</div>
              <h4>Criteria</h4>
              <ul className="crit-results">
                {r.criteria.map((c, i) => (
                  <li key={i} className={c.passed ? "ok" : "no"}>
                    <span aria-hidden>{c.passed ? "✓" : "✗"}</span>
                    <span>
                      <span className="small">{criteria[i]}</span>
                      <span className="muted small block">{c.note}</span>
                    </span>
                  </li>
                ))}
              </ul>
              <h4>Tool calls</h4>
              <ToolCallList calls={r.toolCalls} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Metric({ label, value, best }: { label: string; value: string; best?: boolean }) {
  return (
    <div className={`metric ${best ? "best" : ""}`}>
      <span className="muted small">{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
