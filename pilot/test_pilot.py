"""Standard-library tests for the coach workflow-pilot toolkit."""
from __future__ import annotations

import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from pilot.schema import PilotSession, SuccessTicks, decision_from_tick_count  # noqa: E402
from pilot.summarize import load_responses, summarize_sessions  # noqa: E402

results = []


def check(name, ok, detail=""):
    results.append(bool(ok))
    print(f"[{'PASS' if ok else 'FAIL'}] {name}" + (f" -- {detail}" if detail else ""))


for tick_count, expected in ((0, "stop"), (1, "stop"), (2, "iterate"), (3, "go"), (4, "go")):
    check(
        f"{tick_count} ticks => {expected}",
        decision_from_tick_count(tick_count) == expected,
    )


def make_session(initials, ticks, useful="Clear report", annoying="Too many clicks",
                 phrases=None, normal_notes="Body line and timing notes"):
    values = [index < ticks for index in range(4)]
    return PilotSession(
        session_date="2026-06-20",
        coach_initials=initials,
        coach_type="Squad coach",
        what_they_use_today="Paper notes",
        normal_notes_from_clip=normal_notes,
        exact_coach_phrases=phrases or ["Hold the line", "Patient hands"],
        most_useful_part=useful,
        most_confusing_or_annoying_part=annoying,
        felt_faster_than_current_process="yes",
        would_use_it="yes",
        would_club_pay_for_it="unsure",
        changes_needed_before_next_pilot="Simplify the review buttons",
        success_ticks=SuccessTicks(*values),
    )


round_trip_source = make_session("AB", 3)
round_trip = PilotSession.from_json(round_trip_source.to_json())
check("schema JSON round-trip", round_trip == round_trip_source)
check("computed decision is stored", round_trip.to_dict()["go_iterate_stop_decision"] == "go")
stored_keys = set(round_trip.to_dict())
check("schema stores no swimmer or footage-path fields",
      not any("swimmer" in key or "footage_path" in key for key in stored_keys))
try:
    make_session("GH", 3, normal_notes="Review /Users/example/private.mov")
    private_reference_rejected = False
except ValueError:
    private_reference_rejected = True
check("schema rejects obvious private footage references", private_reference_rejected)

with tempfile.TemporaryDirectory() as temp_dir:
    responses_dir = Path(temp_dir)
    synthetic = [
        make_session("AB", 4, phrases=["Hold the line", "Patient hands"]),
        make_session("CD", 3, phrases=["hold the line", "Finish the stroke"]),
        make_session("EF", 2, useful="Fast report", annoying="Finding labels"),
    ]
    for session in synthetic:
        (responses_dir / f"{session.coach_initials}__{session.session_date}.json").write_text(
            session.to_json(), encoding="utf-8"
        )
    loaded, warnings = load_responses(responses_dir)
    summary = summarize_sessions(loaded)

check("summarizer loads all synthetic records", len(loaded) == 3 and not warnings)
check("aggregate tick total is correct", summary["total_ticks"] == 9)
check("aggregate signal uses average ticks", summary["overall_decision"] == "go")
check("recurring useful theme is counted",
      summary["most_useful_themes"][0] == {"theme": "Clear report", "count": 2})
check("coach phrases are deduped case-insensitively",
      summary["coach_phrases"] == ["Hold the line", "Patient hands", "Finish the stroke"])

print("\n" + "=" * 50)
failed = results.count(False)
print(f"{results.count(True)}/{len(results)} passed",
      "ALL PASS" if failed == 0 else f"{failed} FAILED")
sys.exit(1 if failed else 0)
