import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import './AllPages.css';
import { AuthContext } from '../App.js';
import MapComponent from './MapComponent';

function RouteView() {
  const authContext = useContext(AuthContext);
  const today = new Date();
  const formattedDate = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
  const { user } = useContext(AuthContext);
  const [routeDetails, setRouteDetails] = useState({ routes: [] });
  const [orders, setOrders] = useState([]);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [routePlanExists, setRoutePlanExists] = useState(false);
  const whLocation = {
    latitude: 38.8433,
    longitude: -77.2705,
    address: "9464 Main St, FairFax, VA 22031"
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !user.email) {
        console.log("User or user.email is not defined.");
        return;
      }

      console.log("Fetching data with formattedDate:", formattedDate, "and driver email:", user.email);

      try {
        const response = await axios.get(`/api/deliveryRoutes/specificRoute?date=2024-04-15&email=jane.smith@email.com`);
        console.log("API response:", response.data);
        setRoutePlanExists(response.data.exists);

        if (response.data.exists) {
          setRouteDetails({ routes: response.data.routes });
        } else {
          setRouteDetails({ routes: [] });
        }
      } catch (error) {
        console.error("Error fetching route plan details:", error);
        setRouteDetails({ routes: [] });
      }
    };

    fetchData();

    const handler = setTimeout(fetchData, 500); // Delayed fetch to ensure user info is loaded
    return () => clearTimeout(handler);
  }, [user, formattedDate]);

  useEffect(() => {
  }, [routeDetails]);

  function reformatDate(selectedDate) {
    const dateParts = selectedDate.split('-'); // Split the date by '-'
    const year = dateParts[0].substr(2); // Get the last two digits of the year
    const month = dateParts[1]; // Month
    const day = dateParts[2]; // Day

    // Construct the new date format as 'mm/dd/yy'
    return `${month}/${day}/${year}`;
  }

  return (
    <div>
      <>
        <h2>Route Plan for {reformatDate("2024-04-15")}</h2>
        <MapComponent whLocation={whLocation} routes={routeDetails.routes} />
        {routeDetails.routes.map((route, routeIndex) => (
          <div key={routeIndex}>
            <h3>Route {routeIndex + 1}</h3>
            <table>
              <thead>
                <tr>
                  <th>Stop Number</th>
                  <th>Address</th>
                  <th>Customer Email</th>
                  <th>Order Number</th>
                </tr>
              </thead>
              <tbody>
                {route.stops.map((stop, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>{stop.address}</td>
                    <td>{stop.customerEmail}</td>
                    <td>{stop.orderNumber}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </>
    </div>
  );
}

export default RouteView;