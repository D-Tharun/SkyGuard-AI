import numpy as np
import pandas as pd

class EventAwareFusionEngine:
    """
    The event-aware decision engine of SkyGuard AI.
    Differentiates between Sensor Faults and Genuine Extreme Meteorological Events.
    Combines independent signals into Anomaly Evidence and Event Evidence.
    """
    
    def __init__(self):
        pass
        
    def _calculate_spatial_evidence(self, df):
        """
        Calculates spatial evidence if neighbour data is available.
        Adds 'spatial_deviation' (abs difference from neighbour median).
        Adds 'spatial_evidence_available' boolean.
        """
        df_out = df.copy()
        
        # If no station column or only 1 station, spatial evidence is unavailable
        if 'station' not in df_out.columns or df_out['station'].nunique() <= 1:
            df_out['spatial_deviation'] = np.nan
            df_out['spatial_evidence_available'] = False
            return df_out
            
        # We have multiple stations. Compute neighbour median for each timestamp.
        temp_med = df_out.groupby('timestamp')['temperature_c'].transform('median')
        rh_med = df_out.groupby('timestamp')['relative_humidity_pct'].transform('median')
        pres_med = df_out.groupby('timestamp')['surface_pressure_hpa'].transform('median')
        
        # Calculate deviation across variables
        temp_dev = np.abs(df_out['temperature_c'] - temp_med)
        
        # Max normalized deviation (using approx typical standard deviations for normalization)
        # Temp: ~3C, RH: ~10%, Pres: ~3hPa
        norm_temp = temp_dev / 3.0
        norm_rh = np.abs(df_out['relative_humidity_pct'] - rh_med) / 10.0
        norm_pres = np.abs(df_out['surface_pressure_hpa'] - pres_med) / 3.0
        
        df_out['spatial_deviation'] = temp_dev
        df_out['spatial_deviation_max_norm'] = df_out[['temperature_c']].assign(nt=norm_temp, nr=norm_rh, np=norm_pres)[['nt', 'nr', 'np']].max(axis=1)
        df_out['spatial_evidence_available'] = True
        return df_out

    def _calculate_temporal_multivariate_event_evidence(self, df):
        """
        Calculates supporting evidence for a genuine event based on local temporal/multivariate traits.
        """
        df_out = df.copy()
        
        # Genuine events usually show gradual development. 
        # Calculate rate of change over the last few hours.
        # We need data sorted by station and timestamp
        if 'station' in df_out.columns:
            df_out = df_out.sort_values(['station', 'timestamp'])
        else:
            df_out = df_out.sort_values(['timestamp'])
            
        group = df_out.groupby('station') if 'station' in df_out.columns else df_out
        
        # 1-hour and 3-hour diffs
        df_out['temp_diff_1h'] = group['temperature_c'].diff(1).fillna(0)
        df_out['temp_diff_3h'] = group['temperature_c'].diff(3).fillna(0)
        
        # Genuine events shouldn't have massive 1h jumps compared to 3h jumps
        # Spike evidence: huge 1h diff, but 3h diff is similar (returns to normal)
        # Event evidence: gradual 3h diff is large, 1h diff is moderate.
        
        return df_out

    def calculate_evidences(self, df):
        """
        Calculates S_anomaly and S_event.
        Expects df to have: 'physics_score', 'stat_score', 'if_score', 'lstm_score'
        """
        df_out = df.copy()
        
        # 1. Anomaly Evidence (S_anomaly)
        # Higher score = stronger evidence of a fault/anomaly
        # Take the maximum signal across all detectors to ensure subtle faults (like drift detected by ML) are not averaged away.
        df_out['S_anomaly'] = df_out[['physics_score', 'stat_score', 'if_score', 'lstm_score']].max(axis=1)
        # Hard overrides for SPIKE and FREEZE
        df_out.loc[df_out.get('spike_flag', 0) > 0, 'S_anomaly'] = np.maximum(df_out['S_anomaly'], 0.9)
        df_out.loc[df_out.get('freeze_flag', 0) > 0, 'S_anomaly'] = np.maximum(df_out['S_anomaly'], 0.9)
        
        # 2. Event Evidence (S_event)
        df_out['S_event'] = 0.0
        
        # Temporal event evidence:
        # High 'lstm_score' + moderate 'if_score' + NO spike/freeze + gradual temp change
        # If it's a gradual drift, it could be an event.
        temp_gradual = (np.abs(df_out['temp_diff_1h']) < 3.0) & (np.abs(df_out['temp_diff_3h']) > 2.0)
        df_out.loc[temp_gradual, 'S_event'] += 0.3
        
        # Multivariate event evidence:
        # IForest flags it, but physics is okay (no impossible state)
        multiv_coherent = (df_out['if_score'] > 0.5) & (df_out['physics_score'] < 0.1)
        df_out.loc[multiv_coherent, 'S_event'] += 0.2
        
        # Spatial event evidence
        # If deviation from neighbour median is low (< 2.0C), it's highly likely a genuine regional event.
        spatial_agreement = (df_out['spatial_evidence_available']) & (df_out['spatial_deviation'] < 2.0)
        df_out.loc[spatial_agreement, 'S_event'] += 0.5
        
        # Clip scores
        df_out['S_anomaly'] = np.clip(df_out['S_anomaly'], 0.0, 1.0)
        df_out['S_event'] = np.clip(df_out['S_event'], 0.0, 1.0)
        
        return df_out
        
    def determine_final_state(self, row):
        """
        Rule-based diagnostic logic combining S_anomaly, S_event, and spatial availability.
        Returns: Final State, Reason, Confidence
        """
        S_a = row['S_anomaly']
        S_e = row['S_event']
        spatial_avail = row['spatial_evidence_available']
        
        # Base confidence calculation
        confidence = 0.90 if spatial_avail else 0.70
        
        # HARD DATA FAULTS (Missing, Freeze, Impossible Physics)
        # These override event evidence completely.
        if row.get('physics_score', 0) > 0.8 or row.get('freeze_flag', 0) > 0 or pd.isna(row.get('temperature_c')) or pd.isna(row.get('relative_humidity_pct')) or pd.isna(row.get('surface_pressure_hpa')):
            if pd.isna(row.get('temperature_c')) or pd.isna(row.get('relative_humidity_pct')) or pd.isna(row.get('surface_pressure_hpa')):
                return "COMMUNICATION_FAULT", "Missing data (NaN detected).", 0.99
            elif row.get('freeze_flag', 0) > 0:
                return "FROZEN_FAULT", "Hard data integrity fault (frozen).", 0.99
            else:
                return "RANGE_FAULT", "Physically impossible state.", 0.99
                
        # NORMAL
        if S_a < 0.5 and S_e < 0.5:
            return "NORMAL", "All indicators within normal ranges.", confidence
            
        # SENSOR FAULT (High Fault, Low Event)
        if S_a >= 0.5 and S_e < 0.5:
            reasons = []
            fault_type = "SENSOR_FAULT"
            
            if row.get('spike_flag', 0) > 0: 
                reasons.append("Sudden unnatural value jump.")
                fault_type = "SPIKE_FAULT"
            elif row.get('lstm_score', 0) > 0.6 and row.get('if_score', 0) < 0.6:
                fault_type = "DRIFT_FAULT"
            elif row.get('if_score', 0) > 0.6:
                fault_type = "MULTIVARIATE_FAULT"
                
            if spatial_avail and row.get('spatial_deviation_max_norm', 0) > 1.0: 
                reasons.append(f"Deviates heavily from neighbours (Norm Dev: {row.get('spatial_deviation_max_norm', 0):.1f}).")
            reason_str = " | ".join(reasons) if reasons else f"High anomaly score ({S_a:.2f}) with low event support."
            return fault_type, reason_str, confidence
            
        # GENUINE EXTREME EVENT (High Event, Low Fault)
        if S_e >= 0.5 and S_a < 0.5:
            return "GENUINE_EXTREME_EVENT", f"Strong event evidence ({S_e:.2f}).", confidence
            
        # CONFLICT: High Fault AND High Event
        if S_a >= 0.5 and S_e >= 0.5:
            # We resolve this using multi-variable spatial deviation
            if spatial_avail:
                # Dynamic threshold based on formal validation set tuning
                # Selected: ML Gate = 0.75, Spatial Threshold = 0.10
                threshold = 1.0
                if row.get('lstm_score', 0) > 0.75 or row.get('if_score', 0) > 0.75:
                    # ML is highly confident; require only minimal spatial deviation
                    threshold = 0.10
                    
                if row.get('spatial_deviation_max_norm', 0) > threshold:
                    fault_type = "SENSOR_FAULT"
                    if row.get('spike_flag', 0) > 0: fault_type = "SPIKE_FAULT"
                    elif row.get('if_score', 0) > 0.6: fault_type = "MULTIVARIATE_FAULT"
                    elif row.get('lstm_score', 0) > 0.6: fault_type = "DRIFT_FAULT"
                    return fault_type, f"Station deviates (Norm Dev: {row.get('spatial_deviation_max_norm', 0):.1f}) from regional event.", confidence + 0.05
                else:
                    return "GENUINE_EXTREME_EVENT", "High anomaly scores but supported by strong multi-variable regional coherence.", confidence - 0.1
            else:
                return "UNCERTAIN_REVIEW", f"Evidence conflict (S_a={S_a:.2f}, S_e={S_e:.2f}) and no spatial data.", confidence - 0.2
                
        # Default fallback
        return "UNCERTAIN_REVIEW", f"Scores in grey area. S_a={S_a:.2f}, S_e={S_e:.2f}", confidence - 0.3

    def run_fusion(self, df, disable_spatial=False):
        """
        Executes the full event-aware fusion pipeline.
        Returns dataframe with 'final_state', 'reason', and 'confidence'.
        If disable_spatial is True, skips spatial evidence calculation and forces it to unavailable.
        """
        df_out = df.copy()
        
        # Ensure base columns
        for col in ['physics_score', 'stat_score', 'if_score', 'lstm_score', 'freeze_flag', 'spike_flag']:
            if col not in df_out.columns:
                df_out[col] = 0.0
                
        # 1. Pre-calculate spatial & temporal features
        if disable_spatial:
            df_out['spatial_deviation'] = np.nan
            df_out['spatial_evidence_available'] = False
        else:
            df_out = self._calculate_spatial_evidence(df_out)
            
        df_out = self._calculate_temporal_multivariate_event_evidence(df_out)
        
        # 2. Calculate S_anomaly and S_event
        df_out = self.calculate_evidences(df_out)
        
        # 3. Determine Final State
        results = df_out.apply(self.determine_final_state, axis=1)
        
        df_out['final_state'] = [res[0] for res in results]
        df_out['reason'] = [res[1] for res in results]
        df_out['confidence'] = [res[2] for res in results]
        
        # For legacy compatibility in evaluate_models, we can map fusion_score
        # A high S_anomaly and low S_event yields a high fusion score (fault)
        df_out['fusion_score'] = df_out['S_anomaly'] * (1 - df_out['S_event'])
        
        # Restore original order
        df_out = df_out.sort_index()
        
        return df_out

if __name__ == "__main__":
    # Test script
    engine = EventAwareFusionEngine()
    test_df = pd.DataFrame({
        'station': ['A', 'A', 'B', 'B'],
        'timestamp': pd.to_datetime(['2023-01-01 10:00:00', '2023-01-01 11:00:00', '2023-01-01 10:00:00', '2023-01-01 11:00:00']),
        'temperature_c': [30.0, 45.0, 30.1, 30.2], # Station A spiked at 11:00
        'physics_score': [0.0, 0.0, 0.0, 0.0],
        'stat_score': [0.0, 1.0, 0.0, 0.0],
        'if_score': [0.1, 0.9, 0.1, 0.1],
        'lstm_score': [0.05, 0.8, 0.05, 0.05],
        'spike_flag': [0, 1, 0, 0],
        'freeze_flag': [0, 0, 0, 0]
    })
    
    result = engine.run_fusion(test_df)
    print("Event-Aware Fusion Test Results:")
    for i, row in result.iterrows():
        print(f"Station {row['station']} | Final: {row['final_state']} | S_a: {row['S_anomaly']:.2f} | S_e: {row['S_event']:.2f} | Conf: {row['confidence']:.2f}")
        print(f"   Reason: {row['reason']}")
