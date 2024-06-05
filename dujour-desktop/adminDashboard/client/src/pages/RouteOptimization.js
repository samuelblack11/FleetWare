import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { GenericTable, GenericPopup } from './ReusableReactComponents';
import MapComponent from './MapComponent';

const LoadingSpinner = () => {
  return (
    <div className="spinner-container">
      <div className="spinner" aria-label="Loading"></div>
    </div>
  );
};

const RouteOptimization = () => {
  const today = new Date();
  const formattedDate = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
  const [selectedDate, setSelectedDate] = useState(formattedDate);
  const [orders, setOrders] = useState([]);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [numClusters, setNumClusters] = useState(2);
  const [optimizedRoutes, setOptimizedRoutes] = useState([]);
  const [routePlanExists, setRoutePlanExists] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [users, setUsers] = useState([]);
  const [routeDetails, setRouteDetails] = useState({ routes: [] });
  const [selectedUsers, setSelectedUsers] = useState({});
  const [routingMethod, setRoutingMethod] = useState('kmeans');
  const whLocation = {
    latitude: 38.804840,
    longitude: -77.043430,
    address: " 301 King St, Alexandria, VA 22314"
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const exists = await checkForExistingRoutePlan(selectedDate);
      setRoutePlanExists(exists);

      if (!exists) {
        try {
          const { data } = await axios.get(`/api/orders?date=${selectedDate}`);
          setOrders(data);
          setSelectedOrders([]);
        } catch (error) {
          console.error("Error fetching orders:", error);
        }
      } else {
        try {
          const routePlanDetails = await axios.get(`/api/deliveryRoutes?date=${selectedDate}`);
          console.log("@@@@@")
          console.log(routePlanDetails.data)
          setRouteDetails(routePlanDetails.data);
          setOrders([]);
        } catch (error) {
          console.error("Error fetching route plan details:", error);
        }
      }
      setIsLoading(false);
    };

    if (selectedDate) {
      fetchData();
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchUsers();
  }, []);

useEffect(() => {
  if (routeDetails.routes.length > 0 && users.length > 0) {
    const selectedUsersInit = routeDetails.routes.reduce((acc, route, index) => {
      // Make sure driver ID from route is in the users list to ensure validity
      const isValidUser = users.some(user => user._id === route.driver);
      if (route.driver && isValidUser) {
        acc[index] = route.driver;
      }
      return acc;
    }, {});
    setSelectedUsers(selectedUsersInit);
  }
}, [routeDetails, users]);





  useEffect(() => {
  }, [selectedUsers]);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to fetch users.');
    }
  };

  const checkForExistingRoutePlan = async (selectedDate) => {
    try {
      const response = await axios.get(`/api/deliveryRoutes?date=${selectedDate}`);
      return response.data.exists;
    } catch (error) {
      console.error("Error checking for existing route plan:", error);
      setError('Failed to check for existing route plans.');
    }
  };

  const handleChange = (setter) => (e) => setter(e.target.value);

  const handleSubmit = async (e) => {
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

  const handleDeleteRoutePlan = async () => {
    setIsLoading(true);
    if (!selectedDate) {
      setError('Please select a date to delete the route plan.');
      return;
    }
    try {
      await axios.delete(`/api/deliveryRoutes?date=${selectedDate}`);
      alert('Route plan deleted successfully.');
      setSelectedDate('')
      setRoutePlanExists(false);
      setRouteDetails({ routes: [] });
      setError('');
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
      const date = new Date(`${selectedDate}T06:00:00`);
      const estOffset = 5 * 60 * 60 * 1000;
      const startTimeIso = new Date(date.getTime() - estOffset).toISOString();

      const routes = optimizedRoutes.map((route, index) => ({
        clusterId: index,
        stops: route.map((stop, stopIndex) => ({
          stopNumber: stopIndex + 1,
          address: stop.address,
          customerEmail: stop.customerEmail,
          masterOrderNumber: stop.masterOrderNumber,
          latitude: stop.latitude,
          longitude: stop.longitude,
        })),
        startTime: startTimeIso,
        driver: selectedUsers[index] || null
      }));

      console.log("ROUTES....")
      console.log(routes)
      await axios.post('/api/deliveryRoutes', { routes });
      setRoutePlanExists(true);
      setRouteDetails({ routes });
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
      value={selectedUserId || ''} 
      onChange={(e) => onUserAssigned(routeIndex, e.target.value)}
    >
      <option value="">Select a Driver</option>
      {users.map((user) => (
        <option key={user._id} value={user._id}>{user.name}</option>
      ))}
    </select>
  );

  const handleUserSelection = (routeIndex, userId) => {
    console.log(`Route Index: ${routeIndex}, User ID: ${userId}`);
    setSelectedUsers(prev => {
      const updated = { ...prev, [routeIndex]: userId };
      return updated;
    });
  };

  const reformatDate = (selectedDate) => {
    const dateParts = selectedDate.split('-');
    const year = dateParts[0].substr(2);
    const month = dateParts[1];
    const day = dateParts[2];

    return `${month}/${day}/${year}`;
  };

const handleConfirmDriverAssignments = async () => {
  setIsLoading(true);
  console.log(selectedUsers);

  const updatedRoutes = routeDetails.routes.map((route, index) => {
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
      <form className="form-section" onSubmit={handleSubmit}>
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
      {routePlanExists && Array.isArray(routeDetails.routes) && routeDetails.routes.length > 0 && (
        <>
          <h2>Route Plan for {reformatDate(selectedDate)}</h2>
          <MapComponent whLocation={whLocation} routes={routeDetails.routes} />
          <button className="submit-btn" onClick={handleConfirmDriverAssignments}>Confirm Driver Assignments</button>
          <button className="submit-btn" onClick={handleDeleteRoutePlan}>Delete Route Plan</button>
          {routeDetails.routes.map((route, routeIndex) => (
            <div key={routeIndex}>
              <h3>Route {routeIndex + 1}</h3>
              <UserDropdown
                users={users}
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