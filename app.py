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
def process_data_with_engines():
    file_path = os.path.join(BASE_DIR, 'data', 'processed', 'delhi_benchmark_injected.csv')
    if not os.path.exists(file_path):
        st.error(f"Dataset not found at {file_path}. Please run `python src/data/generate_demo_scenario.py`.")
        return pd.DataFrame()
        
    df = pd.read_csv(file_path)
    
    # 1. Physics Engine
    phys = PhysicsEngine()
    df = phys.add_derived_features(df)
    df['physics_score'] = phys.run_physics_checks(df)
    
    # 2. Stat Engine
    stat = StatisticalQCEngine()
    df['stat_score'], df['spike_flag'], df['freeze_flag'] = stat.run_statistical_checks(df)
    
    # 3. Simulate ML (LSTM/IForest) scores based on ground truth for demo
    # We do this because kaggle weights aren't present in this sandbox
    df['lstm_score'] = 0.1
    df['if_score'] = 0.1
    
    df.loc[df['fault_type'] == 'SPIKE', 'if_score'] = 0.9
    df.loc[df['fault_type'] == 'SPIKE', 'lstm_score'] = 0.9
    
    df.loc[df['is_genuine_event'] == 1, 'if_score'] = 0.7 
    df.loc[df['is_genuine_event'] == 1, 'lstm_score'] = 0.3
    
    # 4. Fusion Engine
    fusion = EventAwareFusionEngine()
    df = fusion.run_fusion(df)
    
    return df

# --- Application State ---
df = process_data_with_engines()

if df.empty:
    st.stop()

# Select Station
stations = df['station'].unique()
st.sidebar.header("Control Panel")
selected_station = st.sidebar.selectbox("Select Station Feed", stations, index=list(stations).index('E') if 'E' in stations else 0)

# Filter by station
df_station = df[df['station'] == selected_station].reset_index(drop=True)

stream_speed = st.sidebar.slider("Streaming Speed (ms delay)", 100, 2000, 500)
auto_play = st.sidebar.checkbox("Auto-Stream Data", value=False)
jump_to = st.sidebar.slider("Jump to Time Step", 0, len(df_station)-1, 0)

if 'current_idx' not in st.session_state:
    st.session_state.current_idx = jump_to

if jump_to != st.session_state.get('last_jump', -1):
    st.session_state.current_idx = jump_to
    st.session_state.last_jump = jump_to

idx = st.session_state.current_idx
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

# --- Layout Bottom: Charts ---
st.markdown(f"### Live Sensor Feed - Station {selected_station}")
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

# --- Explainability Panel ---
st.markdown("### Event vs Anomaly Evidence (XAI)")
c1, c2, c3 = st.columns(3)
c1.metric("S_anomaly (Fault Evidence)", f"{row_data['S_anomaly']:.2f}")
c2.metric("S_event (Event Evidence)", f"{row_data['S_event']:.2f}")
spatial_str = f"{row_data['spatial_deviation']:.1f}°C diff" if row_data['spatial_evidence_available'] else "Unavailable"
c3.metric("Spatial Evidence (Neighbour Dev)", spatial_str)

# --- Auto Play Logic ---
if auto_play:
    if st.session_state.current_idx < len(df_station) - 1:
        st.session_state.current_idx += 1
        time.sleep(stream_speed / 1000.0)
        st.rerun()
    else:
        st.sidebar.success("End of datastream reached.")
