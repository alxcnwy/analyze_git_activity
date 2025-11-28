from __future__ import annotations

import argparse
import atexit
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

from app import create_app


def _is_github_url(value: str) -> bool:
    if not value:
        return False
    return value.startswith(("https://github.com/", "http://github.com/", "git@github.com:"))


def _clone_github_repo(url: str) -> Path:
    tmp_dir = Path(tempfile.mkdtemp(prefix="git-activity-"))
    try:
        subprocess.check_call(["git", "clone", url, str(tmp_dir)])
    except subprocess.CalledProcessError:
        print(f"Failed to clone GitHub repository: {url}", file=sys.stderr)
        raise SystemExit(1)

    print(f"Cloned {url} into {tmp_dir} for analysis.")
    return tmp_dir


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Visualise Git commit activity for a repository in your browser.",
    )
    parser.add_argument(
        "repo",
        nargs="?",
        help="Path to the Git repository or a public GitHub URL (default: current directory).",
    )
    parser.add_argument(
        "--port",
        type=int,
        default=5000,
        help="Port to run the web UI on (default: 5000).",
    )
    args = parser.parse_args()

    tmp_repo_path: Path | None = None
    repo_url: str | None = None
    if args.repo and _is_github_url(args.repo):
        tmp_repo_path = _clone_github_repo(args.repo)
        repo_path = tmp_repo_path
        repo_url = args.repo
    else:
        repo_path = Path(args.repo) if args.repo else Path.cwd()

    if tmp_repo_path is not None:
        atexit.register(shutil.rmtree, tmp_repo_path, ignore_errors=True)

    app = create_app(repo_path, repo_url=repo_url)
    app.run(debug=True, port=args.port)


if __name__ == "__main__":
    main()
