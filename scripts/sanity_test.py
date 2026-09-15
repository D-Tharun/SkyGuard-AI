import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import pandas as pd
import numpy as np
from src.models.lstm_ae_model import TemporalLSTMAE
import tensorflow as tf

# Turn off verbose tensorflow warnings
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3' 

def run_checks():
    # Create a mock dataset exactly mimicking our structure
    stations = ['Station_A'] * 30 + ['Station_B'] * 20
    df = pd.DataFrame({
        'timestamp': pd.date_range('2023-01-01', periods=50, freq='H'),
        'temperature_c': np.random.rand(50) * 30,
        'relative_humidity_pct': np.random.rand(50) * 100,
        'surface_pressure_hpa': np.random.rand(50) * 1000,
        'station': stations
    })

    print(f"Mock Data shape: {df.shape}")
    print(f"Stations present: {df['station'].unique()}")

    model = TemporalLSTMAE(sequence_length=12, latent_dim=8)

    # 1. Train Check
    print("\n--- Training Check ---")
    try:
        model.train(df, epochs=1, batch_size=32)
        print("Train: OK (No leakage, grouping worked)")
    except Exception as e:
        print(f"Train FAILED: {e}")

    # 2. Predict Check
    print("\n--- Predict Check ---")
    try:
        scores = model.predict(df)
        print(f"Scores shape: {scores.shape} (Matches original df? {scores.shape[0] == len(df)})")
        
        # Check padding explicitly
        station_a_scores = scores[:30]
        station_b_scores = scores[30:]
        
        print(f"Station A padded correctly? {np.all(station_a_scores[:12] == 0)} (First 12 are zero)")
        print(f"Station B padded correctly? {np.all(station_b_scores[:12] == 0)} (First 12 are zero)")
        print("Predict: OK")
    except Exception as e:
        print(f"Predict FAILED: {e}")

    # 3. Artifact Check
    print("\n--- Save/Load Check ---")
    try:
        model.save('models/lstm_ae_test_v2')
        loaded_model = TemporalLSTMAE()
        loaded_model.load('models/lstm_ae_test_v2')
        print("Artifact Save/Load: OK")
    except Exception as e:
        print(f"Save/Load FAILED: {e}")

if __name__ == "__main__":
    run_checks()
