import os
import sys
import random
import pandas as pd
import numpy as np

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path = [BASE_DIR] + sys.path if 'sys' in locals() else [BASE_DIR]

from src.data.inject_anomalies_v2 import init_ground_truth_columns

def generate_subtle_benchmark(output_csv):
    print("Generating Subtle Fault Benchmark...")
    
    # Base normal values for 5000 hours
    timestamps = pd.date_range(start='2025-01-01 00:00:00', periods=5000, freq='h')
    temp = 25 + 5 * np.sin(np.linspace(0, 100, 5000)) + np.random.normal(0, 0.2, 5000)
    rh = 60 + 20 * np.cos(np.linspace(0, 100, 5000)) + np.random.normal(0, 1.0, 5000)
    pres = 1010 + np.random.normal(0, 0.5, 5000)
    
    df = pd.DataFrame({
        'timestamp': timestamps,
        'station': 'SubtleStation',
        'temperature_c': temp,
        'relative_humidity_pct': rh,
        'surface_pressure_hpa': pres,
        'anomaly_label': 0
    })
    
    df = init_ground_truth_columns(df)
    
    # Inject 1: Small Temperature Drift (barely noticeable)
    # Drift starts at index 1000, lasts 200 hours, rate 0.005C/hr (Total 1.0C drift)
    for i in range(1000, 1200):
        df.at[i, 'temperature_c'] += (i - 1000) * 0.005
        df.at[i, 'anomaly_label'] = 2 # DRIFT
        
    # Inject 2: Small RH Drift
    # Drift starts at index 2000, lasts 150 hours, rate 0.05%/hr (Total 7.5% drift)
    for i in range(2000, 2150):
        df.at[i, 'relative_humidity_pct'] += (i - 2000) * 0.05
        df.at[i, 'anomaly_label'] = 2 # DRIFT
        
    # Inject 3: Plausible Multivariate Mismatch
    # Temp and RH usually inversely correlated. We make RH drop slightly while Temp drops.
    # E.g. at index 3000, T drops by 3C (normal for night), but RH also drops by 15% (unusual)
    df.at[3000, 'temperature_c'] -= 3.0
    df.at[3000, 'relative_humidity_pct'] -= 15.0
    df.at[3000, 'anomaly_label'] = 6 # MULTIVARIATE
    
    # Inject 4: Partial data corruption / Slow degradation
    # Temp noise increases over time at index 4000
    for i in range(4000, 4100):
        noise = np.random.normal(0, 0.5 + (i-4000)*0.01)
        df.at[i, 'temperature_c'] += noise
        df.at[i, 'anomaly_label'] = 6 # Using multivariate/degradation label
        
    df.to_csv(output_csv, index=False)
    print(f"[OK] Subtle benchmark saved to {output_csv}")

if __name__ == "__main__":
    import sys
    out_file = os.path.join(BASE_DIR, 'data', 'processed', 'subtle_benchmark_injected.csv')
    os.makedirs(os.path.dirname(out_file), exist_ok=True)
    np.random.seed(123)
    generate_subtle_benchmark(out_file)
