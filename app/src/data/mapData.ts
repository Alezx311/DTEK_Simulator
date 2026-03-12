import buildingsGeoJson from './buildings.json';
import polygonsData from './polygons.json';
import groupColorsData from './groupColors.json';
import type { Building } from '../types';

export const groupColors = groupColorsData as Record<string, string>;
export const polygons = polygonsData as Array<{ group: string; coordinates: [number, number][] }>;

interface GeoFeature {
  properties: { id: string; title: string; group?: string; group2?: string };
  geometry: { coordinates: [number, number] };
}

export function createBuildings(): Building[] {
  return (buildingsGeoJson as { features: GeoFeature[] }).features.map(f => ({
    id: f.properties.id,
    lat: f.geometry.coordinates[1],
    lng: f.geometry.coordinates[0],
    address: f.properties.title,
    group: f.properties.group || f.properties.group2 || 'unknown',
    incomeRate: Math.floor(Math.random() * 3) + 1,
    status: 'on' as const,
    destroyedAt: null,
    offTime: 0,
  }));
}
