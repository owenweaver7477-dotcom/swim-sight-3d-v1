#!/usr/bin/env python3
"""Summarize privacy-safe coach workflow-pilot responses."""
from __future__ import annotations

import argparse
import json
import re
import sys
from collections import Counter
from pathlib import Path
from typing import Dict, Iterable, List, Sequence, Tuple

try:
    from pilot.schema import PilotSession, decision_from_tick_count
except ModuleNotFoundError:
    from schema import PilotSession, decision_from_tick_count

DEFAULT_RESPONSES_DIR = Path(__file__).resolve().parent / "responses"
TICK_FIELDS = (
    ("report_format_useful", "Report format useful"),
    ("approval_flow_makes_sense", "Approval flow makes sense"),
    ("could_save_time", "Could save time"),
    ("would_test_with_real_squad_footage", "Would test with real squad footage"),
)


def load_responses(responses_dir: Path) -> Tuple[List[PilotSession], List[str]]:
    sessions = []
    warnings = []
    for path in sorted(responses_dir.glob("*.json")) if responses_dir.is_dir() else []:
        try:
            sessions.append(PilotSession.from_json(path.read_text(encoding="utf-8")))
        except (OSError, ValueError, TypeError, json.JSONDecodeError) as exc:
            warnings.append(f"Skipped {path.name}: {exc}")
    return sessions, warnings


def _normalise_theme(value: str) -> str:
    return re.sub(r"[^a-z0-9 ]", "", " ".join(value.lower().split()))


def theme_counts(values: Iterable[str]) -> List[Dict[str, object]]:
    representatives: Dict[str, str] = {}
    counts: Counter = Counter()
    for value in values:
        normalised = _normalise_theme(value)
        if not normalised:
            continue
        representatives.setdefault(normalised, value.strip())
        counts[normalised] += 1
    return [
        {"theme": representatives[key], "count": count}
        for key, count in sorted(counts.items(), key=lambda item: (-item[1], item[0]))
    ]


def dedupe_phrases(sessions: Sequence[PilotSession]) -> List[str]:
    seen = set()
    phrases = []
    for session in sessions:
        for phrase in session.exact_coach_phrases:
            key = _normalise_theme(phrase)
            if key and key not in seen:
                seen.add(key)
                phrases.append(phrase)
    return phrases


def aggregate_decision(sessions: Sequence[PilotSession]) -> str:
    if not sessions:
        return "no_data"
    average_ticks = sum(session.tick_count for session in sessions) / len(sessions)
    if average_ticks >= 3:
        return decision_from_tick_count(3)
    if average_ticks >= 2:
        return decision_from_tick_count(2)
    return decision_from_tick_count(1)


def summarize_sessions(sessions: Sequence[PilotSession]) -> Dict[str, object]:
    tick_totals = {
        field: sum(bool(getattr(session.success_ticks, field)) for session in sessions)
        for field, _label in TICK_FIELDS
    }
    total_ticks = sum(session.tick_count for session in sessions)
    return {
        "coach_count": len(sessions),
        "total_ticks": total_ticks,
        "possible_ticks": len(sessions) * 4,
        "average_ticks": round(total_ticks / len(sessions), 2) if sessions else 0.0,
        "tick_totals": tick_totals,
        "overall_decision": aggregate_decision(sessions),
        "most_useful_themes": theme_counts(session.most_useful_part for session in sessions),
        "most_annoying_themes": theme_counts(
            session.most_confusing_or_annoying_part for session in sessions
        ),
        "coach_phrases": dedupe_phrases(sessions),
    }


def print_summary(sessions: Sequence[PilotSession], summary: Dict[str, object]) -> None:
    print("PER-COACH WORKFLOW PILOT SUMMARY")
    if not sessions:
        print("No coach responses found.")
    for session in sessions:
        print(
            f"- {session.coach_initials} | {session.coach_type} | "
            f"{session.session_date} | {session.tick_count}/4 | {session.decision.upper()}"
        )
        print(f"  Useful: {session.most_useful_part or 'Not captured'}")
        print(
            "  Confusing/annoying: "
            f"{session.most_confusing_or_annoying_part or 'Not captured'}"
        )

    print("\nAGGREGATE")
    print(
        f"Coaches: {summary['coach_count']} | Ticks: {summary['total_ticks']}/"
        f"{summary['possible_ticks']} | Average: {summary['average_ticks']}/4 | "
        f"Signal: {str(summary['overall_decision']).upper()}"
    )
    for field, label in TICK_FIELDS:
        print(f"- {label}: {summary['tick_totals'][field]}/{summary['coach_count']}")

    print("\nMOST USEFUL THEMES")
    for item in summary["most_useful_themes"]:
        print(f"- {item['theme']} ({item['count']})")
    if not summary["most_useful_themes"]:
        print("- None captured")

    print("\nMOST CONFUSING / ANNOYING THEMES")
    for item in summary["most_annoying_themes"]:
        print(f"- {item['theme']} ({item['count']})")
    if not summary["most_annoying_themes"]:
        print("- None captured")

    print("\nDEDUPED COACH PHRASES FOR DRAFT FINDINGS")
    for phrase in summary["coach_phrases"]:
        print(f"- {phrase}")
    if not summary["coach_phrases"]:
        print("- None captured")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Summarize coach workflow-pilot responses.")
    parser.add_argument("--responses-dir", default=str(DEFAULT_RESPONSES_DIR))
    return parser


def main(argv=None) -> int:
    args = build_parser().parse_args(argv)
    sessions, warnings = load_responses(Path(args.responses_dir).expanduser())
    for warning in warnings:
        print(warning, file=sys.stderr)
    print_summary(sessions, summarize_sessions(sessions))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
