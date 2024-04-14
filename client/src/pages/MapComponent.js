import React from 'react';
import GoogleMapReact from 'google-map-react';
const config = require('../config'); 


const PinIcon = ({ color }) => (
  <svg height="30" width="30" viewBox="0 0 24 24" style={{ fill: color }}>
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5 14.5 7.62 14.5 9 13.38 11.5 12 11.5z"/>
  </svg>
);

const colors = ["red", "blue", "green", "yellow", "purple", "orange", "brown", "pink", "gray", "teal"]; // Define your colors

const MapComponent = ({ whLocation, routes }) => {
    const defaultProps = {
        center: {
            lat: 38.8433,
            lng: -77.2705
        },
        zoom: 11
    };

const handleApiLoaded = ({ map, maps }) => {
    routes.forEach((route, idx) => {
        const directionsService = new maps.DirectionsService();
        const directionsRenderer = new maps.DirectionsRenderer({
            map: map,
            suppressMarkers: false, // Set this to false to use default markers
            polylineOptions: {
                strokeColor: colors[idx % colors.length], // Use route-specific color
                strokeOpacity: 0.8,
                strokeWeight: 4,
            },
            preserveViewport: true // Keeps the current zoom level after rendering the route
        });

        // Set the origin as the warehouse location
        const origin = { lat: whLocation.latitude, lng: whLocation.longitude };
        // The last stop in the array is the destination
        const destination = {
            lat: route.stops[route.stops.length - 1].latitude,
            lng: route.stops[route.stops.length - 1].longitude,
        };
        // Intermediate stops are waypoints
        const waypoints = route.stops.slice(0, -1).map(stop => ({
            location: { lat: stop.latitude, lng: stop.longitude },
            stopover: true
        }));

        directionsService.route({
            origin: origin,
            destination: destination,
            waypoints: waypoints,
            travelMode: maps.TravelMode.DRIVING,
        }, (response, status) => {
            if (status === maps.DirectionsStatus.OK) {
                directionsRenderer.setDirections(response);
            } else {
                console.error('Directions request failed due to ' + status);
            }
        });
    });
};

    
    return (
        <div style={{ height: '400px', width: '100%', position: 'relative', overflow: 'hidden' }}>
            <GoogleMapReact
                bootstrapURLKeys={{ key: config.googleMapsApiKey }}
                defaultCenter={defaultProps.center}
                defaultZoom={defaultProps.zoom}
                onGoogleApiLoaded={handleApiLoaded}
                yesIWantToUseGoogleMapApiInternals
            />
        </div>
    );
};

export default MapComponent;
