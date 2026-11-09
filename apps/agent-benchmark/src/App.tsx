import { useState } from "react";
import { TestsView } from "./components/TestsView";
import { CompareView } from "./components/CompareView";
import { RunDrawer } from "./components/RunDrawer";
import { runs, tests, agentVersions } from "./data";

type Tab = "tests" | "compare";

export default function App() {
  const [tab, setTab] = useState<Tab>("tests");
  const [openRunId, setOpenRunId] = useState<string | null>(null);

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="logo" aria-hidden>◆</span>
          <span>Agent Benchmark</span>
          <span className="muted small">
            {tests.length} tests · {agentVersions.length} agent versions · {runs.length} runs
          </span>
        </div>
        <nav className="tabs" role="tablist">
          <button role="tab" aria-selected={tab === "tests"} className={tab === "tests" ? "active" : ""} onClick={() => setTab("tests")}>
            Tests
          </button>
          <button role="tab" aria-selected={tab === "compare"} className={tab === "compare" ? "active" : ""} onClick={() => setTab("compare")}>
            Compare versions
          </button>
        </nav>
      </header>
      <main>{tab === "tests" ? <TestsView onOpenRun={setOpenRunId} /> : <CompareView onOpenRun={setOpenRunId} />}</main>
      {openRunId && <RunDrawer runId={openRunId} onClose={() => setOpenRunId(null)} />}
    </div>
  );
}
