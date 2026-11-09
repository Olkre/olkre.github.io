export type ProfileKind = "Retail customer" | "Employee" | "New hire" | "Enterprise admin" | "Partner";

export interface TestParameters {
  profileKind: ProfileKind;
  location: string;
  businessUnit: string;
  language: string;
  channel: "Chat" | "Email" | "Voice" | "Slack";
  /** Anything else the test wants to pass to the agent. */
  extra?: Record<string, string>;
}

export interface EvalTest {
  id: string;
  name: string;
  description: string;
  category: string;
  successCriteria: string[];
  parameters: TestParameters;
  samplePrompt: string;
  /** Tools the agent is expected to call to pass. */
  expectedTools: string[];
}

export interface ModelDetails {
  model: string;
  provider: string;
  temperature: number;
  maxTokens: number;
  /** USD per million tokens. */
  inputPrice: number;
  outputPrice: number;
}

export interface AgentVersion {
  id: string;
  label: string;
  promptVersion: string;
  changeNote: string;
  modelDetails: ModelDetails;
  tools: string[];
}

export interface ToolCall {
  name: string;
  args: Record<string, unknown>;
  output: string;
  durationMs: number;
  status: "ok" | "error";
}

export type RunStatus = "passed" | "failed" | "partial";

export interface CriterionResult {
  passed: boolean;
  note: string;
}

export interface EvalRun {
  id: string;
  testId: string;
  agentVersionId: string;
  startedAt: string;
  status: RunStatus;
  /** One result per entry in the test's successCriteria, same order. */
  criteria: CriterionResult[];
  response: string;
  toolCalls: ToolCall[];
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
}
