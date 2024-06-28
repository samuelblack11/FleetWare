import React, { useState, useEffect, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './AllPages.css';
import { DetailedOrderSummary } from './ReusableReactComponents';
import axios from 'axios';
import { CartContext } from '../context/CartContext'; // Import CartContext


const OrderSummary = () => {
  const { cartItems, totalCost, clearCart } = useContext(CartContext); // Use the CartContext
  const location = useLocation();
  const navigate = useNavigate();
  const { orderData, masterOrderNumber } = location.state || { orderData: {}, masterOrderNumber: null };
  const [showOrderPopup, setShowOrderPopup] = useState(true);  // Set to true to show the order summary initially
  const [forConfirmation, setForConfirmation] = useState(false);  // You can adjust this based on your needs

  const currentOrder = {
    customerEmail: orderData.customerEmail || '',
    deliveryAddress: orderData.deliveryAddress || '',
    deliveryDate: orderData.deliveryDate || '',
    overallStatus: orderData.overallStatus || 'Order Confirmed',
    items: orderData.items,
    totalCost: orderData.totalCost,
    masterOrderNumber: masterOrderNumber || '',
    promoApplied: orderData.promoDiscount > 0 || orderData.discountedShipping !== orderData.shippingCharge,
    originalShippingCharge: orderData.originalShippingCharge,
    discountedShipping: orderData.discountedShipping,
    originalTotalCost: orderData.totalCostPreDiscount
  };

  useEffect(() => {
    // Log the current order
  }, [currentOrder]);


  const handleBackToMenu = () => {
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
