# Swim Sight 3D — Coach Pilot Script (~15 minutes)

**What you're testing:** the coach-review *workflow*, report structure, and
feedback format — **not** whether the AI is accurate yet. The AI only creates
**draft** observations; the coach reviews, edits, approves, or rejects everything
before it becomes a report.

**Why that distinction matters for the pilot:** if a coach sees a *wrong* AI
finding, they'll judge the AI and miss that you're testing the workflow. Set it
up so the workflow gets a fair test (see Prep).

---

## Before the session (prep, ~10 min)

- [ ] Pick **one clip where pose detection actually works**: above-water,
      side-on, good light, one swimmer in frame. (Underwater / backlit clips make
      the AI look worse than the workflow deserves.)
- [ ] Pre-run it so a **draft report is ready**, and have **one finished,
      coach-approved report** open as the "this is the end product" example.
- [ ] **Consent / safeguarding:** if any swimmer on film is under 18, get
      parent/guardian consent before filming or showing it, and delete the
      footage after the pilot. For the demo itself, a willing adult swimmer or a
      free stock clip avoids this entirely.
- [ ] Decide how you'll capture answers: ask to record audio (with permission) or
      use the tick sheet below. Keep it to ~15 minutes.
- [ ] Have this line ready: *"This is a draft-and-review tool. The AI suggests;
      the coach decides. I'm testing whether the review-and-report flow is useful,
      not whether the AI is perfect yet."*

## Run of show (~15 min)

1. **Frame it (1 min).** Say the line above. Make clear nothing the AI produces
   reaches a swimmer or parent without the coach approving it.
2. **Upload & review (3 min).** Show uploading a clip → draft observations
   appearing for review.
3. **Coach Studio (4 min).** Walk the finding cards — severity, what the coach
   sees, why it matters, cue, drill, next focus. **Edit one, reject one, approve
   one** so they see the coach is in control.
4. **The report (3 min).** Open the finished, approved report as it would be sent
   to a swimmer / parent.
5. **Questions (4 min).** Ask the set below. Let them talk; don't defend.

## Questions (after they've seen it)

- Would you use this after filming a swimmer?
- Which part feels most useful? Which feels unnecessary?
- Would a parent / swimmer understand this report?
- What wording sounds too "AI" or too confident?
- What technical information would you want added?
- What would make you trust the system more?
- Session report, term report, or competition review — which fits your squad?

## Wording guardrails (say / don't say)

- **Say:** "draft observation", "estimate", "for your review", "the coach
  approves everything".
- **Avoid:** "the AI detected a fault", "measured", "accurate", "the AI says".
  Never imply certainty the system doesn't have. (This is also exactly what
  you're asking the coach to sanity-check.)

## Did the pilot succeed? (tick after)

- [ ] The report format is useful
- [ ] The coach-approval flow makes sense
- [ ] The feedback structure could save time vs manual notes
- [ ] They'd test it with real squad footage

**3–4 ticks** = green light to a real-squad trial. **2** = iterate on the gaps
they named. **0–1** = rethink the workflow before building more.

Also write down the **single most useful** part and the **single most annoying**
part — those two answers drive your next change more than anything else.

## After

Thank them, tell them exactly what you'll change based on their feedback, and ask
if they'd take a second look once you have. A coach who feels heard becomes your
first real user.

---

## Get more signal from each coach session (optional)

These sharpen the feedback without making the session longer. Pick the ones that
fit — it's still a workflow pilot of coach-approved, AI-assisted draft findings.

1. **Time-saving test.** Before showing the app, ask the coach to watch the same
   clip and jot down the notes they'd normally write. Then show the Swim Sight
   report and ask whether it saves time or improves structure.
2. **Capture the coach's language.** Write down the exact phrases they use for
   faults, cues, drills, and priorities. Use those words later so draft findings
   read like real coaching rather than AI-generated text.
3. **Their current workflow.** Ask what they use today — phone notes, paper,
   Dartfish, Hudl, spreadsheets, WhatsApp, nothing, or another tool. That's what
   Swim Sight has to beat.
4. **Soft value probe (optional, non-pushy).** At the end, lightly: *"If this
   saved around 10 minutes per swimmer, would a club pay for it — and roughly what
   would feel reasonable?"* Drop it if the moment isn't right.
5. **Test 2–3 coach types.** At least a head coach, an age-group / squad coach,
   and optionally a learn-to-swim or junior coach. One opinion is anecdote; three
   starts to show a pattern.
6. **Plan one clear moment.** Pick one finding or key frame that shows the product
   well. Show it, then go quiet and watch where the coach hesitates, looks
   confused, or asks questions.
7. **Pre-committed stop signal.** Decide now what would make you pause: if coaches
   repeatedly distrust the wording, can't see the time savings, or wouldn't use
   the report format even after wording fixes — pause and rethink the workflow
   before building more AI-assisted features.
8. **Consent reminder.** If keeping or showing footage of a swimmer, especially
   under 18, get written parent/guardian consent or use an adult or stock demo
   clip. Don't store or show footage beyond the agreed pilot use.

## Pilot notes template (one per coach)

- Coach name / type:
- What they use today:
- Their normal notes from the clip:
- Exact coach phrases:
- Most useful part:
- Most confusing / annoying part:
- Did it feel faster than their current process?
- Would they use it?
- Would a club pay for it?
- Changes needed before next pilot:
- Go / iterate / stop decision:

Capture with `python3 pilot/collect.py`; summarise with
`python3 pilot/summarize.py`.
