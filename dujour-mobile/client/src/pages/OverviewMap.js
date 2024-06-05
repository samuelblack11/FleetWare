import React, { useEffect, useState, useRef } from 'react';
import { Loader } from "@googlemaps/js-api-loader";
import '../App.css'; // Import the CSS file for marker labels

const config = require('../config');

const containerStyle = {
  width: '100%',
  height: '400px'
};

const center = {
  lat: 38.804840,
  lng: -77.043430
};

const libraries = ['places', 'geometry']; // Add any other required libraries here

// Create a single instance of the Loader
const loader = new Loader({
  apiKey: config.googleMapsApiKey,
  version: "weekly",
  libraries: libraries,
  mapIds: [config.mapID] // Replace with your actual Map ID
});

const OverviewMap = ({ stops }) => {
  const [directions, setDirections] = useState(null);
  const mapRef = useRef(null);
  const directionsRendererRef = useRef(null); // Reference for DirectionsRenderer

  const clearMarkers = () => {
    // Clear markers logic if any
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];
  };

  const markersRef = useRef([]);
  const loadMarkers = (map) => {
    clearMarkers();
    if (window.google && window.google.maps && window.google.maps.marker && window.google.maps.marker.AdvancedMarkerElement) {
      const labels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']; // Extend as needed

      const createMarkerContent = (label) => {
        const div = document.createElement('div');
        div.className = 'marker-label';
        div.innerText = label;
        return div;
      };

      // Center marker
      markersRef.current.push(new window.google.maps.marker.AdvancedMarkerElement({
        map: map,
        position: center,
        title: 'A',
        content: createMarkerContent('A') // Custom content for the marker
      }));

      // Stop markers
      stops.forEach((stop, index) => {
        const position = { lat: stop.latitude, lng: stop.longitude };
        const label = labels[index + 1]; // B, C, D, etc.
        markersRef.current.push(new window.google.maps.marker.AdvancedMarkerElement({
          map: map,
          position: position,
          title: label,
          content: createMarkerContent(label) // Custom content for the marker
        }));
      });
    }
  };

useEffect(() => {
  loader.load().then(() => {
    const map = new window.google.maps.Map(document.getElementById("map"), {
      center: center,
      zoom: 10
    });

    mapRef.current = map;
    loadMarkers(map);

    if (stops && stops.length > 0) {
      const directionsService = new window.google.maps.DirectionsService();
      const directionsRenderer = new window.google.maps.DirectionsRenderer();
      directionsRenderer.setMap(map);
      directionsRendererRef.current = directionsRenderer;

      const waypoints = stops.map(stop => ({
        location: { lat: stop.latitude, lng: stop.longitude },
        stopover: true
      }));

      directionsService.route(
        {
          origin: center,
          destination: waypoints[waypoints.length - 1].location,
          waypoints: waypoints.slice(0, -1),
          travelMode: window.google.maps.TravelMode.DRIVING
        },
        (result, status) => {
          if (status === window.google.maps.DirectionsStatus.OK) {
            setDirections(result);
            directionsRenderer.setDirections(result);
          } else {
            console.error(`Error fetching directions ${result}`);
          }
        }
      );
    }
  }).catch(e => {
    console.error('Error loading Google Maps API:', e);
  });
}, [stops]); // Adding stops to dependency array


  return (
    <div style={containerStyle} id="map">
    </div>
  );
};

export default OverviewMap;

