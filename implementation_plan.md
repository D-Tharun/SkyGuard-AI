# SkyGuard AI — Revised Implementation Plan (v2.0)
## SIH PS 26073: AI/ML-Based Intelligent Anomaly Detection for AWS

> [!IMPORTANT]
> This is the **corrected and hardened** version of the original blueprint. All 28 review points have been incorporated. Every technical claim in this document is defensible to SIH judges.

---

## Central Technical Theme

> **The difficult problem is not detecting unusual weather. It is deciding whether an unusual observation is caused by the atmosphere or by the sensor.**

This is the core story of SkyGuard AI. Everything in our architecture serves this single question.

---

## 1. Revised Architecture

```
┌─────────────────────────┐
│     BME280 Sensor        │
│   T / RH / Pressure      │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│       ESP32 Edge         │
│  ● Data integrity check  │
│  ● Range plausibility     │
│  ● Spike / rate-of-change │
│  ● Frozen / flatline      │
│  ● Lightweight stats QC   │
└───────────┬─────────────┘
            │ Wi-Fi
            ▼
┌──────────────────────────────────────────┐
│        SkyGuard QC Engine (Server)       │
│                                          │
│  Layer 0 — Data Integrity                │
│    Missing packets, duplicate timestamps │
│    NaN/corrupted values, range checks    │
│                                          │
│  Layer 1 — Fast Sensor QC                │
│    Spike/rate-of-change detection        │
│    Frozen/flatline (persistence check)   │
│    Short-term statistical checks         │
│                                          │
│  Layer 2 — ML Anomaly Engine             │
│    Temporal model (LSTM Autoencoder)     │
│    Multivariate model (Isolation Forest  │
│    on engineered features)               │
│                                          │
│  Layer 3 — Physics Consistency           │
│    T + RH → derived quantities           │
│    (dew point, saturation vapor press.)  │
│    Pressure temporal plausibility        │
│    Multivariate consistency scoring      │
│                                          │
│  Layer 4 — Context Engine                │
│    Time-of-day / season / station        │
│    baseline; optional spatial compare    │
│                                          │
│  Layer 5 — Diagnosis Engine              │
│    Anomaly score & confidence            │
│    Fault type classification             │
│    SHAP feature attribution              │
│    Human-readable explanation            │
│    Sensor health index                   │
└────────────────┬─────────────────────────┘
                 │
     ┌───────────┴───────────┐
     ▼                       ▼
┌──────────────┐    ┌─────────────────┐
│ Raw + Flagged │    │   Dashboard     │
│ Data Store    │    │  Alerts/Trends  │
│ (never        │    │  Health/XAI     │
│  overwritten) │    │  Station Map    │
└──────────────┘    └─────────────────┘
```

### Why This Architecture is Defensible

This mirrors how **real meteorological QC systems** are structured. The WMO (World Meteorological Organization) and national met services already use layered QC with physical limits → step checks → persistence → internal consistency → spatial consistency. Our innovation is:

> **Traditional meteorological QC + temporal ML + multivariate reasoning + edge intelligence + explainable diagnosis**

Not: *"We use lots of different AI models."*

---

## 2. Key Corrections Applied (From Review)

### ❌ Removed / Rewritten

| Original Claim | Action | Reason |
|---|---|---|
| "Quantized model < 50 KB" | ❌ Removed | Unmeasured assumption |
| "No existing solution combines…" | ❌ Removed | Unverifiable broad claim |
| "Most solutions don't have edge intelligence" | ❌ Removed | Unverifiable broad claim |
| "T rises → RH must decrease" | ❌ **Rewritten** | Oversimplified; RH depends on both T and actual moisture content |
| "Pressure-temperature relationship" as hard rule | ❌ **Rewritten** | No simple local equation at fixed station every 5 min |
| "LSTM on ESP32" as core | ❌ **Downgraded** | Operator compatibility issues; deployment risk too high |
| "Sensor will fail in X days" | ❌ **Replaced** | Use Health Index + degradation risk, not specific predictions |
| "Self-healing pipeline" | ⚠️ **Renamed** | → "Self-Healing Data Quality Pipeline" (data, not sensor) |
| Calibration error as separate class | ⚠️ **Merged** | Into drift/bias degradation |
| Mandatory imputation | ⚠️ **Made optional** | Preserves raw + flagged data; wrong imputation is worse than flagging |
| "24-48 readings = 6-24 hours" | ❌ **Corrected** | Math was wrong; now configurable temporal window |
| "Existing solutions for temperate climates" | ❌ **Rewritten** | → "Station-specific and seasonal baselines for Indian diversity" |

### ✅ Kept & Strengthened

- ESP32 + BME280 physical prototype
- Real-time streaming pipeline
- Spike, frozen, drift detection
- LSTM Autoencoder for temporal patterns
- Isolation Forest on **engineered features** (not raw sequences)
- Physics consistency via **derived quantities** (dew point, saturation VP)
- Confidence scores + root-cause classification
- SHAP explainability + human-readable diagnosis
- Sensor Health Index (not predictive maintenance claims)
- Anomaly injection simulator for evaluation
- Optional second station for spatial demo
- Dashboard with real-time visualization

---

## 3. Corrected Physics Engine

### Old Approach (Removed)
```
❌ "Temperature rises → RH should decrease"
❌ "Clausius-Clapeyron as main anomaly detector"
❌ "Pressure must fall when temperature rises"
```

### New Approach: Derived Quantity Consistency

The physics engine answers: **"Is this combination physically plausible?"**

#### Derived Quantities We Compute

| Derived Variable | Formula | Purpose |
|---|---|---|
| **Dew Point Temperature** | `Td = T - (100 - RH)/5` (Magnus approx.) | Must be ≤ T; if Td > T → impossible → fault |
| **Saturation Vapor Pressure** | `es = 6.1078 × 10^(7.5T / (237.3+T))` | From Clausius-Clapeyron (as a feature, not a rule) |
| **Actual Vapor Pressure** | `e = es × (RH/100)` | Moisture content indicator |
| **Vapor Pressure Deficit** | `VPD = es - e` | Combined T+RH health metric |
| **Absolute Humidity** | `AH = (e × 2.16679) / (T + 273.15)` | g/m³, invariant to T changes alone |

#### Consistency Checks (Soft Scores, Not Hard Rules)

| Check | Logic | Score Output |
|---|---|---|
| Dew point sanity | `Td ≤ T` always | 0 = pass, 1 = impossible violation |
| RH range | `0 ≤ RH ≤ 100` | 0 = pass, 1 = impossible |
| Absolute humidity stability | If T changes but AH changes proportionally in wrong direction | 0–1 consistency score |
| Pressure rate of change | Compare ΔP/Δt against statistical baseline for station | 0–1 plausibility score |
| Cross-variable coherence | T, RH, P together fed to multivariate model | 0–1 anomaly score |

> [!NOTE]
> Clausius-Clapeyron is used to **compute derived features**, not as a detection rule. These features feed into the ML model and diagnosis engine.

---

## 4. Corrected ML Models

### Model 1: LSTM Autoencoder (Temporal Anomaly Detection)

- **Runs on**: Server/laptop (NOT ESP32)
- **Input**: Configurable temporal window of [T, RH, P, ΔT, ΔRH, ΔP, dew_point, VPD, hour_sin, hour_cos, month_sin, month_cos]
- **Window size**: Configurable — we experiment with 1h / 6h / 12h / 24h windows based on sampling interval and pick best validation result
- **Output**: Reconstruction error → anomaly score
- **Detects**: Gradual drift, unusual temporal patterns, regime changes
- **Research support**: Met Éireann 2026 study showed LSTM-AE best at capturing temporal patterns in meteorological QC

### Model 2: Isolation Forest (Feature-Based Anomaly Detection)

- **Runs on**: Server/laptop
- **Input**: Engineered features (NOT raw time-series):
  ```
  temperature, pressure, humidity,
  ΔT, ΔP, ΔRH,                        # rate of change
  rolling_mean_T, rolling_std_T,        # short-term stats
  rolling_mean_P, rolling_std_P,
  rolling_mean_RH, rolling_std_RH,
  dew_point, VPD, consistency_score,    # derived physics
  hour_sin, hour_cos, month_sin, month_cos  # context
  ```
- **Role**: Complementary detector; good at finding multivariate outliers in feature space
- **Limitation acknowledged**: Does not understand sequential order; hence used on pre-computed features

### Model 3: Root-Cause Classifier

- **Input**: Anomaly features (from Models 1+2 + physics scores)
- **Output**: Fault type + confidence
- **Method**: Random Forest or Gradient Boosting classifier trained on labeled synthetic anomalies
- **Enables**: Actionable diagnosis, not just "anomaly detected"

### Edge Model (ESP32)

- **Scope**: Lightweight statistical QC only
- Simple rate-of-change checks
- Rolling mean/std deviation
- Persistence counter (frozen detection)
- Range plausibility
- **NOT an LSTM** — reliable, fast, tiny memory footprint

---

## 5. Corrected Anomaly Taxonomy (6 Classes)

| # | Fault Class | Description | Detection Method |
|---|---|---|---|
| 1 | **Spike / Transient** | Sudden jump that returns to normal | Rate-of-change threshold + LSTM |
| 2 | **Frozen / Stuck** | Same value repeated for extended period | Persistence counter + variance monitor |
| 3 | **Drift / Bias** | Gradual shift from expected range (includes calibration degradation) | Trend analysis + LSTM |
| 4 | **Communication / Data Integrity** | Missing data, NaN, duplicate timestamps, corrupted values | Pattern detection + data checks |
| 5 | **Multivariate Inconsistency** | Values that violate physical relationships | Physics engine + cross-variable model |
| 6 | **Range / Plausibility Violation** | Values outside physically possible limits | Hard range checks |

> [!NOTE]
> "Calibration degradation" is handled within the **drift/bias** class and the **sensor health index** — not as a separate fault type. This avoids the ambiguity a judge might challenge: *"How do you distinguish drift from calibration?"*

---

## 6. Corrected Sensor Health System

### What We DON'T Claim
```
❌ "Sensor will fail in 17 days"
❌ "Predictive maintenance with precise timeline"
```

### What We DO Demonstrate

**Sensor Health Index (0–100)**:

```
Health Score
100 ─────────────── Healthy
 90 ────────────── Minor concerns
 80 ───────────── Degrading
 70 ──────────── Needs inspection
 60 ─────────── At risk
 50 ────────── Critical
```

**Computed from**:
- Anomaly frequency (rolling count of anomalies per time window)
- Drift magnitude (cumulative offset from learned baseline)
- Persistence episodes (how often sensor freezes)
- Consistency score (physics violations frequency)
- Missing data rate
- Recovery behavior (does sensor recover after anomalies?)

**We say**: *"The system identifies increasing degradation risk and recommends inspection."*

That's defensible. With enough historical data, this can evolve toward predictive maintenance — but we don't claim that in the prototype.

---

## 7. Corrected Explainability System

### Two-Level Explainability

**Level 1 — ML Feature Attribution (SHAP)**
```
Temperature trend    ████████████░░  +0.42
Humidity incons.     ████████░░░░░░  +0.18
Rate of change       ██████░░░░░░░░  +0.14
Pressure deviation   ███░░░░░░░░░░░  +0.06
Seasonal baseline    ██░░░░░░░░░░░░  +0.03
```

**Level 2 — Human-Readable Diagnosis**
```
⚠️ LIKELY SENSOR DRIFT

Temperature has deviated +2.3°C from its learned baseline 
for 9 consecutive observations over the past 45 minutes.

• Pressure and humidity readings remain within normal range
• Dew point calculation shows physical inconsistency
• Neighboring station (if available) shows no similar trend

Confidence: 87%
Recommended Action: Schedule sensor inspection
```

> SHAP explains the model. The rule-based natural language explains the diagnosis. Both are needed for judges AND for real operators.

---

## 8. Corrected Demo Scenarios

### Demo A: Genuine Weather Event (MUST NOT falsely alert)
```
Temperature:  32 → 34 → 36 → 37°C (gradual rise)
Humidity:     Changes consistently with temperature
Dew point:    Stable (absolute moisture unchanged)
Pressure:     Normal diurnal variation

→ System output: ✅ NORMAL — Consistent atmospheric heating pattern
```

### Demo B: Sensor Fault (MUST correctly detect)
```
Temperature:  32 → 33 → 55 → 34°C (sudden spike)
Humidity:     No corresponding change
Dew point:    Physically inconsistent
Pressure:     Stable (no weather event signature)

→ System output: 🔴 SPIKE ANOMALY
  Confidence: 94%
  Root cause: Temperature sensor transient fault
  Explanation: 22°C jump in 5 min with no humidity/pressure 
  response. Neighboring station normal.
```

### Demo C: Gradual Drift (Subtle detection)
```
Temperature:  Baseline ~30°C
Drift:        +0.2, +0.5, +0.8, +1.1, +1.4°C over hours

→ System output: ⚠️ DRIFT DETECTED
  Health Index: 72 → 68 → 63 (declining)
  Action: Recommend calibration check
```

### Demo D: Physical Inconsistency
```
Temperature:  42°C
Humidity:     98% (suspiciously high for 42°C)
Dew point:    41.6°C (unusual but physically borderline)

→ System output: ⚠️ MULTIVARIATE INCONSISTENCY
  Confidence: 78%
  Explanation: T=42°C with RH=98% implies near-saturation 
  at extreme heat. Rare but not impossible. Flagged for review.
```

> [!IMPORTANT]
> Demo A (NO false alarm on real weather) is the most critical demo. The PS explicitly requires distinguishing genuine events from faults while minimizing false alarms.

---

## 9. Corrected Evaluation Strategy

### Metrics (Not Just Accuracy)

| Metric | What It Measures | Why It Matters |
|---|---|---|
| **Precision** | Of all flagged anomalies, how many were real faults? | False alarm rate |
| **Recall / Sensitivity** | Of all real faults, how many did we catch? | Detection rate |
| **F1-Score** | Harmonic mean of precision & recall | Balanced performance |
| **False Positive Rate** | Normal weather incorrectly flagged | Critical for PS requirement |
| **False Negative Rate** | Faults missed entirely | Safety concern |
| **Detection Latency** | How fast after anomaly onset | Real-time capability |

### Test Matrix

| Scenario | Expected Result | Tests |
|---|---|---|
| Normal weather (various conditions) | ✅ No alert | Must pass |
| Legitimate temperature rise/drop | ✅ No fault alert | **Critical** |
| Sudden sensor spike | 🔴 Spike fault | Must detect |
| Flatline sensor | 🔴 Frozen fault | Must detect |
| Gradual bias/drift | ⚠️ Drift + health decline | Must detect |
| Missing packets / NaN values | 🔴 Communication fault | Must detect |
| Corrupted values | 🔴 Data integrity fault | Must detect |
| Impossible range (e.g., T = -80°C) | 🔴 Plausibility violation | Must detect |
| T+RH physically inconsistent | ⚠️ Multivariate flag | Must detect |
| **Extreme but genuine weather event** | ✅ **Must NOT be rejected** | **Most critical test** |

> [!WARNING]
> A model that says "everything is normal" could achieve 99.5% accuracy (since 99.5% of data IS normal). That's useless. We report precision, recall, and F1 — not just accuracy.

---

## 10. Spatial Consistency — Clarified

### The Input Restriction
The PS says use only: **Temperature, Pressure, Humidity**.
But the PS example mentions comparing with neighboring stations.

### Our Approach
- We still use **only the 3 permitted variables**
- We simply obtain them from **multiple stations**
- The system works with:
  - **One station → definitely** (core functionality)
  - **Multiple stations → optionally** (enhanced spatial checking)
- No dependency on having neighboring data

### Second BME280 Demo
```
Node A: ESP32 + BME280  ──┐
                           ├──→ SkyGuard AI
Node B: ESP32 + BME280  ──┘

Inject fault in Node A:
  A: 30 → 31 → 32 → 48 → 33
  B: 30 → 31 → 32 → 33 → 33

→ "Station A anomaly likely sensor-induced"
```

---

## 11. Data Preservation Policy

```
  Raw observation
       ↓
  Quality flag (PASS / SUSPECT / FAIL)
       ↓
  Anomaly diagnosis (fault type, confidence)
       ↓
  Optional estimated/corrected value
       ↓
  ALL RETAINED — original NEVER overwritten
```

This aligns with established meteorological QC practice where raw, flagged, and corrected datasets are maintained separately.

> [!NOTE]
> Imputation is optional and always secondary to detection → diagnosis → explanation. Incorrect imputation is worse than leaving a value flagged.

---

## 12. Datasets — Where to Get Them

### 📊 Primary: Synthetic Data with Injected Anomalies (WE BUILD THIS)

This is our **primary evaluation dataset**. The PS itself supports anomaly injection — *"To be evaluated in anomaly injected data"*.

**We will build a data generator** that:
1. Creates realistic Indian weather patterns (diurnal cycles, seasonal variation, monsoon patterns)
2. Programmatically injects each of our 6 anomaly types with known labels
3. Produces ground-truth labels for precise metric calculation

**Why this is PREFERRED:**
- Exact ground-truth labels (we know exactly where anomalies are)
- Controllable difficulty (subtle vs. obvious anomalies)
- Reproducible experiments
- Can test edge cases (extreme weather that's NOT an anomaly)

---

### 📊 Secondary: Real Historical Weather Data (FOR TRAINING NORMAL PATTERNS)

We need real weather data to train the models on what "normal" looks like for Indian cities.

#### Source 1: Open-Meteo Historical Weather API ⭐ BEST SOURCE
- **URL**: https://open-meteo.com/en/docs/historical-weather-api
- **What it offers**: Hourly weather data from 1940 onwards for ANY location on Earth
- **Variables available**: Temperature (2m), Relative Humidity (2m), Surface Pressure — ALL THREE we need
- **Resolution**: 0.1° (ERA5-Land) or 0.25° (ERA5), 9km from 2017+
- **Cost**: 🟢 **FREE** for non-commercial use (perfect for SIH)
- **Format**: JSON via REST API
- **How to get it**: I will build a Python downloader script that fetches data for multiple Indian cities

**Example API call** (I'll automate this):
```
https://archive-api.open-meteo.com/v1/archive?
  latitude=28.6139&longitude=77.2090
  &start_date=2023-01-01&end_date=2023-12-31
  &hourly=temperature_2m,relative_humidity_2m,surface_pressure
  &timezone=Asia/Kolkata
```

#### Source 2: NOAA Integrated Surface Database (ISD)
- **URL**: https://www.ncei.noaa.gov/products/land-based-station/integrated-surface-database
- **What it offers**: Global hourly and synoptic observations from 35,000+ stations
- **Includes Indian stations**: Yes, many IMD stations are in ISD
- **Variables**: Temperature, dew point, pressure, humidity-related
- **Cost**: 🟢 **FREE**
- **Format**: ASCII fixed-width or CSV
- **How to get it**: Download from NOAA CDO or I can write a script

#### Source 3: data.gov.in (IMD Official)
- **URL**: https://data.gov.in
- **What**: Official Government of India open data portal
- **Availability**: Variable; some IMD datasets available but coverage can be inconsistent
- **Cost**: 🟢 **FREE**
- **Action**: Search for "weather" or "temperature" datasets; download if available

#### Source 4: Kaggle Datasets (Supplementary)
- Search for: "weather station data", "IoT sensor anomaly", "temperature time series"
- Useful as additional training/validation data
- **Cost**: 🟢 **FREE**

---

### 📊 Tertiary: Live ESP32 Sensor Data (FOR DEMO)

- Real-time data from our BME280 sensor
- Demonstrates the complete pipeline from sensor → edge → server → dashboard
- Anomalies created by physically manipulating the sensor (cover with hand, blow on it, etc.)

---

### Data Strategy Summary

| Data Type | Source | Purpose | Action Required |
|---|---|---|---|
| Synthetic + anomalies | **We build generator** | Evaluation, testing, metrics | I'll code it |
| Real Indian weather | **Open-Meteo API** | Training normal patterns | I'll build downloader; **you need internet** |
| Real global weather | **NOAA ISD** | Additional training data | I'll build parser; **you download files** |
| IMD official | **data.gov.in** | If available, authentic Indian data | **You check & download** |
| Live sensor | **ESP32 + BME280** | Live demo | **You buy hardware** |

> [!TIP]
> **Open-Meteo is our hero data source.** Free, instant API access, all 3 variables, any Indian city, hourly resolution, decades of history. I will build an automated downloader for cities spanning India's climate zones: Delhi, Mumbai, Chennai, Jaisalmer, Shimla, Cherrapunji, Bengaluru, Guwahati.

---

## 13. Hardware — What You Need to Buy

### 🔴 MUST BUY

| Item | Qty | Cost (INR) | Where to Buy | Notes |
|---|---|---|---|---|
| **ESP32 DevKit V1** | 1 | ₹400-500 | Robu.in, Amazon.in, Electronicscomp | Any ESP32 with WiFi works |
| **BME280 Sensor Module** | 1 | ₹250-350 | Robu.in, Amazon.in | I2C module; gives T+P+RH in one chip |
| **Breadboard (400-point)** | 1 | ₹50-80 | Any electronics shop | For prototyping connections |
| **Jumper Wires (M-M, M-F)** | 1 set | ₹50-80 | Any electronics shop | ~20 wires enough |
| **Micro USB Cable** | 1 | ₹100 | Probably already have | For ESP32 programming + power |

**Subtotal: ~₹850 – ₹1,100**

### 🟡 RECOMMENDED

| Item | Qty | Cost (INR) | Why |
|---|---|---|---|
| **0.96" OLED Display (SSD1306 I2C)** | 1 | ₹200-250 | Show readings + anomaly status directly on device — impressive for judges |
| **Second BME280** | 1 | ₹250-350 | Demonstrate "neighboring station" spatial consistency |

**With recommended: ~₹1,300 – ₹1,700**

### BME280 — Why It's Perfect

We use BME280 as a **compact prototype sensor node** to reproduce the three required AWS variables. We do NOT claim it's the same sensor used in professional IMD stations.

| Parameter | BME280 Spec | AWS Relevance |
|---|---|---|
| Temperature | ±1°C accuracy, -40 to +85°C | ✅ Covers full Indian range |
| Pressure | ±1 hPa, 300–1100 hPa | ✅ Covers all altitudes |
| Humidity | ±3% RH, 0–100% | ✅ Full range |
| Interface | I2C / SPI | ✅ Easy ESP32 connection |

### Wiring (ESP32 ↔ BME280 ↔ OLED)

```
ESP32          BME280         OLED SSD1306
─────          ──────         ────────────
3.3V    ──→    VIN            VCC
GND     ──→    GND            GND
GPIO 21 ──→    SDA  ←─────→  SDA    (shared I2C)
GPIO 22 ──→    SCL  ←─────→  SCL    (shared I2C)
```

Both BME280 and OLED use I2C (different addresses), so they share the same two data wires. Very clean, minimal wiring.

---

## 14. Software Requirements

### Python Environment
```
# Core ML
tensorflow>=2.12        # LSTM Autoencoder
scikit-learn>=1.3       # Isolation Forest, Random Forest
shap>=0.42              # Explainability

# Data
pandas>=2.0             # Data manipulation
numpy>=1.24             # Numerical computing

# API & Backend
fastapi>=0.100          # REST API + WebSocket
uvicorn>=0.23           # ASGI server
websockets>=11.0        # Real-time streaming
pydantic>=2.0           # Data validation

# Visualization
plotly>=5.15             # Interactive charts (for dashboard data)
matplotlib>=3.7         # Static plots for SHAP

# Utilities
pyserial>=3.5           # Read ESP32 serial data
requests>=2.31          # Download data from APIs
joblib>=1.3             # Model serialization
```

### Arduino IDE Libraries
```
Adafruit_BME280         # BME280 driver
Adafruit_SSD1306        # OLED display driver
Wire                    # I2C (built-in)
WiFi                    # WiFi (built-in for ESP32)
HTTPClient              # HTTP POST to server (built-in)
ArduinoJson             # JSON serialization
```

### Frontend
```
HTML + CSS + JavaScript  # Core
Chart.js or Plotly.js    # Real-time charts
Leaflet.js               # India map with station markers
Socket.IO client         # WebSocket for real-time updates
```

---

## 15. Build Order (Risk-Managed)

> [!IMPORTANT]
> Build in this order. Each step produces a working system. The high-risk ML components come AFTER you have a functioning data pipeline.

```
Phase 1: Foundation (Hours 0-6)
├── Working ESP32 + BME280 sensor node
├── WiFi data streaming to laptop
├── Synthetic data generator with anomaly injection
└── Basic data visualization

Phase 2: Core QC (Hours 6-12)
├── Data integrity checks (Layer 0)
├── Statistical QC: spike, frozen, range (Layer 1)
├── Physics consistency engine (Layer 3)
└── Basic anomaly flagging working end-to-end

Phase 3: ML Models (Hours 12-20)
├── LSTM Autoencoder training on normal data
├── Isolation Forest on engineered features
├── Root-cause classifier
└── Ensemble scoring

Phase 4: Intelligence (Hours 20-28)
├── SHAP integration
├── Human-readable explanations
├── Sensor Health Index
├── Context engine (time/season)
└── Optional spatial comparison (if 2nd BME280)

Phase 5: Dashboard & Polish (Hours 28-36)
├── Real-time web dashboard
├── Alert feed with explanations
├── Sensor health panel
├── Evaluation metrics display
├── Demo preparation
└── Documentation
```

---

## 16. Our True Innovation Pitch

### What We Say to Judges

> *"SkyGuard AI combines conventional meteorological quality control with temporal machine learning and contextual reasoning to determine whether an unusual observation is a faulty sensor or a genuine atmospheric event."*

### Our Distinguishing Design Choices

1. **Hybrid edge-cloud architecture** — edge QC on ESP32 for fast local detection + deep analysis on server
2. **Physics-informed feature engineering** — derived atmospheric quantities (dew point, saturation VP, VPD) as model features, grounded in atmospheric physics
3. **6-class fault taxonomy** — actionable root-cause classification, not just "anomaly/normal"
4. **Two-level explainability** — SHAP for model transparency + natural language for operator understanding
5. **Sensor Health Index** — tracks degradation trajectory, recommends inspection when risk increases
6. **Self-healing data quality pipeline** — quarantines anomalous data, optionally estimates corrected values, never overwrites raw observations
7. **Station-specific and seasonal baselines** — designed for India's climatic diversity from deserts to mountains to coasts

---

## 17. What You Need to Do Right Now

### ✅ Hardware (Buy This Week)
- [ ] Order ESP32 DevKit V1
- [ ] Order BME280 sensor module
- [ ] Order breadboard + jumper wires
- [ ] Order OLED SSD1306 display (recommended)
- [ ] Order second BME280 (recommended)
- [ ] Ensure you have a Micro USB cable

### ✅ Software (Install Now)
- [ ] Python 3.9+ installed
- [ ] Arduino IDE 2.x installed
- [ ] Node.js 18+ installed
- [ ] VS Code installed
- [ ] Git installed

### ✅ Data (I Can Help Build)
- [ ] I'll build the Open-Meteo data downloader
- [ ] I'll build the synthetic data generator with anomaly injection
- [ ] You check data.gov.in for IMD datasets
- [ ] You need internet access for API data downloads

### ✅ Knowledge Prep
- [ ] Understand LSTM Autoencoder concept
- [ ] Understand SHAP basics
- [ ] Understand BME280 I2C wiring
- [ ] Review anomaly types and detection logic

---

## Open Questions

> [!IMPORTANT]
> **Q1:** Do you already have any of the hardware (ESP32, BME280, breadboard)?

> [!IMPORTANT]
> **Q2:** How many team members do you have, and what are their primary skills (ML, backend, frontend, hardware)?

> [!IMPORTANT]
> **Q3:** Do you have a specific timeline — when is the hackathon? This affects what we build first vs. skip.

> [!IMPORTANT]
> **Q4:** Do you want to build the dashboard with plain HTML+CSS+JS (simpler, faster) or a framework like React/Next.js (more polished but more setup)?
