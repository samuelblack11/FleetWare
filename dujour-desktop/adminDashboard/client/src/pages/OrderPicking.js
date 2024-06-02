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

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const { data } = await axios.get(`/api/orders/detailed-orders?date=${selectedDate}`);
        console.log("+=+=+=")
        console.log(data)
        setOrders(data);
      } catch (error) {
        console.error('Error fetching orders:', error);
        setError('Failed to fetch orders.');
      }
      setIsLoading(false);
    };

    if (selectedDate) {
      fetchData();
    }
  }, [selectedDate]);

  const handleChange = (setter) => (e) => setter(e.target.value);

  const orderTableColumns = [
    { Header: 'Order Number', accessor: 'masterOrderNumber' },
    { Header: 'Customer Email', accessor: 'customerEmail' },
    { Header: 'Delivery Address', accessor: 'deliveryAddress' },
  ];

  const itemTableColumns = [
    { Header: 'Item Name', accessor: 'item.itemName' },
    { Header: 'Quantity', accessor: 'quantity' },
    { Header: 'Vendor Location Number', accessor: 'item.farm.vendorLocationNumber' },
  ];

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
      </form>
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
    </div>
  );
};

export default OrderPicking;
