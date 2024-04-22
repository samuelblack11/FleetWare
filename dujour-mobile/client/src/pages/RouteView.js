import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import './AllPages.css';
import { AuthContext } from '../App.js';

// Assuming 'Performance' should be the name of the component
function RouteView() {
  // You can use state, context, and effects here if needed
  const authContext = useContext(AuthContext);
  const today = new Date();
  const formattedDate = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
  const { user } = useContext(AuthContext);  // Access user from context
  const [routeDetails, setRouteDetails] = useState({ routes: [] });
  const [orders, setOrders] = useState([]);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [routePlanExists, setRoutePlanExists] = useState(false);

  const checkForExistingRoutePlan = async (thisDriver) => {
    try {
        const response = await axios.get(`/api/deliveryRoutes?date=${formattedDate}&driver=${user}`);
        // Assuming response.data.exists is true if a route plan exists, false otherwise
        console.log(`Returned ${response} Routes`)
        console.log(routeDetails.routes)
        return response.data.exists;
    } catch (error) {
        console.error("Error checking for existing route plan:", error);
        //return false; // Assume no plan exists if there's an error
    }
  };

useEffect(() => {
  const fetchData = async () => {
    if (!user || !user.email) {
      console.log("User or user.email is not defined.");
      return;
    }

    console.log("Fetching data with formattedDate:", formattedDate, "and driver email:", user.email);

    try {
      // Ensure the query string matches the expected API endpoint parameter 'email'
      //const response = await axios.get(`http://localhost:3001/api/deliveryRoutes?date=${formattedDate}`);
      const response = await axios.get(`/api/deliveryRoutes/specificRoute?date=2024-04-15&email=jane.smith@email.com`);
      //const response = await axios.get(`/api/deliveryRoutes/specificRoute?date=${formattedDate}&email=${user.email}`);
      console.log("API response:", response.data);
      setRoutePlanExists(response.data.exists);

      if (response.data.exists) {
        setRouteDetails(response.data.routes);
      } else {
        setRouteDetails({ routes: [] });
      }
    } catch (error) {
      console.error("Error fetching route plan details:", error);
      setRouteDetails({ routes: [] });
    }
  };

  const handler = setTimeout(fetchData, 500); // Delayed fetch to ensure user info is loaded
  return () => clearTimeout(handler);
}, [user, formattedDate]); // Depend on user and formattedDate to re-run fetchData


  return (
    <div>
        <table>
          <thead>
            <tr>
              <th>Stop Number</th>
              <th>Address</th>
              <th>Customer Email</th>
              <th>Order Number</th>
            </tr>
          </thead>
        </table>
    </div>
  );
}

export default RouteView;