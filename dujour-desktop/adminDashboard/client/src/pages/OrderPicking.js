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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [pickPlan, setPickPlan] = useState([]);
  const [showPickPlan, setShowPickPlan] = useState(false);
  const [numberOfPickers, setNumberOfPickers] = useState(1);
  const [drivers, setDrivers] = useState([]);
  const [selectedDrivers, setSelectedDrivers] = useState({});
  const [planSaved, setPlanSaved] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const { data: ordersData } = await axios.get(`/api/orders/detailed-orders?date=${selectedDate}`);
        console.log("Fetched Orders:", ordersData);
        setOrders(ordersData);

        const { data: pickPlansData } = await axios.get(`/api/pickPlans?date=${selectedDate}`);
        console.log("Fetched Pick Plans:", pickPlansData);

        if (pickPlansData.length > 0) {
          setPickPlan(pickPlansData);
          const driversInit = pickPlansData.reduce((acc, plan, index) => {
            if (plan.driver) acc[index] = plan.driver._id;
            return acc;
          }, {});
          setSelectedDrivers(driversInit);
          setShowPickPlan(true);
          setPlanSaved(true);
        } else {
          setShowPickPlan(false);
          setPickPlan([]);
          setSelectedDrivers({});
          setPlanSaved(false);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to fetch data.');
      }
      setIsLoading(false);
    };

    if (selectedDate) {
      fetchData();
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      const response = await axios.get('/api/drivers');
      setDrivers(response.data);
      console.log(`DRIVERS....${response.data}`);
    } catch (error) {
      console.error('Error fetching drivers:', error);
      setError('Failed to fetch drivers.');
    }
  };

  const handleChange = (setter) => (e) => setter(e.target.value);

  const handleCreatePickPlan = () => {
    const allItems = orders.flatMap(order => 
      order.items.map(item => ({
        ...item,
        masterOrderNumber: order.masterOrderNumber
      }))
    );
    const sortedItems = allItems.sort((a, b) => a.vendorLocationNumber - b.vendorLocationNumber);

    // Split the sorted items into groups based on the number of pickers
    const chunkSize = Math.ceil(sortedItems.length / numberOfPickers);
    const dividedPickPlans = [];
    for (let i = 0; i < numberOfPickers; i++) {
      dividedPickPlans.push({
        items: sortedItems.slice(i * chunkSize, (i + 1) * chunkSize),
        driver: null
      });
    }

    setPickPlan(dividedPickPlans);
    setShowPickPlan(true);
    setPlanSaved(false);
  };

  const handleUndoPickPlan = () => {
  setShowPickPlan(false);
  setPickPlan([]);
  setSelectedDrivers({});
  setPlanSaved(false);
};

  const handleDriverSelection = (planIndex, driverId) => {
    setSelectedDrivers(prev => ({
      ...prev,
      [planIndex]: driverId,
    }));
  };


 const updateOrderStatus = async (orders, status) => {
    try {
      console.log("???????")
      console.log(status)
      console.log(orders)
      await Promise.all(orders.map(order =>
        axios.put(`/api/orders/${order._id}`, { overallStatus: status })
      ));
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };


  const handleSavePickPlan = async () => {
    setIsLoading(true);
    try {
      const date = selectedDate;
      const pickPlans = pickPlan.map((plan, index) => ({
        date,
        items: plan.items,
        driver: selectedDrivers[index] || null
      }));
      await axios.post('/api/pickPlans', { date, pickPlans });
      updateOrderStatus(orders, 'Ready for Order Pick');
      setIsLoading(false);
      alert('Pick plans saved successfully.');
      setPlanSaved(true);
    } catch (error) {
      console.error('Error saving pick plans:', error);
      setIsLoading(false);
      setError('Failed to save pick plans.');
    }
  };

  const handleDeletePickPlan = async () => {
    setIsLoading(true);
    if (!selectedDate) {
      setError('Please select a date to delete the pick plan.');
      setIsLoading(false); // Add this line to stop the loading spinner if there's no selected date
      return;
    }
    try {
      await axios.delete(`/api/pickPlans?date=${selectedDate}`);
      alert('Pick plan deleted successfully.');
      setShowPickPlan(false);
      setPickPlan([]);
      setSelectedDrivers({});
      setError('');
      setPlanSaved(false);

      updateOrderStatus(orders, 'Order Confirmed');
    } catch (error) {
      console.error('Error deleting pick plan:', error);
      setError('Failed to delete pick plan.');
    }
    setIsLoading(false); // Ensure this is called in both success and error cases
  };

  const orderTableColumns = [
    { Header: 'Order Number', accessor: 'masterOrderNumber' },
    { Header: 'Customer Email', accessor: 'customerEmail' },
    { Header: 'Delivery Address', accessor: 'deliveryAddress' },
  ];

  const itemTableColumns = [
    { Header: 'Item Name', accessor: 'itemName' },
    { Header: 'Quantity', accessor: 'quantity' },
    { Header: 'Farm Name', accessor: 'farmName' },
  ];

  const pickPlanTableColumns = [
    { Header: 'Location Number', accessor: 'vendorLocationNumber' },
    { Header: 'Farm Name', accessor: 'farmName' },
    { Header: 'Item Name', accessor: 'itemName' },
    { Header: 'Quantity', accessor: 'quantity' },
    { Header: 'Order Number', accessor: 'masterOrderNumber' },
  ];

  const DriverDropdown = ({ drivers, selectedDriverId, onDriverAssigned, planIndex }) => (
    <select 
      value={selectedDriverId || ''} 
      onChange={(e) => onDriverAssigned(planIndex, e.target.value)}
    >
      <option value="">Select a picker</option>
      {drivers.map((driver) => (
        <option key={driver._id} value={driver._id.toString()}>{driver.Name}</option>
      ))}
    </select>
  );

  return (
    <div className="route-optimization-container">
      <h2>Order Details</h2>
      {isLoading && <LoadingSpinner />}
      <form className="form-section">
        <div className="form-group">
          <label htmlFor="dateSelect">Select Delivery Date:</label>
          <input
            type="date"
            id="dateSelect"
            value={selectedDate}
            onChange={handleChange(setSelectedDate)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="numPickers">Number of Pickers:</label>
          <input
            type="number"
            id="numPickers"
            value={numberOfPickers}
            onChange={handleChange(setNumberOfPickers)}
            min="1"
          />
        </div>
      </form>
      {!showPickPlan && (
        <>
          {orders.length > 0 && (
            orders.map(order => (
              <div key={order._id}>
                <h3>Order Number: {order.masterOrderNumber}</h3>
                <GenericTable
                  data={order.items}
                  columns={itemTableColumns}
                />
              </div>
            ))
          )}
          {error && <p className="error">{error}</p>}
        </>
      )}
      {showPickPlan && (
        <div>
          <h3>Pick Plan</h3>
          {pickPlan.map((plan, index) => (
            <div key={index}>
              <h4>Picker {index + 1}</h4>
              <DriverDropdown
                drivers={drivers}
                selectedDriverId={selectedDrivers[index]}
                onDriverAssigned={handleDriverSelection}
                planIndex={index}
              />
              <GenericTable
                data={plan.items}
                columns={pickPlanTableColumns}
              />
            </div>
          ))}
          {!planSaved && <button className="submit-btn" onClick={handleSavePickPlan}>Save Pick Plan</button>}
        </div>
      )}
      <button
        className="submit-btn"
        type="button"
        onClick={showPickPlan ? (planSaved ? handleDeletePickPlan : handleUndoPickPlan) : handleCreatePickPlan}
        >
      {showPickPlan ? (planSaved ? 'Delete Pick Plan' : 'Undo') : 'Create Pick Plan'}
      </button>
    </div>
  );
};

export default OrderPicking;
