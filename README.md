# 🌤️ SkyGuard AI: Event-Aware Weather Sensor Anomaly Detection

> **Smart India Hackathon (SIH) - Automated Quality Control (QC) & Fault vs. Extreme Event Disambiguation System**

SkyGuard AI is a multi-tier, physics-guided machine learning framework designed for Automated Weather Stations (AWS) and meteorological sensor networks. It solves the critical challenge of **distinguishing between hardware sensor faults** (spikes, sensor freeze/drift, calibration errors) and **genuine extreme meteorological events** (severe squalls, heatwaves, cloudbursts, sudden temperature inversions).

---

## 🚀 Key Features

1. **Physics-Guided Quality Control (PhysicsEngine)**:
   - Validates thermodynamic limits, lapse rates, relative humidity vs. dew point depression, and solar radiation constraints.
2. **Statistical QC Engine (StatisticalQCEngine)**:
   - Real-time step-change, rate-of-change, persistent value (freeze) detection, and rolling Z-scores.
3. **Machine Learning Anomaly Detectors**:
   - **Isolation Forest**: Multivariate out-of-distribution anomaly detection.
   - **LSTM Autoencoder**: Temporal sequence reconstruction error modeling for subtle temporal drift.
4. **Event-Aware Decision Fusion (EventAwareFusionEngine)**:
   - Multi-sensor consensus & spatial-temporal cross-validation to prevent false alarms during genuine extreme weather events.
5. **Interactive Dashboard (`app.py`)**:
   - Real-time Streamlit visualization with interactive Plotly telemetry, anomaly flags, confidence metrics, and alert logs.

---

## 📂 Project Structure

```
├── app.py                     # Streamlit web application & real-time dashboard
├── data/
│   ├── raw/                   # Raw benchmark datasets (Open-Meteo, Jena Climate)
│   └── processed/             # Injected sensor fault benchmarks & validation sets
├── models/                    # Trained ML models (Isolation Forest, LSTM Autoencoder)
├── scripts/                   # Evaluation, threshold tuning, and benchmark generation
├── src/
│   ├── qc/                    # Physics, Statistical, and Fusion QC engines
│   ├── models/                # ML model definitions (IForest, LSTM-AE)
│   ├── data/                  # Synthetic fault injection & pipeline utilities
│   └── visualization/         # Plotting & report generators
├── requirements.txt           # Python dependencies
└── .gitignore                 # Files excluded from version control
```

---

## 🛠️ Quickstart Guide for Teammates

### 1. Clone the Repository
```bash
git clone <REPO_URL>
cd sih-ps-2
```

### 2. Set Up Python Environment
Recommended Python version: **3.10+**
```bash
# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows (PowerShell):
.venv\Scripts\Activate.ps1
# Windows (Command Prompt):
.venv\Scripts\activate.bat
# Linux / macOS:
source .venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```
*(If `requirements.txt` is missing, install the core packages: `pip install streamlit pandas numpy plotly scikit-learn tensorflow`)*

### 4. Run the Streamlit Dashboard
```bash
streamlit run app.py
```

---

## 🤝 Team Workflow with Git

- **Pull latest changes before starting work:**
  ```bash
  git pull origin main
  ```
- **Commit and push your work:**
  ```bash
  git add .
  git commit -m "feat: describe what you added or fixed"
  git push origin main
  ```
