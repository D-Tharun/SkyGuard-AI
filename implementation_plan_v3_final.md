# SkyGuard AI — Final Implementation Plan (v3.0 — FROZEN)
## SIH PS 26073: AI/ML-Based Intelligent Anomaly Detection for AWS

> [!IMPORTANT]
> **This is the final, frozen plan.** It incorporates all corrections from both review rounds (38 total points). Every technical claim is defensible to SIH judges. No further architectural changes unless a fundamental blocker is discovered during build.

---

## Central Technical Theme

> **The difficult problem is not detecting unusual weather. It is deciding whether an unusual observation is caused by the atmosphere or by the sensor.**

This is the core story of SkyGuard AI. Everything in our architecture serves this single question.

**Our signature metric**: False Positive Rate during genuine weather events — *"We catch injected sensor faults while preserving legitimate extreme weather transitions."*

---

## 1. Architecture

```
┌─────────────────────────────┐
│       BME280 Sensor(s)       │
│     T / RH / Pressure        │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│         ESP32 Edge           │
│  ● Data integrity check      │
│  ● Range plausibility        │
│  ● Spike / rate-of-change    │
│  ● Frozen / flatline         │
│  ● Lightweight stats QC      │
│  ● Edge flag (pass/suspect)  │
└─────────────┬───────────────┘
              │ Wi-Fi
              ▼
┌─────────────────────────────────────────────┐
│       SkyGuard QC Engine (Server)           │
│                                             │
│  Layer 0 — Data Integrity                   │
│    Missing packets, duplicate timestamps    │
│    NaN/corrupted values, range checks       │
│                                             │
│  Layer 1 — Fast Sensor QC                   │
│    Spike/rate-of-change detection           │
│    Frozen/flatline (persistence check)      │
│    Short-term statistical checks            │
│                                             │
│  Layer 2 — ML Anomaly Engine                │
│    Temporal model (LSTM Autoencoder)        │
│    Multivariate model (Isolation Forest     │
│    on engineered features)                  │
│                                             │
│  Layer 3 — Physics Consistency              │
│    T + RH → derived quantities              │
│    (dew point, saturation vapor pressure,   │
│     actual vapor pressure, VPD)             │
│    Pressure temporal plausibility           │
│    Multivariate consistency scoring         │
│                                             │
│  Layer 4 — Context Engine                   │
│    Time-of-day / season / station baseline  │
│    Optional neighboring-station compare     │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │    ★ ANOMALY FUSION SCORE ★         │    │
│  │                                     │    │
│  │  Edge QC score                      │    │
│  │  + Temporal ML score (LSTM-AE)      │    │
│  │  + Multivariate ML score (IF)       │    │
│  │  + Physics consistency score        │    │
│  │  + Context plausibility score       │    │
│  │  + (Optional) Spatial score         │    │
│  │           ↓                         │    │
│  │     Weighted Fusion                 │    │
│  │           ↓                         │    │
│  │  Unified Anomaly Score (0–1)        │    │
│  └─────────────────────────────────────┘    │
│                    │                         │
│                    ▼                         │
│  Layer 5 — Diagnosis Engine                 │
│    Fault type classification                │
│    Confidence score                         │
│    SHAP feature attribution                 │
│    Human-readable explanation               │
│    Sensor Health Index                      │
└──────────────────┬──────────────────────────┘
                   │
       ┌───────────┴───────────┐
       ▼                       ▼
┌──────────────┐      ┌─────────────────┐
│ Raw + Flagged │      │   Dashboard     │
│ Data Store    │      │  Alerts/Trends  │
│ (original     │      │  Health/XAI     │
│  NEVER        │      │  Station Map    │
│  overwritten) │      │  Fusion Detail  │
└──────────────┘      └─────────────────┘
```

### Why This Architecture is Defensible

This mirrors how **real meteorological QC systems** are structured. The WMO and national met services use layered QC: physical limits → step checks → persistence → internal consistency → spatial consistency. Our innovation is:

> **Traditional meteorological QC + temporal ML + multivariate reasoning + edge intelligence + anomaly fusion + explainable diagnosis**

Not: *"We use lots of different AI models."*

---

## 2. The Anomaly Fusion Score — Mathematical Heart of SkyGuard

This is the **most important new component**. It is how SkyGuard makes its final decision.

### Why Fusion Matters

A judge will ask: *"Why does your system decide this is a sensor fault?"*

Our answer: **The decision doesn't come from one arbitrary threshold. Multiple independent signals agree.**

### How It Works

Each detection layer produces an independent score in [0, 1]:

| Signal | Source | What It Captures |
|---|---|---|
| `S_edge` | ESP32 edge QC | Range, rate-of-change, persistence flags |
| `S_temporal` | LSTM Autoencoder | Temporal reconstruction error |
| `S_multivariate` | Isolation Forest | Multivariate outlier score in feature space |
| `S_physics` | Physics engine | Derived-quantity consistency violations |
| `S_context` | Context engine | Deviation from time/season/station baseline |
| `S_spatial` | Neighboring station (optional) | Cross-station divergence |

### Fusion Formula

```
Anomaly_Score = w₁·S_edge + w₂·S_temporal + w₃·S_multivariate 
             + w₄·S_physics + w₅·S_context + w₆·S_spatial

where Σwᵢ = 1.0
```

**Initial weights** (tuned during development):

| Weight | Value | Rationale |
|---|---|---|
| w₁ (edge) | 0.10 | Coarse first-pass check |
| w₂ (temporal) | 0.30 | Strongest ML signal |
| w₃ (multivariate) | 0.20 | Complementary feature-space view |
| w₄ (physics) | 0.20 | Hard physical constraints |
| w₅ (context) | 0.15 | Seasonal/diurnal expectations |
| w₆ (spatial) | 0.05 | Optional; 0 if no neighbor data |

**Decision thresholds** (tuned on validation set):

| Score Range | Verdict | Action |
|---|---|---|
| 0.0 – 0.3 | ✅ PASS | No action |
| 0.3 – 0.6 | ⚠️ SUSPECT | Flag for review |
| 0.6 – 1.0 | 🔴 FAIL | Alert + diagnosis |

### Why This Is Strong

- **No single point of failure**: One confused model can't cause a false alarm alone
- **Explainable decisions**: We can show judges exactly which signals contributed
- **Tunable**: Weights can be adjusted per station, season, or deployment
- **Confidence = agreement**: When 4/5 signals agree → high confidence; when only 1 signal fires → low confidence → SUSPECT not FAIL

---

## 3. Physics Engine — Corrected

The physics engine answers: **"Is this combination physically plausible?"**

### Derived Quantities

| Derived Variable | Formula | Purpose |
|---|---|---|
| **Dew Point Temperature** | Simplified approximation: `Td ≈ T - (100 - RH)/5` | Quick estimate; must be ≤ T |
| **Dew Point (Magnus formula, preferred)** | `α = (a·T)/(b+T) + ln(RH/100)` then `Td = (b·α)/(a-α)` where a=17.27, b=237.7 | Accurate logarithmic calculation |
| **Saturation Vapor Pressure** | `es = 6.1078 × 10^(7.5·T / (237.3+T))` hPa | Clausius-Clapeyron as computed feature |
| **Actual Vapor Pressure** | `e = es × (RH/100)` | Current moisture content |
| **Vapor Pressure Deficit** | `VPD = es - e` | Combined T+RH health metric |
| **Absolute Humidity** | `AH = (e × 2.16679) / (T + 273.15)` g/m³ | Temperature-normalized measure of atmospheric moisture that complements RH |

> [!NOTE]
> **Implementation note**: We implement the **full Magnus formula** for dew point (`Td = (b·α)/(a-α)`), not the simplified linear approximation. The simplified version is documented for reference only. This matters because we present the physics engine to judges.

> [!NOTE]
> Clausius-Clapeyron is used to **compute derived features**, not as a detection rule. These features feed into the fusion scoring and diagnosis engine.

### Consistency Checks (Soft Scores, Not Hard Rules)

| Check | Logic | Score Output |
|---|---|---|
| Dew point sanity | `Td ≤ T` always; if violated → physically impossible | 0 = pass, 1 = violation |
| RH range | `0 ≤ RH ≤ 100` | 0 = pass, 1 = impossible |
| Moisture coherence | Compare temporal changes in absolute humidity vs temperature — do they follow a plausible atmospheric process? | 0–1 consistency score |
| Pressure rate of change | Compare ΔP/Δt against statistical baseline for station | 0–1 plausibility score |
| Cross-variable coherence | T, RH, P and derived quantities fed to multivariate model | 0–1 anomaly score |

These five checks are combined into a single **`S_physics` score** that feeds into the Anomaly Fusion.

---

## 4. ML Models — Final Specification

### Model 1: LSTM Autoencoder (Temporal Anomaly Detection)

- **Runs on**: Server/laptop (NOT ESP32)
- **Input features**: `[T, RH, P, ΔT, ΔRH, ΔP, dew_point, VPD, hour_sin, hour_cos, month_sin, month_cos]`
- **Window size**: Treated as an **experimental hyperparameter**
  - Initial experiment range: 1h / 6h / 12h / 24h
  - Extended range to test: 48h / 72h (1-3 day contexts)
  - Select the window that minimizes false positives while retaining anomaly sensitivity on validation set
  - Recent Met Éireann research (2026) tested 1–3 day sequences and found longer contexts useful for reducing false positives
- **Output**: Reconstruction error → `S_temporal` score
- **Detects**: Gradual drift, unusual temporal patterns, regime changes
- **Research result we can report**: *"We empirically selected the temporal context that minimized false alarms while retaining anomaly sensitivity."*

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
- **Output**: Isolation score → `S_multivariate` score
- **Role**: Complementary detector for multivariate outliers in feature space
- **Limitation acknowledged**: Does not understand sequential order; hence used on pre-computed features, not raw sequences

### Model 3: Root-Cause Classifier

- **Input**: Anomaly features from Models 1+2 + physics scores + fusion score
- **Output**: Fault type (1 of 6 classes) + confidence
- **Method**: Random Forest or Gradient Boosting
- **Critical training requirement**: Trained on faults injected into **real historical weather data** (not purely synthetic weather patterns), with significant **variability per fault type**:

  | Fault Type | Required Variability in Training Data |
  |---|---|
  | Spike | Different amplitudes (2°C to 25°C), durations (1 to 5 readings), recovery curves (sharp, gradual), affected variables (T only, RH only, both) |
  | Frozen | Exact constant, quantized constant, slowly changing but abnormally persistent, different durations (10 min to 6 hours) |
  | Drift | Linear, nonlinear (exponential), intermittent, slow (0.1°C/hr) vs fast (1°C/hr), positive vs negative |
  | Communication | Random missing, burst missing, periodic gaps, partial corruption |
  | Multivariate | T anomalous but P/RH normal, RH anomalous but T/P normal, physically impossible combinations |
  | Range | Just outside range, far outside range, alternating valid/invalid |

### Edge Model (ESP32)

- **Scope**: Lightweight statistical QC only
  - Simple rate-of-change checks
  - Rolling mean/std deviation
  - Persistence counter (frozen detection)
  - Range plausibility (hard physical limits)
- **Output**: `S_edge` score (0 or 1 for each check, combined)
- **NOT an LSTM** — reliable, fast, tiny memory footprint

---

## 5. Anomaly Taxonomy (6 Classes)

| # | Fault Class | Description | Primary Detection |
|---|---|---|---|
| 1 | **Spike / Transient** | Sudden jump that returns to normal | Rate-of-change + LSTM |
| 2 | **Frozen / Stuck** | Same value repeated for extended period | Persistence counter + variance |
| 3 | **Drift / Bias** | Gradual shift from expected range (includes calibration degradation) | Trend analysis + LSTM |
| 4 | **Communication / Data Integrity** | Missing data, NaN, duplicates, corruption | Pattern detection + data checks |
| 5 | **Multivariate Inconsistency** | Values that violate physical relationships | Physics engine + cross-variable model |
| 6 | **Range / Plausibility Violation** | Values outside physically possible limits | Hard range checks |

> [!NOTE]
> "Calibration degradation" is handled within **drift/bias** and the **sensor health index** — not as a separate class. This avoids a judge challenging: *"How do you distinguish drift from calibration?"*

---

## 6. Sensor Health Index

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
- Physics consistency score (violation frequency)
- Missing data rate
- Recovery behavior (does sensor self-recover after anomalies?)

**We say**: *"The system identifies increasing degradation risk and recommends inspection."*

Defensible. With enough historical data, this can evolve toward predictive maintenance — but we don't claim that in the prototype.

---

## 7. Explainability System

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

Fusion Score: 0.74 (FAIL)
  Temporal ML:  0.81  ████████░░
  Physics:      0.72  ███████░░░
  Multivariate: 0.65  ██████░░░░
  Context:      0.58  █████░░░░░
  Edge QC:      0.00  ░░░░░░░░░░

Confidence: 87%
Recommended Action: Schedule sensor inspection
```

> The Fusion Score breakdown is the strongest answer to *"Why did your system decide this?"* — it shows which independent signals agreed.

---

## 8. Demo Scenarios

### Demo A: Genuine Weather Event — MUST NOT Falsely Alert ★ MOST CRITICAL
```
Temperature:   32 → 34 → 36 → 37°C (gradual rise over 2 hours)
Humidity:      Changes consistently with temperature
Dew point:     Stable (atmospheric moisture unchanged)
Abs. humidity: Stable
Pressure:      Normal diurnal variation

Fusion Score:  0.12 (PASS)
  All signals low → No anomaly

→ System output: ✅ NORMAL — Consistent atmospheric heating pattern
```

### Demo B: Sensor Spike Fault — MUST Correctly Detect
```
Temperature:   32 → 33 → 55 → 34°C (sudden spike)
Humidity:      No corresponding change
Dew point:     Physically inconsistent at spike point
Pressure:      Stable

Fusion Score:  0.89 (FAIL)
  Edge QC:      1.0  (rate-of-change exceeded)
  Temporal ML:  0.92 (reconstruction error high)
  Physics:      0.85 (dew point inconsistent)
  Multivariate: 0.78 (outlier in feature space)

→ System output: 🔴 SPIKE ANOMALY
   Confidence: 94%
   Root cause: Temperature sensor transient fault
```

### Demo C: Gradual Drift — Subtle Detection
```
Temperature:   Baseline ~30°C
Over 4 hours:  +0.2, +0.5, +0.8, +1.1, +1.4°C cumulative

Fusion Score:  0.18 → 0.28 → 0.39 → 0.52 → 0.64 (SUSPECT → FAIL)

→ System output: ⚠️ DRIFT DETECTED
   Health Index: 72 → 68 → 63 (declining)
   Action: Recommend calibration check
```

### Demo D: Temporal + Spatial Inconsistency — Better Than Extreme Values
```
Station A:  Temperature drops 8°C in 15 minutes
            Humidity rises sharply
            But pressure shows NO frontal passage signature
            Neighboring Station B shows no change

Fusion Score:  0.71 (FAIL)
  Temporal ML:  0.68 (unusual temporal pattern)
  Physics:      0.55 (borderline but suspicious)
  Spatial:      0.92 (strong disagreement with neighbor)

→ System output: ⚠️ SUSPECTED SENSOR ANOMALY
   Confidence: 81%
   Explanation: Rapid temperature drop with no corresponding 
   pressure change or neighboring station confirmation.
   Individual values are plausible; the temporal and spatial 
   context makes sensor fault more likely than weather.
```

> [!IMPORTANT]
> Demo D demonstrates our central theme: **individually plausible values + abnormal temporal/spatial relationship = likely sensor fault**. This is much stronger than flagging extreme-looking values, which could be genuine weather.

### Demo E: Live Hardware Demo
```
ESP32 + BME280 streaming real-time data to dashboard.
Physically manipulate sensor → system detects and diagnoses.
Show edge flags arriving before server-side analysis completes.
```

---

## 9. Evaluation Strategy

### Signature Metric

> **False Positive Rate during genuine weather events**

This is what separates SkyGuard from simple threshold-based QC. Even a good LSTM can flag legitimate meteorological changes (rainfall, cloud cover, frontal passages). Our fusion system with physics and context layers should reduce this.

### Full Metric Set

| Metric | What It Measures | Why It Matters |
|---|---|---|
| **Precision** | Of all flagged anomalies, how many were real faults? | False alarm quality |
| **Recall / Sensitivity** | Of all real faults, how many did we catch? | Detection completeness |
| **F1-Score** | Harmonic mean of precision & recall | Balanced performance |
| **FPR (Weather Events)** | Normal/extreme weather incorrectly flagged | ★ Signature metric |
| **FNR** | Faults missed entirely | Safety concern |
| **Detection Latency** | Time from anomaly onset to alert | Real-time capability |
| **Per-class F1** | F1 for each of the 6 fault types | Classification quality |

### Test Matrix

| Scenario | Expected Result | Priority |
|---|---|---|
| Normal weather (calm conditions) | ✅ No alert | Must pass |
| Normal weather (active weather: rain, wind, cloud) | ✅ No alert | Must pass |
| Legitimate temperature rise (heatwave pattern) | ✅ No fault alert | **Critical** |
| Legitimate rapid change (frontal passage) | ✅ No fault alert | **Critical** |
| **Extreme but genuine weather event** | ✅ **Must NOT be rejected** | **★ Most critical** |
| Sudden sensor spike | 🔴 Spike fault | Must detect |
| Flatline sensor | 🔴 Frozen fault | Must detect |
| Gradual bias/drift | ⚠️ Drift + health decline | Must detect |
| Missing packets / NaN | 🔴 Communication fault | Must detect |
| Physically impossible combination | 🔴 Multivariate flag | Must detect |
| Impossible range (T = -80°C) | 🔴 Plausibility violation | Must detect |

> [!WARNING]
> A model that says "everything is normal" achieves 99.5% accuracy. That's useless. We report precision, recall, F1, and **especially FPR during weather events**.

---

## 10. Dataset Strategy — Corrected Hierarchy

### Dataset Trust Hierarchy

```
Tier 1 (Strongest):  Real observed station data    → validation
Tier 2 (Strong):     Reanalysis/model data          → training normal patterns
Tier 3 (Controlled): Synthetic anomaly injection    → fault evaluation
Tier 4 (Live):       ESP32 BME280 sensor            → physical demonstration
```

### Tier 1: Real Observed Station Data — NOAA ISD

| Detail | Value |
|---|---|
| **Source** | NOAA Integrated Surface Database (ISD) |
| **URL** | https://www.ncei.noaa.gov/products/land-based-station/integrated-surface-database |
| **What** | Actual hourly observations from 35,000+ stations worldwide, including many Indian IMD stations |
| **Variables** | Temperature, dew point, pressure, wind, visibility |
| **Coverage** | Decades of real observations |
| **Format** | ASCII fixed-width or CSV |
| **Cost** | 🟢 **FREE** |
| **Why Tier 1** | These are **real sensor observations** from physical weather stations — the closest to what IMD AWS produces |
| **Action** | **You download** Indian station files from NOAA CDO; I'll write the parser |

### Tier 1 Alternative: data.gov.in (IMD Official)

| Detail | Value |
|---|---|
| **URL** | https://data.gov.in |
| **What** | Official Indian government open data; some IMD datasets |
| **Availability** | Variable; check for "automatic weather station" or "surface weather" datasets |
| **Cost** | 🟢 **FREE** |
| **Action** | **You search and download** whatever is available |

### Tier 2: Reanalysis Data — Open-Meteo Historical API

| Detail | Value |
|---|---|
| **Source** | Open-Meteo Historical Weather API |
| **URL** | https://open-meteo.com/en/docs/historical-weather-api |
| **What** | Model/reanalysis-derived weather data (ERA5, ERA5-Land) — NOT direct sensor observations |
| **Variables** | Temperature (2m), Relative Humidity (2m), Surface Pressure — all 3 needed |
| **Resolution** | 0.1° (ERA5-Land), hourly, from 1940 onwards |
| **Cost** | 🟢 **FREE** for non-commercial use |
| **Why Tier 2** | Excellent for learning normal weather patterns, but it represents modeled data, not raw sensor output. It won't contain sensor-specific faults |
| **Action** | I'll build automated downloader for Indian cities |

**Example API call**:
```
https://archive-api.open-meteo.com/v1/archive?
  latitude=28.6139&longitude=77.2090
  &start_date=2023-01-01&end_date=2023-12-31
  &hourly=temperature_2m,relative_humidity_2m,surface_pressure
  &timezone=Asia/Kolkata
```

**Cities to download** (spanning India's climate diversity):

| City | Climate Type | Lat/Lon |
|---|---|---|
| Delhi | Semi-arid continental | 28.61, 77.21 |
| Mumbai | Tropical coastal | 19.08, 72.88 |
| Chennai | Tropical wet/dry | 13.08, 80.27 |
| Jaisalmer | Hot desert | 26.91, 70.91 |
| Shimla | Subtropical highland | 31.10, 77.17 |
| Cherrapunji | Extreme rainfall | 25.30, 91.70 |
| Bengaluru | Tropical savanna | 12.97, 77.59 |
| Guwahati | Humid subtropical | 26.14, 91.74 |

### Tier 3: Synthetic Anomaly Injection — WE BUILD THIS

This is our **primary evaluation dataset**. The PS itself supports this: *"To be evaluated in anomaly injected data."*

**Approach**: Take **real weather data (Tier 1 or Tier 2)** as the baseline, then programmatically inject faults with known labels.

> [!IMPORTANT]
> We inject faults into **real weather patterns**, NOT into fully synthetic/generated weather. This makes the evaluation substantially more credible because the "normal" data reflects genuine atmospheric variability.

**Anomaly generator variability specification**:

| Fault Type | Variation Parameters |
|---|---|
| **Spike** | Amplitude: ±2°C to ±25°C; Duration: 1–5 readings; Recovery: sharp, gradual, oscillating; Affected variable: T only, RH only, P only, combinations |
| **Frozen** | Type: exact constant, quantized (sensor resolution steps), slowly drifting but abnormally persistent; Duration: 10 min to 6 hours |
| **Drift** | Shape: linear, exponential, sinusoidal; Rate: 0.1°C/hr to 2°C/hr; Direction: positive, negative; Intermittency: continuous, intermittent |
| **Communication** | Pattern: random missing, burst missing (5–20 consecutive), periodic gaps, partial corruption (one variable only) |
| **Multivariate** | Mode: T anomalous with P/RH normal; RH anomalous with T/P normal; physically impossible combination (Td > T); gradual decorrelation |
| **Range** | Severity: just outside range, far outside range, alternating valid/invalid |

### Tier 4: Live ESP32 BME280 Sensor

- Real-time data for physical demonstration
- Shows complete pipeline from sensor → edge → server → dashboard
- Anomalies via physical manipulation (cover sensor, breathe on it, heat source)

### Data Strategy Summary

| Tier | Source | Purpose | Action |
|---|---|---|---|
| Tier 1 | NOAA ISD / data.gov.in | Real observations → validation | **You download**; I parse |
| Tier 2 | Open-Meteo API | Reanalysis → normal pattern training | I build downloader |
| Tier 3 | Our anomaly injector | Controlled faults → evaluation metrics | I build generator |
| Tier 4 | ESP32 + BME280 | Live physical demo | **You buy hardware** |

---

## 11. Spatial Consistency

### The Input Clarification
The PS uses only **Temperature, Pressure, Humidity** — but the PS's own example mentions comparing with neighboring stations. No contradiction: we use the same 3 variables, obtained from multiple stations.

### Design
- **One station → definitely works** (core functionality)
- **Multiple stations → optionally enhances** (spatial checking)
- No dependency on having neighboring data

### Second BME280 — Strongly Recommended

This is **not merely an optional extra**. It provides one of our most powerful physical demonstrations:

```
Node A: ESP32 + BME280  ──┐
                           ├──→ SkyGuard AI
Node B: ESP32 + BME280  ──┘
      (or Node B on same ESP32 with different I2C address)

Inject fault in Node A only:
  A: 30 → 31 → 32 → 48 → 33
  B: 30 → 31 → 32 → 33 → 33

→ "Station A anomaly likely sensor-induced — 
    neighboring station confirms normal conditions"
```

Judges can see this physically — two real sensors, one corrupted, the system correctly identifies which one.

> [!TIP]
> Two BME280 modules can share the same ESP32 via different I2C addresses (SDO pin to GND = 0x76, SDO to VCC = 0x77). This means you may not even need a second ESP32.

---

## 12. Data Preservation Policy

```
  Raw observation
       ↓
  Quality flag (PASS / SUSPECT / FAIL)
       ↓
  Fusion score breakdown
       ↓
  Anomaly diagnosis (fault type, confidence, explanation)
       ↓
  Optional estimated/corrected value
       ↓
  ALL RETAINED — original NEVER overwritten
```

This prevents the judge question: *"What if your AI makes a wrong correction?"*

Our answer: *"We never destroy the original observation. We retain raw value, quality flag, diagnosis, and treat imputation as a secondary derived value."*

> [!NOTE]
> Imputation is optional and always secondary to detection → diagnosis → explanation. Incorrect imputation is worse than leaving a value flagged.

---

## 13. Hardware — What You Need to Buy

### 🔴 MUST BUY

| Item | Qty | Cost (INR) | Where to Buy | Notes |
|---|---|---|---|---|
| **ESP32 DevKit V1** | 1 | ₹400-500 | Robu.in, Amazon.in, Electronicscomp | Any ESP32 with WiFi |
| **BME280 Sensor Module** | 1 | ₹250-350 | Robu.in, Amazon.in | I2C; T+P+RH in one chip |
| **Breadboard (400-point)** | 1 | ₹50-80 | Any electronics shop | |
| **Jumper Wires (M-M, M-F)** | 1 set | ₹50-80 | Any electronics shop | ~20 wires enough |
| **Micro USB Cable** | 1 | ₹100 | Probably already have | |

**Subtotal: ~₹850 – ₹1,100**

### 🟠 STRONGLY RECOMMENDED

| Item | Qty | Cost (INR) | Why |
|---|---|---|---|
| **Second BME280** | 1 | ₹250-350 | Spatial demo — one of the most powerful judge demonstrations; can share same ESP32 via different I2C address |
| **0.96" OLED Display (SSD1306 I2C)** | 1 | ₹200-250 | Show readings + anomaly status on device |

**With recommended: ~₹1,300 – ₹1,700 total**

### BME280 Framing

We use BME280 as a **compact prototype sensor node** to reproduce the three required AWS variables. We do NOT claim it is the same sensor used in professional IMD AWS stations.

- Bosch-specified humidity accuracy: ±3% RH
- Pressure range: 300–1100 hPa
- Temperature range: -40 to +85°C
- Interface: I2C / SPI

### Wiring

```
ESP32          BME280 #1 (0x76)    BME280 #2 (0x77)    OLED SSD1306
─────          ────────────────    ────────────────     ────────────
3.3V    ──→    VIN                 VIN                  VCC
GND     ──→    GND                 GND                  GND
GPIO 21 ──→    SDA ←──────────→   SDA ←──────────→     SDA  (shared I2C bus)
GPIO 22 ──→    SCL ←──────────→   SCL ←──────────→     SCL  (shared I2C bus)
                SDO → GND           SDO → 3.3V
                (addr 0x76)         (addr 0x77)
```

---

## 14. Software Requirements

### Python
```
# Core ML
tensorflow>=2.12        # LSTM Autoencoder
scikit-learn>=1.3       # Isolation Forest, Random Forest, metrics
shap>=0.42              # Explainability

# Data
pandas>=2.0             # Data manipulation
numpy>=1.24             # Numerical computing

# Backend
fastapi>=0.100          # REST API + WebSocket
uvicorn>=0.23           # ASGI server
websockets>=11.0        # Real-time streaming
pydantic>=2.0           # Data validation

# Visualization
plotly>=5.15             # Interactive charts
matplotlib>=3.7         # SHAP plots

# Utilities
pyserial>=3.5           # ESP32 serial data
requests>=2.31          # API downloads
joblib>=1.3             # Model serialization
```

### Arduino IDE
```
Adafruit_BME280         # BME280 driver
Adafruit_SSD1306        # OLED display
Wire                    # I2C (built-in)
WiFi                    # WiFi (built-in)
HTTPClient              # HTTP POST (built-in)
ArduinoJson             # JSON serialization
```

### Frontend
```
HTML + CSS + JavaScript  # Core
Chart.js or Plotly.js    # Real-time charts
Leaflet.js               # India map
Socket.IO client         # WebSocket for live updates
```

---

## 15. Build Order (Risk-Managed)

> [!IMPORTANT]
> Each phase produces a **working, demonstrable system**. High-risk ML comes AFTER a functioning data pipeline exists.

```
Phase 1: Foundation (Hours 0–6)
├── Working ESP32 + BME280(s) sensor node
├── WiFi data streaming to laptop
├── Open-Meteo data downloader (real weather data)
├── Anomaly injection generator (faults into real data)
└── Basic data visualization (sensor readings plotting)

Phase 2: Core QC (Hours 6–12)
├── Data integrity checks (Layer 0)
├── Statistical QC: spike, frozen, range (Layer 1)
├── Physics consistency engine — derived quantities (Layer 3)
├── Basic anomaly flagging working end-to-end
└── Anomaly Fusion Score (initial version, equal weights)

Phase 3: ML Models (Hours 12–20)
├── LSTM Autoencoder — train on real data, experiment with windows
├── Isolation Forest on engineered features
├── Root-cause classifier — train on injected faults
├── Integrate ML scores into Fusion system
└── Tune fusion weights on validation set

Phase 4: Intelligence (Hours 20–28)
├── SHAP integration
├── Human-readable explanation generator
├── Sensor Health Index
├── Context engine (time/season encoding)
├── Spatial comparison (if 2nd BME280 available)
└── Evaluation metrics computation (precision, recall, F1, FPR)

Phase 5: Dashboard & Polish (Hours 28–36)
├── Real-time web dashboard
├── Alert feed with fusion score breakdown
├── Sensor health panel
├── Evaluation metrics display
├── India map with station markers
├── Demo preparation (all 5 scenarios rehearsed)
└── Documentation
```

---

## 16. Innovation Pitch — What We Say to Judges

### One-Sentence Pitch

> *"SkyGuard AI combines conventional meteorological quality control with temporal machine learning and contextual reasoning to determine whether an unusual observation is a faulty sensor or a genuine atmospheric event."*

### Distinguishing Design Choices

1. **Hybrid edge-cloud architecture** — edge QC on ESP32 for fast local detection + deep analysis on server
2. **Anomaly Fusion Score** — multiple independent signals (temporal ML, multivariate ML, physics, context, spatial) fused into a single decision with explainable breakdown
3. **Physics-informed feature engineering** — derived atmospheric quantities (dew point via Magnus, saturation VP, VPD) as model features
4. **6-class fault taxonomy** — actionable root-cause classification, not just "anomaly/normal"
5. **Two-level explainability** — SHAP for model transparency + natural language for operators + fusion score breakdown
6. **Sensor Health Index** — tracks degradation trajectory over time
7. **Self-healing data quality pipeline** — quarantines data, optionally estimates corrections, never overwrites originals
8. **Station-specific seasonal baselines** — supports India's climatic diversity

---

## 17. Corrections Applied — Full Changelog

### Round 1 (28 corrections)
| # | Correction | Status |
|---|---|---|
| 1 | Architecture restructured to match real met QC | ✅ Applied |
| 2 | Don't stack algorithms — show layered purpose | ✅ Applied |
| 3 | LSTM choice research-backed | ✅ Applied |
| 4 | Humidity physics rewritten | ✅ Applied |
| 5 | Clausius-Clapeyron as feature, not detector | ✅ Applied |
| 6 | Pressure-temperature rule removed | ✅ Applied |
| 7 | Spatial consistency clarified | ✅ Applied |
| 8 | Reading window timing corrected | ✅ Applied |
| 9 | LSTM NOT on ESP32 | ✅ Applied |
| 10 | <50KB claim removed | ✅ Applied |
| 11 | BME280 properly framed | ✅ Applied |
| 12 | Second BME280 kept | ✅ Applied → upgraded to strongly recommended |
| 13 | Anomaly classes merged (drift + calibration) | ✅ Applied |
| 14 | Sensor degradation → Health Index | ✅ Applied |
| 15 | Self-healing → Self-healing data quality | ✅ Applied |
| 16 | Corrected data made optional | ✅ Applied |
| 17 | Isolation Forest on engineered features | ✅ Applied |
| 18 | Two-level explainability | ✅ Applied |
| 19 | Demo scenarios changed | ✅ Applied → further improved in R2 |
| 20 | "No existing solution" claims removed | ✅ Applied |
| 21 | Indian climate claim rewritten | ✅ Applied |
| 22 | Innovation pitch reframed | ✅ Applied |
| 23 | Architecture simplified | ✅ Applied |
| 24 | Overclaimed items removed | ✅ Applied |
| 25 | Strong items kept | ✅ Applied |
| 26 | Evaluation depth added | ✅ Applied → signature metric added in R2 |
| 27 | Test matrix with genuine-event test | ✅ Applied → expanded in R2 |
| 28 | Build order risk-managed | ✅ Applied |

### Round 2 (10 corrections + 1 addition)
| # | Correction | Status |
|---|---|---|
| 1 | LSTM window as experimental hyperparameter + longer contexts | ✅ Applied |
| 2 | Dew point formula corrected (not Magnus; Magnus provided separately) | ✅ Applied |
| 3 | Absolute humidity "invariant" removed | ✅ Applied |
| 4 | Demo D replaced with temporal/spatial inconsistency | ✅ Applied |
| 5 | Root-cause classifier: variability in synthetic faults | ✅ Applied |
| 6 | Dataset hierarchy: observed > reanalysis > synthetic > live | ✅ Applied |
| 7 | Open-Meteo is reanalysis, not observations — documented | ✅ Applied |
| 8 | Second BME280 upgraded to strongly recommended | ✅ Applied |
| 9 | FPR during weather events = signature metric | ✅ Applied |
| 10 | Data preservation excellent — keep exactly | ✅ Confirmed |
| +1 | **Anomaly Fusion Score added** as mathematical heart | ✅ **NEW** — Added as Section 2 |

---

## 18. Action Items — What You Need to Do Right Now

### ✅ Hardware (Buy This Week)
- [ ] ESP32 DevKit V1 — ₹400-500
- [ ] BME280 sensor module #1 — ₹250-350
- [ ] **BME280 sensor module #2** — ₹250-350 (strongly recommended)
- [ ] Breadboard + jumper wires — ₹100-160
- [ ] OLED SSD1306 display — ₹200-250
- [ ] Micro USB cable (probably have)

### ✅ Software (Install Now)
- [ ] Python 3.9+
- [ ] Arduino IDE 2.x
- [ ] Node.js 18+
- [ ] VS Code
- [ ] Git

### ✅ Data (Before Hackathon)
- [ ] I'll build Open-Meteo downloader → **you need internet**
- [ ] I'll build anomaly injection generator
- [ ] **You search data.gov.in** for IMD weather datasets
- [ ] **You download NOAA ISD** Indian station files (I'll provide links)

### ✅ Knowledge Prep
- [ ] LSTM Autoencoder concept
- [ ] SHAP basics
- [ ] BME280 I2C wiring (GPIO 21/22 on ESP32)
- [ ] The 6 anomaly types and why each matters
- [ ] Anomaly Fusion Score concept

---

## Open Questions

> [!IMPORTANT]
> **Q1:** Do you already have any hardware (ESP32, BME280, breadboard)?

> [!IMPORTANT]
> **Q2:** How many team members, and what are their skills (ML / backend / frontend / hardware)?

> [!IMPORTANT]
> **Q3:** When is the hackathon? Timeline affects build priority.

> [!IMPORTANT]
> **Q4:** Dashboard: plain HTML+CSS+JS (faster to build) or React/Next.js (more polished)?
