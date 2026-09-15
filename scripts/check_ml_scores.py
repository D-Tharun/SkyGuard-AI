import pandas as pd
import numpy as np
import os
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(BASE_DIR)
from src.models.iforest_model import MultivariateIForest
from src.models.lstm_ae_model import TemporalLSTMAE
from src.visualization.evaluate_models import load_data, run_base_models

df = load_data('subtle_benchmark_injected.csv')
from src.qc.physics_qc import PhysicsEngine
phys = PhysicsEngine()
df = phys.add_derived_features(df)

iforest = MultivariateIForest()
iforest.load(os.path.join(BASE_DIR, 'models', 'iforest_v2.pkl'))
df_prepared = iforest._prepare_time_features(df)
X = df_prepared[iforest.features].values
X_scaled = iforest.scaler.transform(X)
raw_scores = iforest.model.decision_function(X_scaled)
print("IForest Raw Scores (negative is anomaly):")
print(f"Normal: mean={np.mean(raw_scores[df['anomaly_label']==0])}, p1={np.percentile(raw_scores[df['anomaly_label']==0], 1)}, p5={np.percentile(raw_scores[df['anomaly_label']==0], 5)}")
print(f"Anomalous: mean={np.mean(raw_scores[df['anomaly_label']>0])}, min={np.min(raw_scores[df['anomaly_label']>0])}, max={np.max(raw_scores[df['anomaly_label']>0])}")

lstm = TemporalLSTMAE()
lstm.load(os.path.join(BASE_DIR, 'models', 'lstm_ae_v2'))
data_values = df[lstm.features].values
scaled_data = lstm.scaler.transform(data_values)
X_seq = lstm._create_sequences(scaled_data)
X_pred = lstm.model.predict(X_seq, verbose=0)
mae = np.mean(np.abs(X_pred - X_seq), axis=(1, 2))
print("\nLSTM MAE:")
# Padding for alignment
mae_padded = np.zeros(len(df))
mae_padded[lstm.sequence_length:] = mae
print(f"Normal: mean={np.mean(mae_padded[df['anomaly_label']==0])}, p95={np.percentile(mae_padded[df['anomaly_label']==0], 95)}, p99={np.percentile(mae_padded[df['anomaly_label']==0], 99)}")
print(f"Anomalous: mean={np.mean(mae_padded[df['anomaly_label']>0])}, min={np.min(mae_padded[df['anomaly_label']>0])}, max={np.max(mae_padded[df['anomaly_label']>0])}")
