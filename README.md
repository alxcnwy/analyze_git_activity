# git activity analyser

Point this at a Git repository and it opens a small web dashboard showing who committed on which days.

Small [Flask](https://flask.palletsprojects.com/en/latest/) + [Chart.js](https://www.chartjs.org/) UI for visualising Git commit activity (by day and by author) for any local repository. It shells out to `git log --all` on a repo you point it at, and never stores or uploads your data.

## Quick Start

### 1. Clone this tool

```bash
git clone https://github.com/alxcnwy/analyze_git_activity.git
cd analyze_git_activity
```

### 2. Create and Activate a Virtual Environment

This ensures all dependencies are installed in an isolated environment.

```bash
# Create the virtual environment
python -m venv .venv
```

```bash
# --- Activation: Choose your platform ---
# macOS / Linux:
# source .venv/bin/activate
# Windows (Command Prompt):
# .venv\Scripts\activate.bat
# Windows (PowerShell):
# .venv\Scripts\Activate.ps1

# Install dependencies
pip install flask
```

### 3. Run it against an example public GitHub repo

```bash
python cli.py https://github.com/openai/codex --port 5050
```

### 4. Open the UI in your browser

```bash
open http://127.0.0.1:5050/
```

## Sample usage

### Current directory (already a Git repo)

```bash
python cli.py --port 5050
```

### Local repo at a specific path

```bash
python cli.py ~/code/my-project --port 5050
```

### Public GitHub repo

```bash
python cli.py https://github.com/user/repo.git --port 5050
```

---

## Getting Started

Follow these steps from the project directory after cloning:

### 1. Create and Activate a Virtual Environment

| OS / Shell | Create Venv | Activate Venv |
| :--- | :--- | :--- |
| **macOS / Linux** | `python -m venv .venv` | `source .venv/bin/activate` |
| **Windows (CMD)** | `python -m venv .venv` | `.venv\Scripts\activate.bat` |
| **Windows (PS)** | `python -m venv .venv` | `.venv\Scripts\Activate.ps1` |

Install dependencies:

```bash
pip install flask
```

### 2. Run the CLI

Point the tool at any Git repository:

```bash
python cli.py /path/to/your/git/repo --port 5050
```

### 3. Open the UI in your browser

```text
http://127.0.0.1:5050/
```

You will see:

- A time series of total commits per day across all branches.
- Commits per day broken down by author, overlaid so you can see who is active when.
- A dedicated line chart for a focus author you select from a dropdown, to inspect their streaks and gaps.
- A bar chart marking days where the focus author made zero commits (1 = no commits), making it easy to spot days off.

---

## CLI Alias (Optional)

We recommend creating an alias that calls the Python executable directly from your virtual environment. This ensures the correct dependencies are always used, **even if the environment is not actively sourced**.

Replace `/absolute/path/to/analyze_git_activity` with the path where you cloned this repo.

| OS / Shell | Alias Command |
| :--- | :--- |
| **macOS / Linux** | `alias gitanalyze='/absolute/path/to/analyze_git_activity/.venv/bin/python /absolute/path/to/analyze_git_activity/cli.py'` |
| **Windows (PowerShell)** | Set a persistent alias using a [custom function in your PowerShell profile](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.utility/set-alias?view=powershell-7.4). |

Then you can run (on macOS/Linux):

```bash
gitanalyze /path/to/your/git/repo --port 5050
gitanalyze https://github.com/user/repo.git --port 5050
```

---

## Privacy

- All analysis runs locally on your machine.
- The tool reads commit metadata via `git log` (timestamps and author names) from the repo you point it at.
- It does not send data over the network or persist it to disk; everything is held in memory by the Flask app while it is running.
