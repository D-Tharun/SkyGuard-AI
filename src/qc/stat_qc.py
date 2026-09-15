import numpy as np
import pandas as pd

class StatisticalQCEngine:
    """
    Statistical and Temporal Quality Control Engine.
    Simulates edge-level (ESP32) and basic server-level rate-of-change and persistence checks.
    """
    
    def __init__(self, spike_threshold_temp=5.0, spike_threshold_pres=10.0, freeze_duration_hours=6):
        self.spike_threshold_temp = spike_threshold_temp # Max valid jump in 1 hour (°C)
        self.spike_threshold_pres = spike_threshold_pres # Max valid jump in 1 hour (hPa)
        self.freeze_duration_hours = freeze_duration_hours # Hours of zero-variance to flag as frozen
        
    def check_spikes(self, df):
        """
        Flag sudden spikes / rate of change violations.
        Returns a boolean mask where True = Spike Anomaly.
        """
        # Calculate step differences (absolute change from t-1 to t)
        if 'station' in df.columns:
            # Sort by station and time to ensure proper diffs
            df_sorted = df.sort_values(by=['station', 'timestamp'])
            temp_diff = df_sorted.groupby('station')['temperature_c'].diff().abs()
            pres_diff = df_sorted.groupby('station')['surface_pressure_hpa'].diff().abs()
            # Align back to original index
            temp_diff = temp_diff.loc[df.index]
            pres_diff = pres_diff.loc[df.index]
        else:
            temp_diff = df['temperature_c'].diff().abs()
            pres_diff = df['surface_pressure_hpa'].diff().abs()
        
        # Rule: jump cannot exceed thresholds in a single timestep
        temp_spike = temp_diff > self.spike_threshold_temp
        pres_spike = pres_diff > self.spike_threshold_pres
        
        return (temp_spike | pres_spike).astype(int)
        
    def check_persistence(self, df):
        """
        Flag frozen sensors (flatlining).
        Returns a boolean mask where True = Frozen Sensor Anomaly.
        """
        # Calculate rolling standard deviation over the freeze duration window
        if 'station' in df.columns:
            df_sorted = df.sort_values(by=['station', 'timestamp'])
            temp_std = df_sorted.groupby('station')['temperature_c'].rolling(window=self.freeze_duration_hours, min_periods=self.freeze_duration_hours).std().reset_index(level=0, drop=True)
            rh_std = df_sorted.groupby('station')['relative_humidity_pct'].rolling(window=self.freeze_duration_hours, min_periods=self.freeze_duration_hours).std().reset_index(level=0, drop=True)
            temp_std = temp_std.loc[df.index]
            rh_std = rh_std.loc[df.index]
        else:
            temp_std = df['temperature_c'].rolling(window=self.freeze_duration_hours, min_periods=self.freeze_duration_hours).std()
            rh_std = df['relative_humidity_pct'].rolling(window=self.freeze_duration_hours, min_periods=self.freeze_duration_hours).std()
        
        # Rule: if standard deviation is exactly 0.0 over 6 hours, the sensor is stuck
        # (Real atmosphere always has some micro-variance in decimal places)
        temp_frozen = temp_std == 0.0
        rh_frozen = rh_std == 0.0
        
        return (temp_frozen | rh_frozen).astype(int)
        
    def run_statistical_checks(self, df):
        """
        Run all statistical/edge checks.
        Returns a tuple: (combined_score, spike_flags, freeze_flags)
        """
        spike_flags = self.check_spikes(df)
        freeze_flags = self.check_persistence(df)
        
        # Combined hard flag (1 if any stat check fails)
        combined_stat_anomaly = spike_flags | freeze_flags
        
        return combined_stat_anomaly.astype(int), spike_flags, freeze_flags

if __name__ == "__main__":
    # Quick test
    engine = StatisticalQCEngine(freeze_duration_hours=3)
    test_df = pd.DataFrame({
        'temperature_c': [25.0, 25.1, 25.0, 45.0, 45.0, 45.0, 45.0], # Spike at idx 3, frozen after
        'relative_humidity_pct': [50.0, 51.0, 50.0, 50.0, 50.0, 50.0, 50.0], # Frozen after idx 2
        'surface_pressure_hpa': [1013.25] * 7
    })
    
    score, spikes, freezes = engine.run_statistical_checks(test_df)
    test_df['spike_flag'] = spikes
    test_df['freeze_flag'] = freezes
    test_df['stat_score'] = score
    print("Statistical Engine Test Results:")
    print(test_df)
