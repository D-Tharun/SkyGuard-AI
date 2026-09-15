import os
import sys
import pandas as pd
import numpy as np
from sklearn.metrics import f1_score, precision_score, recall_score, confusion_matrix

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.append(BASE_DIR)

from src.qc.physics_qc import PhysicsEngine
from src.qc.stat_qc import StatisticalQCEngine
from src.qc.fusion import EventAwareFusionEngine
from src.visualization.evaluate_models import load_data, run_base_models, get_conventional_preds, get_ml_preds, calculate_metrics

def main():
    print("======================================================")
    print(" SKYGUARD AI: FINAL EVALUATION & METRICS AUDIT ")
    print("======================================================\n")
    
    df_nat = load_data('national_benchmark_v2_injected.csv')
    df_nat = run_base_models(df_nat, is_demo=False, use_real_ml=False)
    
    fusion = EventAwareFusionEngine()
    df_nat_full = fusion.run_fusion(df_nat)
    
    # Class mapping for exact multi-class evaluation
    class_map = {
        'NORMAL': 0,
        'GENUINE_EXTREME_EVENT': 0,
        'UNCERTAIN_REVIEW': -1, # Separate metric
        'SPIKE_FAULT': 1,
        'SENSOR_FAULT': 1,
        'DRIFT_FAULT': 2,
        'FROZEN_FAULT': 3,
        'RANGE_FAULT': 4,
        'COMMUNICATION_FAULT': 5,
        'MULTIVARIATE_FAULT': 6
    }
    
    y_true_all = (df_nat['anomaly_label'] > 0).astype(int)
    preds_conv = get_conventional_preds(df_nat)
    preds_ml = get_ml_preds(df_nat)
    
    # Binary predictions for F1 MUST NOT include UNCERTAIN_REVIEW (which is -1)
    preds_full_binary = df_nat_full['final_state'].isin([k for k, v in class_map.items() if v > 0]).astype(int)
    uncertain_count = (df_nat_full['final_state'] == 'UNCERTAIN_REVIEW').sum()
    uncertain_rate = uncertain_count / len(df_nat_full)
    
    c_p, c_r, c_f, c_fpr = calculate_metrics(y_true_all, preds_conv)
    m_p, m_r, m_f, m_fpr = calculate_metrics(y_true_all, preds_ml)
    f_p, f_r, f_f, f_fpr = calculate_metrics(y_true_all, preds_full_binary)
    
    print("3. CONVENTIONAL QC vs ML-ONLY vs FULL SKYGUARD")
    print("1. OVERALL PRECISION / RECALL / F1")
    print(f"{'Metric':<20} | {'Conv QC':<15} | {'IForest':<15} | {'Full SkyGuard':<15}")
    print("-" * 70)
    print(f"{'Precision':<20} | {c_p:<15.4f} | {m_p:<15.4f} | {f_p:<15.4f}")
    print(f"{'Fault Recall':<20} | {c_r:<15.4f} | {m_r:<15.4f} | {f_r:<15.4f}")
    print(f"{'F1-Score':<20} | {c_f:<15.4f} | {m_f:<15.4f} | {f_f:<15.4f}")
    print(f"{'Overall FPR':<20} | {c_fpr:<15.4f} | {m_fpr:<15.4f} | {f_fpr:<15.4f}")
    print(f"{'Uncertainty Rate':<20} | {'0.0000':<15} | {'0.0000':<15} | {uncertain_rate:<15.4f}")
    print()
    
    print("2. PER-CLASS PRECISION / RECALL / F1 (Full SkyGuard)")
    classes = ['0 NORMAL', '1 SPIKE', '2 DRIFT', '3 FROZEN', '4 RANGE', '5 COMMUNICATION', '6 MULTIVARIATE']
    print(f"{'Class':<15} | {'Precision':<10} | {'Recall':<10} | {'F1-Score':<10}")
    print("-" * 55)
    for class_id, class_name in enumerate(classes[1:], 1):
        y_true_c = (df_nat['anomaly_label'] == class_id).astype(int)
        y_pred_c = (df_nat_full['final_state'].map(class_map).fillna(1) == class_id).astype(int)
        
        p = precision_score(y_true_c, y_pred_c, zero_division=0)
        r = recall_score(y_true_c, y_pred_c, zero_division=0)
        f = f1_score(y_true_c, y_pred_c, zero_division=0)
        
        print(f"{class_name:<15} | {p:<10.4f} | {r:<10.4f} | {f:<10.4f}")
    
    print("\n------------------------------------------------------")
    print(" GENUINE EVENT & EVENT+FAULT ANALYSIS (Demo Scenario) ")
    print("------------------------------------------------------")
    
    df_demo = load_data('delhi_benchmark_injected.csv')
    df_demo = run_base_models(df_demo, is_demo=True, use_real_ml=False)
    df_demo_full = fusion.run_fusion(df_demo)
    
    # Ablated demo
    df_demo_no_spatial = df_demo.copy()
    df_demo_no_spatial['station'] = 'A'
    df_demo_ns_full = fusion.run_fusion(df_demo_no_spatial)
    
    genuine_mask = (df_demo_full['is_genuine_event'] == 1) & (df_demo_full['fault_type'] == 'NONE')
    n_obs = genuine_mask.sum()
    
    preds_demo_full = df_demo_full['final_state'].isin([k for k, v in class_map.items() if v > 0])
    false_alerts = preds_demo_full[genuine_mask].sum()
    fpr = false_alerts / n_obs if n_obs > 0 else 0
    gepr = 1 - fpr
    
    preds_ns_full = df_demo_ns_full['final_state'].isin([k for k, v in class_map.items() if v > 0])
    ns_false_alerts = preds_ns_full[genuine_mask].sum()
    ns_fpr = ns_false_alerts / n_obs if n_obs > 0 else 0
    ns_gepr = 1 - ns_fpr
    
    event_fault_mask = (df_demo_full['is_genuine_event'] == 1) & (df_demo_full['fault_type'] != 'NONE')
    total_faults_in_event = event_fault_mask.sum()
    
    detected = preds_demo_full[event_fault_mask].sum()
    acc = detected / total_faults_in_event if total_faults_in_event > 0 else 0
    
    ns_detected = preds_ns_full[event_fault_mask].sum()
    ns_acc = ns_detected / total_faults_in_event if total_faults_in_event > 0 else 0
    
    print("EVENT METRICS: FULL SYSTEM vs NO SPATIAL")
    print(f"{'Metric':<40} | {'With Spatial':<15} | {'NO Spatial':<15}")
    print("-" * 75)
    print(f"{'GEPR (Genuine Event Pres. Rate)':<40} | {gepr:<15.4f} | {ns_gepr:<15.4f}")
    print(f"{'False Sensor-Fault Rate (Events)':<40} | {fpr:<15.4f} | {ns_fpr:<15.4f}")
    print(f"{'Fault Recall (During Events)':<40} | {acc:<15.4f} | {ns_acc:<15.4f}")
    
    print("\n------------------------------------------------------")
    print(" SUBTLE FAULT BENCHMARK (REAL ML VALIDATION) ")
    print("------------------------------------------------------")
    
    try:
        df_subtle = load_data('subtle_benchmark_injected.csv')
        df_subtle = run_base_models(df_subtle, is_demo=False, use_real_ml=True)
        df_subtle_full = fusion.run_fusion(df_subtle)
        
        y_true_subtle = (df_subtle['anomaly_label'] > 0).astype(int)
        preds_ml_subtle = get_ml_preds(df_subtle)
        preds_full_subtle = df_subtle_full['final_state'].isin([k for k, v in class_map.items() if v > 0]).astype(int)
        
        sm_p, sm_r, sm_f, sm_fpr = calculate_metrics(y_true_subtle, preds_ml_subtle)
        sf_p, sf_r, sf_f, sf_fpr = calculate_metrics(y_true_subtle, preds_full_subtle)
        
        print("PERFORMANCE ON SUBTLE FAULT BENCHMARK")
        print(f"{'Metric':<20} | {'ML-Only':<15} | {'Full SkyGuard':<15}")
        print("-" * 55)
        print(f"{'Subtle Fault Recall':<20} | {sm_r:<15.4f} | {sf_r:<15.4f}")
        print(f"{'Subtle F1-Score':<20} | {sm_f:<15.4f} | {sf_f:<15.4f}")
    except Exception as e:
        print("Subtle benchmark not generated yet.")

    print("\n[OK] Evaluation Complete.")

if __name__ == "__main__":
    main()
