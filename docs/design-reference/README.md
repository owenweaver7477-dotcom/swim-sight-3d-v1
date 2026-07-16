# Design reference — read this before using anything in this folder

This folder mixes **current** reference material with **superseded concept art**.
Nothing in here is imported by the app; it is reference only.

## ⛔ Deprecated — do NOT use as a design target

| File | Why it's here | Why you must not build to it |
|---|---|---|
| `Logged-In Page.png` | Historical concept mockup | Predates the **2026-07-11 coach-led repositioning**. Still shows AI-forward branding ("AI SUGGESTS. COACHES DECIDE.", "AI ANALYSIS QUEUE"). Building to it would reverse the rebrand. |
| `Public UI Page.png` | Historical concept mockup | Same — pre-rebrand public site with AI-led messaging. |

These are kept for history only. The 2026-07-11 repositioning removed AI from all
user-facing copy (it remains internal and reversible). Matching these mockups
would undo that deliberate product decision.

## ✅ What the design targets actually are

- **Live public site** (swimsight3d.com) and `src/components/public/` — ground truth for the public brand.
- **`src/components/ui/`** — the shadcn-style primitives. Reuse these before hand-rolling anything.
- **Design tokens** — `src/index.css` (`:root` / `.dark` HSL values) wired through `tailwind.config.js`. Change token *values* in `src/index.css`.
- **Brand assets** — `public/brand/` (logo, transparent logo, emblem), `public/hero/`.
- **Coach Studio** — the three approved reference images that drove the 3-step rebuild (Final Cut / Linear feel, explicitly not SwimPro/OnForm).

There is no Figma and no in-app living style guide. The live site plus
`src/components/ui/` are the consistency reference.

## Other files here

- `LOGO.png` — high-res logo source.
- `CoachSight Core.docx`, `CoachSight_Core_Master_Plan_for_Claude_Code.{docx,md}`, `Swim_Sight_3D_Codex_UI_Prompts.docx` — product/UI direction docs.
- `Swim Sight 3D Images/` — screenshot reference.

See `CLAUDE.md` section 10 for the canonical version of this guidance.
