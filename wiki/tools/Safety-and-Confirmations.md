[Previous page: Built-in Tools](Built-in-Tools.md)

# Safety and Confirmations

## Modes

`toolExecutionModes` can configure each tool:

- `disabled`: do not execute.
- `enabled`: execute with normal rules.
- `auto_approve`: allow without confirmation if danger analysis does not require it.

## Danger analysis

Logic lives in `src/core/tools/definitions/DangerAnalysis.ts`.

It should mark as dangerous:

- deletions or overwrites.
- destructive commands.
- dangerous shell redirection.
- changes outside the workspace.
- secret usage.
- ambiguous high-impact operations.

## Expected UX

When there is risk:

1. backend sends `toolCallConfirmationRequired`.
2. UI shows tool, arguments, and reason.
3. user approves or cancels.
4. backend executes only if approval matches the pending tool.

Do not auto-approve a destructive operation just because the tool is set to `auto_approve`.

---

[Next page: Registry and Executor](Registry-and-Executor.md)
