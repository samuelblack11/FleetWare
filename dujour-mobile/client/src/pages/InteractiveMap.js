import React, { useEffect, useState } from 'react';
import { GoogleMap, LoadScript, DirectionsService, DirectionsRenderer } from '@react-google-maps/api';
const config = require('../config');

const containerStyle = {
  width: '100%',
  height: '100vh',
  position: 'relative'
};

const center = {
  lat: 38.804840,
  lng: -77.043430
};

const InteractiveMap = ({ stop, stops, onBack, onDeliver }) => {
  const [directions, setDirections] = useState(null);

  useEffect(() => {
    if (stops && stops.length > 0) {
      const origin = stops[0];
      const destination = stop;
      const waypoints = stops.slice(1, -1).map(stop => ({ location: { lat: stop.latitude, lng: stop.longitude } }));

      const directionsService = new window.google.maps.DirectionsService();
      directionsService.route(
        {
          origin: { lat: origin.latitude, lng: origin.longitude },
          destination: { lat: destination.latitude, lng: destination.longitude },
          waypoints: waypoints,
          travelMode: window.google.maps.TravelMode.DRIVING
        },
        (result, status) => {
          if (status === window.google.maps.DirectionsStatus.OK) {
            setDirections(result);
          } else {
            console.error(`Error fetching directions ${result}`);
          }
        }
      );
    }
  }, [stop, stops]);

  return (
    <LoadScript googleMapsApiKey={config.googleMapsApiKey}>
      <div style={containerStyle}>
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={center}
          zoom={10}
          onLoad={(map) => console.log('Map loaded:', map)}
          onUnmount={(map) => console.log('Map unmounted:', map)}
        >
          {directions && (
            <DirectionsRenderer
              directions={directions}
            />
          )}
        </GoogleMap>
        <div className="overlay-buttons">
          <button className="back-button" onClick={onBack}>Back</button>
          <button className="deliver-button" onClick={onDeliver}>Deliver Package</button>
        </div>
      </div>
    </LoadScript>
  );
};

export default InteractiveMap;
