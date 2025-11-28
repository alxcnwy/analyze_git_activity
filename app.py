from pathlib import Path

from flask import Flask, jsonify, render_template

from parser import parse_git_repo, build_timeseries


def create_app(repo_path: Path | None = None) -> Flask:
    app = Flask(__name__)

    if repo_path is None:
        repo_path = Path.cwd()

    events = parse_git_repo(repo_path)
    series = build_timeseries(events)

    @app.route("/")
    def index():
        return render_template("index.html", repo_name=repo_path.name)

    @app.route("/api/data")
    def api_data():
        return jsonify(series)

    return app

