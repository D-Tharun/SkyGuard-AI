# 📋 SkyGuard AI — Next Steps & Laptop Setup Guide

This guide gives you the exact checklist and commands to set up this project on your laptop at college, sync your work smoothly between devices, and collaborate with your teammates.

---

## 💻 Part 1: First-Time Setup on Your Laptop (At College)

Follow these steps once on your laptop:

### 1. Prerequisites Check
Ensure your laptop has:
- **Git** installed ([Download Git](https://git-scm.com/downloads) if not installed).
- **Python 3.10+** installed (check by running `python --version` in terminal).
- A code editor like **VS Code**.

### 2. Clone the Repository
Open PowerShell or Terminal in the folder where you keep your projects:
```bash
git clone https://github.com/D-Tharun/SkyGuard-AI.git
cd SkyGuard-AI
```

### 3. Create & Activate Virtual Environment
Keeping dependencies isolated in a virtual environment prevents version conflicts:

```powershell
# Create the virtual environment
python -m venv .venv

# Activate the virtual environment:
# On Windows PowerShell:
.venv\Scripts\Activate.ps1

# (If you get an Execution_Policy error in PowerShell, run this once:)
# Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### 4. Install Dependencies
Install all required libraries with one command:
```bash
pip install -r requirements.txt
```

### 5. Launch the Dashboard to Verify Setup
```bash
streamlit run app.py
```
If the browser opens and displays the **SkyGuard AI Dashboard**, your laptop environment is 100% ready!

---

## 🔄 Part 2: Daily Sync Routine (Laptop 🔁 PC)

To keep your PC and laptop in sync without losing any progress:

### When Starting Work (on Laptop or PC):
Always download the latest updates first:
```bash
git pull origin main
```

### When Finishing Work (before packing up):
Save and upload your latest changes to GitHub:
```bash
git add .
git commit -m "work from college: describe what you changed"
git push origin main
```

---

## 👥 Part 3: Teammate Collaboration Best Practices

When your teammates start working on the project:

### Option A: Feature Branches (Recommended for Teams)
Instead of everyone pushing directly to `main`, have each teammate work on a separate branch:
```bash
# Create and switch to a new branch
git checkout -b feature/model-optimization

# Do work, then commit and push branch
git add .
git commit -m "tuned 2D thresholds for fusion engine"
git push -u origin feature/model-optimization
```
Then on GitHub, create a **Pull Request (PR)** to merge it into `main`.

### Option B: If Someone Else Pushed to `main`
If GitHub says your push is rejected because your teammates made changes:
```bash
git pull --rebase origin main
git push origin main
```

---

## 🎯 Part 4: Project Development Checklist (What to Build Next)

Here are high-priority technical tasks ready to be tackled:

- [ ] **Run & Validate ML Scoring**:
  - Test `scripts/check_ml_scores.py` to evaluate IForest and LSTM Autoencoder reconstruction errors.
- [ ] **Threshold Tuning**:
  - Fine-tune false alarm vs. detection rates using `scripts/tune_2d_thresholds.py`.
- [ ] **Benchmark Validation**:
  - Run `scripts/generate_validation_benchmark.py` and inspect confusion matrix outputs in `results/`.
- [ ] **Streamlit UI Enhancements (`app.py`)**:
  - Connect full multi-city selection (Delhi, Mumbai, Bengaluru, Shimla, Cherrapunji).
  - Add real-time telemetry playback / simulation slider.
  - Export audit logs to downloadable CSV directly from the dashboard UI.
- [ ] **Presentation / SIH Pitch Preparation**:
  - Prepare a 3-minute demo flow showing how the system catches sensor freeze/spikes while ignoring genuine extreme weather squalls.

---

## 🆘 Quick Troubleshooting

| Issue | Solution |
|---|---|
| `Activate.ps1 cannot be loaded because running scripts is disabled` | Run: `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned` in PowerShell |
| `fatal: refusing to merge unrelated histories` | Run: `git pull origin main --allow-unrelated-histories` |
| `streamlit: command not found` | Ensure virtual environment is activated (`.venv\Scripts\Activate.ps1`) |
| Git asks for username / password on laptop | Enter your GitHub username and use a **GitHub Personal Access Token (PAT)** or authorize via browser prompt |
