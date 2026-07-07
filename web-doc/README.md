# DeepSeek Copilot Web Doc

Human-facing visual documentation for DeepSeek Copilot, built with Astro.

## Languages

The site supports:

- English: `/en/`
- Spanish: `/es/`
- Chinese: `/zh/`

Translated content is centralized in `src/i18n.ts`.

## Scripts

- `npm run dev`: local Astro server.
- `npm run build`: validation and static build into the repository root `docs/` folder.
- `npm run preview`: build preview.
- `npm run lint`: Astro validation.

## GitHub Pages

Astro writes the static site to `../docs` so GitHub Pages can serve it from the repository root `/docs` folder.

Technical documentation lives in the GitHub Wiki:

https://github.com/YarCrasy/deepseek-copilot/wiki
