
import React, { useState, useEffect, useContext } from 'react';
import './AllPages.css';
import { AuthContext } from '../App.js';
import { validateEmail, validateDeliveryAddress, validateDeliveryDate, validateCreditCardNumber, validateCreditCardExpiration, validateCVV, validateItemQuantities } from './helperFiles/orderValidation';
import { useLocation, useNavigate } from 'react-router-dom';
import ReactDOMServer from 'react-dom/server';
import axios from 'axios';
import { DetailedOrderSummary } from './ReusableReactComponents';
import logo from '../assets/logo128.png';

const PlaceOrder = () => {
  const { user } = useContext(AuthContext);
  const { state } = useLocation();
  const { cartItems: initialCartItems, totalCost: initialTotalCost } = state || { cartItems: [], totalCost: 0 };
  const navigate = useNavigate();
  const today = new Date();
  const userTimezoneOffset = today.getTimezoneOffset() * 60000; // User's timezone offset in milliseconds
  const estOffset = -300; // EST is UTC-5 hours, which is -300 minutes
  const estTime = new Date(today.getTime() + userTimezoneOffset + estOffset * 60000);
  estTime.setHours(10, 0, 0, 0); // Set time to 10:00:00.000
  const formattedDate = `${estTime.getFullYear()}-${(estTime.getMonth() + 1).toString().padStart(2, '0')}-${estTime.getDate().toString().padStart(2, '0')}`;
  const handleBackToBuildOrder = () => {
  	navigate('/build-order', { state: { cartItems, totalCost } });
  };

  const initialOrderState = {
    customerName: user?.name || '',
    customerEmail: user?.email || '',
    deliveryAddress: user?.deliveryAddress || '2201 N Pershing Dr Apt 444, Arlington, VA 22209',
    deliveryDate: formattedDate,
    creditCardNumber: '0000000000000000',
    creditCardExpiration: '1028',
    creditCardCVV: '222',
    items: initialCartItems,
  };

  const [orderData, setOrderData] = useState(initialOrderState);
  const [cartItems, setCartItems] = useState(initialCartItems);
  const [totalCost, setTotalCost] = useState(initialTotalCost);
  const [availableItems, setAvailableItems] = useState([]);

  useEffect(() => {
    const calculateTotalCost = () => {
      const total = cartItems.reduce((acc, item) => acc + (item.quantity * item.unitCost), 0);
      setTotalCost(total);
    };
    calculateTotalCost();
  }, [cartItems]);

  const handleChange = (e) => {
    setOrderData({ ...orderData, [e.target.name]: e.target.value });
  };

  useEffect(() => {
  const fetchAvailableItems = async () => {
    try {
      const response = await axios.get('/api/items');
      setAvailableItems(response.data);
    } catch (error) {
      console.error("Error fetching items:", error);
    }
  };
  fetchAvailableItems();
}, []);


const handleItemQuantityChange = (index, newQuantity) => {
  const item = cartItems[index];
  const stockItem = availableItems.find(avItem => avItem._id === item._id); // Ensure using _id consistently
  if (!stockItem || newQuantity > stockItem.quantityAvailable) {
    alert(`Sorry, there are only ${stockItem ? stockItem.quantityAvailable : 0} units available of ${item.itemName} in stock.`);
    return;
  }

  const updatedCartItems = [...cartItems];
  updatedCartItems[index] = { ...item, quantity: Number(newQuantity) };
  setCartItems(updatedCartItems);
  updateTotalCost();
};



	const removeItemFromCart = (itemId) => {
  	const updatedCartItems = cartItems.filter(item => item._id !== itemId); // Use _id if available
  	setCartItems(updatedCartItems);
	};


  const toggleUpdateItem = (index) => {
    const updatedCartItems = cartItems.map((item, idx) =>
      idx === index ? { ...item, isUpdating: !item.isUpdating } : item
    );
    setCartItems(updatedCartItems);
  };

  const transformOrderItems = (order) => {
  const transformedItems = order.items.map((item) => ({
    item: {
      _id: item._id,
      itemName: item.itemName,
      description: item.description,
      quantityAvailable: item.quantityAvailable,
      unitCost: item.unitCost,
      farm: item.farm,
      __v: item.__v,
    },
    quantity: item.quantity,
    _id: item._id
  }));

  const totalCost = transformedItems.reduce((acc, item) => {
    return acc + (item.quantity * item.item.unitCost);
  }, 0);

  return { ...order, items: transformedItems, totalCost: totalCost.toFixed(2) };
};

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateEmail(orderData.customerEmail)) { alert('Please enter a valid email address.'); return; }
    if (!validateDeliveryAddress(orderData.deliveryAddress)) { alert('Please enter a valid delivery address.'); return; }
    if (!validateDeliveryDate(orderData.deliveryDate)) { alert('Please enter a valid delivery date.'); return; }
    if (!validateCreditCardNumber(orderData.creditCardNumber)) { alert('Please enter a valid credit card number.'); return; }
    if (!validateCreditCardExpiration(orderData.creditCardExpiration)) { alert('Please enter a valid credit card expiration date.'); return; }
    if (!validateCVV(orderData.creditCardCVV)) { alert('Please enter a valid CVV.'); return; }
    if (!validateItemQuantities(cartItems)) { alert('Please ensure all item quantities are valid.'); return; }

    const transformedOrder = transformOrderItems(orderData);

    const orderHtml = ReactDOMServer.renderToString(
      <>
        <img src={logo} className="logo" alt="Dujour Logo" />
        <DetailedOrderSummary
          show={true}
          order={transformedOrder}
          onClose={() => window.location.href = 'http://frontend-domain/order-history'}
          forConfirmation={true}
          isPopup={false}
          buttonTitle="View Order History"
        />
      </>
    );

    try {
      const response = await axios.post('/api/orders', {
        orderData,
        paymentMethodId: 'pm_card_visa', // This should be the actual payment method ID
        amount: totalCost * 100, // Amount in cents
        currency: 'usd',
        emailHtml: orderHtml
      });


      if (response.status === 200) {
        alert('Order submitted and email sent successfully!');
        setOrderData(initialOrderState);
        setCartItems([]);
        const savedOrder = response.data.order;
        const masterOrderNumber = savedOrder.masterOrderNumber;
        navigate('/order-summary', { state: { orderData: transformedOrder, cartItems, totalCost, masterOrderNumber } });
      } else {
        alert('Failed to submit the order.');
      }
    } catch (error) {
      console.error('Failed to submit the order and send the email.', error);
      alert('Failed to submit the order and send the email. Please try again.');
    }
  };


  return (
    <div className="customer-info-section">
    <button className="add-button" onClick={handleBackToBuildOrder}>Back to Build Order</button>
      <h3>Customer Information</h3>
      <table className="customer-info-table">
        <tbody>
            <tr>
              <td><label htmlFor="customerName">Customer Name:</label></td>
              <td><input type="text" name="customerName" id="customerName" value={orderData.customerName} onChange={handleChange} required /></td>
            </tr>
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
            <td><input 
              type="text" 
              name="creditCardExpiration" 
              id="creditCardExpiration" 
              value={orderData.creditCardExpiration} 
              placeholder="MM/YY" 
              onChange={handleChange} 
              required 
              className="input-expiration"
            />
        </td>
      </tr>
      <tr>
        <td><label htmlFor="creditCardCVV">Security Code (CVV):</label></td>
          <td><input 
            type="text" 
            name="creditCardCVV" 
            id="creditCardCVV" 
            value={orderData.creditCardCVV} 
            onChange={handleChange} 
            required 
            className="input-cvv"
          />
      </td>
    </tr>
        </tbody>
      </table>
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
              <tr key={item._id}>
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
                  <button className="delete-btn" onClick={() => removeItemFromCart(item._id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="total-cost">Total Cost: ${totalCost.toFixed(2)}</p>
        <div className="submitButton">
          <form onSubmit={handleSubmit}>
            <button className="submit-btn" type="submit">Submit Order</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PlaceOrder;
