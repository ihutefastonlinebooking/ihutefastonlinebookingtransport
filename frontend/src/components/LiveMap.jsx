import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Spinner } from './Loader';
import io from 'socket.io-client';

// Fix leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function LiveMap({ routeId, driverId }) {
  const [drivers, setDrivers] = React.useState([]);
  const [connected, setConnected] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const mapRef = React.useRef();

  React.useEffect(() => {
    const ws = io(import.meta.env.VITE_WS_URL || 'http://localhost:3001', {
      reconnection: true,
      reconnectionDelay: 1000,
    });

    ws.on('connect', () => {
      setConnected(true);
      if (routeId) ws.emit('subscribe_route', { routeId });
      else if (driverId) ws.emit('subscribe_driver', { driverId });
      setLoading(false);
    });

    ws.on('driver_location_update', (data) => {
      setDrivers(prev => {
        const idx = prev.findIndex(d => d.id === data.driverId);
        if (idx >= 0) {
          const upd = [...prev];
          upd[idx] = { ...upd[idx], lat: data.lat, lng: data.lng, status: data.status };
          return upd;
        }
        return [...prev, { id: data.driverId, lat: data.lat, lng: data.lng, status: data.status }];
      });
    });

    ws.on('disconnect', () => setConnected(false));

    return () => ws.disconnect();
  }, [routeId, driverId]);

  if (loading) return <div className="w-full h-96 flex items-center justify-center"><Spinner /></div>;

  if (!connected) return <div className="w-full h-96 flex items-center justify-center text-gray-600">Connecting to live tracking...</div>;

  // Default center (Rwanda)
  const center = [drivers[0]?.lat || -1.9536, drivers[0]?.lng || 29.8739];

  return (
    <div className="w-full h-96 rounded overflow-hidden shadow-md">
      <MapContainer center={center} zoom={13} scrollWheelZoom={false} className="w-full h-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {drivers.map(driver => (
          <Marker key={driver.id} position={[driver.lat, driver.lng]}>
            <Popup>
              <strong>Driver {driver.id}</strong>
              <br />
              Status: {driver.status}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
