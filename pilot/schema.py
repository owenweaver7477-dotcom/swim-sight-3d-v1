"""Canonical records for the coach-approved, AI-assisted workflow pilot."""
from __future__ import annotations

import json
import re
from dataclasses import asdict, dataclass
from datetime import date
from typing import Any, Dict, List

DECISION_GO = "go"
DECISION_ITERATE = "iterate"
DECISION_STOP = "stop"
VALID_DECISIONS = {DECISION_GO, DECISION_ITERATE, DECISION_STOP}
VALID_ANSWERS = {"yes", "no", "unsure"}
PRIVATE_REFERENCE_PATTERN = re.compile(
    r"(?:https?://|file://|(?:^|\s)/(?:Users|home|private|tmp)/|"
    r"[A-Za-z]:\\|\.(?:mp4|mov|avi|mkv|m4v|webm)\b)",
    re.IGNORECASE,
)


def decision_from_tick_count(tick_count: int) -> str:
    """Return the pre-committed pilot decision for zero to four ticks."""
    if not isinstance(tick_count, int) or isinstance(tick_count, bool):
        raise TypeError("tick_count must be an integer")
    if not 0 <= tick_count <= 4:
        raise ValueError("tick_count must be between 0 and 4")
    if tick_count >= 3:
        return DECISION_GO
    if tick_count == 2:
        return DECISION_ITERATE
    return DECISION_STOP


def _clean_text(value: Any) -> str:
    return " ".join(str(value or "").strip().split())


def _clean_answer(value: Any) -> str:
    answer = _clean_text(value).lower()
    if answer not in VALID_ANSWERS:
        raise ValueError(f"answer must be one of {sorted(VALID_ANSWERS)}")
    return answer


def safe_initials(value: Any) -> str:
    initials = re.sub(r"[^A-Za-z0-9-]", "", _clean_text(value)).upper()
    if not 1 <= len(initials) <= 12:
        raise ValueError("coach initials must contain 1-12 letters, numbers, or hyphens")
    return initials


def _reject_private_reference(field_name: str, value: str) -> None:
    if PRIVATE_REFERENCE_PATTERN.search(value):
        raise ValueError(
            f"{field_name} appears to contain a URL, local path, or video filename; "
            "remove it before saving the pilot response"
        )


@dataclass
class SuccessTicks:
    report_format_useful: bool
    approval_flow_makes_sense: bool
    could_save_time: bool
    would_test_with_real_squad_footage: bool

    @property
    def count(self) -> int:
        return sum((
            self.report_format_useful,
            self.approval_flow_makes_sense,
            self.could_save_time,
            self.would_test_with_real_squad_footage,
        ))

    @property
    def decision(self) -> str:
        return decision_from_tick_count(self.count)

    @classmethod
    def from_dict(cls, payload: Dict[str, Any]) -> "SuccessTicks":
        required = (
            "report_format_useful",
            "approval_flow_makes_sense",
            "could_save_time",
            "would_test_with_real_squad_footage",
        )
        missing = [field for field in required if field not in payload]
        if missing:
            raise ValueError(f"success ticks missing fields: {', '.join(missing)}")
        if any(not isinstance(payload[field], bool) for field in required):
            raise ValueError("all success ticks must be true or false")
        return cls(**{field: payload[field] for field in required})


@dataclass
class PilotSession:
    """One coach session using the Pilot notes template fields."""

    session_date: str
    coach_initials: str
    coach_type: str
    what_they_use_today: str
    normal_notes_from_clip: str
    exact_coach_phrases: List[str]
    most_useful_part: str
    most_confusing_or_annoying_part: str
    felt_faster_than_current_process: str
    would_use_it: str
    would_club_pay_for_it: str
    changes_needed_before_next_pilot: str
    success_ticks: SuccessTicks

    def __post_init__(self) -> None:
        self.coach_initials = safe_initials(self.coach_initials)
        try:
            date.fromisoformat(self.session_date)
        except (TypeError, ValueError) as exc:
            raise ValueError("session_date must use YYYY-MM-DD") from exc

        text_fields = (
            "coach_type",
            "what_they_use_today",
            "normal_notes_from_clip",
            "most_useful_part",
            "most_confusing_or_annoying_part",
            "changes_needed_before_next_pilot",
        )
        for field_name in text_fields:
            setattr(self, field_name, _clean_text(getattr(self, field_name)))
        self.exact_coach_phrases = [
            phrase for phrase in (_clean_text(item) for item in self.exact_coach_phrases)
            if phrase
        ]
        for field_name in text_fields:
            _reject_private_reference(field_name, getattr(self, field_name))
        for phrase in self.exact_coach_phrases:
            _reject_private_reference("exact_coach_phrases", phrase)
        self.felt_faster_than_current_process = _clean_answer(
            self.felt_faster_than_current_process
        )
        self.would_use_it = _clean_answer(self.would_use_it)
        self.would_club_pay_for_it = _clean_answer(self.would_club_pay_for_it)
        if not isinstance(self.success_ticks, SuccessTicks):
            raise TypeError("success_ticks must be a SuccessTicks record")

    @property
    def tick_count(self) -> int:
        return self.success_ticks.count

    @property
    def decision(self) -> str:
        return self.success_ticks.decision

    def to_dict(self) -> Dict[str, Any]:
        payload = asdict(self)
        payload["tick_count"] = self.tick_count
        payload["go_iterate_stop_decision"] = self.decision
        payload["pilot_scope"] = "workflow pilot: coach-approved, AI-assisted draft findings"
        return payload

    def to_json(self, indent: int = 2) -> str:
        return json.dumps(self.to_dict(), indent=indent, ensure_ascii=True, sort_keys=True)

    @classmethod
    def from_dict(cls, payload: Dict[str, Any]) -> "PilotSession":
        data = dict(payload)
        ticks = SuccessTicks.from_dict(data.pop("success_ticks"))
        stored_decision = data.pop("go_iterate_stop_decision", None)
        data.pop("tick_count", None)
        data.pop("pilot_scope", None)
        session = cls(success_ticks=ticks, **data)
        if stored_decision is not None and stored_decision != session.decision:
            raise ValueError("stored pilot decision does not match the success ticks")
        return session

    @classmethod
    def from_json(cls, value: str) -> "PilotSession":
        payload = json.loads(value)
        if not isinstance(payload, dict):
            raise ValueError("pilot response JSON must contain one object")
        return cls.from_dict(payload)
