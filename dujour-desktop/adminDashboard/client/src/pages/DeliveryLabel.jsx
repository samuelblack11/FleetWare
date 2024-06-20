import React from 'react';

const DeliveryLabel = ({ order }) => {
  if (!order) return null; // If no order is provided, render nothing

  const barcode = `Dujour-${order.masterOrderNumber}-${order.customerEmail}`;

  return (
    <div style={{ padding: '10px', border: '1px solid black', width: '300px', height: '900', margin: '20px', textAlign: 'center' }}>
      <h2>Dujour Delivery</h2>
      <p><strong>Name:</strong> {order.customerName}</p>
      <p><strong>Address:</strong> {order.deliveryAddress}</p>
      <p><strong>Barcode:</strong> {barcode}</p>
    </div>
  );
};

export default DeliveryLabel;
