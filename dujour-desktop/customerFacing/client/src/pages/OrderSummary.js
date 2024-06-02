import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './AllPages.css';
import { DetailedOrderSummary } from './ReusableReactComponents';
import axios from 'axios';

const OrderSummary = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { orderData, cartItems: initialCartItems, totalCost: initialTotalCost, masterOrderNumber } = location.state || { orderData: {}, cartItems: [], totalCost: 0, masterOrderNumber: null };
  const [showOrderPopup, setShowOrderPopup] = useState(true);  // Set to true to show the order summary initially
  const [forConfirmation, setForConfirmation] = useState(false);  // You can adjust this based on your needs
  const [cartItems, setCartItems] = useState(initialCartItems);
  const [totalCost, setTotalCost] = useState(initialTotalCost);

  const currentOrder = {
    customerEmail: orderData.customerEmail || '',
    deliveryAddress: orderData.deliveryAddress || '',
    deliveryDate: orderData.deliveryDate || '',
    overallStatus: orderData.overallStatus || 'Order Confirmed',
    items: orderData.items,
    totalCost: orderData.totalCost,
    masterOrderNumber: masterOrderNumber || ''
  };

  useEffect(() => {
    // Log the current order
  }, [currentOrder]);

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
          isPopup={false}
          buttonTitle={"Proceed"}
        />
      </div>
    </div>
  );
};

export default OrderSummary;
