import os
import pandas as pd
import logging

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

class SkyGuardService:
    """Shared SkyGuard processing service for both Streamlit and FastAPI."""
    
    _instance = None
    _cache = {}

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(SkyGuardService, cls).__new__(cls)
        return cls._instance

    def load_and_process_data(self, disable_spatial=False):
        """Loads data, runs through the pipeline, and caches the result."""
        cache_key = f"processed_spatial_{not disable_spatial}"
        if cache_key in self._cache:
            return self._cache[cache_key]

        file_path = os.path.join(BASE_DIR, 'data', 'processed', 'delhi_benchmark_injected.csv')
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Dataset not found at {file_path}. Please run `python src/data/generate_demo_scenario.py`.")
            
        df = pd.read_csv(file_path)
        
        # 1. Physics Engine
        from src.qc.physics_qc import PhysicsEngine
        phys = PhysicsEngine()
        df = phys.add_derived_features(df)
        df['physics_score'] = phys.run_physics_checks(df)
        
        # 2. Stat Engine
        from src.qc.stat_qc import StatisticalQCEngine
        stat = StatisticalQCEngine()
        df['stat_score'], df['spike_flag'], df['freeze_flag'] = stat.run_statistical_checks(df)
        
        # 3. Real ML Inference
        from src.models.iforest_model import MultivariateIForest
        from src.models.lstm_ae_model import TemporalLSTMAE
        
        try:
            iforest = MultivariateIForest()
            iforest.load(os.path.join(BASE_DIR, 'models', 'iforest_v2.pkl'))
            
            lstm_ae = TemporalLSTMAE()
            lstm_ae.load(os.path.join(BASE_DIR, 'models', 'lstm_ae_v2'))
            
            df['if_score'] = iforest.predict(df)
            df['lstm_score'] = lstm_ae.predict(df)
        except Exception as e:
            raise RuntimeError(f"Failed to load ML artifacts: {e}. Please ensure Kaggle weights are downloaded.")
        
        # 4. Fusion Engine
        from src.qc.fusion import EventAwareFusionEngine
        fusion = EventAwareFusionEngine()
        df = fusion.run_fusion(df, disable_spatial=disable_spatial)
        
        self._cache[cache_key] = df
        return df

    def get_scenario_target(self, df, scenario_name):
        """Replicates the scenario logic to find target station and index."""
        target_station = None
        target_idx = 0
        
        if scenario_name == "A. Normal Weather" or scenario_name == "A":
            normal_cases = df[df['final_state'] == 'NORMAL']
            if not normal_cases.empty:
                idx = normal_cases.index[0]
                target_station = df.loc[idx, 'station']
                target_idx = len(df[(df['station'] == target_station) & (df.index <= idx)]) - 1

        elif scenario_name == "B. Isolated Sensor Fault" or scenario_name == "B":
            fault_cases = df[(df['final_state'].str.contains('FAULT')) & (df['final_state'] != 'GENUINE_EXTREME_EVENT') & (df['S_event'] < 0.3)]
            if not fault_cases.empty:
                idx = fault_cases.index[0]
                target_station = df.loc[idx, 'station']
                target_idx = len(df[(df['station'] == target_station) & (df.index <= idx)]) - 1

        elif scenario_name == "C. Genuine Regional Event (Heatwave)" or scenario_name == "C":
            event_cases = df[df['final_state'] == 'GENUINE_EXTREME_EVENT']
            if not event_cases.empty:
                idx = event_cases.index[0]
                target_station = df.loc[idx, 'station']
                target_idx = len(df[(df['station'] == target_station) & (df.index <= idx)]) - 1

        elif scenario_name == "D. Example: genuine event + one faulty station" or scenario_name == "D":
            event_faults = df[(df['final_state'].str.contains('FAULT')) & (df['S_event'] >= 0.5)]
            if not event_faults.empty:
                idx = event_faults.index[0]
                target_station = df.loc[idx, 'station']
                target_idx = len(df[(df['station'] == target_station) & (df.index <= idx)]) - 1
            else:
                target_station = df['station'].iloc[0]
                target_idx = 0

        elif scenario_name == "E. Spatial Logic Disabled (Demonstrate fallback)" or scenario_name == "E":
            faults_without_spatial = df[df['final_state'].str.contains('FAULT')]
            if not faults_without_spatial.empty:
                idx = faults_without_spatial.index[0]
                target_station = df.loc[idx, 'station']
                target_idx = len(df[(df['station'] == target_station) & (df.index <= idx)]) - 1
                
        if not target_station:
            target_station = df['station'].iloc[0]
            target_idx = 0
            
        return target_station, target_idx
