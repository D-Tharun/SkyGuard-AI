import numpy as np
import pandas as pd

class PhysicsEngine:
    """
    Thermodynamic consistency and physical bounds checking engine.
    Calculates derived meteorological quantities using the exact Magnus formula.
    """
    
    def __init__(self):
        # Magnus formula constants for water vapor
        self.MAGNUS_A = 17.625
        self.MAGNUS_B = 243.04 # deg C
        
    def calculate_saturation_vapor_pressure(self, t_celsius):
        """Calculate Saturation Vapor Pressure (es) in hPa using Magnus-Tetens."""
        # es = 6.1094 * exp((17.625 * T) / (243.04 + T))
        return 6.1094 * np.exp((self.MAGNUS_A * t_celsius) / (self.MAGNUS_B + t_celsius))
        
    def calculate_actual_vapor_pressure(self, es, rh_pct):
        """Calculate Actual Vapor Pressure (e) in hPa."""
        return es * (rh_pct / 100.0)
        
    def calculate_dew_point(self, t_celsius, rh_pct):
        """Calculate Dew Point Temperature (Td) in Celsius using Magnus formula."""
        # α = ln(RH/100) + (a*T)/(b+T)
        # Td = (b * α) / (a - α)
        rh_clipped = np.clip(rh_pct, 0.001, 100.0) # Prevent log(0)
        alpha = np.log(rh_clipped / 100.0) + ((self.MAGNUS_A * t_celsius) / (self.MAGNUS_B + t_celsius))
        return (self.MAGNUS_B * alpha) / (self.MAGNUS_A - alpha)
        
    def calculate_absolute_humidity(self, e_hpa, t_celsius):
        """Calculate Absolute Humidity in g/m^3."""
        # e is in hPa, T is in Kelvin
        # AH = (e * 100 * 0.018016) / (8.314 * T_kelvin) * 1000 = (e * 2.16679) / T_kelvin
        t_kelvin = t_celsius + 273.15
        return (e_hpa * 2.16679) / t_kelvin
        
    def add_derived_features(self, df):
        """Compute and append all thermodynamic features to the dataframe."""
        df_out = df.copy()
        
        # Calculate thermodynamics
        df_out['sat_vapor_pressure_hpa'] = self.calculate_saturation_vapor_pressure(df_out['temperature_c'])
        df_out['actual_vapor_pressure_hpa'] = self.calculate_actual_vapor_pressure(
            df_out['sat_vapor_pressure_hpa'], df_out['relative_humidity_pct']
        )
        df_out['dew_point_calculated_c'] = self.calculate_dew_point(
            df_out['temperature_c'], df_out['relative_humidity_pct']
        )
        df_out['vapor_pressure_deficit_hpa'] = df_out['sat_vapor_pressure_hpa'] - df_out['actual_vapor_pressure_hpa']
        df_out['absolute_humidity_g_m3'] = self.calculate_absolute_humidity(
            df_out['actual_vapor_pressure_hpa'], df_out['temperature_c']
        )
        
        return df_out
        
    def run_physics_checks(self, df):
        """
        Run hard physical consistency checks.
        Returns a boolean array where True = Physics Violation (Anomaly).
        """
        # Rule 1: RH must be between 0 and 100
        rh_violation = (df['relative_humidity_pct'] < 0) | (df['relative_humidity_pct'] > 100.5) # 0.5 margin for sensor round-off
        
        # Rule 2: Dew point cannot exceed dry bulb temperature (thermodynamic impossibility)
        # Using calculated dew point to check sensor consistency
        dp_violation = df['dew_point_calculated_c'] > (df['temperature_c'] + 0.5) 
        
        # Rule 3: Extreme Earth constraints
        temp_violation = (df['temperature_c'] < -90) | (df['temperature_c'] > 60)
        pres_violation = (df['surface_pressure_hpa'] < 300) | (df['surface_pressure_hpa'] > 1100)
        
        # Combine violations
        physics_anomaly_flag = rh_violation | dp_violation | temp_violation | pres_violation
        
        return physics_anomaly_flag.astype(int)

if __name__ == "__main__":
    # Quick test
    engine = PhysicsEngine()
    test_df = pd.DataFrame({
        'temperature_c': [25.0, 30.0, 20.0],
        'relative_humidity_pct': [50.0, 110.0, 100.0], # Row 1 is a physics violation
        'surface_pressure_hpa': [1013.25, 1010.0, 990.0]
    })
    
    test_df = engine.add_derived_features(test_df)
    test_df['physics_score'] = engine.run_physics_checks(test_df)
    print("Physics Engine Test Results:")
    print(test_df[['temperature_c', 'relative_humidity_pct', 'dew_point_calculated_c', 'physics_score']])
