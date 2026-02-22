import { useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { groupColors, polygons } from '../data/mapData';

export default function LeafletMap({ state, dispatch }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const threatMarkersRef = useRef([]);

  const toggleGroup = useCallback((groupId) => {
    dispatch({ type: 'TOGGLE_GROUP', payload: groupId });
  }, [dispatch]);

  // Initialize map once
  useEffect(() => {
    if (mapInstanceRef.current) return;
    const map = L.map(mapRef.current, {
      zoomControl: true,
      attributionControl: false,
    }).setView([50.465, 30.355], 15.8);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
    }).addTo(map);

    // Draw district polygons
    polygons.forEach(poly => {
      const latLngs = poly.coordinates.map(c => [c[1], c[0]]);
      L.polygon(latLngs, {
        color: groupColors[poly.group] || '#fff',
        weight: 2.5,
        opacity: 0.75,
        fillOpacity: 0.08,
      }).addTo(map);
    });

    mapInstanceRef.current = map;

    // Fix Leaflet resize issues in flex containers
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(mapRef.current);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Create/update building markers when buildings change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !state.buildings) return;

    // Remove old markers
    markersRef.current.forEach(m => map.removeLayer(m.marker));
    markersRef.current = [];

    // Create new markers
    state.buildings.forEach(building => {
      const color = groupColors[building.group] || '#3fb950';
      const marker = L.circleMarker([building.lat, building.lng], {
        radius: 7,
        fillColor: color,
        color: '#111',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.95,
      }).addTo(map);

      marker.bindTooltip(
        `<b>${building.address}</b><br>Група: ${building.group}<br>${building.power} кВт`,
        { permanent: false, direction: 'top' }
      );

      marker.on('click', () => toggleGroup(building.group));
      markersRef.current.push({ marker, building });
    });
  // Only recreate markers on full reset
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.buildings.length, toggleGroup]);

  // Update marker styles based on status
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    markersRef.current.forEach(({ marker, building }) => {
      // Find current building state
      const cur = state.buildings.find(b => b.id === building.id);
      if (!cur) return;

      let fillColor, fillOpacity, radius;
      if (cur.status === 'damaged') {
        fillColor = '#f85149';
        fillOpacity = 0.85;
        radius = 7;
      } else if (cur.status === 'on') {
        fillColor = '#3fb950';
        fillOpacity = 0.95;
        radius = 7;
      } else {
        fillColor = '#222222';
        fillOpacity = 0.7;
        radius = 6;
      }

      marker.setStyle({
        fillColor,
        color: '#ffffff',
        weight: 2,
        opacity: 1,
        fillOpacity,
        radius,
      });
    });
  }, [state.buildings]);

  // Animate threats on the map
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clean up old threat visuals
    threatMarkersRef.current.forEach(({ marker, line }) => {
      if (marker) map.removeLayer(marker);
      if (line) map.removeLayer(line);
    });
    threatMarkersRef.current = [];

    // Draw current threats
    state.wave.threats.forEach(t => {
      if (!t.targetLat || !t.targetLng) return;

      const bounds = map.getBounds();
      const startLat = bounds.getNorth();
      const startLng = bounds.getWest() + (bounds.getEast() - bounds.getWest()) * (t.startX || 0.2);

      const curLat = startLat + (t.targetLat - startLat) * t.progress;
      const curLng = startLng + (t.targetLng - startLng) * t.progress;

      const line = L.polyline([[curLat, curLng], [t.targetLat, t.targetLng]], {
        color: t.type === 'shahed' ? '#888888' : t.type === 'rocket' ? '#ff4444' : '#a371f7',
        weight: 2,
        opacity: 0.4,
        dashArray: '5, 10',
      }).addTo(map);

      const marker = L.circleMarker([curLat, curLng], {
        radius: t.type === 'shahed' ? 6 : 8,
        fillColor: t.type === 'shahed' ? '#db6d28' : t.type === 'rocket' ? '#ff4444' : '#a371f7',
        color: '#fff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.9,
      }).addTo(map);

      marker.bindTooltip(t.icon || '', {
        permanent: true,
        direction: 'top',
        className: 'threat-tooltip',
      });

      threatMarkersRef.current.push({ marker, line });
    });
  }, [state.wave.threats]);

  const shahedCount = state.wave.threats.filter(t => t.type === 'shahed').length;
  const rocketCount = state.wave.threats.filter(t => t.type === 'rocket').length;
  const ballCount = state.wave.threats.filter(t => t.type === 'ballistic' || t.type === 'boss').length;

  return (
    <div className="panel map-section">
      <div className="map-header">
        <span>{'\u{1F5FA}\uFE0F'} АКАДЕММІСТЕЧКО</span>
        <div className="threats-display">
          <span className="threat-counter shahed">{'\u{1F6E9}\uFE0F'}{shahedCount}</span>
          <span className="threat-counter rocket">{'\u{1F680}'}{rocketCount}</span>
          <span className="threat-counter ballistic">{'\u2604\uFE0F'}{ballCount}</span>
        </div>
      </div>
      <div ref={mapRef} className="kyiv-map" />
    </div>
  );
}
