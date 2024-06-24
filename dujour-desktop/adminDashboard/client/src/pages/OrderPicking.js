import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { GenericTable } from './ReusableReactComponents';
import './AllPages.css';
const moment = require('moment-timezone');

const LoadingSpinner = () => (
  <div className="spinner-container">
    <div className="spinner" aria-label="Loading"></div>
  </div>
);

const OrderPicking = () => {
  const dateInEST = moment().tz("America/New_York").set({hour: 11, minute: 0, second: 0, millisecond: 0});
  const formattedDate = dateInEST.format('YYYY-MM-DD');
  const [selectedDate, setSelectedDate] = useState(formattedDate);
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [pickPlan, setPickPlan] = useState([]);
  const [showPickPlan, setShowPickPlan] = useState(false);
  const [numberOfPickers, setNumberOfPickers] = useState(1);
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState({});
  const [planSaved, setPlanSaved] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const { data: ordersData } = await axios.get(`/api/orders/detailed-orders?date=${selectedDate}`);
        setOrders(ordersData);
        const { data: pickPlansData } = await axios.get(`/api/pickPlans?date=${selectedDate}`);

        if (pickPlansData.length > 0) {
          setPickPlan(pickPlansData);
          const usersInit = pickPlansData.reduce((acc, plan, index) => {
            if (plan.user) acc[index] = plan.user._id;
            return acc;
          }, {});
          setSelectedUsers(usersInit);
          setShowPickPlan(true);
          setPlanSaved(true);
        } else {
          setShowPickPlan(false);
          setPickPlan([]);
          setSelectedUsers({});
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

const handleCreatePickPlan = () => {
    // Flatten all items with additional properties for sorting and tracking
    const allItems = orders.flatMap(order => 
        order.items.map(item => ({
            ...item,
            orderID: order._id,
            masterOrderNumber: order.masterOrderNumber,  // Assuming you want to display this as "order number"
            farmName: item.farmName,
            vendorLocationNumber: item.vendorLocationNumber
        }))
    );

    // Group items by order
    const itemsByOrder = allItems.reduce((acc, item) => {
        if (!acc[item.orderID]) {
            acc[item.orderID] = [];
        }
        acc[item.orderID].push(item);
        return acc;
    }, {});

    // Sort orders within each group by vendor location number
    const sortedOrders = Object.values(itemsByOrder).map(order => {
        return order.sort((a, b) => a.vendorLocationNumber - b.vendorLocationNumber);
    });

    // Initialize pick plans and track item counts per picker
    const dividedPickPlans = Array.from({ length: numberOfPickers }, () => ({ items: [], itemCount: 0 }));

    // Function to find the picker with the least items
    const findLeastLoadedPicker = () => {
        return dividedPickPlans.reduce((min, picker, index) => {
            return (min === null || picker.itemCount < dividedPickPlans[min].itemCount) ? index : min;
        }, null);
    };

    // Assign orders to pickers
    sortedOrders.forEach(order => {
        const farmName = order[0].farmName;
        const orderSize = order.length;

        // Check if any picker already has items from this farm
        const pickerIndex = dividedPickPlans.findIndex(picker => 
            picker.items.some(item => item.farmName === farmName)
        );

        let targetPickerIndex = pickerIndex === -1 ? findLeastLoadedPicker() : pickerIndex;
        
        // Check if assigning to this picker would imbalance the load
        if (pickerIndex === -1) {
            const leastLoadedPickerIndex = findLeastLoadedPicker();
            const potentialImbalance = dividedPickPlans[leastLoadedPickerIndex].itemCount + orderSize - dividedPickPlans[targetPickerIndex].itemCount;
            if (potentialImbalance > 5) {
                // Find another picker if the imbalance is too high
                targetPickerIndex = leastLoadedPickerIndex;
            }
        }

        // Add items to the target picker
        dividedPickPlans[targetPickerIndex].items.push(...order);
        dividedPickPlans[targetPickerIndex].itemCount += orderSize;
    });

    // Prepare the final pick plans by removing the itemCount tracking
    const finalPickPlans = dividedPickPlans.map(picker => ({
        items: picker.items
    }));

    setPickPlan(finalPickPlans);
    setShowPickPlan(true);
    setPlanSaved(false);
};



  const handleUndoPickPlan = () => {
  setShowPickPlan(false);
  setPickPlan([]);
  setSelectedUsers({});
  setPlanSaved(false);
};

  const handleUserSelection = (planIndex, userId) => {
    setSelectedUsers(prev => ({
      ...prev,
      [planIndex]: userId,
    }));
  };


 const updateOrderStatus = async (orders, status) => {
    try {
      await Promise.all(orders.map(order =>
        axios.put(`/api/orders/${order._id}`, { overallStatus: status })
      ));
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };


const handleSavePickPlan = async () => {
  // Check if every pick plan has a user assigned
  for (let i = 0; i < pickPlan.length; i++) {
    if (!selectedUsers[i]) {
      alert(`Picker ${i + 1} is not assigned. Please assign a picker to each pick plan.`);
      return;
    }
  }

  setIsLoading(true);
  try {
    const date = moment(selectedDate).tz("America/New_York").set({hour: 11, minute: 0, second: 0, millisecond: 0}).toISOString();
    const pickPlans = pickPlan.map((plan, index) => ({
      date,
      items: plan.items,
      user: selectedUsers[index]
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
      setSelectedUsers({});
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

const UserDropdown = ({ users, selectedUserId, onUserAssigned, planIndex }) => (
  <select 
    value={selectedUserId || ''} 
    onChange={(e) => onUserAssigned(planIndex, e.target.value)}
  >
    <option value="">Select a Picker</option>
    {users.map((user) => (
      <option key={user._id} value={user._id}>{user.name}</option>
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
              <UserDropdown
                users={users}
                selectedUserId={selectedUsers[index]}
                onUserAssigned={handleUserSelection}
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
