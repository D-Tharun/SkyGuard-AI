import os
import sys
import pandas as pd
import numpy as np

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(BASE_DIR)

from src.qc.fusion import EventAwareFusionEngine
from src.qc.physics_qc import PhysicsEngine
from src.qc.stat_qc import StatisticalQCEngine

def test_scenarios():
    print("Loading data...")
    file_path = os.path.join(BASE_DIR, 'data', 'processed', 'delhi_benchmark_injected.csv')
    df = pd.read_csv(file_path)
    
    phys = PhysicsEngine()
    df = phys.add_derived_features(df)
    df['physics_score'] = phys.run_physics_checks(df)
    
    stat = StatisticalQCEngine()
    df['stat_score'], df['spike_flag'], df['freeze_flag'] = stat.run_statistical_checks(df)
    
    from src.models.iforest_model import MultivariateIForest
    from src.models.lstm_ae_model import TemporalLSTMAE
    
    iforest = MultivariateIForest()
    iforest.load(os.path.join(BASE_DIR, 'models', 'iforest_v2.pkl'))
    lstm_ae = TemporalLSTMAE()
    lstm_ae.load(os.path.join(BASE_DIR, 'models', 'lstm_ae_v2'))
    
    df['if_score'] = iforest.predict(df)
    df['lstm_score'] = lstm_ae.predict(df)
    
    fusion = EventAwareFusionEngine()
    df_normal = fusion.run_fusion(df, disable_spatial=False)
    df_no_spatial = fusion.run_fusion(df, disable_spatial=True)
    
    print("Testing Scenarios Extraction:")
    try:
        # Scenario A
        normal_cases = df_normal[df_normal['final_state'] == 'NORMAL']
        n_idx = normal_cases.index[0]
        print(f"Scenario A (Normal): Found at idx {n_idx}, Station {df_normal.loc[n_idx, 'station']}")
        
        # Scenario B
        fault_cases = df_normal[(df_normal['final_state'].str.contains('FAULT')) & (df_normal['final_state'] != 'GENUINE_EXTREME_EVENT') & (df_normal['S_event'] < 0.3)]
        b_idx = fault_cases.index[0]
        print(f"Scenario B (Isolated Fault): Found at idx {b_idx}, Station {df_normal.loc[b_idx, 'station']}, State {df_normal.loc[b_idx, 'final_state']}")
        
        # Scenario C
        event_cases = df_normal[df_normal['final_state'] == 'GENUINE_EXTREME_EVENT']
        c_idx = event_cases.index[0]
        print(f"Scenario C (Genuine Event): Found at idx {c_idx}, Station {df_normal.loc[c_idx, 'station']}")
        
        # Scenario D
        event_faults = df_normal[(df_normal['final_state'].str.contains('FAULT')) & (df_normal['S_event'] >= 0.5)]
        d_idx = event_faults.index[0]
        print(f"Scenario D (Event + Fault): Found at idx {d_idx}, Station {df_normal.loc[d_idx, 'station']}, State {df_normal.loc[d_idx, 'final_state']}")
        
        # Scenario E
        faults_no_spatial = df_no_spatial[df_no_spatial['final_state'].str.contains('FAULT')]
        e_idx = faults_no_spatial.index[0]
        print(f"Scenario E (Spatial Logic Disabled (Demonstrate fallback)): Found at idx {e_idx}, Station {df_no_spatial.loc[e_idx, 'station']}")
        
        print("\nALL SCENARIOS VALIDATED SUCCESSFULLY!")
    except Exception as e:
        print(f"ERROR: {e}")
        
if __name__ == "__main__":
    test_scenarios()
