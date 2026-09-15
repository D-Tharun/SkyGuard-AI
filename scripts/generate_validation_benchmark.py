import os
import pandas as pd
import numpy as np

def create_event(timestamps, event_type, stations, start_idx, end_idx):
    data = []
    for station in stations:
        # Base normal values
        temp = np.linspace(24.0, 26.0, len(timestamps)) + np.random.normal(0, 0.2, len(timestamps))
        rh = np.linspace(55.0, 58.0, len(timestamps)) + np.random.normal(0, 1.0, len(timestamps))
        pres = np.linspace(1012.0, 1010.0, len(timestamps)) + np.random.normal(0, 0.5, len(timestamps))
        
        if event_type == 'heatwave':
            temp[start_idx:end_idx] += np.linspace(0, 14, end_idx - start_idx)
            temp[end_idx:] += 14
            rh[start_idx:end_idx] -= np.linspace(0, 20, end_idx - start_idx)
            rh[end_idx:] -= 20
        elif event_type == 'cold_front':
            temp[start_idx:end_idx] -= np.linspace(0, 10, end_idx - start_idx)
            temp[end_idx:] -= 10
            pres[start_idx:end_idx] += np.linspace(0, 8, end_idx - start_idx)
            pres[end_idx:] += 8
        elif event_type == 'cyclone':
            pres[start_idx:end_idx] -= np.linspace(0, 18, end_idx - start_idx)
            pres[end_idx:] -= 18
            rh[start_idx:end_idx] += np.linspace(0, 35, end_idx - start_idx)
            rh[end_idx:] += 35
            
        # Introduce small inter-station variations
        variation = {'A': 0.6, 'B': -0.4, 'C': 1.2, 'D': -0.3, 'E': 0.1}
        temp += variation[station]
        
        df = pd.DataFrame({
            'timestamp': timestamps,
            'station': station,
            'temperature_c': temp,
            'relative_humidity_pct': rh,
            'surface_pressure_hpa': pres,
            'is_genuine_event': 0,
            'anomaly_label': 0,
            'fault_type': 'NONE',
            'affected_variable': 'NONE'
        })
        
        df.loc[start_idx:, 'is_genuine_event'] = 1
        data.append(df)
        
    final_df = pd.concat(data, ignore_index=True)
    for col in ['temperature_c', 'relative_humidity_pct', 'surface_pressure_hpa']:
        final_df[f'original_{col}'] = final_df[col]
        
    return final_df

def generate_validation_scenario(output_file):
    print("Generating Validation Benchmark Scenario...")
    
    # 5 distinct events in distinct periods (Aug, Sept, Oct, Nov, Dec 2026)
    timestamps_1 = pd.date_range(start='2026-08-01 00:00:00', periods=48, freq='h')
    timestamps_2 = pd.date_range(start='2026-09-01 00:00:00', periods=48, freq='h')
    timestamps_3 = pd.date_range(start='2026-10-01 00:00:00', periods=48, freq='h')
    timestamps_4 = pd.date_range(start='2026-11-01 00:00:00', periods=48, freq='h')
    timestamps_5 = pd.date_range(start='2026-12-01 00:00:00', periods=48, freq='h')
    
    stations = ['A', 'B', 'C', 'D', 'E']
    
    df_h1 = create_event(timestamps_1, 'heatwave', stations, 15, 35)
    df_c1 = create_event(timestamps_2, 'cold_front', stations, 10, 28)
    df_p1 = create_event(timestamps_3, 'cyclone', stations, 20, 40)
    df_h2 = create_event(timestamps_4, 'heatwave', stations, 12, 30)
    df_c2 = create_event(timestamps_5, 'cold_front', stations, 18, 38)
    
    # Inject Subtle Faults in ALL 5 events
    
    # 1. Heatwave 1: Station B subtle drift
    drift_start_h1 = 20
    for i in range(drift_start_h1, 30):
        idx = df_h1[(df_h1['station'] == 'B') & (df_h1['timestamp'] == timestamps_1[i])].index[0]
        df_h1.at[idx, 'temperature_c'] += (i - drift_start_h1) * 0.4 # Small drift
        df_h1.at[idx, 'anomaly_label'] = 2
        df_h1.at[idx, 'fault_type'] = 'DRIFT'
        
    # 2. Cold Front 1: Station D small spike
    idx = df_c1[(df_c1['station'] == 'D') & (df_c1['timestamp'] == timestamps_2[15])].index[0]
    df_c1.at[idx, 'temperature_c'] += 6.0 # Small enough not to be fully obvious
    df_c1.at[idx, 'anomaly_label'] = 1
    df_c1.at[idx, 'fault_type'] = 'SPIKE'
    
    # 3. Cyclone 1: Station A subtle drift
    drift_start_p1 = 25
    for i in range(drift_start_p1, 35):
        idx = df_p1[(df_p1['station'] == 'A') & (df_p1['timestamp'] == timestamps_3[i])].index[0]
        df_p1.at[idx, 'surface_pressure_hpa'] -= (i - drift_start_p1) * 1.5
        df_p1.at[idx, 'anomaly_label'] = 2
        df_p1.at[idx, 'fault_type'] = 'DRIFT'
        
    # 4. Heatwave 2: Station C multivariate fault (humidity stays high during heatwave)
    for i in range(20, 25):
        idx = df_h2[(df_h2['station'] == 'C') & (df_h2['timestamp'] == timestamps_4[i])].index[0]
        df_h2.at[idx, 'relative_humidity_pct'] = 60.0
        df_h2.at[idx, 'anomaly_label'] = 6
        df_h2.at[idx, 'fault_type'] = 'MULTIVARIATE'
        
    # 5. Cold Front 2: Station E comm fault
    for i in range(25, 27):
        idx = df_c2[(df_c2['station'] == 'E') & (df_c2['timestamp'] == timestamps_5[i])].index[0]
        df_c2.at[idx, 'temperature_c'] = np.nan
        df_c2.at[idx, 'anomaly_label'] = 5
        df_c2.at[idx, 'fault_type'] = 'COMMUNICATION'
    
    final_df = pd.concat([df_h1, df_c1, df_p1, df_h2, df_c2], ignore_index=True)
    final_df = final_df.sort_values(by=['timestamp', 'station']).reset_index(drop=True)
    
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    final_df.to_csv(output_file, index=False)
    
    # Print metrics
    n_events = final_df['is_genuine_event'].sum()
    n_faults = (final_df['anomaly_label'] > 0).sum()
    print(f"[OK] Validation scenario saved to {output_file}")
    print(f"Validation Event Data Points: {n_events}")
    print(f"Validation Fault Data Points: {n_faults}")

if __name__ == "__main__":
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    output_csv = os.path.join(BASE_DIR, 'data', 'processed', 'validation_benchmark_injected.csv')
    np.random.seed(999) # Different seed from test set
    generate_validation_scenario(output_csv)
