# {{PROJECT_NAME}} — Claude Code instructions

All project rules, the Domo planning protocol and the skill routing table live in
AGENTS.md (shared with Cursor, Codex, Antigravity and other agents):

@AGENTS.md

## Claude Code specifics

- Domo skills are in `.claude/skills/` and load automatically when relevant. For any
  new app or feature, start with the `domo-app-planning` skill and present your
  recommendations before writing code.
- Use plan mode for multi-file features; confirm the plan (and any Code Engine,
  Workflow or embed recommendations) with the developer first.
- Run `yarn build` before reporting a change as done.
