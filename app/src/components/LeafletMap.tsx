import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { groupColors, polygons } from '../data/mapData';
import type { GameState, ThreatInstance, WeaponInstance, Projectile } from '../types';

interface Props {
  state: GameState;
}

const WEAPON_COLORS: Record<string, string> = {
  mobile: '#39c5cf',
  static: '#2f81f7',
  reb: '#a371f7',
  machinegun: '#ffd700',
  sam: '#f85149',
};

const THREAT_COLORS: Record<string, string> = {
  shahed: '#db6d28',
  rocket: '#f85149',
  ballistic: '#a371f7',
  boss: '#ff00ff',
};

export default function LeafletMap({ state }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ marker: L.CircleMarker; buildingId: string }[]>([]);
  const threatMarkersRef = useRef<{ marker: L.CircleMarker; line: L.Polyline; id: string }[]>([]);
  const weaponLayersRef = useRef<{ marker: L.CircleMarker; circle: L.Circle; id: string }[]>([]);
  const projectileLinesRef = useRef<{ line: L.Polyline; id: string }[]>([]);

  // ── Effect 1: Map initialization + polygon overlays ───────────────
  useEffect(() => {
    if (mapInstanceRef.current || !mapRef.current) return;

    const map = L.map(mapRef.current, {
      zoomControl: true,
      attributionControl: false,
    }).setView([50.465, 30.355], 15.8);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
    }).addTo(map);

    polygons.forEach(poly => {
      const latLngs = poly.coordinates.map((c: [number, number]) => [c[1], c[0]] as [number, number]);
      L.polygon(latLngs, {
        color: groupColors[poly.group] || '#fff',
        weight: 2.5,
        opacity: 0.75,
        fillOpacity: 0.08,
      }).addTo(map);
    });

    mapInstanceRef.current = map;

    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(mapRef.current);

    return () => {
      ro.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // ── Effect 2: Create building markers (only when buildings length changes) ──
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !state.buildings.length) return;

    markersRef.current.forEach(({ marker }) => map.removeLayer(marker));
    markersRef.current = [];

    state.buildings.forEach(b => {
      const marker = L.circleMarker([b.lat, b.lng], {
        radius: 3.5,
        fillColor: '#3fb950',
        color: '#222',
        weight: 1,
        opacity: 0.8,
        fillOpacity: 0.85,
      }).addTo(map);

      marker.bindTooltip(
        `<b>${b.address}</b><br>Група: ${b.group}<br>${b.incomeRate}₴/с`,
        { permanent: false, direction: 'top' }
      );

      markersRef.current.push({ marker, buildingId: b.id });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.buildings.length]);

  // ── Effect 3: Update building marker styles on status change ──────
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const buildingMap = new Map(state.buildings.map(b => [b.id, b]));

    markersRef.current.forEach(({ marker, buildingId }) => {
      const cur = buildingMap.get(buildingId);
      if (!cur) return;

      let fillColor: string, fillOpacity: number, radius: number;
      if (cur.status === 'destroyed') {
        fillColor = '#222222';
        fillOpacity = 0.7;
        radius = 3;
      } else if (cur.status === 'damaged') {
        fillColor = '#f85149';
        fillOpacity = 0.9;
        radius = 4;
      } else {
        fillColor = '#3fb950';
        fillOpacity = 0.85;
        radius = 3.5;
      }

      marker.setStyle({ fillColor, color: '#222', weight: 1, opacity: 0.8, fillOpacity });
      marker.setRadius(radius);
    });
  }, [state.buildings]);

  // ── Effect 4: Weapon markers + radius circles ─────────────────────
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    weaponLayersRef.current.forEach(({ marker, circle }) => {
      map.removeLayer(marker);
      map.removeLayer(circle);
    });
    weaponLayersRef.current = [];

    state.weapons.forEach((w: WeaponInstance) => {
      const color = WEAPON_COLORS[w.type] || '#39c5cf';

      const circle = L.circle([w.lat, w.lng], {
        radius: w.radius,
        color,
        weight: 1,
        opacity: 0.4,
        fillOpacity: 0.05,
        dashArray: '4 4',
      }).addTo(map);

      const marker = L.circleMarker([w.lat, w.lng], {
        radius: w.type === 'reb' ? 10 : 8,
        fillColor: color,
        color: '#fff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.9,
      }).addTo(map);

      const typeName: Record<string, string> = {
        mobile: 'Мобільна ППО', static: 'Статичне ППО', reb: 'РЕБ-станція', machinegun: 'Кулемет', sam: 'ЗРК',
      };
      marker.bindTooltip(`${typeName[w.type] || w.type}<br>R: ${w.radius}м`, { permanent: false });

      weaponLayersRef.current.push({ marker, circle, id: w.id });
    });
  }, [state.weapons]);

  // ── Effect 5: Threat markers + flight path lines ───────────────────
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    threatMarkersRef.current.forEach(({ marker, line }) => {
      map.removeLayer(marker);
      map.removeLayer(line);
    });
    threatMarkersRef.current = [];

    state.wave.threats.forEach((t: ThreatInstance) => {
      const curLat = t.startLat + (t.targetLat - t.startLat) * t.progress;
      const curLng = t.startLng + (t.targetLng - t.startLng) * t.progress;

      const color = t.hitFlash > 0 ? '#ffffff' : (THREAT_COLORS[t.type] || '#888888');

      const line = L.polyline(
        [[curLat, curLng], [t.targetLat, t.targetLng]],
        { color, weight: 1.5, opacity: 0.35, dashArray: '5 8' }
      ).addTo(map);

      const radius = t.type === 'boss' ? 10 : t.type === 'ballistic' ? 8 : 6;
      const marker = L.circleMarker([curLat, curLng], {
        radius,
        fillColor: color,
        color: t.hitFlash > 0 ? '#ff0000' : '#fff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.92,
      }).addTo(map);

      const cityLabel = t.launchCity ? ` з ${t.launchCity}` : '';
      marker.bindTooltip(`${t.icon} ${t.name}${cityLabel}<br>HP: ${Math.ceil(t.currentHealth)}/${t.maxHealth}`, {
        permanent: true,
        direction: 'top',
        className: 'threat-tooltip',
      });

      threatMarkersRef.current.push({ marker, line, id: t.instanceId });
    });
  }, [state.wave.threats]);

  // ── Effect 6: Projectile lines ─────────────────────────────────────
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    projectileLinesRef.current.forEach(({ line }) => map.removeLayer(line));
    projectileLinesRef.current = [];

    state.projectiles.forEach((p: Projectile) => {
      const weapon = state.weapons.find(w => w.id === p.weaponId);
      if (!weapon) return;

      const curLat = p.startLat + (p.targetLat - p.startLat) * p.progress;
      const curLng = p.startLng + (p.targetLng - p.startLng) * p.progress;

      const color = p.isCrit ? '#ffff00' : (WEAPON_COLORS[weapon.type] || '#fff');
      const weight = p.isCrit ? 3.5 : 2;
      const line = L.polyline(
        [[weapon.lat, weapon.lng], [curLat, curLng]],
        { color, weight, opacity: p.isCrit ? 1.0 : 0.8 }
      ).addTo(map);

      projectileLinesRef.current.push({ line, id: p.id });
    });
  }, [state.projectiles, state.weapons]);

  const shahedCount = state.wave.threats.filter(t => t.type === 'shahed').length;
  const rocketCount = state.wave.threats.filter(t => t.type === 'rocket').length;
  const ballCount = state.wave.threats.filter(t => t.type === 'ballistic' || t.type === 'boss').length;

  return (
    <div className="panel map-section">
      <div className="map-header">
        <span>🗺️ АКАДЕММІСТЕЧКО</span>
        <div className="threats-display">
          {shahedCount > 0 && <span className="threat-counter shahed">🛩️{shahedCount}</span>}
          {rocketCount > 0 && <span className="threat-counter rocket">🚀{rocketCount}</span>}
          {ballCount > 0 && <span className="threat-counter ballistic">☄️{ballCount}</span>}
          {state.weapons.length > 0 && <span className="threat-counter" style={{ color: '#39c5cf' }}>🛡️{state.weapons.length}</span>}
          {state.blackoutTimer !== null && (
            <span className="threat-counter" style={{ color: 'var(--status-red)', fontWeight: 700 }}>
              ⚡ БЛЕКАУТ {Math.ceil(state.blackoutTimer)}с
            </span>
          )}
        </div>
      </div>
      <div ref={mapRef} className="kyiv-map" />
    </div>
  );
}
