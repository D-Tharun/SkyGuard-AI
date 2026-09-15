import os
import glob
import uuid
import random
import pandas as pd
import numpy as np

LABEL_NORMAL = 0
LABEL_SPIKE = 1
LABEL_DRIFT = 2
LABEL_FREEZE = 3
LABEL_RANGE = 4
LABEL_COMM = 5
LABEL_MULTIVARIATE = 6

def generate_event_id():
    return str(uuid.uuid4())[:8]

def init_ground_truth_columns(df):
    for col in ['temperature_c', 'relative_humidity_pct', 'surface_pressure_hpa']:
        df[col] = df[col].astype(float)
        df[f'original_{col}'] = df[col]
    df['anomaly_label'] = LABEL_NORMAL
    return df

class AnomalyInjector:
    def __init__(self):
        self.manifest = []
        
    def _log_event(self, station, start_time, end_time, fault_type_num, fault_type_name, affected_var, orig_val, mod_val, severity, params):
        self.manifest.append({
            'event_id': generate_event_id(),
            'station': station,
            'start_time': start_time,
            'end_time': end_time,
            'fault_type_num': fault_type_num,
            'fault_type': fault_type_name,
            'affected_variable': affected_var,
            'original_value': orig_val,
            'modified_value': mod_val,
            'severity': severity,
            'injection_parameters': params
        })

    def inject_spikes(self, df, station_name, num_spikes):
        indices = random.sample(range(len(df)), num_spikes)
        for idx in indices:
            col = random.choice(['temperature_c', 'relative_humidity_pct', 'surface_pressure_hpa'])
            severity = random.choice(['small', 'medium', 'large'])
            
            if col == 'temperature_c':
                mag = {'small': 2.0, 'medium': 5.0, 'large': 15.0}[severity]
            elif col == 'relative_humidity_pct':
                mag = {'small': 5.0, 'medium': 15.0, 'large': 40.0}[severity]
            else:
                mag = {'small': 2.0, 'medium': 5.0, 'large': 20.0}[severity]
                
            sign = 1 if random.random() > 0.5 else -1
            magnitude = mag * random.uniform(0.8, 1.2) * sign
            
            orig_val = df.at[idx, col]
            mod_val = orig_val + magnitude
            df.at[idx, col] = mod_val
            df.at[idx, 'anomaly_label'] = LABEL_SPIKE
            
            self._log_event(station_name, df.at[idx, 'timestamp'], df.at[idx, 'timestamp'], 
                            LABEL_SPIKE, 'SPIKE', col, orig_val, mod_val, severity, f"mag={magnitude:.2f}")
        return df

    def inject_drift(self, df, station_name, num_drifts):
        total_records = len(df)
        for _ in range(num_drifts):
            start_idx = random.randint(0, total_records - 150)
            duration = random.randint(24, 120)
            end_idx = min(start_idx + duration, total_records)
            col = random.choice(['temperature_c', 'relative_humidity_pct', 'surface_pressure_hpa'])
            severity = random.choice(['slow', 'medium', 'fast'])
            
            rate = {'slow': 0.01, 'medium': 0.05, 'fast': 0.1}[severity]
            sign = 1 if random.random() > 0.5 else -1
            rate *= sign
            
            orig_start = df.at[start_idx, col]
            accumulated_drift = 0.0
            for i in range(start_idx, end_idx):
                accumulated_drift += rate
                df.at[i, col] += accumulated_drift
                df.at[i, 'anomaly_label'] = LABEL_DRIFT
                
            self._log_event(station_name, df.at[start_idx, 'timestamp'], df.at[end_idx-1, 'timestamp'],
                            LABEL_DRIFT, 'DRIFT', col, orig_start, df.at[end_idx-1, col], severity, f"rate={rate:.3f},dur={duration}")
        return df

    def inject_frozen(self, df, station_name, num_frozen):
        total_records = len(df)
        for _ in range(num_frozen):
            start_idx = random.randint(0, total_records - 50)
            duration = random.randint(12, 48)
            end_idx = min(start_idx + duration, total_records)
            col = random.choice(['temperature_c', 'relative_humidity_pct', 'surface_pressure_hpa'])
            
            stuck_val = df.at[start_idx, col]
            severity = 'exact' if random.random() > 0.5 else 'quantized'
            
            for i in range(start_idx, end_idx):
                val = stuck_val
                if severity == 'quantized':
                    val += random.choice([-0.1, 0.1])
                df.at[i, col] = val
                df.at[i, 'anomaly_label'] = LABEL_FREEZE
                
            self._log_event(station_name, df.at[start_idx, 'timestamp'], df.at[end_idx-1, 'timestamp'],
                            LABEL_FREEZE, 'FREEZE', col, df.at[start_idx, col], stuck_val, severity, f"dur={duration}")
        return df

    def inject_range(self, df, station_name, num_range):
        indices = random.sample(range(len(df)), num_range)
        for idx in indices:
            col = random.choice(['temperature_c', 'relative_humidity_pct'])
            severity = random.choice(['just_outside', 'severe', 'impossible'])
            orig_val = df.at[idx, col]
            
            if col == 'temperature_c':
                if severity == 'just_outside': mod_val = random.uniform(55, 60)
                elif severity == 'severe': mod_val = random.uniform(80, 100)
                else: mod_val = 9999.0
            else:
                if severity == 'just_outside': mod_val = random.uniform(101, 105)
                elif severity == 'severe': mod_val = random.uniform(120, 200)
                else: mod_val = -999.0
                
            df.at[idx, col] = mod_val
            df.at[idx, 'anomaly_label'] = LABEL_RANGE
            
            self._log_event(station_name, df.at[idx, 'timestamp'], df.at[idx, 'timestamp'],
                            LABEL_RANGE, 'RANGE', col, orig_val, mod_val, severity, "out_of_bounds")
        return df

    def inject_communication(self, df, station_name, num_comm):
        total_records = len(df)
        for _ in range(num_comm):
            start_idx = random.randint(0, total_records - 50)
            severity = random.choice(['burst_missing', 'missing_packet', 'partial_missing'])
            duration = random.randint(3, 10) if severity == 'burst_missing' else 1
            end_idx = min(start_idx + duration, total_records)
            
            orig_val = df.at[start_idx, 'temperature_c']
            
            for i in range(start_idx, end_idx):
                if severity == 'burst_missing' or severity == 'missing_packet':
                    df.at[i, 'temperature_c'] = np.nan
                    df.at[i, 'relative_humidity_pct'] = np.nan
                    df.at[i, 'surface_pressure_hpa'] = np.nan
                elif severity == 'partial_missing':
                    df.at[i, 'temperature_c'] = np.nan
                    
                df.at[i, 'anomaly_label'] = LABEL_COMM
                
            self._log_event(station_name, df.at[start_idx, 'timestamp'], df.at[end_idx-1, 'timestamp'],
                            LABEL_COMM, 'COMMUNICATION', 'all' if severity != 'partial_missing' else 'temperature_c', orig_val, np.nan, severity, f"dur={duration}")
        return df

    def inject_multivariate(self, df, station_name, num_multi):
        total_records = len(df)
        for _ in range(num_multi):
            idx = random.randint(0, total_records - 1)
            severity = random.choice(['t_rh_mismatch', 'moisture_mismatch'])
            
            orig_t = df.at[idx, 'temperature_c']
            orig_rh = df.at[idx, 'relative_humidity_pct']
            
            if severity == 't_rh_mismatch':
                # Increase T by 10, but leave RH the same (physically unlikely in many climates without fronts)
                df.at[idx, 'temperature_c'] += 10.0
                mod_val = df.at[idx, 'temperature_c']
                affected = 'temperature_c'
            else:
                # Drop RH by 40% but keep T same
                df.at[idx, 'relative_humidity_pct'] -= 40.0
                if df.at[idx, 'relative_humidity_pct'] < 0:
                    df.at[idx, 'relative_humidity_pct'] = 5.0
                mod_val = df.at[idx, 'relative_humidity_pct']
                affected = 'relative_humidity_pct'
                
            df.at[idx, 'anomaly_label'] = LABEL_MULTIVARIATE
            
            self._log_event(station_name, df.at[idx, 'timestamp'], df.at[idx, 'timestamp'],
                            LABEL_MULTIVARIATE, 'MULTIVARIATE', affected, orig_t if affected == 'temperature_c' else orig_rh, mod_val, severity, "")
        return df

def build_v2_benchmark(input_dir, output_csv, manifest_csv):
    files = glob.glob(os.path.join(input_dir, "*2021_2024_hourly.csv"))
    if not files:
        print(f"Error: No multi-year dataset files found in {input_dir}")
        return
        
    injector = AnomalyInjector()
    all_dfs = []
    
    for file in files:
        station_name = os.path.basename(file).split('_')[0]
        print(f"Processing {station_name}...")
        df = pd.read_csv(file)
        
        # Sort values just in case
        if not pd.api.types.is_datetime64_any_dtype(df['timestamp']):
            df['timestamp'] = pd.to_datetime(df['timestamp'])
        df = df.sort_values('timestamp').reset_index(drop=True)
        
        df = init_ground_truth_columns(df)
        df['station'] = station_name
        
        total = len(df)
        # Rates
        n_spikes = int(total * 0.005)
        n_range = int(total * 0.001)
        n_comm = int(total * 0.002)
        n_multi = int(total * 0.002)
        n_drift = 5
        n_frozen = 10
        
        df = injector.inject_spikes(df, station_name, n_spikes)
        df = injector.inject_drift(df, station_name, n_drift)
        df = injector.inject_frozen(df, station_name, n_frozen)
        df = injector.inject_range(df, station_name, n_range)
        df = injector.inject_communication(df, station_name, n_comm)
        df = injector.inject_multivariate(df, station_name, n_multi)
        
        all_dfs.append(df)
        
    final_df = pd.concat(all_dfs, ignore_index=True)
    manifest_df = pd.DataFrame(injector.manifest)
    
    os.makedirs(os.path.dirname(output_csv), exist_ok=True)
    final_df.to_csv(output_csv, index=False)
    manifest_df.to_csv(manifest_csv, index=False)
    
    print("\n--- V2 BENCHMARK GENERATION COMPLETE ---")
    print(f"Total Records: {len(final_df)}")
    print("Label Distribution:")
    print(final_df['anomaly_label'].value_counts().sort_index())
    print(f"Benchmark saved to {output_csv}")
    print(f"Manifest saved to {manifest_csv}")

if __name__ == "__main__":
    np.random.seed(42)
    random.seed(42)
    
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    input_dir = os.path.join(BASE_DIR, 'data', 'raw', 'open_meteo')
    output_csv = os.path.join(BASE_DIR, 'data', 'processed', 'national_benchmark_v2_injected.csv')
    manifest_csv = os.path.join(BASE_DIR, 'data', 'processed', 'injection_manifest.csv')
    
    build_v2_benchmark(input_dir, output_csv, manifest_csv)
