from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List, Dict
import pandas as pd
import math
import numpy as np
from pydantic import BaseModel

from src.backend_service import SkyGuardService

app = FastAPI(title="SkyGuard AI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

service = SkyGuardService()

def get_df():
    try:
        return service.load_and_process_data()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def _safe_float(val):
    if pd.isna(val) or math.isnan(val) or math.isinf(val):
        return None
    return float(val)

def _row_to_reading(row):
    # Mapping the backend DataFrame row to a dictionary representing a reading
    decision = row.get('final_state', 'NORMAL')
    
    frontend_decision = "NORMAL"
    if "FAULT" in decision:
        frontend_decision = "SENSOR_FAULT"
    elif decision == "GENUINE_EXTREME_EVENT":
        frontend_decision = "GENUINE_EVENT"
    elif decision == "UNCERTAIN_REVIEW":
        frontend_decision = "UNCERTAIN"

    # Derive some scores for the frontend
    s_anomaly = _safe_float(row.get('S_anomaly', 0.0))
    s_event = _safe_float(row.get('S_event', 0.0))
    
    ts_val = row['timestamp']
    if isinstance(ts_val, str):
        ts_val = pd.to_datetime(ts_val)
    timestamp_ms = int(ts_val.timestamp() * 1000) if hasattr(ts_val, 'timestamp') else 0

    return {
        "timestamp": timestamp_ms,
        "stationId": row['station'],
        "temperature": _safe_float(row.get('temperature_c')),
        "humidity": _safe_float(row.get('relative_humidity_pct')),
        "pressure": _safe_float(row.get('surface_pressure_hpa')),
        "dewPoint": _safe_float(row.get('dew_point_c')),
        "vpd": _safe_float(row.get('vapor_pressure_deficit_hpa')),
        
        # Raw backend values
        "raw_final_state": decision,
        "raw_reason": row.get('reason', ''),
        "raw_S_anomaly": s_anomaly,
        "raw_S_event": s_event,
        "raw_if_score": _safe_float(row.get('if_score')),
        "raw_lstm_score": _safe_float(row.get('lstm_score')),
        "raw_physics_score": _safe_float(row.get('physics_score')),
        "raw_spatial_deviation": _safe_float(row.get('spatial_deviation')),
        
        # Frontend mapped fields
        "decision": frontend_decision,
        "qualityFlag": "PASS" if frontend_decision in ["NORMAL", "GENUINE_EVENT"] else ("FAIL" if frontend_decision == "SENSOR_FAULT" else "SUSPECT"),
        "diagnosis": row.get('reason', 'Observation consistent with local envelope'),
        "reason": row.get('reason', 'All measured variables adhere to limits'),
        
        # Mocking specific scores based on raw scores to fit frontend visual bars
        "edgeScore": s_anomaly if row.get('spike_flag') else 0.04,
        "temporalScore": _safe_float(row.get('lstm_score')),
        "multivariateScore": _safe_float(row.get('if_score')),
        "physicsScore": _safe_float(row.get('physics_score')),
        "spatialScore": _safe_float(row.get('spatial_deviation_max_norm')) if row.get('spatial_evidence_available') else 0.0,
        "fusionScore": _safe_float(row.get('fusion_score', 0.0)),
        "confidence": _safe_float(row.get('confidence', 0.90)),
        "spatial_available": bool(row.get('spatial_evidence_available', True))
    }


@app.get("/api/health")
def health_check():
    return {"status": "ok", "backend": "SkyGuard AI Python Backend", "version": "1.0"}

@app.get("/api/stations")
def get_stations():
    df = get_df()
    # Get the latest reading for each station
    df_sorted = df.sort_values('timestamp').groupby('station').tail(1)
    
    stations = []
    for _, row in df_sorted.iterrows():
        reading = _row_to_reading(row)
        
        # Fallbacks for station coordinates and names based on frontend data
        station_id = row['station']
        coords = {
            'Bengaluru_HAL': (12.95, 77.668, 'Karnataka'),
            'Chennai_Meenambakkam': (12.9941, 80.1809, 'Tamil Nadu'),
            'Cherrapunji_Mawsynram': (25.27, 91.73, 'Meghalaya'),
            'Jaisalmer_Desert': (26.9157, 70.9083, 'Rajasthan'),
            'Mumbai_Santacruz': (19.0896, 72.8656, 'Maharashtra'),
            'New_Delhi_Safdarjung': (28.585, 77.206, 'Delhi'),
            'Shimla_Himalayan': (31.1048, 77.1734, 'Himachal Pradesh')
        }
        lat, lng, state = coords.get(station_id, (0, 0, "Unknown"))
        
        stations.append({
            "id": station_id,
            "name": station_id.replace("_", " "),
            "location": station_id.split("_")[0],
            "state": state,
            "lat": lat,
            "lng": lng,
            "elevationMeters": 0, # Could map this if needed
            "status": "Alert" if reading['decision'] == "SENSOR_FAULT" else ("Warning" if reading['decision'] == "UNCERTAIN" else "Online"),
            "healthScore": 100 if reading['decision'] == "NORMAL" else 75,
            "temperature": reading['temperature'],
            "humidity": reading['humidity'],
            "pressure": reading['pressure'],
            "lastUpdate": reading['timestamp'],
            "activeAnomalies": 1 if reading['decision'] == "SENSOR_FAULT" else 0,
            "sensorModel": "BME280 / Industrial AWS",
            "currentDecision": reading['decision'],
            "assessmentSummary": reading['diagnosis']
        })
    return stations

@app.get("/api/observations")
def get_observations(stationId: Optional[str] = None, limit: int = 40):
    df = get_df()
    if stationId:
        df = df[df['station'] == stationId]
    
    df = df.sort_values('timestamp').tail(limit)
    readings = [_row_to_reading(row) for _, row in df.iterrows()]
    return readings

@app.get("/api/alerts")
def get_alerts():
    df = get_df()
    # Find active anomalies (Faults or Events) in the last few readings
    df_recent = df.sort_values('timestamp').groupby('station').tail(5)
    anomalies = df_recent[df_recent['final_state'] != 'NORMAL']
    
    alerts = []
    for _, row in anomalies.iterrows():
        reading = _row_to_reading(row)
        alerts.append({
            "id": f"ALR-{int(reading['timestamp'])}",
            "stationId": reading['stationId'],
            "stationName": reading['stationId'].replace("_", " "),
            "location": reading['stationId'].replace("_", " "),
            "decision": reading['decision'],
            "faultType": row.get('final_state', 'Unknown'),
            "severity": "HIGH" if reading['decision'] == "SENSOR_FAULT" else "MEDIUM",
            "detectedAt": reading['timestamp'],
            "status": "active",
            "headline": f"{reading['decision']} at {reading['stationId']}",
            "summary": reading['diagnosis'],
            "triggerMetric": "Temperature",
            "triggerValue": f"{reading['temperature']} °C",
            "observedSequence": [],
            "evidencePoints": [reading['reason']],
            "featureContributions": [],
            "layerScores": [],
            "fusionScore": reading['fusionScore'],
            "confidencePercent": int(reading['confidence'] * 100),
            "recommendedAction": "Review observation context."
        })
    return alerts

@app.get("/api/scenarios/{scenario_id}")
def get_scenario(scenario_id: str):
    df = get_df()
    
    # Check if spatial logic needs to be disabled
    if scenario_id.startswith("E") or scenario_id == "E. Spatial Logic Disabled (Demonstrate fallback)":
        df = service.load_and_process_data(disable_spatial=True)
    
    target_station, target_idx = service.get_scenario_target(df, scenario_id)
    
    if not target_station:
        raise HTTPException(status_code=404, detail="Scenario could not be located in dataset")
        
    df_station = df[df['station'] == target_station].reset_index(drop=True)
    
    # Return window of readings around the target index
    start_idx = max(0, target_idx - 40)
    window = df_station.iloc[start_idx:target_idx+1]
    
    readings = [_row_to_reading(row) for _, row in window.iterrows()]
    
    return {
        "scenario_id": scenario_id,
        "target_station": target_station,
        "target_idx": target_idx,
        "readings": readings
    }

@app.get("/api/performance")
def get_performance():
    return {
        "title": "Controlled Benchmark Evaluation",
        "datasetDescription": "Controlled evaluation dataset comprising standardized test sequences with ground-truth classifications.",
        "models": [
            {
                "name": "Conventional QC",
                "description": "Static threshold checks, range plausibility, and basic step-test rules.",
                "precision": 0.5202,
                "recall": 0.2038,
                "f1": 0.2929,
                "fpr": 0.0063
            },
            {
                "name": "ML-Only",
                "description": "Standalone ML reconstruction error without physical constraints or multi-modal fusion.",
                "precision": 0.0323,
                "recall": 0.0007,
                "f1": 0.0015,
                "fpr": 0.0008
            },
            {
                "name": "Full SkyGuard",
                "description": "Multi-layer fusion combining edge checks, temporal reasoning, multivariate thermodynamics, and spatial context.",
                "precision": 0.5972,
                "recall": 0.3721,
                "f1": 0.4585,
                "fpr": 0.0085
            }
        ],
        "genuineEventPreservation": {
            "observations": 483,
            "falseAlerts": 0,
            "gepr": "1.0000",
            "description": "483 genuine-event observations evaluated with 0 false alerts (GEPR 1.0000)."
        }
    }
