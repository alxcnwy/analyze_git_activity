from pathlib import Path
import shutil
import subprocess
import tempfile

from flask import Flask, jsonify, render_template, request

from parser import parse_git_repo, build_timeseries


def _is_github_url(value: str) -> bool:
    if not value:
        return False
    return value.startswith(("https://github.com/", "http://github.com/", "git@github.com:"))


def _clone_github_repo(url: str) -> Path:
    tmp_dir = Path(tempfile.mkdtemp(prefix="git-activity-"))
    try:
        subprocess.check_call(["git", "clone", url, str(tmp_dir)])
    except subprocess.CalledProcessError as exc:
        shutil.rmtree(tmp_dir, ignore_errors=True)
        raise RuntimeError(f"Failed to clone GitHub repository: {url}") from exc
    return tmp_dir


def _build_series(repo_path: Path) -> dict:
    events = parse_git_repo(repo_path)
    return build_timeseries(events)


def create_app(repo_path: Path | None = None, repo_url: str | None = None) -> Flask:
    app = Flask(__name__)

    if repo_path is None:
        repo_path = Path.cwd()

    app.config["REPO_PATH"] = repo_path
    app.config["REPO_URL"] = repo_url
    app.config["TMP_REPO_PATH"] = None
    app.config["SERIES"] = _build_series(repo_path)

    @app.route("/")
    def index():
        repo = app.config.get("REPO_PATH")
        name = repo.name if isinstance(repo, Path) else None
        url = app.config.get("REPO_URL")
        return render_template("index.html", repo_name=name, repo_url=url)

    @app.route("/api/data")
    def api_data():
        series = app.config.get("SERIES") or {"dates": [], "total": [], "authors": {}}
        return jsonify(series)

    @app.post("/api/set_repo")
    def set_repo():
        payload = request.get_json(silent=True) or {}
        url = (payload.get("url") or "").strip()
        if not url:
            return jsonify({"error": "URL is required"}), 400
        if not _is_github_url(url):
            return jsonify({"error": "Only public GitHub URLs (github.com) are supported here."}), 400

        old_tmp = app.config.get("TMP_REPO_PATH")
        if isinstance(old_tmp, Path):
            shutil.rmtree(old_tmp, ignore_errors=True)

        try:
            new_repo_path = _clone_github_repo(url)
        except RuntimeError as exc:
            return jsonify({"error": str(exc)}), 400

        app.config["REPO_PATH"] = new_repo_path
        app.config["REPO_URL"] = url
        app.config["TMP_REPO_PATH"] = new_repo_path
        app.config["SERIES"] = _build_series(new_repo_path)

        return jsonify({"ok": True, "repo_name": new_repo_path.name, "repo_url": url})

    return app
