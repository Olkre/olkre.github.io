import { useEffect } from "react";
import { runs } from "../data";
import { fmtCost, fmtDate, fmtMs, fmtNum, runCost, testById, versionById } from "../util";
import { StatusBadge, ToolCallList } from "./common";

export function RunDrawer({ runId, onClose }: { runId: string; onClose: () => void }) {
  const run = runs.find((r) => r.id === runId)!;
  const test = testById(run.testId);
  const v = versionById(run.agentVersionId);
  const m = v.modelDetails;
  const toolTime = run.toolCalls.reduce((s, c) => s + c.durationMs, 0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside className="drawer" role="dialog" aria-label={`Run ${run.id}`} onClick={(e) => e.stopPropagation()}>
        <div className="row-between">
          <div>
            <code className="muted">
              {run.id} · {test.id}
            </code>
            <h2>{test.name}</h2>
          </div>
          <button className="ghost" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <div className="row-between wrap">
          <span>
            <strong>{v.label}</strong> <span className="muted small">· {fmtDate(run.startedAt)}</span>
          </span>
          <StatusBadge status={run.status} />
        </div>

        <div className="metrics four">
          <div className="metric">
            <span className="muted small">Total time</span>
            <strong>{fmtMs(run.latencyMs)}</strong>
            <span className="muted small">{fmtMs(toolTime)} in tools</span>
          </div>
          <div className="metric">
            <span className="muted small">Est. cost</span>
            <strong>{fmtCost(runCost(run))}</strong>
          </div>
          <div className="metric">
            <span className="muted small">Tokens in</span>
            <strong>{fmtNum(run.inputTokens)}</strong>
          </div>
          <div className="metric">
            <span className="muted small">Tokens out</span>
            <strong>{fmtNum(run.outputTokens)}</strong>
          </div>
        </div>

        <h4>Model</h4>
        <dl className="params">
          <dt>Model</dt>
          <dd>
            <code>{m.model}</code> ({m.provider})
          </dd>
          <dt>Temperature</dt>
          <dd>{m.temperature}</dd>
          <dt>Max tokens</dt>
          <dd>{fmtNum(m.maxTokens)}</dd>
          <dt>Pricing</dt>
          <dd>
            ${m.inputPrice} in / ${m.outputPrice} out per million tokens
          </dd>
          <dt>Prompt</dt>
          <dd>
            <code>{v.promptVersion}</code>
          </dd>
        </dl>

        <h4>Prompt</h4>
        <blockquote className="prompt">{test.samplePrompt}</blockquote>

        <h4>Response</h4>
        <div className="response">{run.response}</div>

        <h4>Success criteria</h4>
        <ul className="crit-results">
          {run.criteria.map((c, i) => (
            <li key={i} className={c.passed ? "ok" : "no"}>
              <span aria-hidden>{c.passed ? "✓" : "✗"}</span>
              <span>
                <span className="small">{test.successCriteria[i]}</span>
                <span className="muted small block">{c.note}</span>
              </span>
            </li>
          ))}
        </ul>

        <h4>Tool calls ({run.toolCalls.length})</h4>
        <ToolCallList calls={run.toolCalls} />
      </aside>
    </div>
  );
}
