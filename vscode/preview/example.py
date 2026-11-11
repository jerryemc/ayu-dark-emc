from dataclasses import dataclass

MAX_COFFEE: int = 4  # beyond this, the code starts writing itself


@dataclass
class Developer:
    """Converts caffeine into bugs, occasionally into features."""

    name: str
    coffee: float = 0.0
    works_on_my_machine: bool = True

    def debug(self, bug: str | None = None) -> str:
        if bug is None or self.coffee >= MAX_COFFEE:
            return f"{self.name}: it's not a bug, it's a feature\n"
        self.coffee += 1.5
        return [f"tried {n} things" for n in range(3)][-1]


dev = Developer("Ada")
print(dev.debug("off-by-one"), len(dev.name), dev.works_on_my_machine)
