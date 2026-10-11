import { expect, mock, test } from 'claude-code/testing'
import type { On, SessionUsage } from 'claude-code'

const PANE_PROPS = {
  title: 'Agents',
  isFocused: false,
  bodyColumns: 60,
  placement: 'dock',
  scroll: { offset: 0, bodyRows: 40 },
  view: {},
} as const

const USAGE: SessionUsage = {
  startedAt: 0,
  rateLimits: [],
  context: {
    tokens: 84_000,
    window: 200_000,
    percent: 42,
    breakdown: {
      model: 'claude-opus-5-5',
      totalTokens: 84_000,
      maxTokens: 200_000,
      rawMaxTokens: 200_000,
      autocompactSource: 'model-default',
      percentage: 42,
      isAutoCompactEnabled: true,
      autoCompactThreshold: 160_000,
      apiUsage: null,
      memoryFiles: [],
      mcpTools: [],
      agents: [],
      categories: [
        { name: 'System prompt', tokens: 4_000, color: 'promptBorder', isDeferred: false, kind: 'used' },
        { name: 'Messages', tokens: 80_000, color: 'permission', isDeferred: false, kind: 'used' },
        { name: 'MCP tools', tokens: 9_000, color: 'inactive', isDeferred: true, kind: 'deferred' },
        { name: 'Free space', tokens: 116_000, color: 'inactive', isDeferred: false, kind: 'free' },
      ],
      gridRows: [
        [
          { color: 'permission', isFilled: true, categoryName: 'Messages', tokens: 80_000, percentage: 40, squareFullness: 1 },
          { color: 'inactive', isFilled: false, categoryName: 'Free space', tokens: 116_000, percentage: 58, squareFullness: 0 },
        ],
      ],
    },
  },
}

// Stands in for the engine beneath the plugin; counts the full breakdowns asked for.
function engine(on: On, isPaneOpen: boolean): { counts: () => number } {
  let counts = 0
  mock.clock(on)
  mock.env(on, { LANG: 'en_US.UTF-8' })
  on('settings.read', async () => ({ value: {} }))
  on('tool.register', async (_$, e) => ({ value: { tool: e.name } }))
  on('command.register', async (_$, e) => ({ value: { command: e.name } }))
  on('ui.open', async () => ({ value: { isPlaced: true } as const }))
  on('ui.panes', async () => ({
    value: isPaneOpen
      ? [{ id: 'savvy-agents', title: 'Agents', isShown: true, isFocused: false, isPlaced: true, plugin: 'savvy-progress' }]
      : [],
  }))
  on('session.usage', async (_$, e) => {
    if (e.breakdown === 'full') counts++
    return { value: USAGE }
  })
  return { counts: () => counts }
}

test('the agents pane shows the session context breakdown on every surface', async ($, on) => {
  const usage = engine(on, true)
  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({ plugin: 'savvy-progress', surface, component: 'Pane', props: PANE_PROPS, requestId: 'savvy-agents' })
    // Collapse, then expand: expanding counts the window.
    await ui.press({ key: 'context-toggle' })
    await ui.press({ key: 'context-toggle' })
    expect((await ui.find({ key: 'context-toggle' }))?.text).toMatch(/Session context · 42% · 84k\/200k/)
    expect(await ui.find({ type: 'Text', text: /Messages: 80k \(40\.0%\)/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /MCP tools: 9k \(deferred\)/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /auto-compact at 160k/ })).toBeDefined()
    await ui.unmount()
  }
  expect(usage.counts()).toBe(2)
})

test('a collapsed section or a closed pane counts nothing', async ($, on) => {
  const usage = engine(on, false)
  const ui = await $.ui.mount({ plugin: 'savvy-progress', surface: 'terminal', component: 'Pane', props: PANE_PROPS, requestId: 'savvy-agents' })
  await ui.press({ key: 'context-toggle' })
  await ui.press({ key: 'context-toggle' })
  expect(usage.counts()).toBe(0)
  expect(await ui.find({ type: 'Text', text: /Counting the context window/ })).toBeDefined()
})
