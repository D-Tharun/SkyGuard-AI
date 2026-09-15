import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import joblib
import os

class MultivariateIForest:
    """
    Isolation Forest for Multivariate Anomaly Detection.
    Detects when the combination of T, RH, P, and Time-of-Day is unusual.
    """
    
    def __init__(self, contamination=0.01, random_state=42):
        self.contamination = contamination
        self.model = IsolationForest(
            n_estimators=100, 
            max_samples='auto', 
            contamination=self.contamination, 
            random_state=random_state,
            n_jobs=-1
        )
        self.scaler = StandardScaler()
        self.features = [
            'temperature_c', 
            'relative_humidity_pct', 
            'surface_pressure_hpa',
            'dew_point_calculated_c',
            'hour_sin',
            'hour_cos'
        ]
        
    def _prepare_time_features(self, df):
        """Extract cyclical time-of-day features."""
        df_copy = df.copy()
        # Convert timestamp to datetime if it's string
        if not pd.api.types.is_datetime64_any_dtype(df_copy['timestamp']):
            df_copy['timestamp'] = pd.to_datetime(df_copy['timestamp'])
            
        hour = df_copy['timestamp'].dt.hour
        # Cyclical encoding of hour (0-23)
        df_copy['hour_sin'] = np.sin(2 * np.pi * hour / 24.0)
        df_copy['hour_cos'] = np.cos(2 * np.pi * hour / 24.0)
        return df_copy
        
    def train(self, df_clean):
        """
        Train the Isolation Forest on a CLEAN (or mostly clean) historical dataset.
        """
        df_prepared = self._prepare_time_features(df_clean)
        
        # We assume physics engine has already run and added 'dew_point_calculated_c'
        # If not, we fall back to a simple proxy or throw error.
        if 'dew_point_calculated_c' not in df_prepared.columns:
            raise ValueError("Dataframe is missing 'dew_point_calculated_c'. Run PhysicsEngine first.")
            
        X = df_prepared[self.features].values
        X_scaled = self.scaler.fit_transform(X)
        
        print("Training Isolation Forest on", X_scaled.shape[0], "records...")
        self.model.fit(X_scaled)
        print("Training complete.")
        
    def predict(self, df):
        """
        Predict anomalies. Returns normalized anomaly scores [0, 1].
        1 = Highly Anomalous, 0 = Normal.
        """
        df_prepared = self._prepare_time_features(df)
        X = df_prepared[self.features].values
        X_scaled = self.scaler.transform(X)
        
        # decision_function returns negative values for anomalies, positive for normal
        raw_scores = self.model.decision_function(X_scaled)
        
        # Invert so positive means anomalous
        inverted_scores = -raw_scores
        
        # Robust scaling to prevent extreme outliers (like T=9999) from squashing subtle anomalies
        # Normal data usually has score < 0.0. Anomalies > 0.0.
        norm_scores = np.clip((inverted_scores + 0.05) / 0.15, 0, 1)
        
        return norm_scores
        
    def save(self, filepath):
        """Save model and scaler to disk."""
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        joblib.dump({'model': self.model, 'scaler': self.scaler}, filepath)
        print(f"Model saved to {filepath}")
        
    def load(self, filepath):
        """Load model and scaler from disk."""
        data = joblib.load(filepath)
        self.model = data['model']
        self.scaler = data['scaler']
        print(f"Model loaded from {filepath}")

if __name__ == "__main__":
    # Test script
    from ..qc.physics_qc import PhysicsEngine
    
    print("Testing Isolation Forest...")
    # Generate dummy data
    np.random.seed(42)
    dates = pd.date_range(start='2023-01-01', periods=1000, freq='H')
    temp = 25 + 5 * np.sin(np.linspace(0, 100, 1000)) + np.random.normal(0, 0.5, 1000)
    rh = 60 + 20 * np.cos(np.linspace(0, 100, 1000)) + np.random.normal(0, 2, 1000)
    pres = 1010 + np.random.normal(0, 1, 1000)
    
    df = pd.DataFrame({'timestamp': dates, 'temperature_c': temp, 'relative_humidity_pct': rh, 'surface_pressure_hpa': pres})
    
    # Inject a multivariate anomaly (temp drops but RH also drops drastically - physically unusual)
    df.loc[500, 'temperature_c'] = 10
    df.loc[500, 'relative_humidity_pct'] = 10 
    
    # Run physics engine to get dew point
    phys = PhysicsEngine()
    df = phys.add_derived_features(df)
    
    # Train IForest
    iforest = MultivariateIForest(contamination=0.01)
    iforest.train(df)
    
    # Predict
    scores = iforest.predict(df)
    df['if_score'] = scores
    
    print(f"Anomaly score at injected idx 500: {df.loc[500, 'if_score']:.3f}")
    print(f"Mean anomaly score for normal data: {df['if_score'].mean():.3f}")
