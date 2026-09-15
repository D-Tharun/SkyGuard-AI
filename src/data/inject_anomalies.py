import os
import glob
import pandas as pd
import numpy as np
import random
from datetime import datetime

# Define labels for anomaly types
LABEL_NORMAL = 0
LABEL_SPIKE = 1
LABEL_DRIFT = 2
LABEL_FREEZE = 3
LABEL_PHYSICS = 4

def init_ground_truth_columns(df):
    for col in ['temperature_c', 'relative_humidity_pct', 'surface_pressure_hpa']:
        df[f'original_{col}'] = df[col]
    df['fault_type'] = 'NONE'
    df['start_time'] = None
    df['end_time'] = None
    df['affected_variable'] = 'NONE'
    df['injection_parameters'] = 'NONE'
    df['anomaly_label'] = LABEL_NORMAL
    return df

def inject_spikes(df, col, num_spikes, max_magnitude=10.0):
    indices = random.sample(range(len(df)), num_spikes)
    for idx in indices:
        sign = 1 if random.random() > 0.5 else -1
        magnitude = random.uniform(max_magnitude / 2, max_magnitude)
        
        # Log meta
        df.at[idx, 'fault_type'] = 'SPIKE'
        df.at[idx, 'start_time'] = df.at[idx, 'timestamp']
        df.at[idx, 'end_time'] = df.at[idx, 'timestamp']
        df.at[idx, 'affected_variable'] = col
        df.at[idx, 'injection_parameters'] = f"magnitude={sign*magnitude:.2f}"
        
        df.at[idx, col] += (sign * magnitude)
        df.at[idx, 'anomaly_label'] = LABEL_SPIKE
    return df

def inject_drift(df, col, start_idx, duration, drift_rate_per_step=0.05):
    end_idx = min(start_idx + duration, len(df))
    accumulated_drift = 0.0
    
    start_time = df.at[start_idx, 'timestamp']
    end_time = df.at[end_idx-1, 'timestamp'] if end_idx > 0 else start_time
    
    for i in range(start_idx, end_idx):
        accumulated_drift += drift_rate_per_step
        df.at[i, 'fault_type'] = 'DRIFT'
        df.at[i, 'start_time'] = start_time
        df.at[i, 'end_time'] = end_time
        df.at[i, 'affected_variable'] = col
        df.at[i, 'injection_parameters'] = f"rate={drift_rate_per_step:.3f},duration={duration}"
        
        df.at[i, col] += accumulated_drift
        df.at[i, 'anomaly_label'] = LABEL_DRIFT
    return df

def inject_freeze(df, col, start_idx, duration):
    end_idx = min(start_idx + duration, len(df))
    stuck_value = df.at[start_idx, col]
    
    start_time = df.at[start_idx, 'timestamp']
    end_time = df.at[end_idx-1, 'timestamp'] if end_idx > 0 else start_time
    
    for i in range(start_idx, end_idx):
        df.at[i, 'fault_type'] = 'FREEZE'
        df.at[i, 'start_time'] = start_time
        df.at[i, 'end_time'] = end_time
        df.at[i, 'affected_variable'] = col
        df.at[i, 'injection_parameters'] = f"stuck_val={stuck_value:.2f},duration={duration}"
        
        df.at[i, col] = stuck_value
        df.at[i, 'anomaly_label'] = LABEL_FREEZE
    return df

def inject_physics_violation(df, start_idx):
    df.at[start_idx, 'fault_type'] = 'PHYSICS'
    df.at[start_idx, 'start_time'] = df.at[start_idx, 'timestamp']
    df.at[start_idx, 'end_time'] = df.at[start_idx, 'timestamp']
    df.at[start_idx, 'affected_variable'] = 'relative_humidity_pct'
    df.at[start_idx, 'injection_parameters'] = "value=115.0"
    
    df.at[start_idx, 'relative_humidity_pct'] = 115.0
    df.at[start_idx, 'anomaly_label'] = LABEL_PHYSICS
    return df

def process_station(input_file):
    print(f"Processing {os.path.basename(input_file)}...")
    df = pd.read_csv(input_file)
    df = init_ground_truth_columns(df)
    
    # Optional: Extract a station name from filename if not present
    if 'station' not in df.columns:
        station_name = os.path.basename(input_file).split('_')[0]
        df['station'] = station_name
        
    total_records = len(df)
    
    # 1% Spikes
    num_spikes = int(total_records * 0.01)
    df = inject_spikes(df, 'temperature_c', int(num_spikes * 0.5), max_magnitude=15.0)
    df = inject_spikes(df, 'surface_pressure_hpa', int(num_spikes * 0.5), max_magnitude=25.0)
    
    # 5 Drifts per station
    for _ in range(5):
        start = random.randint(0, total_records - 150)
        df = inject_drift(df, 'temperature_c', start, duration=120, drift_rate_per_step=0.03)
        
    # 10 Freezes per station
    for _ in range(10):
        start = random.randint(0, total_records - 30)
        duration = random.randint(8, 24)
        df = inject_freeze(df, 'relative_humidity_pct', start, duration)
        
    # 50 Physics Violations per station
    physics_indices = random.sample(range(total_records), 50)
    for idx in physics_indices:
        df = inject_physics_violation(df, idx)
        
    return df

def build_national_benchmark(input_dir, output_file):
    all_dfs = []
    # We only want the 2021-2024 full multi-year files to ensure consistency
    files = glob.glob(os.path.join(input_dir, "*2021_2024_hourly.csv"))
    
    if not files:
        print(f"Error: No multi-year dataset files found in {input_dir}")
        return
        
    for file in files:
        df = process_station(file)
        all_dfs.append(df)
        
    national_df = pd.concat(all_dfs, ignore_index=True)
    
    label_counts = national_df['anomaly_label'].value_counts()
    print("\n--- NATIONAL GROUND TRUTH DISTRIBUTION ---")
    print(f"Total Records: {len(national_df)}")
    print(f"0 (Normal): {label_counts.get(LABEL_NORMAL, 0)}")
    print(f"1 (Spikes): {label_counts.get(LABEL_SPIKE, 0)}")
    print(f"2 (Drifts): {label_counts.get(LABEL_DRIFT, 0)}")
    print(f"3 (Freeze): {label_counts.get(LABEL_FREEZE, 0)}")
    print(f"4 (Physics): {label_counts.get(LABEL_PHYSICS, 0)}")
    
    national_df.to_csv(output_file, index=False)
    print(f"\n[OK] National Benchmark saved to {output_file}")

if __name__ == "__main__":
    np.random.seed(42)
    random.seed(42)
    
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    input_dir = os.path.join(BASE_DIR, 'data', 'raw', 'open_meteo')
    output_csv = os.path.join(BASE_DIR, 'data', 'processed', 'national_benchmark_injected.csv')
    
    os.makedirs(os.path.dirname(output_csv), exist_ok=True)
    build_national_benchmark(input_dir, output_csv)
