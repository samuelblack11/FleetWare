import React, { useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import './AllPages.css';
import { AuthContext } from '../App.js';
import { GenericTable } from './ReusableReactComponents';

function PickView() {
  const { user } = useContext(AuthContext); // Access user from AuthContext
  const today = new Date();
  const formattedDate = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
  const [pickPlanDetails, setPickPlanDetails] = useState(null);
  const [pickPlanExists, setPickPlanExists] = useState(false);
  const [fullyPickedOrders, setFullyPickedOrders] = useState([]);
  const [completedOrders, setCompletedOrders] = useState([]);

  const handleBounceBack = () => {
    const container = document.querySelector('.table-container');
    const maxScrollLeft = container.scrollWidth - container.clientWidth;

    if (container.scrollLeft > 0) {
      container.scrollLeft = 0;
    } else if (container.scrollLeft < maxScrollLeft) {
      container.scrollLeft = maxScrollLeft;
    }
  };

  useEffect(() => {
    const container = document.querySelector('.table-container');
    container.addEventListener('scroll', handleBounceBack);

    return () => {
      container.removeEventListener('scroll', handleBounceBack);
    };
  }, [handleBounceBack]);

  const fetchData = useCallback(async () => {
    if (!user || !user._id) {
      return;
    }

    try {
      const response = await axios.get(`/api/pickPlans/specificPickPlan?date=${formattedDate}&userId=${user._id}`);
      setPickPlanExists(response.data.exists);

      if (response.data.exists) {
        const pickPlan = response.data.pickPlans[0];
        setPickPlanDetails(pickPlan);
        const orders = await fetchOrderDetails(pickPlan.items);
        updateFullyPickedOrders(pickPlan.items, orders);
        updateCompletedOrders(pickPlan.items, orders);
      } else {
        setPickPlanDetails(null);
      }
    } catch (error) {
      console.error("Error fetching route plan details:", error);
      setPickPlanDetails(null);
    }
  }, [user, formattedDate]);

  useEffect(() => {
    fetchData();
    const handler = setTimeout(fetchData, 500); // Delayed fetch to ensure user info is loaded
    return () => clearTimeout(handler);
  }, [fetchData]);

  const handleStatusUpdate = async (item) => {
    try {
      const response = await axios.put('/api/pickPlans/updatePickStatus', {
        pickPlanId: pickPlanDetails._id,
        itemId: item._id,
        newStatus: item.status === 'Not Picked' ? 'Picked' : 'Not Picked'
      });
      setPickPlanDetails(response.data.pickPlan);
      const orders = await fetchOrderDetails(response.data.pickPlan.items);
      updateFullyPickedOrders(response.data.pickPlan.items, orders);
      // Fetch updated orders details
      const updatedOrders = await fetchOrderDetails(response.data.pickPlan.items);
      updateCompletedOrders(response.data.pickPlan.items, updatedOrders);
    } catch (error) {
      console.error('Error updating pick status:', error);
    }
  };

  const handleOrderStatusToggle = async (order) => {
    const newStatus = order.status === 'Order Pick Complete' ? 'Ready for Driver Pickup' : 'Order Pick Complete';

    try {
      await axios.put(`/api/orders/${order.orderID}`, { overallStatus: newStatus });
      // Fetch updated orders details to ensure state consistency
      const updatedOrders = await fetchOrderDetails(pickPlanDetails.items);
      updateCompletedOrders(pickPlanDetails.items, updatedOrders);
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const fetchOrderDetails = async (items) => {
    const orderIDs = [...new Set(items.map(item => item.orderID.toString()))];
    try {
      const response = await axios.post('/api/orders/by-IDs', { orderIDs });
      return response.data;
    } catch (error) {
      console.error('Error fetching order details:', error);
      return [];
    }
  };

  const updateFullyPickedOrders = (items, orders) => {
    const ordersDict = orders.reduce((acc, order) => {
      acc[order._id.toString()] = order;
      return acc;
    }, {});

    const pickedOrders = items.reduce((acc, item) => {
      const orderID = item.orderID.toString();
      if (!acc[orderID]) {
        acc[orderID] = {
          itemsPicked: [],
          overallStatus: ordersDict[orderID]?.overallStatus || 'Status Unknown'
        };
      }
      acc[orderID].itemsPicked.push(item.status === 'Picked');
      return acc;
    }, {});

    const fullyPickedOrders = Object.keys(pickedOrders).filter(orderID =>
      pickedOrders[orderID].itemsPicked.every(status => status)
    ).map(orderID => ({
      orderID,
      masterOrderNumber: ordersDict[orderID]?.masterOrderNumber || 'Unknown Order Number',
      status: pickedOrders[orderID].overallStatus
    }));
    setFullyPickedOrders(fullyPickedOrders);
  };

  const updateCompletedOrders = (items, orders) => {
    const ordersDict = orders.reduce((acc, order) => {
      acc[order._id.toString()] = order;
      return acc;
    }, {});

    const completedOrdersMap = items.reduce((acc, item) => {
      const orderID = item.orderID.toString();
      if (!acc[orderID]) {
        acc[orderID] = {
          itemsCompleted: [],
          overallStatus: ordersDict[orderID]?.overallStatus || 'Status Unknown'
        };
      }
      acc[orderID].itemsCompleted.push(item.status === 'Picked');
      return acc;
    }, {});

    const completedOrders = Object.keys(completedOrdersMap).filter(orderID =>
      completedOrdersMap[orderID].itemsCompleted.every(status => status)
    ).map(orderID => ({
      orderID,
      masterOrderNumber: ordersDict[orderID]?.masterOrderNumber || 'Unknown Order Number',
      status: completedOrdersMap[orderID].overallStatus
    }));

    setCompletedOrders(completedOrders);
  };

  const reformatDate = (selectedDate) => {
    const dateParts = selectedDate.split('-');
    const year = dateParts[0].substr(2);
    const month = dateParts[1];
    const day = dateParts[2];
    return `${month}/${day}/${year}`;
  };

  const columns = [
    {
      Header: 'Farm Name (Location #)',
      Cell: ({ row }) => (
        <span data-label="Farm Name (Location #)">{`${row.farmName} (${row.vendorLocationNumber})`}</span>
      )
    },
    { Header: 'Item Name', accessor: 'itemName', Cell: ({ row }) => <span data-label="Item Name">{row.itemName}</span> },
    { Header: 'Quantity', accessor: 'quantity', Cell: ({ row }) => <span data-label="Quantity">{row.quantity}</span> },
    { Header: 'Order #', accessor: 'masterOrderNumber', Cell: ({ row }) => <span data-label="Order #">{row.masterOrderNumber}</span> },
    {
      Header: 'Status',
      accessor: 'status',
      Cell: ({ row }) => <span data-label="Status">{row.status}</span>
    },
    {
      Header: 'Actions',
      Cell: ({ row }) => (
        <button className="add-button" onClick={() => handleStatusUpdate(row)} data-label="Actions">
          {row.status === 'Picked' ? 'Revert Status' : 'Pick Item'}
        </button>
      )
    }
  ];

  const completedOrdersColumns = [
    { Header: 'Order #', accessor: 'masterOrderNumber' },
    { Header: 'Status', accessor: 'status' },
    {
      Header: 'Actions',
      Cell: ({ row }) => (
        <button className="add-button" onClick={() => handleOrderStatusToggle(row)}>
          {row.status === 'Order Pick Complete' ? 'Pack & Seal Order' : 'Revert Status'}
        </button>
      )
    }
  ];

  return (
    <div className="pick-view-container">
      <h2>Pick Plan for {reformatDate(formattedDate)}</h2>
      {pickPlanDetails ? (
        <div className="table-container">
          <GenericTable data={pickPlanDetails.items} columns={columns} fullyPickedOrders={fullyPickedOrders} />
        </div>
      ) : (
        <p>No pick plan available for this date.</p>
      )}
      <h2>Completed Orders</h2>
      <div className="table-container">
        <GenericTable data={completedOrders} columns={completedOrdersColumns} />
      </div>
    </div>
  );
}

export default PickView;
