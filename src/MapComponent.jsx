// src/MapComponent.jsx
import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// 1. Define Custom Icons (Using Emoji Images for speed)
const carIcon = new L.DivIcon({
  html: '<div style="font-size: 24px;">🚗</div>',
  className: 'custom-div-icon',
  iconSize: [30, 30],
  iconAnchor: [15, 15]
});

const bagIcon = new L.DivIcon({
  html: '<div style="font-size: 24px;">🛍️</div>',
  className: 'custom-div-icon',
  iconSize: [30, 30],
  iconAnchor: [15, 15]
});

const sosIcon = new L.DivIcon({
  html: '<div class="animate-ping" style="font-size: 24px;">🚨</div>',
  className: 'custom-div-icon',
  iconSize: [30, 30],
  iconAnchor: [15, 15]
});

// 2. The Component accepts 'requests' data now
const MapComponent = ({ requests = [] }) => {
  const position = [19.0760, 72.8777]; // Campus Center

  return (
    <div className="h-full w-full">
      <MapContainer center={position} zoom={14} style={{ height: "100%", width: "100%" }} zoomControl={false}>
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {/* 3. Map through the requests and drop pins */}
        {requests.map((req) => (
          req.location && (
            <Marker 
              key={req.id} 
              position={req.location} 
              icon={req.type === 'SOS' ? sosIcon : (req.type === 'RIDE' ? carIcon : bagIcon)}
            >
              <Popup>
                <div className="text-center">
                  <h3 className="font-bold text-sm">{req.title}</h3>
                  <p className="text-xs text-gray-500">{req.description}</p>
                  <button className="mt-2 bg-indigo-600 text-white text-xs px-2 py-1 rounded">Join</button>
                </div>
              </Popup>
            </Marker>
          )
        ))}

        {/* Your Location */}
        <Marker position={position}>
           <Popup>📍 You are here</Popup>
        </Marker>

      </MapContainer>
    </div>
  );
};

export default MapComponent;