import React, { useState, useEffect, useContext} from 'react';
import axios from 'axios';
import './AllPages.css';
import { AuthContext } from '../App.js';
import { fetchUserByEmail, submitFinalOrder, incrementUserOrderNumber } from './helperFiles/placeOrder';
import { validateEmail, validateDeliveryAddress, validateDeliveryDate, validateCreditCardNumber, validateCreditCardExpiration, validateCVV, validateItemQuantities } from './helperFiles/orderValidation';

const BuildOrder = () => {
  const { user } = useContext(AuthContext);
    const initialOrderState = {
    customerEmail: '',
    deliveryAddress: '',
    deliveryDate: '',
    creditCardNumber: '',
    creditCardExpiration: '',
    creditCardCVV: '',
    items: [],
  };
  const [orderData, setOrderData] = useState(initialOrderState);
  const [availableItems, setAvailableItems] = useState([]); // Items fetched from the server
  const [cartItems, setCartItems] = useState([]); // Items added to the cart
  const [totalCost, setTotalCost] = useState(0);

      const fetchAvailableItems = async () => {
      try {
        const response = await axios.get('/api/items');
        setAvailableItems(response.data.map(item => ({
          ...item,
          quantity: 0,
          unitCost: item.unitCost || 0, // Assuming each item has a unitCost
        })));
      } catch (error) {
        console.error("Error fetching items:", error);
      }
    };

  useEffect(() => {
    fetchAvailableItems();
  }, []);

  // Inside BuildOrder component
  useEffect(() => {
      console.log(user); // Debugging: Log the user object
      console.log(user.deliveryAddress);
    if (user.role !== 'admin') {
      setOrderData(currentOrderData => ({
        ...currentOrderData,
        deliveryAddress: user.deliveryAddress || '', // Autofill from user profile
      }));
    }
  }, [user]); // Depend on user to update the state when user info is available

  const handleChange = (e) => {
    setOrderData({ ...orderData, [e.target.name]: e.target.value });
  };

  const handleQuantityChange = (index, quantity) => {
      const newItems = [...availableItems];
      newItems[index] = { ...newItems[index], quantity: Number(quantity) };
      setAvailableItems(newItems);
      updateTotalCost(newItems);
};

const removeItemFromCart = (itemId) => {
  const updatedCartItems = cartItems.filter(item => {
    console.log(`Checking item with id ${item.id} against ${itemId}`);
    return item.id !== itemId;
  });
  setCartItems(updatedCartItems);
};


const toggleUpdateItem = (index) => {
  const updatedCartItems = cartItems.map((item, idx) =>
    idx === index ? { ...item, isUpdating: !item.isUpdating } : item
  );
  setCartItems(updatedCartItems);
};

const handleItemQuantityChange = (index, newQuantity) => {
  const item = cartItems[index];
  const stockItem = availableItems.find(avItem => avItem.itemName === item.itemName);
  if (!stockItem || newQuantity > stockItem.quantityAvailable) {
    alert(`Sorry, there are only ${stockItem.quantityAvailable} units available of ${item.itemName} in stock.`);
    return;
  }

  const updatedCartItems = [...cartItems];
  updatedCartItems[index] = { ...item, quantity: newQuantity };
  setCartItems(updatedCartItems);
  // No need to call updateTotalCost here if it's called within useEffect or elsewhere when cartItems changes.
};


const handleAddToCart = (itemToAdd) => {
  // Find the corresponding item in availableItems to check stock
  const stockItem = availableItems.find(item => item._id === itemToAdd._id);

  if (!stockItem) {
    alert('Item not found.');
    return;
  }

  // Calculate the total quantity of this item already in the cart
  const cartItem = cartItems.find(item => item._id === itemToAdd._id);
  const totalQuantityInCart = cartItem ? cartItem.quantity + itemToAdd.quantity : itemToAdd.quantity;

  if (totalQuantityInCart > stockItem.quantityAvailable) {
    alert(`Sorry, there are only ${stockItem.quantityAvailable} units of ${itemToAdd.itemName} available in stock.`);
    return;
  }

  // If item already exists in the cart, update its quantity
  if (cartItem) {
    const updatedCartItems = cartItems.map(item =>
      item._id === itemToAdd._id ? { ...item, quantity: totalQuantityInCart } : item
    );
    setCartItems(updatedCartItems);
  } else {
    // Add new item to the cart
    setCartItems([...cartItems, { ...itemToAdd, quantity: itemToAdd.quantity }]);
  }

  // Update total cost
  updateTotalCost();
};


// Adjust `updateTotalCost` to work directly with `cartItems` instead of `availableItems`
const updateTotalCost = () => {
    const total = cartItems.reduce((acc, item) => acc + (item.quantity * item.unitCost), 0);
    setTotalCost(total);
};

const handleSubmit = async (e) => {
  e.preventDefault();

  // Validation checks
  if (!validateEmail(orderData.customerEmail)) {alert('Please enter a valid email address.'); return;}
  if (!validateDeliveryAddress(orderData.deliveryAddress)) {alert('Please enter a valid delivery address.'); return;}
  if (!validateDeliveryDate(orderData.deliveryDate)) { alert('Please enter a valid delivery address.'); return;}
  if (!validateCreditCardNumber(orderData.creditCardNumber)) {alert('Please enter a valid credit card number.'); return;}
  if (!validateCreditCardExpiration(orderData.creditCardExpiration)) {alert('Please enter a valid credit card expiration.'); return;}
  if (!validateCVV(orderData.creditCardCVV)) {alert('Please enter valid cvv.'); return;}
  if (!validateItemQuantities(cartItems)) {console.log("+++"); console.log(`${cartItems.quantity}`); alert('Please ensure all item quantities are valid.'); return;}

  // Check for stock availability before proceeding with the order submission
  for (const cartItem of cartItems) {
    const stockItem = availableItems.find(item => item._id === cartItem._id);
    if (!stockItem || cartItem.quantity > stockItem.quantityAvailable) {
      alert(`Sorry, there are only ${stockItem.quantityAvailable} units of ${cartItem.itemName} available in stock.`);
      return; // Stop submission if any item exceeds available stock
    }
  }

  let nextOrderNumber;
  let userEmailToUpdate;

  try {
    // Determine nextOrderNumber and userEmailToUpdate logic here
    if (user.role === 'admin' && orderData.customerEmail) {
      const userForOrder = await fetchUserByEmail(orderData.customerEmail);
      nextOrderNumber = userForOrder ? userForOrder.lastOrderNumber + 1 : 1;
      userEmailToUpdate = orderData.customerEmail;
    } else {
      nextOrderNumber = user.lastOrderNumber + 1;
      userEmailToUpdate = user.email;
    }

    let finalOrderData = { ...orderData, orderNumber: nextOrderNumber, items: cartItems };
    const orderResponse = await submitFinalOrder(finalOrderData);

    if (orderResponse.status === 200 || orderResponse.status === 201) {
      await incrementUserOrderNumber(userEmailToUpdate);
      fetchAvailableItems();
    }

    // Reset form and state
    setOrderData(initialOrderState);
    setCartItems([]);
    alert('Order submitted successfully!');
  } catch (error) {
    console.error(error.message);
    alert('Failed to submit the order. Please try again.');
  }
};



async function createNewOrderForUser(userName, orderData) {
  // Increment the user's lastOrderNumber atomically
  const user = await User.findOneAndUpdate(
    { userName },
    { $inc: { lastOrderNumber: 1 } },
    { new: true, upsert: true } // Upsert true to create the user if they don't exist
  );

  // Construct the uniqueOrderId
  const uniqueOrderId = `${userName}-${user.lastOrderNumber}`;

  // Create a new order with the uniqueOrderId
  const newOrder = new Order({
    ...orderData,
    userName,
    orderNumber: user.lastOrderNumber,
    uniqueOrderId
  });

  await newOrder.save();
  return newOrder;
}

return (
  <div className="build-order-container">
  <div className="left-sections"> {/* New wrapper for left sections */}
<div className="customer-info-section">
  <h3>Customer Information</h3>
  <table className="customer-info-table">
    <tbody>
       {user.role === 'admin' && (
      <tr>
        <td><label htmlFor="customerEmail">Customer Email:</label></td>
        <td><input type="email" name="customerEmail" id="customerEmail" value={orderData.customerEmail} onChange={handleChange} required /></td>
      </tr>
        )}
      <tr>
        <td><label htmlFor="deliveryAddress">Delivery Address:</label></td>
        <td><input type="text" name="deliveryAddress" id="deliveryAddress" value={orderData.deliveryAddress} onChange={handleChange} required /></td>
      </tr>
      <tr>
        <td><label htmlFor="deliveryDate">Delivery Date:</label></td>
        <td><input type="date" name="deliveryDate" id="deliveryDate" value={orderData.deliveryDate} onChange={handleChange} required /></td>
      </tr>
      <tr>
        <td><label htmlFor="creditCardNumber">Credit Card Number:</label></td>
        <td><input type="text" name="creditCardNumber" id="creditCardNumber" value={orderData.creditCardNumber} onChange={handleChange} required /></td>
    </tr>
    <tr>
        <td><label htmlFor="creditCardExpiration">Expiration Date:</label></td>
        <td><input type="text" name="creditCardExpiration" id="creditCardExpiration" value={orderData.creditCardExpiration} placeholder="MM/YY" onChange={handleChange} required /></td>
    </tr>
    <tr>
        <td><label htmlFor="creditCardCVV">Security Code (CVV):</label></td>
        <td><input type="text" name="creditCardCVV" id="creditCardCVV" value={orderData.creditCardCVV} onChange={handleChange} required /></td>
    </tr>
    </tbody>
  </table>
</div>
  <div className="build-cart-section">
  <h3>Build Your Cart</h3>
  <table>
    <thead>
      <tr>
        <th>Item Name</th>
        <th>Unit Cost</th>
        <th>Quantity</th>
        <th>Line Item Cost</th>
        <th>Add to Cart</th>
      </tr>
    </thead>
    <tbody>
      {availableItems.map((item, index) => (
        <tr key={index}>
          <td>{item.itemName}</td>
          <td>${item.unitCost.toFixed(2)}</td>
          <td>
            <input
              className="input-quantity"
              type="number"
              min="0"
              value={item.quantity || ''}
              onChange={(e) => handleQuantityChange(index, e.target.value)}
            />
          </td>
          <td>${(item.quantity * item.unitCost).toFixed(2)}</td>
          <td>
            <button onClick={() => handleAddToCart(item)} className="add-button">Add to Cart</button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
    </div> {/* End of left-sections */}
  <div className="cart-summary">
  <h3>Cart Summary</h3>
    <table>
    <thead>
      <tr>
        <th>Item Name</th>
        <th>Quantity</th>
        <th>Unit Cost</th>
        <th>Line Item Cost</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
  {cartItems.map((item, index) => (
    <tr key={item.id}>
      <td>{item.itemName}</td>
      <td>
        {item.isUpdating ? (
          <input
            type="number"
            value={item.quantity}
            onChange={(e) => handleItemQuantityChange(index, e.target.value)}
            autoFocus
          />
        ) : (
          item.quantity
        )}
      </td>
      <td>${item.unitCost.toFixed(2)}</td>
      <td>${(item.quantity * item.unitCost).toFixed(2)}</td>
      <td className="actions-cell">
        <button className="add-button" onClick={() => toggleUpdateItem(index)}>{item.isUpdating ? "Confirm" : "Update"}</button>
        <button className="delete-btn" onClick={() => removeItemFromCart(item.id)}>Delete</button>
      </td>
    </tr>
  ))}
</tbody>

  </table>
  <p className="total-cost">Total Cost: ${cartItems.reduce((acc, item) => acc + (item.quantity * item.unitCost), 0).toFixed(2)}</p>
      <div className="submitButton">
        <form onSubmit={handleSubmit}>
        <div className="submitButton">
          <button className="submit-btn" type="submit">Submit Order</button>
        </div>
        </form>
      </div>
    </div>
  </div>
);
};

export default BuildOrder;