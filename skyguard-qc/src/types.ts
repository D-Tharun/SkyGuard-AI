/**
 * SkyGuard Quality Control System - Core Types
 */

export type AssessmentDecision = 
  | 'NORMAL' 
  | 'GENUINE_EVENT' 
  | 'SENSOR_FAULT' 
  | 'UNCERTAIN';

export type QualityFlag = 'PASS' | 'SUSPECT' | 'FAIL';

export type StationStatus = 'Online' | 'Warning' | 'Alert' | 'Offline';

export type FaultType = 
  | 'Spike / Transient' 
  | 'Frozen / Stuck' 
  | 'Drift / Bias' 
  | 'Communication / Data Integrity' 
  | 'Multivariate Inconsistency' 
  | 'Range / Plausibility Violation';

export interface SensorReading {
  timestamp: number;
  stationId: string;
  temperature: number;
  humidity: number;
  pressure: number;
  dewPoint: number;
  vpd: number;
  edgeScore: number;
  temporalScore: number;
  multivariateScore: number;
  physicsScore: number;
  contextScore: number;
  spatialScore: number;
  fusionScore: number;
  decision: AssessmentDecision;
  qualityFlag: QualityFlag;
  diagnosis: string;
  reason: string;
}

export interface Station {
  id: string;
  code?: string;
  name: string;
  location: string;
  state: string;
  lat: number;
  lng: number;
  elevationMeters: number;
  status: StationStatus;
  healthScore: number;
  temperature: number;
  humidity: number;
  pressure: number;
  lastUpdate: number;
  activeAnomalies: number;
  sensorModel: string;
  currentDecision: AssessmentDecision;
  assessmentSummary: string;
}

export interface AnomalyAlert {
  id: string;
  stationId: string;
  stationName: string;
  location: string;
  decision: AssessmentDecision;
  faultType: FaultType;
  severity: 'HIGH' | 'MEDIUM' | 'LOW' | 'RESOLVED';
  detectedAt: number;
  status: 'active' | 'resolved';
  headline: string;
  summary: string;
  triggerMetric: string;
  triggerValue: string;
  observedSequence: { value: number; time: string; abnormal?: boolean }[];
  evidencePoints: string[];
  featureContributions: { feature: string; impact: 'High' | 'Moderate' | 'Minor'; score: number }[];
  layerScores: {
    layer: string;
    level: 'Strong' | 'Moderate' | 'Low' | 'Normal';
    score: number;
    description: string;
  }[];
  fusionScore: number;
  confidencePercent: number;
  recommendedAction: string;
}

export interface EvidenceSummaryData {
  temporal: 'Strong' | 'Moderate' | 'Low' | 'Normal';
  multivariate: 'Strong' | 'Moderate' | 'Low' | 'Normal';
  physics: 'Strong' | 'Moderate' | 'Low' | 'Normal';
  context: 'Strong' | 'Moderate' | 'Low' | 'Normal';
  spatial: 'Available' | 'Consistent' | 'Inconsistent' | 'Unavailable';
  fusionScore: number;
  confidencePercent: number;
}

export interface DemoScenario {
  id: 'A' | 'B' | 'C' | 'D' | 'E';
  letter: string;
  title: string;
  station: string;
  decision: AssessmentDecision;
  whatHappened: string;
  observedPattern: string;
  readings: { time: string; temp: number; hum: number; pres: number; flag?: 'fault' | 'event' | 'normal' }[];
  evidence: {
    temporal: string;
    multivariate: string;
    physics: string;
    spatial: string;
  };
  finalDecision: string;
  why: string;
  notes?: string;
}

export type PageId = 
  | 'dashboard' 
  | 'live' 
  | 'stations' 
  | 'station-details' 
  | 'alerts' 
  | 'observation-details' 
  | 'performance' 
  | 'health' 
  | 'explorer' 
  | 'reports' 
  | 'scenarios' 
  | 'architecture' 
  | 'settings';
