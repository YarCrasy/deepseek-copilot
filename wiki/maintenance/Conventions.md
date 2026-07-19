[Previous page: Overview](INDEX.md)

# Conventions

## Markdown documentation

- Concise technical content.
- No unnecessary visual styling.
- `wiki/INDEX.md` is the entry point and full documentation index.
- Prefer short lists and concrete paths.
- Update technical Markdown in the same commit as the affected code.

## Code

- Keep aliases consistent with `tsconfig.json`.
- Use `src/adapters` contracts for shared messages.
- Avoid duplicated strings for public ids.
- Do not store secrets outside `SecretStorage`.
- Do not reintroduce Ollama.
- Source folders use `camelCase`.
- Source implementation files use `PascalCase`.
- Keep ecosystem-required exceptions unchanged: `index.ts` barrels, Astro route files such as `index.astro` and `[slug].astro`, package/config files, and generated output.

## New features

Before implementing:

1. identify the responsible layer.
2. update contracts if it crosses webview/backend.
3. document settings if they are public.
4. add manual verification if it affects UX.
5. run compile, lint, and build.

---

[Next page: Migration Status](Migration-Status.md)
