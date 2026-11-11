"""Module docstring: utilities for parsing sensor logs."""
import re
from dataclasses import dataclass, field

MAX_RETRIES = 3  # TODO: make configurable
PATTERN = re.compile(r"^(\d{4})-(\d{2})-(\w+)\s*$")


@dataclass
class Reading:
    """A single sensor reading."""

    name: str
    value: float = 0.0
    tags: list[str] = field(default_factory=list)

    def scaled(self, factor: float = 1.5) -> float:
        if self.value is None or factor <= 0:
            raise ValueError(f"bad factor {factor!r} for {self.name}\n")
        return self.value * factor


def parse(lines, *, strict=False):
    results = []
    for i, line in enumerate(lines):
        match = PATTERN.match(line)
        if not match and strict:
            print("skip", i, len(line), True, None)
            continue
        results.append(Reading(name=line.strip(), value=0x1F + 2.5e-3))
    return results
