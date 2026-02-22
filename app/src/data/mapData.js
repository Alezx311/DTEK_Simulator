import buildingsGeoJson from './buildings.json';
import polygonsData from './polygons.json';
import groupColorsData from './groupColors.json';

export const groupColors = groupColorsData;
export const polygons = polygonsData;

// Process raw GeoJSON into flat building objects
export function createBuildings() {
  return buildingsGeoJson.features.map(f => ({
    id: f.properties.id,
    lat: f.geometry.coordinates[1],
    lng: f.geometry.coordinates[0],
    address: f.properties.title,
    group: f.properties.group || f.properties.group2 || 'unknown',
    power: Math.floor(Math.random() * 22) + 9, // 9-31 kW realistic
    status: 'on',
  }));
}

// Derive unique groups from buildings
export function deriveGroups(buildings) {
  const map = {};
  buildings.forEach(b => {
    if (!map[b.group]) {
      map[b.group] = { id: b.group, buildings: [], totalPower: 0 };
    }
    map[b.group].buildings.push(b);
    map[b.group].totalPower += b.power;
  });
  return Object.values(map).sort((a, b) => a.id.localeCompare(b.id));
}
