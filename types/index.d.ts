export type Phase = 'plan' | 'design' | 'delegate' | 'review' | 'close'

export type PlannedTask = {
  title: string
  tier: string
  after: number[]
}

export type Flow = {
  title: string
  total: number
  done: number
  running: number
  phase: Phase
  isFinished: boolean
  tasks: PlannedTask[]
}

export type AgentStatus = 'running' | 'done' | 'failed'

export type AgentRun = {
  id: string
  agentId?: string
  type: string
  description: string
  model: string
  effort?: string
  status: AgentStatus
  startedAt: number
  endedAt?: number
  contextTokens: number
  contextMax: number
  tokens: number
  costUsd: number
  steps: number
  round: number
  /** Self-reported by the worker through the `step` tool. */
  stepDone?: number
  stepTotal?: number
  stepNote?: string
}

export type Panel = {
  isCompact: boolean
  isDoneCollapsed: boolean
  autoOpenedFor: string
  /** Absent in state saved before the context section existed: expanded. */
  isContextCollapsed?: boolean
}

/** One /context row; the engine's ContextCategory, restated so this contract stands alone. */
export type ContextRow = {
  name: string
  tokens: number
  /** A theme key (`promptBorder`, `inactive`). */
  color: string
  isDeferred: boolean
  kind: 'used' | 'free' | 'buffer' | 'deferred'
}

/** One square of /context's grid; the engine's ContextGridSquare, restated. */
export type ContextSquare = {
  color: string
  isFilled: boolean
  categoryName: string
  tokens: number
  percentage: number
  squareFullness: number
}

/** The main session's window as /context breaks it down, kept for drawing. */
export type ContextSnap = {
  model: string
  totalTokens: number
  maxTokens: number
  percentage: number
  autoCompactThreshold?: number
  categories: ContextRow[]
  gridRows: ContextSquare[][]
  at: number
}

declare module 'claude-code' {
  interface PluginState {
    'savvy-progress': {
      flow: Flow | null
      agents: AgentRun[]
      panel: Panel
      now: number
      context: ContextSnap | null
    }
  }
}
