import pandas as pd
import numpy as np
import os
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(BASE_DIR)

from src.visualization.evaluate_models import load_data, run_base_models
from src.qc.fusion import EventAwareFusionEngine

df_demo = load_data('delhi_benchmark_injected.csv')
df_demo = run_base_models(df_demo, is_demo=True, use_real_ml=False)

fusion = EventAwareFusionEngine()
df_demo_full = fusion.run_fusion(df_demo)

event_fault_mask = (df_demo_full['is_genuine_event'] == 1) & (df_demo_full['fault_type'] != 'NONE')
df_event_fault = df_demo_full[event_fault_mask]

print("Missed Faults During Events:")
missed = df_event_fault[df_event_fault['final_state'].isin(['NORMAL', 'GENUINE_EXTREME_EVENT'])]
for idx, row in missed.iterrows():
    print(f"Time: {row['timestamp']}, Fault: {row['fault_type']}, "
          f"lstm_score: {row.get('lstm_score', 0):.2f}, "
          f"if_score: {row.get('if_score', 0):.2f}, "
          f"S_a: {row['S_anomaly']:.2f}, S_e: {row['S_event']:.2f}, "
          f"Norm_Dev: {row.get('spatial_deviation_max_norm', 0):.2f}, "
          f"State: {row['final_state']}")
