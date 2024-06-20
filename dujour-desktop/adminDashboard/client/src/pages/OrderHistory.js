import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { GenericTable, DetailedOrderSummary } from './ReusableReactComponents';
import './AllPages.css';
import { AuthContext } from '../App.js';
const moment = require('moment-timezone');

const OrderForm = ({ order, onSave, onClose, isEditable }) => {
  const initialState = order || {
    customerName: '',
    customerEmail: '',
    deliveryAddress: '',
    deliveryDate: '',
    items: [{ itemName: '', quantity: '', pickupAddress: '' }],
  };

  const [orderData, setOrderData] = useState(initialState);

  const handleChange = (e, index) => {
    if (index !== undefined) {
      const updatedItems = orderData.items.map((item, i) => 
        i === index ? { ...item, [e.target.name]: e.target.value } : item
      );
      setOrderData({ ...orderData, items: updatedItems });
    } else {
      setOrderData({ ...orderData, [e.target.name]: e.target.value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const method = order ? 'put' : 'post';
      const url = order ? `/api/orders/${order._id}` : '/api/orders';
      await axios[method](url, orderData);
      onSave();
    } catch (error) {
      console.error('Error saving order:', error);
    }
  };

  const addItemField = () => {
    const newItem = { itemName: '', quantity: '', pickupAddress: '' };
    setOrderData({ ...orderData, items: [...orderData.items, newItem] });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Customer Email:</label>
        <input type="text" name="customerEmail" value={orderData.customerEmail} onChange={handleChange} readOnly={!isEditable} />
      </div>
      <div>
        <label>Order Status</label>
        <input type="text" name="overallStatus" value={orderData.overallStatus} onChange={handleChange} readOnly={!isEditable} />
      </div>
      <div>
        <label>Total Cost:</label>
        <input type="number" name="totalCost" value={orderData.totalCost} onChange={handleChange} readOnly={!isEditable} />
      </div>
      <div>
        <label>Delivery Address:</label>
        <input type="text" name="deliveryAddress" value={orderData.deliveryAddress} onChange={handleChange} readOnly={!isEditable} />
      </div>
      <div>
        <label>Delivery Date:</label>
        <input type="date" name="deliveryDate" value={orderData.deliveryDate} onChange={handleChange} readOnly={!isEditable} />
      </div>
      {orderData.items.map((item, index) => (
        <div key={index}>
          <label>Item Name:</label>
          <input type="text" name="itemName" value={item.itemName} onChange={(e) => handleChange(e, index)} readOnly={!isEditable} />
          <label>Quantity:</label>
          <input type="number" name="quantity" value={item.quantity} onChange={(e) => handleChange(e, index)} readOnly={!isEditable} />
          <label>Pickup Address:</label>
          <input type="text" name="pickupAddress" value={item.pickupAddress} onChange={(e) => handleChange(e, index)} readOnly={!isEditable} />
        </div>
      ))}
      <button type="button" onClick={addItemField} className="add-button">Add Item</button>
    </form>
  );
};

const OrderManagement = ({ mode }) => {
  const [orders, setOrders] = useState([]);
  const [showOrderPopup, setShowOrderPopup] = useState(false);
  const [forConfirmation, setforConfirmation] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [filterField, setFilterField] = useState('');
  const [filterValue, setFilterValue] = useState('');
  const { user } = useContext(AuthContext);

  useEffect(() => {
    if (mode === 'myOrders') {
      fetchMyOrders();
    } else {
      fetchOrders();
    }
  }, [mode]);

  const fetchMyOrders = async () => {
    try {
      const allOrdersResponse = await axios.get('/api/orders');
      const myOrders = allOrdersResponse.data.filter(order => order.customerEmail === user.email);
      setOrders(myOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await axios.get('/api/orders');
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const handleClosePopup = () => {
    setShowOrderPopup(false);
    setCurrentOrder(null);
  };

  const handleSaveOrder = async (orderData) => {
    const method = orderData._id ? 'put' : 'post';
    const url = orderData._id ? `/api/orders/${orderData._id}` : '/api/orders';

    try {
      await axios[method](url, orderData);
      fetchOrders();
    } catch (error) {
      console.error('Error saving order:', error);
    }
    setShowOrderPopup(false);
  };

  const deleteOrder = async (id) => {
    try {
      await axios.delete(`/api/orders/${id}`);
      fetchOrders();
    } catch (error) {
      console.error('Error deleting order:', error);
    }
  };

  const filteredOrders = orders.filter(order => {
    if (!filterField || !filterValue) {
      return true;
    }
    const orderValue = String(order[filterField]).toLowerCase();
    return orderValue.includes(filterValue.toLowerCase());
  });

  const columns = [
    { Header: 'Customer Email', accessor: 'customerEmail' },
    { Header: 'Order Number', accessor: 'masterOrderNumber' },
    { Header: 'Order Status', accessor: 'overallStatus' },
    {
      Header: 'Order Cost',
      accessor: 'totalCost',
      Cell: ({ row }) => `$${parseFloat(row.totalCost).toFixed(2)}`
    },
    { Header: 'Delivery Address', accessor: 'deliveryAddress' },
    {
      Header: 'Delivery Date',
      accessor: 'deliveryDate',
      Cell: ({ row }) => {
        const date = new Date(row.deliveryDate);
        const formattedDate = new Intl.DateTimeFormat('en-US', {
          timeZone: 'America/New York'
        }).format(date);
        return formattedDate;
      }
    },
    {
      Header: 'Actions',
      accessor: 'actions', // Assigning a unique accessor for the actions column
      Cell: ({ row }) => {
        const isDraft = row.overallStatus === 'draft';
        return (
          <button onClick={() => {
            setCurrentOrder(row); 
            setShowOrderPopup(true);
          }} className="add-button">
            {isDraft && mode === 'myOrders' ? 'View/Update' : 'View'}
          </button>
        );
      }
    }
  ];

  return (
    <div>
      <h2 className="page-header">Order History</h2>
      <div>
        <select value={filterField} onChange={(e) => setFilterField(e.target.value)}>
          <option value="">Select a field to filter by</option>
          <option value="customerName">Customer Name</option>
          <option value="overallStatus">Order Status</option>
          <option value="deliveryAddress">Delivery Address</option>
          <option value="deliveryDate">Delivery Date</option>
        </select>
        <input
          type="text"
          placeholder="Filter value"
          value={filterValue}
          onChange={(e) => setFilterValue(e.target.value)}
        />
      </div>
      <GenericTable data={filteredOrders} columns={columns} />
      {showOrderPopup && (
        <DetailedOrderSummary
          show={showOrderPopup}
          order={currentOrder}
          onClose={handleClosePopup}
          forConfirmation={false}
          isPopup={true}  // This makes it render as a popup
          buttonTitle={"Close"}
        />
      )}
    </div>
  );
};

export default OrderManagement;