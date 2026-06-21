# Swim Sight 3D — site redesign plan (show, don't tell)

The concept is good; the presentation reads as "template, not product" because every
page is the same headline + grey paragraph + pill-button hero, and the only visuals
are abstract placeholders. Fix = fewer pages, less copy, varied layouts, and **real
product screenshots**.

## 1. Consolidate 8 pages → 4 core + 2 utility

Current: Features · Coaches · Clubs · AI+Trust · Sample Report · Stroke Analysis · Pricing · FAQ.

Proposed:
- **Home** — the pitch. One strong hero with a real demo loop, then 3 alternating
  proof sections (Coach Studio, a real report, trust). Absorbs **Features**.
- **For Coaches & Clubs** — merge **Coaches + Stroke Analysis + Clubs** into one
  audience page with two short sub-sections (coach workflow; club workspace).
- **AI + Trust** — keep (it's a real differentiator), tightened.
- **Sample Report** — keep and make it the star; it's your best "show" asset.
- Utility (de-emphasised in nav): **Pricing**, **FAQ**.

Nav shrinks from 8 to: Home · For Coaches · AI + Trust · Sample Report · Pricing · FAQ · Open App.

## 2. Copy + layout rules (every page)

- One H1, one sub-sentence (≤ 20 words), **one** primary button + one text link. Delete the 3-pill rows.
- Cut body copy ~40%. No hero paragraph longer than two lines.
- Alternate section layouts so no two feel identical: (a) text-left / screenshot-right,
  (b) full-bleed screenshot, (c) 2-up cards, (d) text-right / screenshot-left.
- Every section earns its place with a **visual**, not more text.
- Keep honest wording: "AI-assisted / coach-approved / draft / estimate".

## 3. Capture shot list (from the running app — the missing ingredient)

Capture at retina/2×, crop tight, consistent dark UI. Drop into `/public/marketing/`:

| # | Asset | What it shows | Goes on |
| --- | --- | --- | --- |
| 1 | `hero-loop.mp4` (+ poster) | 15–20s muted autoplay: upload → mark moment → AI draft finding → coach approves → share report | Home hero |
| 2 | `coach-studio.png` | Coach Studio mid-annotation (draw tool active on a swimmer, key-moment timeline) | Coaches |
| 3 | `finding-card.png` | A coach-approved finding with cue + linked drill | Home / Coaches |
| 4 | `report.png` | A finished shared report (public read-only view) | Home / Sample |
| 5 | `compare.png` | Side-by-side before/after with the phase scrubber (once wired) | Coaches |
| 6 | `keyframes.png` | Key-frame gallery / stamp timeline | Stroke section |
| 7 | `mobile-report.png` | The report on a phone (coaches share to parents on mobile) | Home |

## 4. Sequence

1. Approve the hero mockup (sent next).
2. I apply the copy-trim + alternating layouts + media slots across the consolidated
   pages in the repo (screenshot slots are placeholders until your captures land).
3. You drop the captured assets into `/public/marketing/`.
4. `npm run lint && npm run build`, preview, then promote.
