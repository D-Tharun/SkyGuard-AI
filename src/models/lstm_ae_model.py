import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow.keras.models import Sequential, load_model
from tensorflow.keras.layers import LSTM, RepeatVector, TimeDistributed, Dense, Input
from tensorflow.keras.callbacks import EarlyStopping
from sklearn.preprocessing import MinMaxScaler
import os

class TemporalLSTMAE:
    """
    LSTM Autoencoder for Temporal Anomaly Detection.
    Learns the normal 'shape' and sequential transitions of weather patterns over a sliding window.
    """
    
    def __init__(self, sequence_length=12, latent_dim=16):
        self.sequence_length = sequence_length
        self.latent_dim = latent_dim
        self.model = None
        self.scaler = MinMaxScaler()
        self.features = [
            'temperature_c', 
            'relative_humidity_pct', 
            'surface_pressure_hpa'
        ]
        
    def _create_sequences(self, data):
        """Create 3D sequences (samples, time_steps, features) for LSTM."""
        sequences = []
        for i in range(len(data) - self.sequence_length):
            sequences.append(data[i:i + self.sequence_length])
        return np.array(sequences)
        
    def _build_model(self, n_features):
        """Construct the LSTM Autoencoder architecture."""
        model = Sequential([
            Input(shape=(self.sequence_length, n_features)),
            # Encoder
            LSTM(32, activation='relu', return_sequences=True),
            LSTM(self.latent_dim, activation='relu', return_sequences=False),
            # Bottleneck / Repeat
            RepeatVector(self.sequence_length),
            # Decoder
            LSTM(self.latent_dim, activation='relu', return_sequences=True),
            LSTM(32, activation='relu', return_sequences=True),
            TimeDistributed(Dense(n_features))
        ])
        model.compile(optimizer='adam', loss='mse')
        return model
        
    def train(self, df_clean, epochs=20, batch_size=128):
        """Train the LSTM Autoencoder on clean historical sequences."""
        if 'station' not in df_clean.columns:
            raise ValueError("Dataframe must contain 'station' column to generate causal sequences without leakage.")
            
        df_clean = df_clean.copy()
        
        # Fit scaler on the entire clean dataset
        data_values = df_clean[self.features].values
        scaled_data = self.scaler.fit_transform(data_values)
        
        # Add scaled data back temporarily to allow station grouping
        scaled_cols = [f + '_scaled' for f in self.features]
        df_clean[scaled_cols] = scaled_data
        
        all_sequences = []
        for station_name, group in df_clean.groupby('station'):
            station_scaled_data = group[scaled_cols].values
            seqs = self._create_sequences(station_scaled_data)
            if len(seqs) > 0:
                all_sequences.append(seqs)
                
        if len(all_sequences) > 0:
            X_seq = np.vstack(all_sequences)
        else:
            raise ValueError("No sequences could be created. Is the data length per station less than sequence_length?")
        
        if self.model is None:
            self.model = self._build_model(X_seq.shape[2])
            
        print(f"Training LSTM Autoencoder on {X_seq.shape[0]} sequences...")
        
        early_stop = EarlyStopping(monitor='val_loss', patience=3, restore_best_weights=True)
        
        history = self.model.fit(
            X_seq, X_seq, # Autoencoder target is its own input
            epochs=epochs,
            batch_size=batch_size,
            validation_split=0.15,
            callbacks=[early_stop],
            verbose=1
        )
        print("LSTM Training complete.")
        return history
        
    def _calibrate_score(self, raw):
        """
        Piecewise empirical calibration mapping based on 2024 Clean Validation Set.
        p95: 0.063 (Borderline suspicious)
        p999: 0.107 (Extreme tail anomaly)
        """
        p95 = 0.063
        p999 = 0.107
        
        scores = np.zeros_like(raw)
        
        # Normal Range
        mask1 = raw <= p95
        scores[mask1] = (raw[mask1] / p95) * 0.3
        
        # Suspicious Range
        mask2 = (raw > p95) & (raw <= p999)
        scores[mask2] = 0.3 + ((raw[mask2] - p95) / (p999 - p95)) * 0.2
        
        # Anomalous Range
        mask3 = raw > p999
        scores[mask3] = np.clip(0.5 + ((raw[mask3] - p999) / p999) * 0.5, 0.5, 1.0)
        
        return scores
        
    def predict(self, df):
        """
        Predict anomalies. Returns normalized reconstruction error [0, 1].
        1 = Highly Anomalous, 0 = Normal.
        """
        if 'station' not in df.columns:
            raise ValueError("Dataframe must contain 'station' column for correct sequence alignment.")
            
        df = df.copy()
        data_values = df[self.features].astype(float).values.copy()
        
        # Safely handle missing/corrupt data before scaling/inference
        # Mask -999.0, 9999.0 as NaN
        data_values[data_values == -999.0] = np.nan
        data_values[data_values == 9999.0] = np.nan
        
        # Convert to DataFrame for easy ffill/bfill, then back to numpy
        temp_df = pd.DataFrame(data_values)
        temp_df = temp_df.ffill().bfill().fillna(0) # fallback to 0 if all NaNs
        data_values_clean = temp_df.values
        
        scaled_data = self.scaler.transform(data_values_clean)
        
        scaled_cols = [f + '_scaled' for f in self.features]
        df[scaled_cols] = scaled_data
        
        # Initialize padded scores for all rows
        padded_scores = np.zeros(len(df))
        
        for station_name, group in df.groupby('station'):
            station_indices = group.index
            station_scaled_data = group[scaled_cols].values
            
            if len(station_scaled_data) <= self.sequence_length:
                continue
                
            X_seq = self._create_sequences(station_scaled_data)
            
            # Reconstruct sequences
            X_pred = self.model.predict(X_seq, verbose=0)
            
            # Calculate MAE for each sequence (average across time steps and features)
            mae = np.mean(np.abs(X_pred - X_seq), axis=(1, 2))
            
            # Normalize using empirical piecewise calibration
            norm_scores = self._calibrate_score(mae)
                
            # Pad the start of the array to match original dataframe length for this station
            station_padded_scores = np.zeros(len(group))
            station_padded_scores[self.sequence_length:] = norm_scores
            
            # Assign back to original dataframe indices
            padded_scores[station_indices] = station_padded_scores
        
        return padded_scores
        
    def save(self, filepath):
        """Save Keras model weights and scaler to disk."""
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        self.model.save_weights(filepath + '.weights.h5')
        import joblib
        joblib.dump(self.scaler, filepath + '_scaler.pkl')
        print(f"Model saved to {filepath}.weights.h5")
        
    def load(self, filepath):
        """Load Keras model weights and scaler from disk."""
        import joblib
        self.scaler = joblib.load(filepath + '_scaler.pkl')
        
        # Manually construct architecture to bypass Keras serialization bugs
        self.model = self._build_model(len(self.features))
        
        # Load only the raw weights
        self.model.load_weights(filepath + '.weights.h5')
        print(f"Model loaded from {filepath}.weights.h5")

if __name__ == "__main__":
    # Test script
    print("Testing LSTM Autoencoder Architecture...")
    np.random.seed(42)
    tf.random.set_seed(42)
    
    # Generate 500 hours of fake normal data for 2 stations
    temp1 = 25 + 5 * np.sin(np.linspace(0, 50, 250))
    rh1 = 60 + 20 * np.cos(np.linspace(0, 50, 250))
    pres1 = 1010 + np.random.normal(0, 0.5, 250)
    
    temp2 = 15 + 5 * np.sin(np.linspace(0, 50, 250))
    rh2 = 80 + 10 * np.cos(np.linspace(0, 50, 250))
    pres2 = 900 + np.random.normal(0, 0.5, 250)
    
    temp = np.concatenate([temp1, temp2])
    rh = np.concatenate([rh1, rh2])
    pres = np.concatenate([pres1, pres2])
    stations = ['Station_A'] * 250 + ['Station_B'] * 250
    
    df = pd.DataFrame({'temperature_c': temp, 'relative_humidity_pct': rh, 'surface_pressure_hpa': pres, 'station': stations})
    
    lstm_ae = TemporalLSTMAE(sequence_length=12, latent_dim=8)
    
    # Train on small epoch for test
    lstm_ae.train(df, epochs=3, batch_size=32)
    
    # Inject a temporal anomaly (wrong shape, e.g. sudden square wave)
    df.loc[150:160, 'temperature_c'] = 35.0
    
    scores = lstm_ae.predict(df)
    df['lstm_score'] = scores
    
    print(f"Max score during normal period (idx 50): {df.loc[50, 'lstm_score']:.3f}")
    print(f"Max score during anomaly period (idx 160): {df.loc[160, 'lstm_score']:.3f}")

