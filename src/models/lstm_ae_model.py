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
        # Scale data
        data_values = df_clean[self.features].values
        scaled_data = self.scaler.fit_transform(data_values)
        
        # Create sequences
        X_seq = self._create_sequences(scaled_data)
        
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
        
    def predict(self, df):
        """
        Predict anomaly scores based on Mean Absolute Error (MAE) of reconstruction.
        Returns a normalized score array aligned with the dataframe (padded with 0s at the start).
        """
        data_values = df[self.features].values
        scaled_data = self.scaler.transform(data_values)
        X_seq = self._create_sequences(scaled_data)
        
        # Reconstruct sequences
        X_pred = self.model.predict(X_seq, verbose=0)
        
        # Calculate MAE for each sequence (average across time steps and features)
        mae = np.mean(np.abs(X_pred - X_seq), axis=(1, 2))
        
        # Normalize MAE to [0, 1] range robustly
        # Data was scaled to [0,1]. Normal MAE is usually < 0.05. Anomalous is > 0.1.
        norm_scores = np.clip(mae / 0.2, 0, 1)
            
        # Pad the start of the array to match original dataframe length
        # (Since first sequence_length points don't have a full history window)
        padded_scores = np.zeros(len(df))
        padded_scores[self.sequence_length:] = norm_scores
        
        return padded_scores
        
    def save(self, filepath):
        """Save Keras model and scaler to disk."""
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        self.model.save(filepath + '.keras')
        import joblib
        joblib.dump(self.scaler, filepath + '_scaler.pkl')
        print(f"Model saved to {filepath}.keras")
        
    def load(self, filepath):
        """Load Keras model and scaler from disk."""
        import joblib
        self.model = load_model(filepath + '.keras')
        self.scaler = joblib.load(filepath + '_scaler.pkl')
        print(f"Model loaded from {filepath}.keras")

if __name__ == "__main__":
    # Test script
    print("Testing LSTM Autoencoder Architecture...")
    np.random.seed(42)
    tf.random.set_seed(42)
    
    # Generate 500 hours of fake normal data
    temp = 25 + 5 * np.sin(np.linspace(0, 50, 500))
    rh = 60 + 20 * np.cos(np.linspace(0, 50, 500))
    pres = 1010 + np.random.normal(0, 0.5, 500)
    
    df = pd.DataFrame({'temperature_c': temp, 'relative_humidity_pct': rh, 'surface_pressure_hpa': pres})
    
    lstm_ae = TemporalLSTMAE(sequence_length=12, latent_dim=8)
    
    # Train on small epoch for test
    lstm_ae.train(df, epochs=3, batch_size=32)
    
    # Inject a temporal anomaly (wrong shape, e.g. sudden square wave)
    df.loc[300:310, 'temperature_c'] = 35.0
    
    scores = lstm_ae.predict(df)
    df['lstm_score'] = scores
    
    print(f"Max score during normal period (idx 100): {df.loc[100, 'lstm_score']:.3f}")
    print(f"Max score during anomaly period (idx 310): {df.loc[310, 'lstm_score']:.3f}")
