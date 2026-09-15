import os
import sys
import pandas as pd
import numpy as np

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.models.iforest_model import MultivariateIForest
from src.models.lstm_ae_model import TemporalLSTMAE
from src.qc.physics_qc import PhysicsEngine
from src.qc.stat_qc import StatisticalQCEngine
from src.qc.fusion import EventAwareFusionEngine

def run_integration_test():
    print("--- REAL ML INTEGRATION TEST ---")
    
    # 1. Load Data
    # A. normal weather sample
    # B. anomalous sample (spike)
    # C. multi-row chronological sample for one station
    # D. two-station sample proving LSTM sequences do not cross station boundaries
    
    dates1 = pd.date_range('2024-01-01 00:00:00', periods=20, freq='h')
    dates2 = pd.date_range('2024-01-01 00:00:00', periods=15, freq='h')
    
    df1 = pd.DataFrame({
        'timestamp': dates1,
        'station': ['Station_A'] * 20,
        'temperature_c': 25.0 + 2.0 * np.sin(np.linspace(0, 5, 20)),
        'relative_humidity_pct': 60.0 + 5.0 * np.cos(np.linspace(0, 5, 20)),
        'surface_pressure_hpa': 1010.0 + np.random.normal(0, 0.5, 20)
    })
    
    # Add an anomaly (spike) at index 15
    df1.loc[15, 'temperature_c'] = 45.0
    
    df2 = pd.DataFrame({
        'timestamp': dates2,
        'station': ['Station_B'] * 15,
        'temperature_c': 15.0 + 2.0 * np.sin(np.linspace(0, 5, 15)),
        'relative_humidity_pct': 80.0 + 5.0 * np.cos(np.linspace(0, 5, 15)),
        'surface_pressure_hpa': 1000.0 + np.random.normal(0, 0.5, 15)
    })
    
    df = pd.concat([df1, df2], ignore_index=True)
    
    # Base Processing
    phys = PhysicsEngine()
    df = phys.add_derived_features(df)
    df['physics_score'] = phys.run_physics_checks(df)
    
    stat = StatisticalQCEngine()
    df['stat_score'], df['spike_flag'], df['freeze_flag'] = stat.run_statistical_checks(df)
    
    # 2. Real ML Inference
    print("Loading ML Artifacts...")
    try:
        iforest = MultivariateIForest()
        iforest.load('models/iforest_v2.pkl')
        
        lstm_ae = TemporalLSTMAE()
        lstm_ae.load('models/lstm_ae_v2')
        print("✅ Models loaded successfully.")
    except Exception as e:
        print(f"❌ Model load failed: {e}")
        return

    print("Running Inference...")
    df['if_score'] = iforest.predict(df)
    df['lstm_score'] = lstm_ae.predict(df)
    
    print("\n--- INFERENCE RESULTS ---")
    print(f"IForest Score Range: {df['if_score'].min():.4f} to {df['if_score'].max():.4f}")
    print(f"LSTM Score Range: {df['lstm_score'].min():.4f} to {df['lstm_score'].max():.4f}")
    
    # Check station boundary on LSTM
    lstm_a = df[df['station'] == 'Station_A']['lstm_score'].values
    lstm_b = df[df['station'] == 'Station_B']['lstm_score'].values
    
    print("\nLSTM Padding Check (proves station isolation):")
    print(f"Station A first 12 rows are 0? {np.all(lstm_a[:12] == 0)}")
    print(f"Station B first 12 rows are 0? {np.all(lstm_b[:12] == 0)}")
    
    print("\nAnomaly Detection Check (Station A, index 15 = 45C spike):")
    print(f"Row 14 (Normal) - IForest: {df.loc[14, 'if_score']:.4f}, LSTM: {df.loc[14, 'lstm_score']:.4f}")
    print(f"Row 15 (Spike)  - IForest: {df.loc[15, 'if_score']:.4f}, LSTM: {df.loc[15, 'lstm_score']:.4f}")
    
    # 3. Fusion
    print("\nRunning Fusion...")
    fusion = EventAwareFusionEngine()
    
    # Mock spatial data for fusion (requires spatial_evidence_available etc)
    # The benchmark adds this, we'll mock it for the test
    df['spatial_evidence_available'] = False
    df['spatial_deviation'] = 0.0
    
    df = fusion.run_fusion(df)
    
    print(f"Row 15 Final State: {df.loc[15, 'final_state']} (S_anomaly: {df.loc[15, 'S_anomaly']:.4f})")
    print("✅ Integration test complete.")

if __name__ == "__main__":
    run_integration_test()
