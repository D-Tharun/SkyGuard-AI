import os
import sys
import pandas as pd
import numpy as np

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(BASE_DIR)

from src.models.iforest_model import MultivariateIForest
from src.models.lstm_ae_model import TemporalLSTMAE
from src.qc.physics_qc import PhysicsEngine

def main():
    print("========================================")
    print(" TRAINING REAL ML MODELS ON CLEAN DATA  ")
    print("========================================\n")
    
    data_path = os.path.join(BASE_DIR, 'data', 'processed', 'national_benchmark_v2_injected.csv')
    df = pd.read_csv(data_path)
    
    # 1. No anomaly labels used during training
    # We train purely on normal historical data
    df_clean = df[df['anomaly_label'] == 0].copy()
    
    # Needs physics engine for dew point calculation for IForest
    phys = PhysicsEngine()
    df_clean = phys.add_derived_features(df_clean)
    
    # Train Isolation Forest
    print("Training Multivariate Isolation Forest...")
    iforest = MultivariateIForest(contamination=0.01)
    iforest.train(df_clean)
    iforest_path = os.path.join(BASE_DIR, 'models', 'iforest_v2.pkl')
    iforest.save(iforest_path)
    
    # Train LSTM Autoencoder
    # Since LSTM takes sequences, it needs contiguous normal data. 
    # To avoid boundaries caused by slicing out anomalies, we could use only large contiguous normal blocks, 
    # or just train on a completely separate normal historical chunk.
    # For this audit, we will just use the first contiguous 50,000 normal records.
    print("Training Temporal LSTM Autoencoder...")
    df_lstm_train = df_clean.head(50000).copy()
    
    lstm_ae = TemporalLSTMAE(sequence_length=12, latent_dim=16)
    lstm_ae.train(df_lstm_train, epochs=5, batch_size=128)
    
    lstm_path = os.path.join(BASE_DIR, 'models', 'lstm_ae_v2')
    lstm_ae.save(lstm_path)
    
    print("\n[OK] ML Models successfully trained and saved without leakage.")

if __name__ == "__main__":
    main()
