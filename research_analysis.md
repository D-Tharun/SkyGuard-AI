# 🛡️ SkyGuard AI — Deep Research & Prototype Blueprint
## SIH PS 26073: AI/ML-Based Intelligent Anomaly Detection for Automatic Weather Stations

---

## 1. What the Problem Statement Asks (Decoded)

### Core Problem
India Meteorological Department (IMD) operates **800+ Automatic Weather Stations** across India. These stations stream real-time data (Temperature, Pressure, Humidity) every **5-15 minutes**. The data is plagued by:
- **Sensor malfunctions** (stuck readings, spikes, drift)
- **Communication failures** (missing data, corrupted packets)
- **Calibration drift** (gradual accuracy loss over weeks/months)
- **Environmental interference** (spider webs on sensors, bird droppings, water ingress)

Traditional QC uses **static thresholds** (e.g., reject if temp > 50°C). This FAILS because:
- It can't detect **subtle anomalies** (sensor drifting by 2°C over a month)
- It can't distinguish **real extreme weather** from sensor faults
- It generates **massive false alarms** during genuine meteorological events (heatwaves, cyclones)

### What They Want Us to Build
| Requirement | Priority | What It Means |
|---|---|---|
| Real-time anomaly detection | 🔴 Critical | Process data streams, flag anomalies within seconds |
| Sensor fault classification | 🔴 Critical | Identify WHAT went wrong (spike, freeze, drift, communication error) |
| Temporal/seasonal pattern learning | 🔴 Critical | Know that 45°C in Rajasthan in May is normal, but 45°C in Shimla in January is not |
| Multivariate consistency | 🔴 Critical | If temp rises sharply but humidity doesn't drop → suspicious |
| Confidence scores | 🟡 Important | Each alert should say "87% confident this is a sensor fault" |
| Explainable AI (SHAP/LIME) | 🟡 Important | WHY the system flagged it — "pressure dropped 30hPa in 5 min, inconsistent with temp" |
| Sensor degradation prediction | 🟡 Important | Predict when a sensor will fail before it actually does |
| Corrected/imputed values | 🟢 Optional | Suggest what the correct reading might have been |
| Edge AI on ESP32 | 🟢 Bonus | Run lightweight model on the station itself |
| Visualization dashboard | 🟡 Important | Beautiful, real-time monitoring UI |

---

## 2. Existing Solutions & Their Limitations

### 2.1 Traditional Threshold-Based QC (Currently Used by IMD)
- **How it works**: Fixed rules like `if temp > 55 or temp < -40: flag`
- **Limitations**: 
  - Cannot detect context-dependent anomalies
  - Cannot detect gradual drift
  - Cannot do multivariate consistency checks
  - High false alarm rate during extreme weather events
  - No learning capability

### 2.2 Statistical Methods (Z-Score, IQR, Moving Averages)
- **How it works**: Flag values beyond 3σ from rolling mean
- **Limitations**:
  - Assumes Gaussian distribution (weather data is often skewed)
  - Cannot capture complex temporal patterns
  - Seasonal variations cause false alarms
  - No root-cause classification

### 2.3 Isolation Forest / One-Class SVM (Academic Papers)
- **How it works**: Unsupervised ML models trained on "normal" data
- **Limitations**:
  - No temporal awareness (treats each reading independently)
  - Cannot distinguish anomaly types
  - No explainability
  - Requires periodic retraining

### 2.4 LSTM Autoencoders (Research Papers, e.g., Hundman et al. 2018)
- **How it works**: LSTM learns normal temporal patterns, reconstruction error = anomaly score
- **Limitations**:
  - Computationally expensive for edge deployment
  - Poor explainability
  - Requires large labeled datasets for tuning thresholds
  - No root-cause classification

### 2.5 Commercial Solutions (ClimaCell/Tomorrow.io, DTN, Campbell Scientific)
- **How it works**: Proprietary QC pipelines
- **Limitations**:
  - Expensive, not open-source
  - Not designed for Indian climatic diversity
  - No edge deployment capability
  - Black-box approaches

---

## 3. Our Solution: SkyGuard AI — Architecture & Novelty

### 3.1 Solution Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    SKYGUARD AI ARCHITECTURE                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐   │
│  │  ESP32 Edge   │    │  ESP32 Edge   │    │  ESP32 Edge   │  │
│  │  (TinyML)     │───▶│  (TinyML)     │───▶│  (TinyML)     │  │
│  │  Layer 1      │    │  Layer 1      │    │  Layer 1      │  │
│  │  Detection    │    │  Detection    │    │  Detection    │  │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘   │
│         │                    │                    │           │
│         ▼                    ▼                    ▼           │
│  ┌──────────────────────────────────────────────────────┐    │
│  │              CLOUD/SERVER LAYER                       │    │
│  │  ┌────────────────────────────────────────────────┐   │    │
│  │  │  Multi-Model Ensemble Engine                    │   │    │
│  │  │  ┌─────────┐ ┌──────────┐ ┌────────────────┐   │   │    │
│  │  │  │Temporal  │ │Multivar  │ │ Contextual     │   │   │    │
│  │  │  │Anomaly   │ │Consist.  │ │ Aware Engine   │   │   │    │
│  │  │  │(LSTM-AE) │ │Checker   │ │ (Season+Geo)   │   │   │    │
│  │  │  └─────────┘ └──────────┘ └────────────────┘   │   │    │
│  │  └────────────────────────────────────────────────┘   │    │
│  │  ┌────────────────────────────────────────────────┐   │    │
│  │  │  Explainability Engine (SHAP + Custom Rules)    │   │    │
│  │  └────────────────────────────────────────────────┘   │    │
│  │  ┌────────────────────────────────────────────────┐   │    │
│  │  │  Sensor Health Predictor (Degradation Model)    │   │    │
│  │  └────────────────────────────────────────────────┘   │    │
│  └──────────────────────────────────────────────────────┘    │
│         │                                                     │
│         ▼                                                     │
│  ┌──────────────────────────────────────────────────────┐    │
│  │          VISUALIZATION DASHBOARD (Web UI)              │    │
│  │  Real-time maps │ Alert feed │ Sensor health │ Charts  │    │
│  └──────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Our Multi-Layer Detection Approach

#### Layer 1: Edge Detection (ESP32 — TinyML)
- **Lightweight statistical checks** running ON the sensor board
- Detects: Spikes, frozen values, out-of-physical-range values
- Uses: Quantized tiny model (< 50KB), moving statistics
- **Novelty**: Most solutions don't have edge-level intelligence

#### Layer 2: Temporal Anomaly Detection (LSTM Autoencoder)
- Learns normal temporal patterns for each station
- Input: Sliding window of last 24-48 readings (past 6-24 hours)
- Output: Reconstruction error → anomaly score
- Detects: Gradual drift, unusual patterns, sudden regime changes

#### Layer 3: Multivariate Consistency Engine
- **Physics-based constraints** + ML:
  - Clausius-Clapeyron equation: relates temperature to saturation vapor pressure
  - When temp rises → relative humidity should generally decrease (if absolute humidity is constant)
  - Pressure-temperature relationships follow known atmospheric physics
- Detects: Sensor-specific faults (if only one parameter is anomalous)

#### Layer 4: Contextual & Spatial Awareness
- **Seasonal context**: Embed month/season/time-of-day as features
- **Geographical context**: Climate zone encoding (tropical, arid, mountain, coastal)
- **Spatial consistency**: Compare with neighboring stations (if data available)
- Detects: Distinguishes genuine extreme weather from sensor faults

#### Layer 5: Explainability & Root-Cause Classification
- **SHAP values** for feature attribution
- **Rule-based classifier** on top of anomaly features to classify root cause:
  - `SPIKE` — sudden jump returning to normal
  - `FROZEN` — same value repeated for extended period
  - `DRIFT` — gradual shift from expected range
  - `COMMUNICATION_ERROR` — missing/corrupted data patterns
  - `CALIBRATION_ERROR` — consistent offset from expected values
  - `PHYSICAL_INCONSISTENCY` — multivariate violation

### 3.3 Our Key Novelties

| # | Novelty | Why It's Novel |
|---|---------|---------------|
| 1 | **Hybrid Edge-Cloud Architecture** | No existing solution combines TinyML on ESP32 with cloud-level deep learning. We do first-pass filtering at the edge (saving bandwidth, enabling offline detection) and deep analysis in the cloud |
| 2 | **Physics-Informed ML** | We embed atmospheric physics equations (Clausius-Clapeyron, barometric formula) as constraints in our ML model. This is NOT just pure data-driven — it's physics-aware AI |
| 3 | **Multi-Granularity Anomaly Taxonomy** | We don't just say "anomaly" — we classify into 6+ categories with confidence scores and root-cause explanations. This is actionable intelligence |
| 4 | **Sensor Degradation Prediction** | Using trend analysis on anomaly frequency and sensor health metrics, we predict WHEN a sensor will need maintenance — predictive maintenance for weather stations |
| 5 | **Indian Climate-Aware Models** | Trained/tuned for Indian climatic diversity — from Thar Desert to Western Ghats to Himalayan stations. Existing solutions are designed for temperate climates |
| 6 | **Self-Healing Data Pipeline** | When anomalies are detected, we don't just flag — we impute corrected values using multivariate regression and temporal interpolation, making the data usable |
| 7 | **Explainable AI Dashboard** | Every anomaly comes with a human-readable explanation: "Temperature spike of 12°C in 5 minutes while pressure and humidity remained stable — likely sensor malfunction, not weather event" |

---

## 4. Why Our Solution is Better Than Existing Ones

| Criteria | Traditional QC | Statistical ML | Pure LSTM | **SkyGuard AI (Ours)** |
|----------|---------------|---------------|-----------|----------------------|
| Temporal Pattern Learning | ❌ | ❌ | ✅ | ✅ |
| Multivariate Consistency | ❌ | Partial | ❌ | ✅ (Physics-informed) |
| Seasonal Awareness | ❌ | ❌ | Partial | ✅ |
| Root-Cause Classification | ❌ | ❌ | ❌ | ✅ (6 categories) |
| Explainability | ✅ (rules) | ❌ | ❌ | ✅ (SHAP + natural language) |
| Edge Deployment | N/A | ❌ | ❌ | ✅ (ESP32 TinyML) |
| Sensor Health Prediction | ❌ | ❌ | ❌ | ✅ |
| Data Correction | ❌ | ❌ | ❌ | ✅ |
| False Alarm Rate | High | Medium | Medium | **Low** (multi-layer validation) |
| Indian Climate Adapted | Partial | ❌ | ❌ | ✅ |

---

## 5. Evaluation Criteria Mapping

| Criteria | Weight | Our Strategy |
|----------|--------|-------------|
| **Innovation & Novelty** | 25% | Physics-informed ML + Edge-Cloud hybrid + Anomaly taxonomy + Self-healing pipeline |
| **Detection Accuracy** | 20% | Multi-model ensemble (LSTM-AE + Isolation Forest + Physics constraints) reduces false positives |
| **Real-Time Capability** | 15% | Edge pre-filtering + Streaming architecture + Sub-second inference |
| **Explainability** | 10% | SHAP values + Natural language explanations + Root-cause classification |
| **Scalability** | 10% | Containerized microservices + Model-per-station or federated approach |
| **Practical Deployability** | 10% | ESP32 TinyML + Standard sensor interfaces + Low power consumption |
| **Visualization/UI** | 5% | Real-time dashboard with maps, alerts, sensor health, analytics |
| **Energy Efficiency** | 5% | TinyML quantized models + Sleep mode scheduling on ESP32 |

---

## 6. Prototype Plan — What We're Building

### 6.1 Prototype Scope (Hackathon-Ready)

We will build a **fully working end-to-end prototype** with:

```
┌─────────────────────────────────────────────────────┐
│               PROTOTYPE COMPONENTS                   │
├─────────────────────────────────────────────────────┤
│                                                      │
│  HARDWARE DEMO (ESP32 + Sensors)                     │
│  ├── ESP32 microcontroller                           │
│  ├── BME280 sensor (temp + pressure + humidity)      │
│  ├── Edge anomaly detection (TinyML)                 │
│  └── WiFi streaming to server                        │
│                                                      │
│  ML BACKEND (Python)                                 │
│  ├── Data ingestion & preprocessing                  │
│  ├── LSTM Autoencoder (temporal anomaly detection)   │
│  ├── Isolation Forest (point anomaly detection)      │
│  ├── Physics-based consistency checker               │
│  ├── Anomaly classifier (root-cause)                 │
│  ├── SHAP explainability module                      │
│  ├── Sensor health scoring                           │
│  ├── Data correction/imputation                      │
│  └── REST API (Flask/FastAPI)                        │
│                                                      │
│  WEB DASHBOARD (React/Next.js or HTML+JS)            │
│  ├── Real-time data visualization (charts)           │
│  ├── Anomaly alert feed                              │
│  ├── India map with station markers                  │
│  ├── Sensor health status panel                      │
│  ├── SHAP explanation visualizations                 │
│  ├── Historical analysis & trends                    │
│  └── Anomaly injection simulator                     │
│                                                      │
│  ANOMALY SIMULATOR                                   │
│  ├── Inject spikes, freezes, drift, noise            │
│  ├── Test detection accuracy                         │
│  └── Generate evaluation metrics                     │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

## 7. 🛒 What You Need to Get/Bring

### 7.1 Hardware Requirements

| Item | Qty | Approx Cost (INR) | Purpose | Where to Buy |
|------|-----|--------------------|---------|-------------|
| **ESP32 DevKit V1** | 1 | ₹400-500 | Main microcontroller for edge processing | Amazon, Robu.in, Electronicscomp |
| **BME280 Sensor Module** | 1 | ₹250-350 | Temperature + Pressure + Humidity (all 3 in one!) | Amazon, Robu.in |
| **Jumper Wires (M-F, M-M)** | 1 set | ₹50-80 | Connecting sensor to ESP32 | Any electronics store |
| **Breadboard** | 1 | ₹50-80 | Prototyping connections | Any electronics store |
| **Micro USB Cable** | 1 | ₹100 | Programming & powering ESP32 | Already have likely |
| **OLED Display 0.96" (SSD1306)** | 1 | ₹200-250 | Display real-time readings & anomaly status on device | Amazon, Robu.in |
| | | **~₹1,100-1,400** | | |

> [!TIP]
> **BME280 is the PERFECT sensor** — it gives all 3 required parameters (temp, pressure, humidity) in a single I2C module. No need for separate sensors. This is a major practical advantage.

> [!IMPORTANT]
> **Optional but impressive**: Get a **second BME280** (₹250) to simulate a "neighboring station" and demonstrate spatial consistency checking.

### 7.2 Software Requirements (Free — Install on Laptop)

| Software | Purpose | Installation |
|----------|---------|-------------|
| **Python 3.9+** | ML backend | python.org or conda |
| **Arduino IDE 2.x** or **PlatformIO** | ESP32 programming | arduino.cc |
| **Node.js 18+** | Web dashboard | nodejs.org |
| **VS Code** | Code editor | Already have |
| **Git** | Version control | Already have |

### 7.3 Python Libraries Needed

```
# ML & Data Processing
tensorflow / keras          # LSTM Autoencoder
scikit-learn                # Isolation Forest, preprocessing
pandas                      # Data manipulation
numpy                       # Numerical computing
shap                        # SHAP explainability
matplotlib / plotly          # Visualization

# Backend API
fastapi                     # REST API server
uvicorn                     # ASGI server
websockets                  # Real-time streaming
pydantic                    # Data validation

# Sensor Data
pyserial                    # Read ESP32 serial data
```

### 7.4 Arduino/ESP32 Libraries

```
Adafruit_BME280             # BME280 sensor driver
Adafruit_SSD1306            # OLED display driver
WiFi                        # Built-in WiFi
HTTPClient                  # Send data to server
ArduinoJson                 # JSON serialization
TensorFlowLite_ESP32        # TinyML inference (optional, advanced)
```

### 7.5 Datasets Needed (Free — Download)

| Dataset | Source | What It Contains |
|---------|--------|-----------------|
| **IMD AWS Data** | [data.gov.in](https://data.gov.in) or IMD Pune portal | Real Indian weather station data |
| **NOAA ISD** | [NOAA](https://www.ncei.noaa.gov/products/land-based-station/integrated-surface-database) | Global hourly weather observations |
| **OpenWeather Historical** | [OpenWeather API](https://openweathermap.org/history) | Historical weather data for Indian cities |
| **Simulated Data** | We'll generate this | Synthetic data with injected anomalies for testing |

> [!NOTE]
> For the prototype, we'll primarily use **simulated realistic data** with programmatically injected anomalies. This is actually PREFERRED by judges because it lets us precisely measure detection accuracy. We'll also demonstrate with **live ESP32 sensor data**.

---

## 8. Team Skill Requirements

| Role | Skills Needed | Tasks |
|------|--------------|-------|
| **ML Engineer** (1-2) | Python, TensorFlow/Keras, scikit-learn | Build LSTM-AE, Isolation Forest, SHAP integration |
| **Backend Dev** (1) | Python, FastAPI, WebSockets | Build API, data pipeline, real-time streaming |
| **Frontend Dev** (1) | HTML/CSS/JS (or React) | Build visualization dashboard |
| **Hardware/IoT** (1) | Arduino, ESP32, I2C | Build sensor node, edge detection, data streaming |
| **Presenter** (1) | Communication | Demo, presentation, documentation |

---

## 9. Development Timeline (36-Hour Hackathon)

| Phase | Hours | Activities |
|-------|-------|-----------|
| **Setup & Data Prep** | 0-4 | Set up environment, generate/load datasets, connect ESP32 |
| **Core ML Models** | 4-12 | Train LSTM-AE, Isolation Forest, physics checker |
| **Edge Detection** | 8-14 | ESP32 code, edge anomaly detection, WiFi streaming |
| **Backend API** | 12-18 | FastAPI server, WebSocket streaming, model integration |
| **Dashboard UI** | 14-24 | Real-time dashboard, charts, map, alerts |
| **Explainability** | 18-26 | SHAP integration, natural language explanations |
| **Integration & Testing** | 24-30 | End-to-end testing, anomaly injection, accuracy metrics |
| **Polish & Presentation** | 30-36 | UI polish, demo preparation, documentation |

---

## 10. Anomaly Types We'll Detect & Demo

| Anomaly Type | Description | Detection Method | Demo |
|-------------|-------------|-----------------|------|
| **Spike** | Sudden jump (e.g., temp 30→55→31°C) | LSTM-AE + Statistical | Inject via simulator |
| **Frozen/Stuck** | Same reading repeated (sensor stuck) | Variance monitor | Inject via simulator |
| **Drift** | Gradual shift from expected (calibration) | Trend analysis + LSTM | Inject via simulator |
| **Communication Error** | Missing data, NaN, duplicates | Pattern detection | Inject via simulator |
| **Physical Inconsistency** | Temp ↑ + Humidity ↑ simultaneously (violates physics) | Physics engine | Inject via simulator |
| **Range Violation** | Values outside physical limits | Edge detection | Inject via simulator |
| **Noise** | Random high-frequency fluctuations | Signal processing | Inject via simulator |

---

## 11. Key Demo Scenarios for Judges

### Demo 1: Live Sensor Reading
- ESP32 streams real data to dashboard
- Show real-time charts updating
- Cover sensor with hand → temperature spike → system flags it

### Demo 2: Anomaly Injection
- Use simulator to inject each anomaly type
- Show system detecting with confidence scores
- Show SHAP explanation for each

### Demo 3: Sensor Health Dashboard
- Show sensor degradation scoring over time
- Show predicted maintenance timeline
- Show corrected/imputed values

### Demo 4: Edge vs Cloud Detection
- Show ESP32 catching obvious anomalies locally (spike, range)
- Show cloud catching subtle anomalies (drift, multivariate)
- Demonstrate bandwidth savings

---

## 12. Tech Stack Summary

```
┌─────────────────────────────────────────────┐
│              TECH STACK                      │
├─────────────────────────────────────────────┤
│  EDGE:      ESP32 + BME280 + Arduino C++    │
│  ML:        Python + TensorFlow + sklearn   │
│  XAI:       SHAP                            │
│  Backend:   FastAPI + WebSockets            │
│  Frontend:  HTML/CSS/JS + Chart.js/Plotly   │
│  Database:  SQLite (prototype) / InfluxDB   │
│  Comm:      WiFi + REST API + WebSocket     │
└─────────────────────────────────────────────┘
```

---

## 13. Quick Shopping List (Summary)

### 🔴 MUST BUY (Hardware)
- [ ] ESP32 DevKit V1 — ₹400-500
- [ ] BME280 sensor module — ₹250-350
- [ ] Breadboard — ₹50-80
- [ ] Jumper wires (M-M, M-F) — ₹50-80
- [ ] Micro USB cable — ₹100 (probably already have)

### 🟡 NICE TO HAVE
- [ ] 0.96" OLED Display (SSD1306) — ₹200-250
- [ ] Second BME280 for "neighboring station" demo — ₹250-350
- [ ] Power bank for portable demo — ₹500 (probably already have)

### 🟢 SOFTWARE (All Free)
- [ ] Python 3.9+ with pip
- [ ] Arduino IDE 2.x
- [ ] Node.js 18+
- [ ] VS Code
- [ ] Git

### 💾 DATASETS (Download before hackathon)
- [ ] Generate synthetic Indian weather data (we'll build the generator)
- [ ] Download IMD/NOAA sample data if available
- [ ] Prepare anomaly injection scripts

**Total Hardware Cost: ₹1,100 - ₹1,800**

---

> [!CAUTION]
> **Buy hardware EARLY** — at least 1 week before the hackathon. You need time to:
> 1. Verify the sensor works with ESP32
> 2. Calibrate readings
> 3. Write and test edge code
> 4. Debug I2C connections (they can be tricky)

> [!TIP]
> **Pro tip**: Order from **Robu.in** or **Electronicscomp.com** — they're Indian stores with faster shipping and ESP32/BME280 always in stock. Amazon works too but check seller ratings.
