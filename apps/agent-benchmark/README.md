# Agent Benchmark

A small UI for browsing agent eval results. All data is hardcoded in `src/data.ts` for now.

## Run it

```bash
npm install
npm run dev
```

## What's in it

- **Tests**: each test has an id, name, success criteria, parameters (profile kind, location, business unit, language, channel, extras), a sample prompt and the tools it expects. Pick a test to see every run against it.
- **Runs**: response, tool calls (args, output, duration, errors), time, tokens in/out, model details and an estimated cost (tokens × the version's per-million price). Tick two or more runs to compare them side by side.
- **Compare versions**: pick agent versions and a baseline. The summary table shows pass rate, criteria met, time, cost, tokens and tool errors with deltas against the baseline. The by-test grid flags regressions and improvements; click any cell to open the run.

## Files

- `src/types.ts`: data shapes (`EvalTest`, `AgentVersion`, `EvalRun`, `ToolCall`)
- `src/data.ts`: the sample tests, agent versions and runs. Swap this for an API call later.
- `src/util.ts`: cost estimate, summaries and formatters
- `src/components/`: `TestsView`, `CompareView`, `RunDrawer`, shared bits in `common.tsx`
