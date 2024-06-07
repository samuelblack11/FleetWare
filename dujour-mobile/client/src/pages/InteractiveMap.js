import React, { useEffect, useState } from 'react';
import { GoogleMap, LoadScript, DirectionsRenderer } from '@react-google-maps/api';
const config = require('../config');

const containerStyle = {
  width: '100%',
  height: '100vh'
};

const center = {
  lat: 38.804840,
  lng: -77.043430
};

const InteractiveMap = ({ origin, destination, onBack, onDeliver }) => {
  const [directions, setDirections] = useState(null);
  console.log(`Origin: ${origin}`);
  console.log(`Destination: ${destination}`);


  useEffect(() => {
    if (origin && destination) {
      const directionsService = new window.google.maps.DirectionsService();
      directionsService.route({
        origin: origin,  // Use origin passed as a prop
        destination: destination,  // Use destination passed as a prop
        travelMode: window.google.maps.TravelMode.DRIVING
      }, (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK) {
          setDirections(result);
        } else {
          console.error(`Error fetching directions ${result}`);
        }
      });
    }
  }, [origin, destination]); // React to changes in origin and destination

  return (
      <div style={{ position: 'absolute', width: '100%', height: '100%' }}> 
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={center}
          zoom={10}
        >
          {directions && (
            <DirectionsRenderer
              directions={directions}
            />
          )}
        </GoogleMap>
        <div className="overlay-buttons" style={{ position: 'absolute', top: '10px', left: '10px' }}>
          <button className="add-button" onClick={onBack} style={{ marginTop: '70px', marginRight: '10px' }}>Back</button>
          <button className="add-button" onClick={onDeliver} style={{ marginTop: '70px' }}>Deliver Package</button>
        </div>
      </div>
  );
};

export default InteractiveMap;
