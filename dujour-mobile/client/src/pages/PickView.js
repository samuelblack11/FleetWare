import React, { useState, useEffect, useContext } from 'react';
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

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !user._id) { // Assuming user.id is the driver's ID
        return;
      }

      try {
        const response = await axios.get(`/api/pickPlans/specificPickPlan?date=${formattedDate}&userId=${user._id}`);
        console.log("API response:", response.data);
        setPickPlanExists(response.data.exists);

        if (response.data.exists) {
          setPickPlanDetails(response.data.pickPlans[0]); // Assuming pickPlans is an array with one element
          updateFullyPickedOrders(response.data.pickPlans[0].items);
          updateCompletedOrders(response.data.pickPlans[0].items);
        } else {
          setPickPlanDetails(null);
        }
      } catch (error) {
        console.error("Error fetching route plan details:", error);
        setPickPlanDetails(null);
      }
    };

    fetchData();

    const handler = setTimeout(fetchData, 500); // Delayed fetch to ensure user info is loaded
    return () => clearTimeout(handler);
  }, [user, formattedDate]);

  const handleStatusUpdate = async (item) => {
    try {
      const response = await axios.put('/api/pickPlans/updatePickStatus', {
        pickPlanId: pickPlanDetails._id,
        itemId: item._id,
        newStatus: item.status === 'Not Picked' ? 'Picked' : 'Not Picked'
      });
      console.log('Status update response:', response.data);
      setPickPlanDetails(response.data.pickPlan);
      updateFullyPickedOrders(response.data.pickPlan.items);
      updateCompletedOrders(response.data.pickPlan.items);
    } catch (error) {
      console.error('Error updating pick status:', error);
    }
  };

const handleOrderStatusToggle = async (order) => {
  const newStatus = order.status === 'Order Pick Complete' ? 'Ready for Driver Pickup' : 'Order Pick Complete';
  try {
    // Make API call to update order status
    await axios.put(`/api/orders/${order.orderID}`, { overallStatus: newStatus });

    // Update status locally
    setCompletedOrders(completedOrders.map(o => 
      o.masterOrderNumber === order.masterOrderNumber ? { ...o, status: newStatus } : o
    ));
  } catch (error) {
    console.error('Error updating order status:', error);
  }
};

  const updateFullyPickedOrders = (items) => {
    const pickedOrders = items.reduce((acc, item) => {
      acc[item.masterOrderNumber] = acc[item.masterOrderNumber] || [];
      acc[item.masterOrderNumber].push(item.status === 'Picked');
      return acc;
    }, {});

    const fullyPicked = Object.keys(pickedOrders).filter(orderNumber => 
      pickedOrders[orderNumber].every(status => status)
    );

    setFullyPickedOrders(fullyPicked);
    console.log("Fully Picked Orders updated:", fullyPicked); // Debug log
  };

const updateCompletedOrders = (items) => {
  const pickedOrders = items.reduce((acc, item) => {
    if (!acc[item.masterOrderNumber]) {
      acc[item.masterOrderNumber] = {
        orderID: item.orderID,
        statuses: []
      };
    }
    acc[item.masterOrderNumber].statuses.push(item.status === 'Picked');
    return acc;
  }, {});

  const completed = Object.keys(pickedOrders).filter(masterOrderNumber => 
    pickedOrders[masterOrderNumber].statuses.every(status => status)
  ).map(masterOrderNumber => ({
    masterOrderNumber,
    orderID: pickedOrders[masterOrderNumber].orderID, // Include the orderId
    status: 'Order Pick Complete'
  }));

  setCompletedOrders(completed);
};


  function reformatDate(selectedDate) {
    const dateParts = selectedDate.split('-');
    const year = dateParts[0].substr(2);
    const month = dateParts[1];
    const day = dateParts[2];

    return `${month}/${day}/${year}`;
  }

  const columns = [
    { Header: 'Location #', accessor: 'vendorLocationNumber' },
    { Header: 'Farm Name', accessor: 'farmName' },
    { Header: 'Item Name', accessor: 'itemName' },
    { Header: 'Quantity', accessor: 'quantity' },
    { Header: 'Order #', accessor: 'masterOrderNumber' },
    {
      Header: 'Status',
      accessor: 'status',
      Cell: ({ row }) => (
        <span>{row.status}</span>
      )
    },
  {
    Header: 'Actions',
    Cell: ({ row }) => (
      <button className="add-button" onClick={() => handleStatusUpdate(row)}>
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
    <div>
      <h2>Pick Plan for {reformatDate(formattedDate)}</h2>
      {pickPlanDetails ? (
        <GenericTable data={pickPlanDetails.items} columns={columns} fullyPickedOrders={fullyPickedOrders} />
      ) : (
        <p>No pick plan available for this date.</p>
      )}
      <h2>Completed Orders</h2>
      <GenericTable data={completedOrders} columns={completedOrdersColumns} />
    </div>
  );
}

export default PickView;
