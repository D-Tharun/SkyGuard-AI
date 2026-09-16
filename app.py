import streamlit as st
import pandas as pd
import numpy as np
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import time
import os
import sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append(BASE_DIR)

from src.qc.fusion import EventAwareFusionEngine
from src.qc.physics_qc import PhysicsEngine
from src.qc.stat_qc import StatisticalQCEngine

# --- Page Config & Styling ---
st.set_page_config(page_title="SkyGuard AI Dashboard", layout="wide", page_icon="🌤️")
st.markdown("""
    <style>
    .main {background-color: #0E1117; color: white;}
    .stMetric {background-color: #1E2130; padding: 15px; border-radius: 10px; border-left: 5px solid #00F0FF;}
    h1, h2, h3 {color: #00F0FF;}
    .alert-box {padding: 15px; border-radius: 5px; color: white; font-weight: bold; margin-bottom: 10px;}
    .alert-normal {background-color: #1a6334; border-left: 5px solid #28a745;}
    .alert-warning {background-color: #856404; border-left: 5px solid #ffc107;}
    .alert-danger {background-color: #721c24; border-left: 5px solid #dc3545;}
    .alert-event {background-color: #004085; border-left: 5px solid #80bdff;}
    </style>
""", unsafe_allow_html=True)

# --- Header ---
st.title("🌤️ SkyGuard AI: Event-Aware Anomaly Detection")
st.markdown("*Differentiating between Sensor Faults and Genuine Extreme Meteorological Events*")

@st.cache_data
def load_and_process_data(disable_spatial=False):
    from src.backend_service import SkyGuardService
    service = SkyGuardService()
    try:
        return service.load_and_process_data(disable_spatial)
    except Exception as e:
        st.error(str(e))
        st.stop()

# Initialize session state for scenario loading
if 'current_scenario' not in st.session_state:
    st.session_state.current_scenario = None

# --- Scenario Selector ---
st.sidebar.header("Demo Scenario Selector")
scenario_options = [
    "Select Scenario...",
    "A. Normal Weather",
    "B. Isolated Sensor Fault",
    "C. Genuine Regional Event (Heatwave)",
    "D. Example: genuine event + one faulty station",
    "E. Spatial Logic Disabled (Demonstrate fallback)"
]
selected_scenario = st.sidebar.selectbox("Choose a scenario:", scenario_options)

# Reload data if spatial setting changes
disable_spatial = (selected_scenario == "E. Spatial Logic Disabled (Demonstrate fallback)")
df = load_and_process_data(disable_spatial=disable_spatial)

if df.empty:
    st.stop()

# Auto-jump logic based on scenario
if selected_scenario != st.session_state.current_scenario:
    st.session_state.current_scenario = selected_scenario
    
    from src.backend_service import SkyGuardService
    service = SkyGuardService()
    target_station, target_idx = service.get_scenario_target(df, selected_scenario)
    st.session_state.target_station = target_station
    st.session_state.target_idx = target_idx

if 'target_station' not in st.session_state:
    st.session_state.target_station = df['station'].iloc[0]
    st.session_state.target_idx = 0

# Filter by target station
df_station = df[df['station'] == st.session_state.target_station].reset_index(drop=True)

# Allow manual sliding as well
st.sidebar.markdown("---")
st.sidebar.header("Manual Override")

def reset_idx():
    st.session_state.target_idx = 0

st.sidebar.selectbox("Select Station Feed", df['station'].unique(), key="target_station", on_change=reset_idx)

# Safely bound the target_idx in case data reloads changed the max length
max_idx = max(0, len(df_station) - 1)
if st.session_state.target_idx > max_idx:
    st.session_state.target_idx = max_idx

st.sidebar.slider("Jump to Time Step", 0, max_idx, key="target_idx")

idx = st.session_state.target_idx
row_data = df_station.iloc[idx]

# --- Layout Top: Key Metrics ---
col1, col2, col3, col4, col5 = st.columns(5)
col1.metric("Temperature", f"{row_data['temperature_c']:.1f} °C")
col2.metric("Humidity", f"{row_data['relative_humidity_pct']:.1f} %")
col3.metric("Pressure", f"{row_data['surface_pressure_hpa']:.1f} hPa")
col4.metric("Time", str(row_data['timestamp'])[:16])

status = row_data['final_state']
status_color = "normal" if status == "NORMAL" else "inverse" if "FAULT" in status else "off"
col5.metric("Decision State", status, delta="!" if status != "NORMAL" else "", delta_color=status_color)

# --- Layout Middle: Diagnosis Alert ---
diagnosis = row_data['reason']
conf = row_data['confidence']
diag_str = f"{status} (Confidence: {conf:.2f}) - Reasons: {diagnosis}"

if status == "NORMAL":
    st.markdown(f'<div class="alert-box alert-normal">✅ {diag_str}</div>', unsafe_allow_html=True)
elif status == "GENUINE_EXTREME_EVENT":
    st.markdown(f'<div class="alert-box alert-event">🌍 {diag_str}</div>', unsafe_allow_html=True)
elif "FAULT" in status:
    st.markdown(f'<div class="alert-box alert-danger">🚨 {diag_str}</div>', unsafe_allow_html=True)
else:
    st.markdown(f'<div class="alert-box alert-warning">⚠️ {diag_str}</div>', unsafe_allow_html=True)

# --- Layout Expandable: Telemetry ---
with st.expander("🔍 View SkyGuard Fusion Telemetry (XAI Evidence)"):
    c1, c2, c3, c4, c5 = st.columns(5)
    c1.metric("IForest Score", f"{row_data['if_score']:.3f}")
    c2.metric("LSTM Score", f"{row_data['lstm_score']:.3f}")
    c3.metric("S_anomaly", f"{row_data['S_anomaly']:.3f}")
    c4.metric("S_event", f"{row_data['S_event']:.3f}")
    spatial_str = f"{row_data['spatial_deviation']:.2f}°C diff" if row_data['spatial_evidence_available'] else "Unavailable"
    c5.metric("Spatial", spatial_str)
    
# --- Layout Bottom: Charts ---
st.markdown(f"### Live Sensor Feed - Station {st.session_state.target_station}")
window = df_station.iloc[max(0, idx-48):idx+1].copy()

fig = make_subplots(rows=3, cols=1, shared_xaxes=True, vertical_spacing=0.05)
fig.add_trace(go.Scatter(x=window['timestamp'], y=window['temperature_c'], mode='lines', name='Temp (°C)', line=dict(color='#ff9900')), row=1, col=1)
fig.add_trace(go.Scatter(x=window['timestamp'], y=window['relative_humidity_pct'], mode='lines', name='RH (%)', line=dict(color='#00F0FF')), row=2, col=1)
fig.add_trace(go.Scatter(x=window['timestamp'], y=window['surface_pressure_hpa'], mode='lines', name='Pres (hPa)', line=dict(color='#33cc33')), row=3, col=1)

# Highlight anomalies
faults = window[window['final_state'].str.contains('FAULT')]
if not faults.empty:
    fig.add_trace(go.Scatter(x=faults['timestamp'], y=faults['temperature_c'], mode='markers', name='Fault Detected', marker=dict(color='red', size=10, symbol='x')), row=1, col=1)

# Highlight events
events = window[window['final_state'] == 'GENUINE_EXTREME_EVENT']
if not events.empty:
    fig.add_trace(go.Scatter(x=events['timestamp'], y=events['temperature_c'], mode='markers', name='Extreme Event', marker=dict(color='blue', size=8, symbol='star')), row=1, col=1)

fig.update_layout(height=500, margin=dict(l=0, r=0, t=30, b=0), paper_bgcolor='rgba(0,0,0,0)', plot_bgcolor='rgba(0,0,0,0)', font=dict(color='white'))
st.plotly_chart(fig, use_container_width=True)
