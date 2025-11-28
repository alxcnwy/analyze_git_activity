# git activity analyser

Point this at a Git repository and it opens a small web dashboard showing who committed on which days.

Small Flask + Chart.js UI for visualising Git commit activity (by day and by author) for any local repository. It shells out to `git log --all` on a repo you point it at, and never stores or uploads your data.

## Quick Start

```bash
# 1. Clone this tool (replace <your-username> with your GitHub user)
git clone https://github.com/<your-username>/analyze_git_activity.git
cd analyze_git_activity

# 2. (Optional) create and activate a virtualenv
python -m venv .venv
source .venv/bin/activate
pip install flask

# 3. Run it against a repo
#    (a) Local repo on disk
python cli.py /path/to/your/git/repo --port 5050

#    (b) Public GitHub repo
python cli.py https://github.com/user/repo.git --port 5050

# 4. Open the UI in your browser
open http://127.0.0.1:5050/
```

## Sample usage

- Current directory (already a Git repo):

  ```bash
  python cli.py --port 5050
  ```

- Local repo at a specific path:

  ```bash
  python cli.py ~/code/my-project --port 5050
  ```

- Public GitHub repo:

  ```bash
  python cli.py https://github.com/user/repo.git --port 5050
  ```

## Getting Started

From this project directory:

1. (Optional) Create and activate a virtualenv:

   ```bash
   python -m venv .venv
   source .venv/bin/activate
   pip install flask
   ```

2. Run the CLI, pointing it at a Git repo:

   ```bash
   python cli.py /path/to/your/git/repo --port 5050
   ```

3. Open the UI in your browser:

   ```text
   http://127.0.0.1:5050/
   ```

You will see:

- A time series of total commits per day across all branches.
- Commits per day broken down by author, overlaid so you can see who is active when.
- A dedicated line chart for a focus author you select from a dropdown, to inspect their streaks and gaps.
- A bar chart marking days where the focus author made zero commits (1 = no commits), making it easy to spot days off.

## CLI alias (optional)

If you want a shorter command like `gitanalyze`, add this to your shell config (for example `~/.zshrc` or `~/.bashrc`):

```bash
alias gitanalyze='python /absolute/path/to/analyze_git_activity/cli.py'
```

Then you can run:

```bash
gitanalyze /path/to/your/git/repo --port 5050
gitanalyze https://github.com/user/repo.git --port 5050
```

Replace `/absolute/path/to/analyze_git_activity` with the path where you cloned this repo.

## Privacy

- All analysis runs locally on your machine.
- The tool reads commit metadata via `git log` (timestamps and author names) from the repo you point it at.
- It does not send data over the network or persist it to disk; everything is held in memory by the Flask app while it is running.
