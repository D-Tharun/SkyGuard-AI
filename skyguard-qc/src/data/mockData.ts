import { Station, AnomalyAlert, DemoScenario, SensorReading } from '../types';

export const STATIONS: Station[] = [
  {
    id: 'Bengaluru_HAL',
    code: 'AWS-01',
    name: 'Bengaluru HAL',
    location: 'Bengaluru',
    state: 'Karnataka',
    lat: 12.9500,
    lng: 77.6680,
    elevationMeters: 920,
    status: 'Online',
    healthScore: 97,
    temperature: 24.6,
    humidity: 64,
    pressure: 914,
    lastUpdate: Date.now() - 35000,
    activeAnomalies: 0,
    sensorModel: 'BME280 / Industrial AWS',
    currentDecision: 'NORMAL',
    assessmentSummary: 'Nominal urban plateau diurnal profile. Thermal rate of change strictly bounded by convective envelope.',
  },
  {
    id: 'Chennai_Meenambakkam',
    code: 'AWS-02',
    name: 'Chennai Meenambakkam',
    location: 'Chennai',
    state: 'Tamil Nadu',
    lat: 12.9941,
    lng: 80.1809,
    elevationMeters: 16,
    status: 'Alert',
    healthScore: 68,
    temperature: 55.0,
    humidity: 67,
    pressure: 1008,
    lastUpdate: Date.now() - 120000,
    activeAnomalies: 1,
    sensorModel: 'BME280 / Industrial AWS',
    currentDecision: 'SENSOR_FAULT',
    assessmentSummary: 'Sudden temperature change (+22 °C transient) is inconsistent with recent station behaviour and neighbouring coastal sensors.',
  },
  {
    id: 'Cherrapunji_Mawsynram',
    code: 'AWS-03',
    name: 'Cherrapunji / Mawsynram',
    location: 'Cherrapunji',
    state: 'Meghalaya',
    lat: 25.2700,
    lng: 91.7300,
    elevationMeters: 1430,
    status: 'Online',
    healthScore: 94,
    temperature: 19.8,
    humidity: 92,
    pressure: 862,
    lastUpdate: Date.now() - 50000,
    activeAnomalies: 0,
    sensorModel: 'BME280 / Industrial AWS',
    currentDecision: 'NORMAL',
    assessmentSummary: 'High-altitude orographic precipitation regime. Temperature and saturation vapor deficit align with cloud immersion physics.',
  },
  {
    id: 'Jaisalmer_Desert',
    code: 'AWS-04',
    name: 'Jaisalmer Desert',
    location: 'Jaisalmer',
    state: 'Rajasthan',
    lat: 26.9157,
    lng: 70.9083,
    elevationMeters: 225,
    status: 'Online',
    healthScore: 94,
    temperature: 48.7,
    humidity: 14,
    pressure: 998,
    lastUpdate: Date.now() - 30000,
    activeAnomalies: 1,
    sensorModel: 'BME280 / Industrial AWS',
    currentDecision: 'GENUINE_EVENT',
    assessmentSummary: 'Unusual extreme conditions are supported by temporal continuity, vapor deficit evolution, and regional synoptic evidence.',
  },
  {
    id: 'Mumbai_Santacruz',
    code: 'AWS-05',
    name: 'Mumbai Santacruz',
    location: 'Mumbai',
    state: 'Maharashtra',
    lat: 19.0896,
    lng: 72.8656,
    elevationMeters: 14,
    status: 'Online',
    healthScore: 93,
    temperature: 31.0,
    humidity: 76,
    pressure: 1009,
    lastUpdate: Date.now() - 25000,
    activeAnomalies: 0,
    sensorModel: 'BME280 / Industrial AWS',
    currentDecision: 'NORMAL',
    assessmentSummary: 'Sea-breeze cycle progressing as expected. Psychrometric vapor equilibrium validated.',
  },
  {
    id: 'New_Delhi_Safdarjung',
    code: 'AWS-06',
    name: 'New Delhi Safdarjung',
    location: 'New Delhi',
    state: 'Delhi',
    lat: 28.5850,
    lng: 77.2060,
    elevationMeters: 216,
    status: 'Warning',
    healthScore: 78,
    temperature: 38.6,
    humidity: 48,
    pressure: 1007,
    lastUpdate: Date.now() - 90000,
    activeAnomalies: 1,
    sensorModel: 'BME280 / Industrial AWS',
    currentDecision: 'UNCERTAIN',
    assessmentSummary: 'Temporal drift detected over 48h (-1.8 °C offset). Regional stations show warmer conditions. Recalibration review recommended.',
  },
  {
    id: 'Shimla_Himalayan',
    code: 'AWS-07',
    name: 'Shimla Himalayan',
    location: 'Shimla',
    state: 'Himachal Pradesh',
    lat: 31.1048,
    lng: 77.1734,
    elevationMeters: 2205,
    status: 'Online',
    healthScore: 96,
    temperature: 14.8,
    humidity: 52,
    pressure: 785,
    lastUpdate: Date.now() - 40000,
    activeAnomalies: 0,
    sensorModel: 'BME280 / Industrial AWS',
    currentDecision: 'NORMAL',
    assessmentSummary: 'Mountain valley boundary layer nominal. Hydrostatic barometric lapse rate verified consistent with high-altitude elevation.',
  },
];

export const ALERTS: AnomalyAlert[] = [
  {
    id: 'ALR-2024-0891',
    stationId: 'Chennai_Meenambakkam',
    stationName: 'Chennai Meenambakkam',
    location: 'Chennai, Tamil Nadu',
    decision: 'SENSOR_FAULT',
    faultType: 'Spike / Transient',
    severity: 'HIGH',
    detectedAt: Date.now() - 120000, // 2 min ago
    status: 'active',
    headline: 'Temperature spike: 33 → 55 °C',
    summary: 'Sudden rate-of-change jump (+22 °C in 2s) with immediate recovery. Uncorroborated by humidity, pressure, or regional neighbours.',
    triggerMetric: 'Temperature',
    triggerValue: '55.0 °C',
    observedSequence: [
      { value: 32.0, time: '10:41:58' },
      { value: 33.0, time: '10:42:01' },
      { value: 55.0, time: '10:42:03', abnormal: true },
      { value: 34.0, time: '10:42:06' },
    ],
    evidencePoints: [
      'Sudden rate-of-change anomaly (+22.0 °C within a single reporting interval)',
      'Other measured variables (humidity, pressure) show zero thermodynamic response',
      'Adjacent coastal observations remain completely normal at 31–33 °C',
      'Physics constraint violation: adiabatic atmospheric heating rate exceeded by 400x',
    ],
    featureContributions: [
      { feature: 'Instantaneous ΔT / Δt', impact: 'High', score: 0.46 },
      { feature: 'Vapor pressure deficit residual', impact: 'Moderate', score: 0.22 },
      { feature: 'Temporal autoencoder reconstruction loss', impact: 'Moderate', score: 0.18 },
      { feature: 'Regional neighbor correlation delta', impact: 'Minor', score: 0.08 },
    ],
    layerScores: [
      { layer: 'Temporal Evidence', level: 'Strong', score: 0.94, description: 'Extreme sudden jump incompatible with temporal persistence' },
      { layer: 'Multivariate Evidence', level: 'Strong', score: 0.88, description: 'Humidity and pressure did not react to massive thermal jump' },
      { layer: 'Physics Consistency', level: 'Strong', score: 0.92, description: 'Violates atmospheric thermal inertia limits' },
      { layer: 'Spatial Evidence', level: 'Moderate', score: 0.76, description: 'Surrounding stations remain at nominal 31–33 °C' },
      { layer: 'Contextual Baseline', level: 'Moderate', score: 0.62, description: 'Far outside historical diurnal envelope for station' },
    ],
    fusionScore: 0.89,
    confidencePercent: 94,
    recommendedAction: 'Inspect sensor wiring harness and physical connection for transient contact noise or ESD disturbance.',
  },
  {
    id: 'ALR-2024-0892',
    stationId: 'Jaisalmer_Desert',
    stationName: 'Jaisalmer Desert',
    location: 'Jaisalmer, Rajasthan',
    decision: 'GENUINE_EVENT',
    faultType: 'Range / Plausibility Violation',
    severity: 'MEDIUM',
    status: 'active',
    detectedAt: Date.now() - 480000, // 8 min ago
    headline: 'Regional extreme heatwave event',
    summary: 'Sustained temperature surge to 48.7 °C corroborated by falling relative humidity, pressure dip, and synoptic western disturbance.',
    triggerMetric: 'Temperature',
    triggerValue: '48.7 °C',
    observedSequence: [
      { value: 43.1, time: '13:00:00' },
      { value: 45.4, time: '13:30:00' },
      { value: 47.2, time: '14:00:00' },
      { value: 48.7, time: '14:30:00', abnormal: false },
    ],
    evidencePoints: [
      'Persistent change over time: gradual multi-hour climb consistent with severe advection',
      'Other weather variables evolve consistently: relative humidity dropped from 22% to 14%',
      'Physics consistency preserved: dew point and vapor pressure deficit trace valid desert atmospheric thermodynamics',
      'Regional observations support the event: synoptic desert stations report concurrent severe heatwave',
    ],
    featureContributions: [
      { feature: 'Multi-hour temporal trend', impact: 'High', score: 0.41 },
      { feature: 'Thermodynamic coupling (T vs RH)', impact: 'High', score: 0.38 },
      { feature: 'Regional synoptic alignment', impact: 'Moderate', score: 0.16 },
    ],
    layerScores: [
      { layer: 'Temporal Evidence', level: 'Normal', score: 0.12, description: 'Smooth, continuous heating curve without non-physical discontinuities' },
      { layer: 'Multivariate Evidence', level: 'Normal', score: 0.08, description: 'Humidity dropped in thermodynamic lockstep with temperature' },
      { layer: 'Physics Consistency', level: 'Normal', score: 0.05, description: 'Enthalpy and dew point follow meteorological laws' },
      { layer: 'Spatial Evidence', level: 'Normal', score: 0.10, description: 'Aligned with regional Thar desert synoptic conditions' },
      { layer: 'Contextual Baseline', level: 'Strong', score: 0.72, description: 'Extreme heatwave warning in effect for district' },
    ],
    fusionScore: 0.15,
    confidencePercent: 96,
    recommendedAction: 'Preserve observation. Retain quality flag as verified genuine meteorological extreme. Forward to forecasting bulletin.',
  },
  {
    id: 'ALR-2024-0890',
    stationId: 'New_Delhi_Safdarjung',
    stationName: 'New Delhi Safdarjung',
    location: 'New Delhi, Delhi',
    decision: 'UNCERTAIN',
    faultType: 'Drift / Bias',
    severity: 'MEDIUM',
    status: 'active',
    detectedAt: Date.now() - 1080000, // 18 min ago
    headline: 'Progressive baseline drift detected',
    summary: 'Steady negative offset of -1.8 °C emerging across a 72-hour window. Neighbouring stations reflect warmer regional conditions.',
    triggerMetric: 'Temperature Drift',
    triggerValue: '38.6 °C (-1.8 °C bias)',
    observedSequence: [
      { value: 40.2, time: 'Day -2' },
      { value: 39.5, time: 'Day -1' },
      { value: 38.6, time: 'Today' },
    ],
    evidencePoints: [
      'Temporal evidence suggests an anomaly: monotonic deviation from diurnal baseline over 72h',
      'Cross-station delta against regional peers shows divergence increasing at 0.05 °C / day',
      'Other evidence is mixed: diurnal curve remains intact, but mean elevation is depressed',
      'Review recommended before recalibration or flagging records',
    ],
    featureContributions: [
      { feature: '72h rolling bias delta', impact: 'High', score: 0.34 },
      { feature: 'Inter-station regional variance', impact: 'Moderate', score: 0.26 },
      { feature: 'Diurnal wave shape stability', impact: 'Minor', score: 0.12 },
    ],
    layerScores: [
      { layer: 'Temporal Evidence', level: 'Moderate', score: 0.54, description: 'Gradual downward bias accumulating over consecutive cycles' },
      { layer: 'Multivariate Evidence', level: 'Moderate', score: 0.42, description: 'Slight residual against psychrometric vapor equation' },
      { layer: 'Physics Consistency', level: 'Low', score: 0.28, description: 'Individual points plausible, cumulative trend suspicious' },
      { layer: 'Spatial Evidence', level: 'Moderate', score: 0.58, description: 'Surrounding northern plains stations do not exhibit this depression' },
      { layer: 'Contextual Baseline', level: 'Moderate', score: 0.48, description: 'Sensor deployed 18 months without routine recalibration' },
    ],
    fusionScore: 0.48,
    confidencePercent: 78,
    recommendedAction: 'Schedule field verification. Compare reading against secondary calibrated reference unit before applying offset adjustment.',
  },
];

export const DEMO_SCENARIOS: Record<'A' | 'B' | 'C' | 'D' | 'E', DemoScenario> = {
  A: {
    id: 'A',
    letter: 'A',
    title: 'Normal Weather',
    station: 'Chennai Meenambakkam',
    decision: 'NORMAL',
    whatHappened: 'Observation parameters followed expected coastal diurnal cycle with regular sea-breeze transition.',
    observedPattern: 'Gradual morning thermal rise (28.2 °C → 31.2 °C) paired with gradual relative humidity adjustment (76% → 68%) and stable atmospheric pressure (1009 hPa).',
    readings: [
      { time: '08:00', temp: 28.2, hum: 76, pres: 1010, flag: 'normal' },
      { time: '09:00', temp: 29.5, hum: 73, pres: 1010, flag: 'normal' },
      { time: '10:00', temp: 30.6, hum: 70, pres: 1009, flag: 'normal' },
      { time: '11:00', temp: 31.2, hum: 68, pres: 1009, flag: 'normal' },
    ],
    evidence: {
      temporal: 'Rates of change (< 0.8 °C / hr) are fully bounded by the expected local coastal diurnal envelope.',
      multivariate: 'Temperature and relative humidity trace reciprocal diurnal curves without thermodynamic mismatch.',
      physics: 'Calculated dew point (24.7 °C) and vapor pressure deficit match maritime coastal boundary dynamics.',
      spatial: 'Fully aligned with adjoining regional stations across the coastal corridor.',
    },
    finalDecision: 'NORMAL — OBSERVATION VERIFIED',
    why: 'Temperature, humidity, and pressure are consistent with expected local diurnal behavior; rate-of-change is within natural limits, and no temporal or physical anomalies were detected across any channel.',
  },
  B: {
    id: 'B',
    letter: 'B',
    title: 'Isolated Sensor Fault',
    station: 'Chennai Meenambakkam',
    decision: 'SENSOR_FAULT',
    whatHappened: 'Temperature reading jumped instantly by +22 °C to 55.0 °C for one recording interval, returning immediately to baseline on the next packet.',
    observedPattern: 'Sequence: 32.0 °C → 33.0 °C → 55.0 °C (isolated spike) → 34.0 °C. Zero accompanying shift in humidity or pressure.',
    readings: [
      { time: '10:41:58', temp: 32.0, hum: 67, pres: 1007, flag: 'normal' },
      { time: '10:42:01', temp: 33.0, hum: 67, pres: 1007, flag: 'normal' },
      { time: '10:42:03', temp: 55.0, hum: 67, pres: 1007, flag: 'fault' },
      { time: '10:42:06', temp: 34.0, hum: 66, pres: 1007, flag: 'normal' },
    ],
    evidence: {
      temporal: 'Rate-of-change spike (+22.0 °C in 2s) exceeds the physical limit of sensor thermal mass and convective heat transfer.',
      multivariate: 'Humidity and pressure remain completely flat; genuine atmospheric heating requires thermodynamic moisture adjustment.',
      physics: 'Violates thermodynamic energy conservation (extreme enthalpy jump without external energy flux).',
      spatial: 'Surrounding regional AWS stations show steady 31–33 °C with no thermal perturbation.',
    },
    finalDecision: 'SENSOR / DATA FAULT',
    why: 'The sudden temperature spike (+22 °C in 2 seconds) is physically impossible given thermistor thermal mass and is unsupported by humidity, pressure, or neighboring station observations. The atmosphere itself is not unusual; the reading represents an electrical contact glitch or digitizer fault.',
  },
  C: {
    id: 'C',
    letter: 'C',
    title: 'Genuine Regional Event',
    station: 'Jaisalmer Desert',
    decision: 'GENUINE_EVENT',
    whatHappened: 'Station logged extreme temperature of 48.7 °C during a severe regional advective heatwave.',
    observedPattern: 'Sustained, continuous heating curve climbing over 4 hours: 43.1 °C → 45.4 °C → 47.2 °C → 48.7 °C, matched by plummeting humidity to 14%.',
    readings: [
      { time: '13:00', temp: 43.1, hum: 22, pres: 1000, flag: 'event' },
      { time: '13:30', temp: 45.4, hum: 18, pres: 999, flag: 'event' },
      { time: '14:00', temp: 47.2, hum: 16, pres: 998, flag: 'event' },
      { time: '14:30', temp: 48.7, hum: 14, pres: 998, flag: 'event' },
    ],
    evidence: {
      temporal: 'Persistent change over time: steady, smooth acceleration without non-physical discontinuity.',
      multivariate: 'Other weather variables evolve consistently: deep humidity drawdown matches dry continental advection.',
      physics: 'Atmospheric thermodynamics strictly preserved: vapor deficit curve fits extreme arid adiabatic compression.',
      spatial: 'Regional observations support the event: synoptic desert stations corroborate the severe regional heatwave.',
    },
    finalDecision: 'GENUINE EXTREME WEATHER EVENT',
    why: 'High-temperature reading is validated by temporal continuity, multivariate thermodynamic coupling, and regional network corroboration. An unusual observation is not automatically a sensor fault.',
  },
  D: {
    id: 'D',
    letter: 'D',
    title: 'Genuine Event + One Faulty Station',
    station: 'New Delhi Safdarjung',
    decision: 'SENSOR_FAULT',
    whatHappened: 'A genuine regional rainstorm passed through the district, causing regional stations to drop ~4 °C with rising humidity. However, New Delhi Safdarjung simultaneously reported an impossible drop to 2.0 °C due to water ingress in the thermistor housing.',
    observedPattern: 'Regional cluster: 34 °C → 30 °C (rain cooling). New Delhi Safdarjung: 34 °C → 2.0 °C (water bridged thermistor terminals).',
    readings: [
      { time: '15:10', temp: 34.2, hum: 62, pres: 1008, flag: 'normal' },
      { time: '15:20', temp: 30.5, hum: 78, pres: 1006, flag: 'event' },
      { time: '15:30', temp: 2.0, hum: 100, pres: 1005, flag: 'fault' },
      { time: '15:40', temp: 2.0, hum: 100, pres: 1005, flag: 'fault' },
    ],
    evidence: {
      temporal: 'Regional storm context confirmed across surrounding stations, but the local drop (-32 °C in 1 min) violates physical thermal inertia limits.',
      multivariate: 'Adjoining stations dropped ~4 °C with rising humidity; Safdarjung\'s 2.0 °C reading violates dew point depression limits.',
      physics: 'Sub-freezing temperatures (2 °C) at sea level during monsoon season violate atmospheric thermodynamic bounds.',
      spatial: 'Neighboring cluster stations recorded 30–31 °C during the rainstorm, exposing a 28 °C anomaly at Safdarjung.',
    },
    finalDecision: 'SENSOR FAULT (OCCURRING WITHIN GENUINE WEATHER EVENT)',
    why: 'While a genuine rainstorm event was occurring regionally, New Delhi Safdarjung\'s specific reading of 2.0 °C during monsoon season is physically impossible and caused by a sensor moisture bridge. SkyGuard validates the broader weather event while isolating the specific faulty station observation.',
    notes: 'Controlled demonstration scenario showing dual fault-event isolation capability under stress test conditions.',
  },
  E: {
    id: 'E',
    letter: 'E',
    title: 'Spatial Context Unavailable',
    station: 'Shimla Himalayan',
    decision: 'NORMAL',
    whatHappened: 'High-altitude terrain across Himalayan ridgelines isolates the site, rendering low-altitude spatial cross-correlation unavailable.',
    observedPattern: 'Rapid temperature drop of 6 °C in 20 minutes following local katabatic wind onset (18 °C → 12 °C, pressure spike +3 hPa).',
    readings: [
      { time: '16:00', temp: 18.0, hum: 32, pres: 785, flag: 'normal' },
      { time: '16:10', temp: 15.2, hum: 38, pres: 787, flag: 'normal' },
      { time: '16:20', temp: 12.1, hum: 44, pres: 788, flag: 'normal' },
    ],
    evidence: {
      temporal: 'Smooth exponential decay consistent with katabatic mountain drainage flow.',
      multivariate: 'Simultaneous barometric surge (+3 hPa) and humidity increase confirm dense cold air drainage.',
      physics: 'Hydrostatic mountain airflow equation satisfies local thermodynamics.',
      spatial: 'SPATIAL EVIDENCE UNAVAILABLE (high-altitude orographic separation). Spatial evidence layer disabled; operational confidence adjusted accordingly.',
    },
    finalDecision: 'NORMAL — VERIFIED VIA LOCAL TEMPORAL & PHYSICS EVIDENCE',
    why: 'When spatial evidence is unavailable, SkyGuard gracefully relies on temporal dynamics and physical consistency checks rather than failing or raising a false alarm, while appropriately reducing operational confidence.',
    notes: 'System safely relies on local temporal and thermodynamic evidence layers when regional connectivity or network density is limited.',
  },
};

export const CONTROLLED_BENCHMARK = {
  title: 'Controlled Benchmark Evaluation',
  datasetDescription: 'Controlled evaluation dataset comprising standardized test sequences with ground-truth classifications and controlled physical fault cases.',
  models: [
    {
      name: 'Conventional QC',
      description: 'Static threshold checks, range plausibility, and basic step-test rules.',
      precision: 0.5202,
      recall: 0.2038,
      f1: 0.2929,
      fpr: 0.0063,
    },
    {
      name: 'ML-Only',
      description: 'Standalone ML reconstruction error without physical constraints or multi-modal fusion.',
      precision: 0.0323,
      recall: 0.0007,
      f1: 0.0015,
      fpr: 0.0008,
    },
    {
      name: 'Full SkyGuard',
      description: 'Multi-layer fusion combining edge checks, temporal reasoning, multivariate thermodynamics, and spatial context.',
      precision: 0.5972,
      recall: 0.3721,
      f1: 0.4585,
      fpr: 0.0085,
    },
  ],
  genuineEventPreservation: {
    observations: 483,
    falseAlerts: 0,
    gepr: '1.0000',
    description: '483 genuine-event observations evaluated with 0 false alerts (GEPR 1.0000).',
  },
  eventAndFaultyStation: {
    controlledCases: 12,
    correctlyDetected: 2,
    accuracyPercent: '16.67%',
    description: '12 controlled cases with 2 correctly detected (16.67% accuracy).',
  },
};

// Generates time-series readings for a given station
export function generateHistory(stationId: string, count = 40, injectAnomaly = true): SensorReading[] {
  const station = STATIONS.find(s => s.id === stationId || s.code === stationId) || STATIONS[0];
  const isDesert = station.id === 'Jaisalmer_Desert' || station.id === 'AWS-11' || station.id === 'AWS-04';
  const isFaultStation = station.id === 'Chennai_Meenambakkam' || station.id === 'AWS-03' || station.id === 'AWS-02';
  const isDriftStation = station.id === 'New_Delhi_Safdarjung' || station.id === 'AWS-07' || station.id === 'AWS-06';

  const baseT = isDesert ? 46.0 : (station.temperature || 30.0);
  const baseH = isDesert ? 16.0 : (station.humidity || 65.0);
  const baseP = station.pressure || 1009.0;
  const now = Date.now();
  const stepMs = 60000; // 1 min

  const readings: SensorReading[] = [];

  for (let i = count - 1; i >= 0; i--) {
    const ts = now - i * stepMs;
    // Diurnal sine pattern
    const diurnalT = Math.sin((ts / 3600000) * 0.5) * 1.5;
    let t = baseT + diurnalT + (Math.sin(i * 0.4) * 0.3);
    let h = baseH - diurnalT * 2.0 + (Math.cos(i * 0.3) * 0.8);
    let p = baseP + Math.sin(i * 0.2) * 0.4;

    let decision: SensorReading['decision'] = 'NORMAL';
    let qualityFlag: SensorReading['qualityFlag'] = 'PASS';
    let diagnosis = 'Observation consistent with local meteorological envelope';
    let reason = 'All measured variables adhere to thermodynamic and temporal limits';
    let edge = 0.04;
    let temporal = 0.08;
    let multivariate = 0.06;
    let physics = 0.05;
    let context = 0.08;
    let spatial = 0.05;
    let fusion = 0.07;

    // Inject station specific traits
    if (isFaultStation && injectAnomaly && i === 12) {
      t = 55.0;
      decision = 'SENSOR_FAULT';
      qualityFlag = 'FAIL';
      diagnosis = 'Transient spike anomaly detected';
      reason = 'Sudden +22 °C jump unsupported by humidity or atmospheric pressure';
      edge = 1.0;
      temporal = 0.94;
      multivariate = 0.88;
      physics = 0.92;
      context = 0.62;
      spatial = 0.76;
      fusion = 0.89;
    } else if (isDesert) {
      // Jaisalmer genuine heat event
      t = 47.0 + (count - i) * 0.04;
      h = 15.0 - (count - i) * 0.02;
      decision = 'GENUINE_EVENT';
      qualityFlag = 'PASS';
      diagnosis = 'Verified extreme regional heatwave';
      reason = 'Continuous multi-hour thermal climb verified by regional network';
      fusion = 0.15;
    } else if (isDriftStation) {
      // Delhi drift
      t = t - (count - i) * 0.03;
      if (i < 15) {
        decision = 'UNCERTAIN';
        qualityFlag = 'SUSPECT';
        diagnosis = 'Sensor drift under review';
        reason = 'Progressive negative bias detected relative to regional stations';
        fusion = 0.48;
      }
    }

    const dewPoint = t - (100 - h) / 5;
    const vpd = Math.max(0, 0.6108 * Math.exp((17.27 * t) / (t + 237.3)) * (1 - h / 100));

    readings.push({
      timestamp: ts,
      stationId,
      temperature: Math.round(t * 10) / 10,
      humidity: Math.round(Math.max(5, Math.min(100, h))),
      pressure: Math.round(p),
      dewPoint: Math.round(dewPoint * 10) / 10,
      vpd: Math.round(vpd * 100) / 100,
      edgeScore: Math.round(edge * 100) / 100,
      temporalScore: Math.round(temporal * 100) / 100,
      multivariateScore: Math.round(multivariate * 100) / 100,
      physicsScore: Math.round(physics * 100) / 100,
      contextScore: Math.round(context * 100) / 100,
      spatialScore: Math.round(spatial * 100) / 100,
      fusionScore: Math.round(fusion * 100) / 100,
      decision,
      qualityFlag,
      diagnosis,
      reason,
    });
  }

  return readings;
}

export function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString('en-IN', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function formatDateTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleString('en-IN', { hour12: true, hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' });
}

export function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return `${Math.max(1, diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
