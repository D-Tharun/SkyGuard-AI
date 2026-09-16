import { Station, AnomalyAlert, DemoScenario, SensorReading } from '../types';

const API_BASE_URL = '/api';

export async function fetchHealth(): Promise<{ status: string, backend: string, version: string }> {
  const response = await fetch(`${API_BASE_URL}/health`);
  if (!response.ok) throw new Error('API unavailable');
  return response.json();
}

export async function fetchStations(): Promise<Station[]> {
  const response = await fetch(`${API_BASE_URL}/stations`);
  if (!response.ok) throw new Error('Failed to fetch stations');
  return response.json();
}

export async function fetchObservations(stationId?: string, limit = 40): Promise<SensorReading[]> {
  const url = stationId 
    ? `${API_BASE_URL}/observations?stationId=${stationId}&limit=${limit}`
    : `${API_BASE_URL}/observations?limit=${limit}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch observations');
  return response.json();
}

export async function fetchAlerts(): Promise<AnomalyAlert[]> {
  const response = await fetch(`${API_BASE_URL}/alerts`);
  if (!response.ok) throw new Error('Failed to fetch alerts');
  return response.json();
}

export async function fetchScenario(scenarioId: string): Promise<{ scenario_id: string, target_station: string, target_idx: number, readings: SensorReading[] }> {
  const response = await fetch(`${API_BASE_URL}/scenarios/${encodeURIComponent(scenarioId)}`);
  if (!response.ok) throw new Error('Failed to fetch scenario');
  return response.json();
}

export async function fetchPerformance(): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/performance`);
  if (!response.ok) throw new Error('Failed to fetch performance stats');
  return response.json();
}
