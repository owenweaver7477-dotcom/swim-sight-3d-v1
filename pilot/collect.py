#!/usr/bin/env python3
"""Interactively capture one privacy-safe coach workflow-pilot response."""
from __future__ import annotations

import argparse
from datetime import date
from pathlib import Path
from typing import List

try:
    from pilot.schema import PilotSession, SuccessTicks, safe_initials
except ModuleNotFoundError:
    from schema import PilotSession, SuccessTicks, safe_initials

DEFAULT_RESPONSES_DIR = Path(__file__).resolve().parent / "responses"
PRIVACY_REMINDER = (
    "Privacy reminder: record coach initials/type only; do not enter swimmer "
    "names, footage filenames, links, or file paths."
)


def ask_required(prompt: str) -> str:
    while True:
        value = input(prompt).strip()
        if value:
            return value
        print("Please enter a response.")


def ask_answer(prompt: str) -> str:
    while True:
        value = input(f"{prompt} [yes/no/unsure]: ").strip().lower()
        if value in {"yes", "no", "unsure"}:
            return value
        print("Please answer yes, no, or unsure.")


def ask_tick(prompt: str) -> bool:
    while True:
        value = input(f"{prompt} [y/n]: ").strip().lower()
        if value in {"y", "yes"}:
            return True
        if value in {"n", "no"}:
            return False
        print("Please answer y or n.")


def split_phrases(value: str) -> List[str]:
    return [phrase.strip() for phrase in value.split("|") if phrase.strip()]


def collect_session() -> PilotSession:
    print(PRIVACY_REMINDER)
    initials = safe_initials(ask_required("Coach initials: "))
    coach_type = ask_required("Coach type: ")
    what_they_use_today = ask_required("What they use today: ")
    normal_notes = ask_required(
        "Their normal notes from the clip (no names or footage references): "
    )
    phrases = split_phrases(ask_required("Exact coach phrases (separate with |): "))
    most_useful = ask_required("Most useful part: ")
    most_annoying = ask_required("Most confusing / annoying part: ")
    felt_faster = ask_answer("Did it feel faster than their current process?")
    would_use = ask_answer("Would they use it?")
    would_pay = ask_answer("Would a club pay for it?")
    changes = ask_required("Changes needed before next pilot: ")
    ticks = SuccessTicks(
        report_format_useful=ask_tick("The report format is useful"),
        approval_flow_makes_sense=ask_tick("The coach-approval flow makes sense"),
        could_save_time=ask_tick("The feedback structure could save time"),
        would_test_with_real_squad_footage=ask_tick(
            "They would test it with real squad footage"
        ),
    )
    return PilotSession(
        session_date=date.today().isoformat(),
        coach_initials=initials,
        coach_type=coach_type,
        what_they_use_today=what_they_use_today,
        normal_notes_from_clip=normal_notes,
        exact_coach_phrases=phrases,
        most_useful_part=most_useful,
        most_confusing_or_annoying_part=most_annoying,
        felt_faster_than_current_process=felt_faster,
        would_use_it=would_use,
        would_club_pay_for_it=would_pay,
        changes_needed_before_next_pilot=changes,
        success_ticks=ticks,
    )


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Capture one coach workflow-pilot response.")
    parser.add_argument("--responses-dir", default=str(DEFAULT_RESPONSES_DIR))
    parser.add_argument("--overwrite", action="store_true")
    return parser


def main(argv=None) -> int:
    args = build_parser().parse_args(argv)
    session = collect_session()
    responses_dir = Path(args.responses_dir).expanduser()
    responses_dir.mkdir(parents=True, exist_ok=True)
    output_path = responses_dir / f"{session.coach_initials}__{session.session_date}.json"
    if output_path.exists() and not args.overwrite:
        print(f"Response already exists: {output_path}. Use --overwrite to replace it.")
        return 1
    output_path.write_text(session.to_json() + "\n", encoding="utf-8")
    print(
        f"Saved {output_path} — {session.tick_count}/4 ticks, "
        f"decision: {session.decision.upper()}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
