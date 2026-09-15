import os
import pandas as pd
import numpy as np

def create_event(timestamps, event_type, stations, start_idx, end_idx):
    data = []
    for station in stations:
        # Base normal values
        temp = np.linspace(25.0, 27.0, len(timestamps)) + np.random.normal(0, 0.2, len(timestamps))
        rh = np.linspace(50.0, 52.0, len(timestamps)) + np.random.normal(0, 1.0, len(timestamps))
        pres = np.linspace(1010.0, 1009.0, len(timestamps)) + np.random.normal(0, 0.5, len(timestamps))
        
        if event_type == 'heatwave':
            temp[start_idx:end_idx] += np.linspace(0, 15, end_idx - start_idx)
            temp[end_idx:] += 15
            rh[start_idx:end_idx] -= np.linspace(0, 25, end_idx - start_idx)
            rh[end_idx:] -= 25
        elif event_type == 'cold_front':
            temp[start_idx:end_idx] -= np.linspace(0, 12, end_idx - start_idx)
            temp[end_idx:] -= 12
            pres[start_idx:end_idx] += np.linspace(0, 10, end_idx - start_idx)
            pres[end_idx:] += 10
        elif event_type == 'cyclone':
            pres[start_idx:end_idx] -= np.linspace(0, 20, end_idx - start_idx)
            pres[end_idx:] -= 20
            rh[start_idx:end_idx] += np.linspace(0, 40, end_idx - start_idx)
            rh[end_idx:] += 40
            
        # Introduce small inter-station variations
        variation = {'A': 0.5, 'B': -0.5, 'C': 1.0, 'D': -0.2, 'E': 0.3}
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

def generate_demo_scenario(output_file):
    print("Generating Expanded Genuine Events Scenario...")
    
    timestamps_h = pd.date_range(start='2026-05-10 00:00:00', periods=48, freq='h')
    timestamps_c = pd.date_range(start='2026-06-10 00:00:00', periods=48, freq='h')
    timestamps_p = pd.date_range(start='2026-07-10 00:00:00', periods=48, freq='h')
    
    stations = ['A', 'B', 'C', 'D', 'E']
    
    df_heatwave = create_event(timestamps_h, 'heatwave', stations, 20, 40)
    df_coldfront = create_event(timestamps_c, 'cold_front', stations, 10, 25)
    df_cyclone = create_event(timestamps_p, 'cyclone', stations, 15, 30)
    
    # Inject Faults
    # Heatwave: Station E spikes
    idx = df_heatwave[(df_heatwave['station'] == 'E') & (df_heatwave['timestamp'] == timestamps_h[35])].index[0]
    df_heatwave.at[idx, 'temperature_c'] = 72.0
    df_heatwave.at[idx, 'anomaly_label'] = 1
    df_heatwave.at[idx, 'fault_type'] = 'SPIKE'
    
    # Cold front: Station B drifts
    drift_start = timestamps_c[15]
    for i in range(15, 25):
        idx = df_coldfront[(df_coldfront['station'] == 'B') & (df_coldfront['timestamp'] == timestamps_c[i])].index[0]
        df_coldfront.at[idx, 'temperature_c'] += (i - 15) * 0.5
        df_coldfront.at[idx, 'anomaly_label'] = 2
        df_coldfront.at[idx, 'fault_type'] = 'DRIFT'
        
    # Cyclone: Station C missing data
    idx = df_cyclone[(df_cyclone['station'] == 'C') & (df_cyclone['timestamp'] == timestamps_p[20])].index[0]
    df_cyclone.at[idx, 'surface_pressure_hpa'] = np.nan
    df_cyclone.at[idx, 'anomaly_label'] = 5
    df_cyclone.at[idx, 'fault_type'] = 'COMMUNICATION'
    
    final_df = pd.concat([df_heatwave, df_coldfront, df_cyclone], ignore_index=True)
    final_df = final_df.sort_values(by=['timestamp', 'station']).reset_index(drop=True)
    
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    final_df.to_csv(output_file, index=False)
    print(f"[OK] Demo scenario saved to {output_file}")

if __name__ == "__main__":
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    output_csv = os.path.join(BASE_DIR, 'data', 'processed', 'delhi_benchmark_injected.csv')
    np.random.seed(42)
    generate_demo_scenario(output_csv)
