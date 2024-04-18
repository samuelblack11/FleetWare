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
    const [selectedDate, setSelectedDate] = useState('');
    const [orders, setOrders] = useState([]);
    const [selectedOrders, setSelectedOrders] = useState([]);
    const [numClusters, setNumClusters] = useState(2);
    const [optimizedRoutes, setOptimizedRoutes] = useState([]);
    const [routePlanExists, setRoutePlanExists] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [drivers, setDrivers] = useState([]); // Assuming you fetch this from somewhere
    const [routeDetails, setRouteDetails] = useState({ routes: [] });
    const [selectedDrivers, setSelectedDrivers] = useState({}); // {routeIndex: driverId}
    const [routingMethod, setRoutingMethod] = useState('kmeans'); // Default to 'kmeans'
    const whLocation = {
        latitude: 38.8433,
        longitude: -77.2705,
        address: "9464 Main St, FairFax, VA 22031"
    };

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            const exists = await checkForExistingRoutePlan(selectedDate);
            setRoutePlanExists(exists);

            if (!exists) {
            // No route plan exists, fetch orders for the selected date
                try {
                    const { data } = await axios.get(`/api/orders?date=${selectedDate}`);
                    setOrders(data); // Set orders for route optimization
                    setSelectedOrders([]); // Reset any previously selected orders
                } catch (error) {
                    console.error("Error fetching orders:", error);
                }
            } else {
                // A route plan exists, fetch route plan details
                try {
                    const routePlanDetails = await axios.get(`/api/deliveryRoutes?date=${selectedDate}`);
                    setRouteDetails(routePlanDetails.data); // Set route plan details for display
                    setOrders([]); // Optionally clear orders as they are now part of the route plan
                } catch (error) {
                    console.error("Error fetching route plan details:", error);
                }
            }
            setIsLoading(false);
        };

    const handler = setTimeout(() => {   
        if (selectedDate) {
            fetchData();
        }
    }, 500);
    return () => clearTimeout(handler);
}, [selectedDate]);

    useEffect(() => {
        fetchDrivers();
    }, []); // Fetch drivers when the component mounts


    useEffect(() => {
    const selectedDriversInit = {};
    routeDetails.routes.forEach((route, index) => {
        if (route.driverId) {
            selectedDriversInit[index] = route.driverId;
        }
    });
    setSelectedDrivers(selectedDriversInit);
}, [routeDetails]);

useEffect(() => {
    console.log("Existing Route Details:", routeDetails);
    console.log("Updated Optimized Routes:", optimizedRoutes);
}, [routeDetails, optimizedRoutes]);


  const fetchDrivers = async () => {
    try {
      const response = await axios.get('/api/drivers');
      setDrivers(response.data);
    } catch (error) {
      console.error('Error fetching drivers:', error);
      setError('Failed to fetch drivers.');
    }
  };


const checkForExistingRoutePlan = async (selectedDate) => {
    try {
        const response = await axios.get(`/api/deliveryRoutes?date=${selectedDate}`);
        // Assuming response.data.exists is true if a route plan exists, false otherwise
        console.log(`Returned ${response} Routes`)
        console.log(routeDetails.routes)
        return response.data.exists;
    } catch (error) {
        console.error("Error checking for existing route plan:", error);
        setError('Failed to check for existing route plans.');
        //return false; // Assume no plan exists if there's an error
    }
};

// Simplify form handlers by removing redundant code
const handleChange = (setter) => (e) => setter(e.target.value);

    // Submit handler simplified with async/await and direct mapping
const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
        const { data } = await axios.post('/api/optimize-deliveries', {
            orders, // Sending all fetched orders
            numClusters,
            warehouseLocation: whLocation,
            method: routingMethod
        });
        setOptimizedRoutes(data.optimizedRoutes || []);
        console.log()
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
        // Reset state or refresh data as necessary
        setSelectedDate('')
        setRoutePlanExists(false);
        setRouteDetails({ routes: [] }); // Clear existing route details
        //fetchOrdersForDate(selectedDate); // Refetch orders if needed, or handle UI updates
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
    address: stop.address, // Assuming each 'stop' object has an 'address' field
    customerEmail: stop.customerEmail, // Assuming each 'stop' object has a 'customerEmail' field
    orderNumber: stop.orderNumber, // Assuming each 'stop' object has an 'orderNumber' field
  }))
);



    const orderTableColumns = [
        { Header: 'Order Number', accessor: 'orderNumber' },
        { Header: 'Customer Email', accessor: 'customerEmail' },
        { Header: 'Delivery Address', accessor: 'deliveryAddress' },
        // Add more columns as needed
    ];

    // Only define columns once, if they do not change
    const routeTableColumns = [
        { Header: 'Cluster ID', accessor: 'clusterId' },
        { Header: 'Stop Number', accessor: 'stopNumber' },
        { Header: 'Address', accessor: 'address' },
    ];

    const handleSubmitRoutePlan = async () => {
        setIsLoading(true)
        try {
            // Construct the payload according to your backend expectations
            const selectedDateTime = new Date(`${selectedDate}T06:00:00`);
            const estOffset = 5 * 60 * 60 * 1000; // UTC-5 for EST
            const estTime = new Date(selectedDateTime.getTime() - estOffset);
            const startTimeIso = estTime.toISOString();
            console.log("++++")
            console.log(optimizedRoutes)
            const routes = optimizedRoutes.map((route, index) => ({
                clusterId: index,
                stops: route.map((stop, stopIndex) => ({
                    stopNumber: stopIndex + 1,
                    address: stop.address,
                    customerEmail: stop.customerEmail,
                    orderNumber: stop.orderNumber,
                    latitude: stop.latitude,
                    longitude: stop.longitude
                })),
                startTime: startTimeIso
            }));

            await axios.post('/api/deliveryRoutes', { routes });
            setRoutePlanExists(true);
            setRouteDetails({ routes: routes });
            setOrders([]);
            setIsLoading(false);
            alert('Route plan submitted successfully.');
            // Optionally clear routes after submission
            setOptimizedRoutes([]);
        } catch (error) {
            console.error('Error submitting route plan:', error);
            setIsLoading(false);
            alert('Failed to submit route plan.');
        }
    };

    const handleClearRoutes = () => {
        setOptimizedRoutes([]); // Reset optimized routes
    };


const DriverDropdown = ({ drivers, selectedDriverId, onDriverAssigned, routeIndex }) => (
        <select value={selectedDriverId || ''} onChange={(e) => onDriverAssigned(routeIndex, e.target.value)}>
        <option value="">Select a driver</option>
        {drivers.map((driver) => (
            <option key={driver._id} value={driver._id}>{driver.Name}</option>
        ))}
    </select>
);

const handleDriverSelection = (routeIndex, driverId) => {
    console.log(`Route Index: ${routeIndex}, Driver ID: ${driverId}`); // Debugging line
    setSelectedDrivers(prev => ({
        ...prev,
        [routeIndex]: driverId,
    }));
};

function reformatDate(selectedDate) {
    const dateParts = selectedDate.split('-'); // Split the date by '-'
    const year = dateParts[0].substr(2); // Get the last two digits of the year
    const month = dateParts[1]; // Month
    const day = dateParts[2]; // Day

    // Construct the new date format as 'mm/dd/yy'
    return `${month}/${day}/${year}`;
}

const handleConfirmDriverAssignments = async () => {
    setIsLoading(true);
    // Loop through each route and update it with the assigned driver
    const updatedRoutes = routeDetails.routes.map((route, index) => ({
        ...route,
        driverId: selectedDrivers[index] // Assign the selected driver ID to the route
    }));

    try {
        // Assuming you have an endpoint that accepts updated routes for a specific date
        await axios.put('/api/deliveryRoutes/updateDrivers', {
            date: selectedDate,
            updatedRoutes
        });
        setIsLoading(false);
        alert('Driver assignments confirmed successfully.');

        // Optionally refresh data here if needed
    } catch (error) {
        console.error('Error confirming driver assignments:', error);
        setIsLoading(false);
        alert('Failed to confirm driver assignments.');
    }
};


  // Render method
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
            {(optimizedRoutes.length > 0) && (
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
{
  routePlanExists && Array.isArray(routeDetails.routes) && routeDetails.routes.length > 0 && (
    <>
      <h2>Route Plan for {reformatDate(selectedDate)}</h2>
     <MapComponent whLocation={whLocation} routes={routeDetails.routes} />
      <button className="submit-btn" onClick={handleConfirmDriverAssignments}>Confirm Driver Assignments</button>
      <button className="submit-btn" onClick={handleDeleteRoutePlan}>Delete Route Plan</button>
      
      {routeDetails.routes.map((route, routeIndex) => (
        <div key={routeIndex}>
          <h3>Route {routeIndex + 1}</h3>
          <DriverDropdown
            drivers={drivers}
            selectedDriverId={selectedDrivers[routeIndex]}
            onDriverAssigned={(driverId) => handleDriverSelection(routeIndex, driverId)}
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
                  <td>{stop.orderNumber}</td>
                </tr>
              ))}
            </tbody>
          </table>
        {/*  */}
        </div>
      ))}
    </>
  )
}
        </div>
    );
};


export default RouteOptimization;