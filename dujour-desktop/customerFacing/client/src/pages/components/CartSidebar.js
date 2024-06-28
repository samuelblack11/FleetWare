import React, { useState, useEffect, useContext } from 'react';
import { useCart } from '../../context/CartContext';
import CartTable from '../components/CartTable';  // Ensure path is correct
import { useNavigate } from 'react-router-dom';

const CartSidebar = () => {
  const {
    cartItems,
    totalCost,
    removeFromCart,
    updateCartItem,
    toggleItemUpdate,
    confirmOrder
  } = useCart();
  const [editQuantities, setEditQuantities] = useState({});
  const navigate = useNavigate();
  const minimumOrderAmount = 30; // Minimum order amount before shipping
  const [error, setError] = useState('');

useEffect(() => {
  const newEditQuantities = {...editQuantities};
  cartItems.forEach(item => {
    if (item.isUpdating && !newEditQuantities[item._id]) {
      newEditQuantities[item._id] = item.quantity.toString(); // Store as string for input
    } else if (!item.isUpdating) {
      delete newEditQuantities[item._id]; // Remove from edit quantities when not updating
    }
  });
  setEditQuantities(newEditQuantities);
}, [cartItems]);


  const handleQuantityChange = (itemId, quantity) => {
    setEditQuantities(prev => ({ ...prev, [itemId]: quantity }));
  };

const confirmUpdate = (itemId) => {
    const quantityStr = editQuantities[itemId];
    const quantity = quantityStr.trim() === '' ? 0 : Number(quantityStr);  // Convert empty input to 0 or any default value

    if (!isNaN(quantity) && quantity >= 0) {
        updateCartItem(itemId, quantity);
        toggleItemUpdate(itemId);  // Toggle off the editing mode
    }
};


  const handleConfirmOrder = () => {
    if (totalCost < minimumOrderAmount) {
      setError(`Minimum order amount of $${minimumOrderAmount} not reached. Please add more items to your cart.`);
      return;
    }
    setError('');
    //confirmOrder(); // Assuming you have this method to handle order confirmation
    navigate('/place-order'); // pass entire orderData including totalCost
  };

  return (
    <div className="cart-sidebar">
      {error && <div className="about-dujour">{error}</div>}
      <h2>Cart</h2>
      <div className="table-container">
        <CartTable
          cartItems={cartItems}
          inputQuantities={editQuantities}
          updatingItems={item => item.isUpdating}
          setInputQuantities={handleQuantityChange}
          confirmUpdate={confirmUpdate}
          toggleItemUpdate={toggleItemUpdate} // Toggle edit mode
          removeFromCart={removeFromCart}
        />
      </div>
      <p className="total-cost">Total Cost: ${totalCost.toFixed(2)}</p>
      <button onClick={handleConfirmOrder} className="add-button">Confirm Order</button>
    </div>
  );
};

export default CartSidebar;
