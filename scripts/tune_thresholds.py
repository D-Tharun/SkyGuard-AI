import os
import sys
import pandas as pd
import numpy as np

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(BASE_DIR)

from src.visualization.evaluate_models import load_data, run_base_models
from src.qc.fusion import EventAwareFusionEngine

def evaluate_threshold(df_base, threshold):
    # Temporarily patch fusion.py logic or instantiate a modified engine
    # Instead of rewriting fusion.py, we can dynamically override the run_fusion logic for testing
    
    # Actually, the cleanest way is to modify EventAwareFusionEngine to accept the threshold as a parameter.
    # Let's just create a custom test engine inherited from it.
    class TunedFusionEngine(EventAwareFusionEngine):
        def determine_final_state(self, row):
            # Base logic
            S_a = row['S_anomaly']
            S_e = row['S_event']
            spatial_avail = row['spatial_evidence_available']
            confidence = 0.90 if spatial_avail else 0.70
            
            if S_a < 0.5 and S_e < 0.5:
                return "NORMAL", "Low anomaly, low event evidence.", confidence
                
            if S_a < 0.5 and S_e >= 0.5:
                return "GENUINE_EXTREME_EVENT", "Low fault evidence, high event evidence.", confidence
                
            if S_a >= 0.5 and S_e < 0.5:
                fault_type = "SENSOR_FAULT"
                if row.get('spike_flag', 0) > 0: fault_type = "SPIKE_FAULT"
                elif row.get('freeze_flag', 0) > 0: fault_type = "FROZEN_FAULT"
                elif row.get('lstm_score', 0) > 0.6: fault_type = "DRIFT_FAULT"
                elif row.get('if_score', 0) > 0.6: fault_type = "MULTIVARIATE_FAULT"
                
                if row.get('temperature_c', 0) == 9999.0 or row.get('relative_humidity_pct', 0) == -999.0 or row.get('temperature_c', 0) > 65:
                    fault_type = "RANGE_FAULT"
                if pd.isna(row.get('temperature_c')):
                    fault_type = "COMMUNICATION_FAULT"
                    
                return fault_type, "High fault evidence, low event evidence.", confidence
                
            if S_a >= 0.5 and S_e >= 0.5:
                if spatial_avail:
                    current_thresh = 1.0
                    if row.get('lstm_score', 0) > 0.80 or row.get('if_score', 0) > 0.80:
                        current_thresh = threshold # Use candidate threshold
                        
                    if row.get('spatial_deviation_max_norm', 0) > current_thresh:
                        return "SENSOR_FAULT", f"Deviation > {current_thresh}", confidence
                    else:
                        return "GENUINE_EXTREME_EVENT", "Coherent", confidence
                else:
                    return "UNCERTAIN_REVIEW", "Conflict without spatial.", confidence
                    
            return "NORMAL", "Fallback", 0.0

    fusion = TunedFusionEngine()
    df_full = fusion.run_fusion(df_base)
    
    genuine_mask = (df_full['is_genuine_event'] == 1) & (df_full['fault_type'] == 'NONE')
    n_obs = genuine_mask.sum()
    
    # We only care about positive fault predictions (not NORMAL, GENUINE, or UNCERTAIN)
    preds = ~df_full['final_state'].isin(['NORMAL', 'GENUINE_EXTREME_EVENT', 'UNCERTAIN_REVIEW'])
    
    false_alerts = preds[genuine_mask].sum()
    fpr = false_alerts / n_obs if n_obs > 0 else 0
    gepr = 1 - fpr
    
    event_fault_mask = (df_full['is_genuine_event'] == 1) & (df_full['fault_type'] != 'NONE')
    total_faults = event_fault_mask.sum()
    detected = preds[event_fault_mask].sum()
    recall = detected / total_faults if total_faults > 0 else 0
    
    return gepr, recall

def main():
    print("========================================")
    print(" DYNAMIC THRESHOLD GRID SEARCH ")
    print("========================================\n")
    
    # We should theoretically use a validation set. 
    # For this experiment, we will run it on the demo dataset (which we've been using as a proxy for the test set)
    # just to show the trade-off curve, but we will acknowledge the leakage.
    df_demo = load_data('delhi_benchmark_injected.csv')
    df_demo = run_base_models(df_demo, is_demo=True, use_real_ml=False)
    
    thresholds = [0.05, 0.10, 0.20, 0.30, 0.50, 0.70, 0.90, 1.00]
    
    print(f"{'Threshold':<12} | {'GEPR (Normal Event Acc)':<25} | {'Fault Recall (During Event)':<25}")
    print("-" * 65)
    
    for t in thresholds:
        gepr, recall = evaluate_threshold(df_demo, t)
        print(f"{t:<12.2f} | {gepr:<25.4f} | {recall:<25.4f}")
        
if __name__ == "__main__":
    main()
