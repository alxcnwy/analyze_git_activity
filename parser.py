import datetime as _dt
import subprocess
from dataclasses import dataclass
from pathlib import Path
from typing import List, Dict, Union


PathLike = Union[str, Path]


@dataclass
class CommitEvent:
    timestamp: _dt.datetime
    author: str
    repo: str


def parse_git_repo(repo_path: PathLike) -> List[CommitEvent]:
    """
    Parse commit history from a Git repository using `git log`.

    Each commit becomes a CommitEvent with timestamp, author name, and repo name.
    """
    repo = Path(repo_path).resolve()
    repo_name = repo.name

    cmd = [
        "git",
        "-C",
        str(repo),
        "log",
        "--all",
        "--pretty=format:%H|%ct|%an",
    ]

    try:
        output = subprocess.check_output(cmd, text=True, stderr=subprocess.DEVNULL)
    except subprocess.CalledProcessError:
        return []

    events: List[CommitEvent] = []
    for line in output.splitlines():
        if not line.strip():
            continue
        parts = line.split("|", 2)
        if len(parts) != 3:
            continue
        _, ts_str, author = parts
        try:
            ts = int(ts_str)
        except ValueError:
            continue
        dt = _dt.datetime.fromtimestamp(ts)
        events.append(CommitEvent(timestamp=dt, author=author.strip() or "unknown", repo=repo_name))

    return events


def aggregate_by_day(events: List[CommitEvent]) -> Dict[str, Dict[str, int]]:
    per_day: Dict[str, int] = {}
    per_author: Dict[str, Dict[str, int]] = {}

    for ev in events:
        date_str = ev.timestamp.date().isoformat()
        per_day[date_str] = per_day.get(date_str, 0) + 1

        if ev.author not in per_author:
            per_author[ev.author] = {}
        per_author[ev.author][date_str] = per_author[ev.author].get(date_str, 0) + 1

    return {"per_day": per_day, "per_author": per_author}


def build_timeseries(events: List[CommitEvent]) -> Dict:
    if not events:
        return {"dates": [], "total": [], "authors": {}}

    agg = aggregate_by_day(events)
    per_day = agg["per_day"]
    per_author = agg["per_author"]

    # Build a continuous date range from the first to last commit date
    sorted_dates = sorted(per_day.keys())
    start = _dt.date.fromisoformat(sorted_dates[0])
    end = _dt.date.fromisoformat(sorted_dates[-1])

    dates: List[str] = []
    current = start
    while current <= end:
        dates.append(current.isoformat())
        current = current + _dt.timedelta(days=1)

    total = [per_day.get(d, 0) for d in dates]

    authors_series: Dict[str, List[int]] = {}
    for author, counts in per_author.items():
        authors_series[author] = [counts.get(d, 0) for d in dates]

    return {"dates": dates, "total": total, "authors": authors_series}
