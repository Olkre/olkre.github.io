import type { EvalRun, RunStatus, ToolCall } from "../types";

export function StatusBadge({ status }: { status: RunStatus }) {
  const label = status === "passed" ? "Passed" : status === "failed" ? "Failed" : "Partial";
  return <span className={`badge ${status}`}>{label}</span>;
}

export function CriteriaBar({ run }: { run: EvalRun }) {
  return (
    <span className="crit-bar" title={run.criteria.map((c) => `${c.passed ? "✓" : "✗"} ${c.note}`).join("\n")}>
      {run.criteria.map((c, i) => (
        <i key={i} className={c.passed ? "ok" : "no"} />
      ))}
    </span>
  );
}

export function ToolCallList({ calls }: { calls: ToolCall[] }) {
  if (calls.length === 0) return <p className="muted small">No tools called.</p>;
  return (
    <ol className="tool-list">
      {calls.map((c, i) => (
        <li key={i} className={c.status}>
          <div className="tool-head">
            <code className="tool-name">{c.name}</code>
            <span className="muted small">{c.durationMs}ms</span>
            {c.status === "error" && <span className="badge failed">error</span>}
          </div>
          <details>
            <summary className="small">args / output</summary>
            <pre>{JSON.stringify(c.args, null, 2)}</pre>
            <pre>{prettyJson(c.output)}</pre>
          </details>
        </li>
      ))}
    </ol>
  );
}

function prettyJson(s: string) {
  try {
    return JSON.stringify(JSON.parse(s), null, 2);
  } catch {
    return s;
  }
}

/** Signed delta text with a good/bad class. lowerIsBetter flips the colour. */
export function Delta({ value, format, lowerIsBetter = false }: { value: number; format: (n: number) => string; lowerIsBetter?: boolean }) {
  if (Math.abs(value) < 1e-9) return <span className="delta same">±0</span>;
  const better = lowerIsBetter ? value < 0 : value > 0;
  return (
    <span className={`delta ${better ? "good" : "bad"}`}>
      {value > 0 ? "+" : "−"}
      {format(Math.abs(value))}
    </span>
  );
}
