import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Navigation, Crosshair, Layers } from 'lucide-react';

const cyberIcon = L.divIcon({
  className: 'cyber-custom-marker',
  html: `<div class="cyber-marker-pulse"></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

interface CyberMapProps {
  latitude: number;
  longitude: number;
  accuracy?: number;
  updatedAt?: string;
  tileStyle?: 'tactical' | 'satellite' | 'street';
}

function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  React.useEffect(() => {
    map.flyTo([lat, lng], map.getZoom(), { animate: true, duration: 1.2 });
  }, [lat, lng, map]);
  return null;
}

export const CyberMap: React.FC<CyberMapProps> = ({
  latitude,
  longitude,
  accuracy = 25,
  updatedAt,
  tileStyle = 'tactical',
}) => {
  const [activeTile, setActiveTile] = React.useState<'tactical' | 'satellite' | 'street'>(tileStyle);

  const getTileUrl = () => {
    switch (activeTile) {
      case 'satellite':
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      case 'street':
        return 'https://{s}.tile.openstreetmap.org/{z}/{y}/{x}.png';
      case 'tactical':
      default:
        return 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{y}/{x}{r}.png';
    }
  };

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden border border-cyber-border shadow-neon-teal">
      <div className="absolute top-3 left-3 z-[1000] flex items-center gap-2 bg-cyber-bg/90 border border-cyber-teal/40 px-3 py-1.5 rounded-md text-xs font-mono text-cyber-teal backdrop-blur-md">
        <Crosshair className="w-4 h-4 text-cyber-teal animate-spin" style={{ animationDuration: '6s' }} />
        <span>GPS LOCK: {latitude.toFixed(5)}, {longitude.toFixed(5)}</span>
      </div>

      <div className="absolute top-3 right-3 z-[1000] flex items-center bg-cyber-bg/90 border border-cyber-border rounded-md overflow-hidden backdrop-blur-md text-xs font-mono">
        <button
          onClick={() => setActiveTile('tactical')}
          className={`px-3 py-1.5 flex items-center gap-1 transition-all ${
            activeTile === 'tactical' ? 'bg-cyber-teal/20 text-cyber-teal border-b-2 border-cyber-teal' : 'text-gray-400 hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" /> TAC-DARK
        </button>
        <button
          onClick={() => setActiveTile('satellite')}
          className={`px-3 py-1.5 flex items-center gap-1 transition-all ${
            activeTile === 'satellite' ? 'bg-cyber-teal/20 text-cyber-teal border-b-2 border-cyber-teal' : 'text-gray-400 hover:text-white'
          }`}
        >
          SAT-EYE
        </button>
        <button
          onClick={() => setActiveTile('street')}
          className={`px-3 py-1.5 flex items-center gap-1 transition-all ${
            activeTile === 'street' ? 'bg-cyber-teal/20 text-cyber-teal border-b-2 border-cyber-teal' : 'text-gray-400 hover:text-white'
          }`}
        >
          GRID
        </button>
      </div>

      <MapContainer
        center={[latitude, longitude]}
        zoom={16}
        scrollWheelZoom={true}
        className="w-full h-full min-h-[350px] z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url={getTileUrl()}
        />

        <RecenterMap lat={latitude} lng={longitude} />

        <Circle
          center={[latitude, longitude]}
          radius={accuracy}
          pathOptions={{
            color: '#00f3ff',
            fillColor: '#00f3ff',
            fillOpacity: 0.15,
            weight: 1.5,
            dashArray: '4, 4',
          }}
        />

        <Marker position={[latitude, longitude]} icon={cyberIcon}>
          <Popup className="cyber-popup">
            <div className="p-1 font-mono text-xs text-cyber-teal space-y-1">
              <div className="font-bold flex items-center gap-1 border-b border-cyber-teal/30 pb-1">
                <Navigation className="w-3.5 h-3.5 text-cyber-teal" /> NODE TARGET ACTIVE
              </div>
              <div>Lat: {latitude.toFixed(6)}</div>
              <div>Lng: {longitude.toFixed(6)}</div>
              <div>Accuracy: ±{Math.round(accuracy)}m</div>
              {updatedAt && (
                <div className="text-[10px] text-gray-400">
                  Last Sync: {new Date(updatedAt).toLocaleTimeString()}
                </div>
              )}
            </div>
          </Popup>
        </Marker>
      </MapContainer>

      <div className="pointer-events-none absolute inset-0 border border-cyber-teal/20 z-[999] bg-cyber-grid opacity-30" />
    </div>
  );
};
