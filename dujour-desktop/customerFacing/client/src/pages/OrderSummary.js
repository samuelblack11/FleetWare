import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './AllPages.css';
import { DetailedOrderSummary } from './ReusableReactComponents';
import axios from 'axios';

const OrderSummary = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { orderData, cartItems: initialCartItems, totalCost: initialTotalCost } = location.state || { orderData: {}, cartItems: [], totalCost: 0 };
  const [showOrderPopup, setShowOrderPopup] = useState(true);  // Set to true to show the order summary initially
  const [forConfirmation, setForConfirmation] = useState(false);  // You can adjust this based on your needs
  const [cartItems, setCartItems] = useState(initialCartItems);
  const [totalCost, setTotalCost] = useState(initialTotalCost);

  const currentOrder = {
    customerEmail: orderData.customerEmail,
    deliveryAddress: orderData.deliveryAddress,
    deliveryDate: orderData.deliveryDate,
    status: orderData.status || 'Pending',
    items: cartItems,
  };

  const handleBackToBuildOrder = () => {
    navigate('/build-order', { state: { cartItems, totalCost } });
  };

  const handleBackToPlaceOrder = () => {
    navigate('/place-order', { state: { cartItems, totalCost } });
  };

  const handleBackToMenu = () => {
    setCartItems([]);
    setTotalCost(0);
    navigate('/build-order', { state: { cartItems: [], totalCost: 0 } });
  }


  return (
    <div className="order-summary-section">
      <div className="customer-info-summary">
        <DetailedOrderSummary
          show={showOrderPopup}
          order={currentOrder}
          onClose={handleBackToMenu}
          forConfirmation={forConfirmation}
          isPopup={false}  // This makes it render as part of the page
          buttonTitle={"Proceed"}
        />
      </div>
      {/*<div className="order-summary-actions">
        <button className="add-button" onClick={handleBackToBuildOrder}>Back to Build Order</button>
        <button className="add-button" onClick={handleBackToPlaceOrder}>Back to Place Order</button>
      </div>*/}
    </div>
  );
};

export default OrderSummary;
