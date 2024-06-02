import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { GenericTable } from './ReusableReactComponents';
import './AllPages.css';

const LoadingSpinner = () => (
  <div className="spinner-container">
    <div className="spinner" aria-label="Loading"></div>
  </div>
);

const OrderPicking = () => {
  const [selectedDate, setSelectedDate] = useState('');
  const [orders, setOrders] = useState([]);
  const [numClusters, setNumClusters] = useState(2);
  const [optimizedPickPlans, setOptimizedPickPlans] = useState([]);
  const [pickPlanExists, setPickPlanExists] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [drivers, setDrivers] = useState([]);
  const [pickPlanDetails, setPickPlanDetails] = useState({ pickPlans: [] });
  const [selectedDrivers, setSelectedDrivers] = useState({});
  const [routingMethod, setRoutingMethod] = useState('kmeans');

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const exists = await checkForExistingPickPlan(selectedDate);
      setPickPlanExists(exists);

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
          const { data } = await axios.get(`/api/pickPlans?date=${selectedDate}`);
          setPickPlanDetails(data);
          setOrders([]);
        } catch (error) {
          console.error("Error fetching pick plan details:", error);
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
  }, []);

  useEffect(() => {
    const selectedDriversInit = {};
    pickPlanDetails.pickPlans.forEach((pickPlan, index) => {
      if (pickPlan.driverId) {
        selectedDriversInit[index] = pickPlan.driverId;
      }
    });
    setSelectedDrivers(selectedDriversInit);
  }, [pickPlanDetails]);

  const fetchDrivers = async () => {
    try {
      const response = await axios.get('/api/drivers');
      setDrivers(response.data);
    } catch (error) {
      console.error('Error fetching drivers:', error);
      setError('Failed to fetch drivers.');
    }
  };

  const checkForExistingPickPlan = async (selectedDate) => {
    try {
      const response = await axios.get(`/api/pickPlans?date=${selectedDate}`);
      console.log(`Returned ${response} Pick Plans`);
      return response.data.exists;
    } catch (error) {
      console.error("Error checking for existing pick plan:", error);
      setError('Failed to check for existing pick plans.');
      return false;
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
        routingMethod,
      });
      setOptimizedPickPlans(data.optimizedPickPlans || []);
    } catch (error) {
      console.error("Error optimizing pick plans:", error);
      setOptimizedPickPlans([]);
      setError('Failed to optimize pick plans.');
    }
    setIsLoading(false);
  };

  const handleDeletePickPlan = async () => {
    setIsLoading(true);
    if (!selectedDate) {
      setError('Please select a date to delete the pick plan.');
      return;
    }
    try {
      await axios.delete(`/api/pickPlans?date=${selectedDate}`);
      alert('Pick plan deleted successfully.');
      setSelectedDate('');
      setPickPlanExists(false);
      setPickPlanDetails({ pickPlans: [] });
      setError('');
    } catch (error) {
      console.error('Error deleting pick plan:', error);
      setError('Failed to delete pick plan.');
    }
    setIsLoading(false);
  };

  const flatPickPlans = optimizedPickPlans.flatMap((pickPlan, clusterIndex) =>
    pickPlan.map((stop, index) => ({
      stopNumber: index + 1,
      clusterId: clusterIndex + 1,
      address: stop.address,
      customerEmail: stop.customerEmail,
      orderNumber: stop.masterOrderNumber,
    }))
  );

  const orderTableColumns = [

    { Header: 'Order Number', accessor: 'masterOrderNumber' },
    { Header: 'Items', accessor: 'items' },




    { Header: 'Order Number', accessor: 'masterOrderNumber' },
    { Header: 'Customer Email', accessor: 'customerEmail' },
    { Header: 'Delivery Address', accessor: 'deliveryAddress' },
  ];

  const pickTableColumns = [





    { Header: 'Cluster ID', accessor: 'clusterId' },
    { Header: 'Stop Number', accessor: 'stopNumber' },
    { Header: 'Address', accessor: 'address' },
  ];

  const handleSubmitPickPlan = async () => {
    setIsLoading(true);
    try {
      const selectedDateTime = new Date(`${selectedDate}T06:00:00`);
      const estOffset = 5 * 60 * 60 * 1000;
      const estTime = new Date(selectedDateTime.getTime() - estOffset);
      const startTimeIso = estTime.toISOString();

      const pickPlans = optimizedPickPlans.map((pickPlan, index) => ({
        clusterId: index,
        stops: pickPlan.map((stop, stopIndex) => ({
          stopNumber: stopIndex + 1,
          address: stop.address,
          customerEmail: stop.customerEmail,
          orderNumber: stop.orderNumber,
          latitude: stop.latitude,
          longitude: stop.longitude,
        })),
        startTime: startTimeIso,
      }));

      await axios.post('/api/pickPlans', { pickPlans });
      setPickPlanExists(true);
      setPickPlanDetails({ pickPlans });
      setOrders([]);
      setIsLoading(false);
      alert('Pick plan submitted successfully.');
      setOptimizedPickPlans([]);
    } catch (error) {
      console.error('Error submitting pick plan:', error);
      setIsLoading(false);
      alert('Failed to submit pick plan.');
    }
  };

  const handleClearPickPlans = () => {
    setOptimizedPickPlans([]);
  };

  const DriverDropdown = ({ drivers, selectedDriverId, onDriverAssigned, routeIndex }) => (
    <select
      value={selectedDriverId || ''}
      onChange={(e) => onDriverAssigned(routeIndex, e.target.value)}
    >
      <option value="">Select a driver</option>
      {drivers.map((driver) => (
        <option key={driver._id} value={driver._id.toString()}>{driver.Name}</option>
      ))}
    </select>
  );

  const handleDriverSelection = (routeIndex, driverId) => {
    setSelectedDrivers(prev => {
      const updated = { ...prev, [routeIndex]: driverId };
      return updated;
    });
  };

  const handleConfirmDriverAssignments = async () => {
    setIsLoading(true);
    const updatedPickPlans = pickPlanDetails.pickPlans.map((pickPlan, index) => ({
      ...pickPlan,
      driverId: selectedDrivers[index],
    }));

    try {
      await axios.put('/api/pickPlans/updateDrivers', {
        date: selectedDate,
        updatedPickPlans,
      });
      setIsLoading(false);
      alert('Driver assignments confirmed successfully.');
    } catch (error) {
      console.error('Error confirming driver assignments:', error);
      setIsLoading(false);
      alert('Failed to confirm driver assignments.');
    }
  };

  return (
    <div className="route-optimization-container">
      <h2>Pick Optimization</h2>
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
        {selectedDate && !pickPlanExists && (
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
            <button className="submit-btn" type="submit">Optimize Pick Plans</button>
          </>
        )}
      </form>
      {orders.length > 0 && !pickPlanExists && (
        <GenericTable
          data={orders}
          columns={orderTableColumns}
        />
      )}
      {(optimizedPickPlans.length > 0) && (
        <>
          <h2>Pick Plan Details</h2>
          <GenericTable
            data={flatPickPlans}
            columns={pickTableColumns}
          />
          <button className="submit-btn" onClick={handleSubmitPickPlan}>Submit Pick Plan</button>
          <button className="submit-btn" onClick={handleClearPickPlans}>Clear</button>
        </>
      )}
      {pickPlanExists && pickPlanDetails.pickPlans.length > 0 && (
        <>
          <h2>Pick Plan for {selectedDate}</h2>
          <button className="submit-btn" onClick={handleConfirmDriverAssignments}>Confirm Driver Assignments</button>
          <button className="submit-btn" onClick={handleDeletePickPlan}>Delete Pick Plan</button>
          {pickPlanDetails.pickPlans.map((pickPlan, pickPlanIndex) => (
            <div key={pickPlanIndex}>
              <h3>Pick Plan {pickPlanIndex + 1}</h3>
              <DriverDropdown
                drivers={drivers}
                selectedDriverId={selectedDrivers[pickPlanIndex]}
                onDriverAssigned={handleDriverSelection}
                routeIndex={pickPlanIndex}
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
                  {pickPlan.stops.map((stop, index) => (
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
      )}
    </div>
  );
};

export default OrderPicking;
