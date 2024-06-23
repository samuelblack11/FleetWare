import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { GenericTable, GenericPopup } from './ReusableReactComponents';
import MapComponent from './MapComponent';
const moment = require('moment-timezone');

const LoadingSpinner = () => {
  return (
    <div className="spinner-container">
      <div className="spinner" aria-label="Loading"></div>
    </div>
  );
};

const RouteOptimization = () => {
  const dateInEST = moment().tz("America/New_York").set({hour: 11, minute: 0, second: 0, millisecond: 0});
  const formattedDate = dateInEST.format('YYYY-MM-DD');;
  const [selectedDate, setSelectedDate] = useState(formattedDate);
  const [orders, setOrders] = useState([]);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [numClusters, setNumClusters] = useState(2);
  const [optimizedRoutes, setOptimizedRoutes] = useState([]);
  const [routePlanExists, setRoutePlanExists] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [users, setUsers] = useState([]);
  const [routePlan, setRoutePlan] = useState({ routes: [] });
  const [selectedUsers, setSelectedUsers] = useState({});
  const [routingMethod, setRoutingMethod] = useState('kmeans');
  const [showRoutePlan, setShowRoutePlan] = useState(false);
  const [planSaved, setPlanSaved] = useState(false);

  const whLocation = {
    latitude: 38.804840,
    longitude: -77.043430,
    address: " 301 King St, Alexandria, VA 22314"
  };

useEffect(() => {
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const exists = await checkForExistingRoutePlan(selectedDate);
      setRoutePlanExists(exists);
      if (exists) {
        const { data: routePlan } = await axios.get(`/api/deliveryRoutes?date=${selectedDate}`);
        console.log("**")
        console.log(routePlan)
        setRoutePlan(routePlan);

      // Initialize users for each route, use "Set Driver" as a placeholder if no driver is assigned
      const usersInit = routePlan.routes.reduce((acc, route, index) => {
      console.log(route)
      // Check if the route has a driver and the driver has an _id, otherwise use a placeholder
      if (route.driver && route.driver._id) {
        acc[index] = route.driver._id;
      } else {
        acc[index] = "Select a Driver"; // Using a placeholder string
      }
      return acc;
    }, {});
      console.log("&&&")
      console.log(usersInit)
      setSelectedUsers(usersInit);
      setShowRoutePlan(true);
      setPlanSaved(true);
      } 
      else {
        const { data: ordersData } = await axios.get(`/api/orders?date=${selectedDate}`);
        console.log(ordersData)


        setOrders(ordersData);
        setShowRoutePlan(false);
        setRoutePlan([]);
        setSelectedUsers({});
        setPlanSaved(false);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setError('Failed to fetch data.');
    }
    setIsLoading(false);
  };

  if (selectedDate) fetchData();
}, [selectedDate]);

  useEffect(() => {
    fetchUsers();
  }, []);


  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/users');
      const filteredUsers = response.data.filter(user => user.role !== 'supplier' && user.role !== 'customer');
      setUsers(filteredUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to fetch users.');
    }
  };

  const handleChange = (setter) => (e) => setter(e.target.value);

  const handleUserSelection = (routeIndex, userId) => {
    setSelectedUsers(prev => ({
      ...prev,
      [routeIndex]: userId  // Ensuring a new object is created for the state
    }));
  };

  const checkForExistingRoutePlan = async (selectedDate) => {
    try {
      const response = await axios.get(`/api/deliveryRoutes?date=${selectedDate}`);
      console.log(response)
      return response.data.exists;
    } catch (error) {
      console.error("Error checking for existing route plan:", error);
      setError('Failed to check for existing route plans.');
    }
  };

  const handleOptimizeRoutes = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const { data } = await axios.post('/api/optimize-deliveries', {
        orders,
        numClusters,
        warehouseLocation: whLocation,
        method: routingMethod
      });
      setOptimizedRoutes(data.optimizedRoutes || []);
    } catch (error) {
      console.error("Error optimizing routes:", error);
      setOptimizedRoutes([]);
      setError('Failed to optimize routes.');
    }
    setIsLoading(false);
  };

  const updateRouteDetails = async () => {
  try {
    const response = await axios.get(`/api/deliveryRoutes?date=${selectedDate}`);
    setRoutePlan(response.data);
  } catch (error) {
    console.error("Failed to fetch updated route details:", error);
  }
};

  const handleDeleteRoutePlan = async () => {
    setIsLoading(true);
    if (!selectedDate) {
      setError('Please select a date to delete the route plan.');
      setIsLoading(false); // Add this line to stop the loading spinner if there's no selected date
      return;
    }
    try {
      await axios.delete(`/api/deliveryRoutes?date=${selectedDate}`);
      alert('Route plan deleted successfully.');
      setShowRoutePlan(false);
      setRoutePlan({ routes: [] });
      setSelectedUsers({});
      setError('');
      setPlanSaved(false);
      setRoutePlanExists(false);
    } catch (error) {
      console.error('Error deleting route plan:', error);
      setError('Failed to delete route plan.');
    }
    setIsLoading(false);
  };

  const flatRoutes = optimizedRoutes.flatMap((route, clusterIndex) =>
    route.map((stop, index) => ({
      stopNumber: index + 1,
      clusterId: clusterIndex + 1,
      address: stop.address,
      customerEmail: stop.customerEmail,
      masterOrderNumber: stop.masterOrderNumber,
    }))
  );

  const orderTableColumns = [
    { Header: 'Order Number', accessor: 'masterOrderNumber' },
    { Header: 'Customer Email', accessor: 'customerEmail' },
    { Header: 'Delivery Address', accessor: 'deliveryAddress' },
  ];

  const routeTableColumns = [
    { Header: 'Cluster ID', accessor: 'clusterId' },
    { Header: 'Stop Number', accessor: 'stopNumber' },
    { Header: 'Address', accessor: 'address' },
  ];

  const handleSubmitRoutePlan = async () => {
    setIsLoading(true);
    try {
      const routeDate = new Date(`${selectedDate}T09:00:00`);

      const routes = optimizedRoutes.map((route, index) => ({
        clusterId: index,
        stops: route.map((stop, stopIndex) => ({
          stopNumber: stopIndex + 1,
          address: stop.address,
          customerEmail: stop.customerEmail,
          masterOrderNumber: stop.masterOrderNumber,
          latitude: stop.latitude,
          longitude: stop.longitude,
          orderId: stop.orderId
        })),
        startTime: routeDate,
        //driver: selectedUsers[index]
      }));

      console.log(optimizedRoutes)

      console.log("Submitting Routes: ", routes);
    const response = await axios.post('/api/deliveryRoutes', { routes });
    setRoutePlanExists(true);
    setRoutePlan({ routes: response.data.routes });  // Ensure to update with the response data which includes route IDs
    setOrders([]);
    setIsLoading(false);
    alert('Route plan submitted successfully.');
    setOptimizedRoutes([]);
  } catch (error) {
    console.error('Error submitting route plan:', error);
    setIsLoading(false);
    alert('Failed to submit route plan.');
  }
};

  const handleClearRoutes = () => {
    setOptimizedRoutes([]);
  };

  const UserDropdown = ({ users, selectedUserId, onUserAssigned, routeIndex }) => (
    <select 
     value={selectedUserId || ''}  // Adjusted to use _id from the user object
      onChange={(e) => onUserAssigned(routeIndex, e.target.value)}
    >
     <option value="">Select a Driver</option>
      {users.map((user) => (
        <option key={user._id} value={user._id}>{user.name}</option>
      ))}
    </select>
  );

  const reformatDate = (selectedDate) => {
    const dateParts = selectedDate.split('-');
    const year = dateParts[0].substr(2);
    const month = dateParts[1];
    const day = dateParts[2];

    return `${month}/${day}/${year}`;
  };

const handleConfirmDriverAssignments = async () => {
  setIsLoading(true);
  const updatedRoutes = routePlan.routes.map((route, index) => {
    const user = users.find(user => user._id === selectedUsers[index]);
    return {
      ...route,
      driver: user ? user._id : null // Ensure we have a valid user before accessing _id
    };
  });

  console.log("Updated Routes:");
  console.log(updatedRoutes);

  try {
    await axios.put('/api/deliveryRoutes/updateUsers', {
      date: selectedDate,
      updatedRoutes
    });
    await updateRouteDetails();  // Call the function to refresh route details
    setIsLoading(false);
    alert('User assignments confirmed successfully.');
  } catch (error) {
    console.error('Error confirming user assignments:', error);
    setIsLoading(false);
    alert('Failed to confirm user assignments.');
  }
};


  return (
    <div className="route-optimization-container">
      <h2>Route Optimization</h2>
      {isLoading && <LoadingSpinner />}
      <form className="form-section" onSubmit={handleOptimizeRoutes}>
        <div className="form-group">
          <label htmlFor="dateSelect">Select Delivery Date:</label>
          <input
            type="date"
            id="dateSelect"
            value={selectedDate}
            onChange={handleChange(setSelectedDate)}
          />
        </div>
        {selectedDate && !routePlanExists && (
          <>
            <div className="form-group">
              <label htmlFor="numClusters">Number of Clusters:</label>
              <input
                type="number"
                id="numClusters"
                value={numClusters}
                onChange={handleChange(setNumClusters)}
                min="1"
              />
            </div>
            <label htmlFor="routingMethod">Routing Method:</label>
            <select
              id="routingMethod"
              value={routingMethod}
              onChange={e => setRoutingMethod(e.target.value)}
            >
              <option value="kmeans">K-Means</option>
              <option value="aco">Ant Colony Optimization (ACO)</option>
              <option value="hierarchical">Hierarchical Clustering</option>
            </select>
            <button className="submit-btn" type="submit">Optimize Routes</button>
          </>
        )}
      </form>
      {orders.length > 0 && !routePlanExists && (
        <GenericTable
          data={orders}
          columns={orderTableColumns}
        />
      )}
      {optimizedRoutes.length > 0 && (
        <>
          <h2>Route Details</h2>
          <GenericTable
            data={flatRoutes}
            columns={routeTableColumns}
          />
          <button className="submit-btn" onClick={handleSubmitRoutePlan}>Submit Route Plan</button>
          <button className="submit-btn" onClick={handleClearRoutes}>Clear</button>
        </>
      )}
      {routePlanExists && Array.isArray(routePlan.routes) && routePlan.routes.length > 0 && (
        <>
          <h2>Route Plan for {reformatDate(selectedDate)}</h2>
          <MapComponent whLocation={whLocation} routes={routePlan.routes} />
          <button className="submit-btn" onClick={handleConfirmDriverAssignments}>Confirm Driver Assignments</button>
          <button className="submit-btn" onClick={handleDeleteRoutePlan}>Delete Route Plan</button>
          {routePlan.routes.map((route, routeIndex) => (
            <div key={routeIndex}>
              <h3>Route {routeIndex + 1}</h3>
              <UserDropdown
                users={users}
                //selectedUserId={route.driver._id}
                selectedUserId={selectedUsers[routeIndex]}
                onUserAssigned={handleUserSelection}
                routeIndex={routeIndex}
              />
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
                      <td>{stop.masterOrderNumber}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </>
      )}
    </div>
  );
};

export default RouteOptimization;