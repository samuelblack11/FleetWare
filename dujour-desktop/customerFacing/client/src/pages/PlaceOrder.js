
import React, { useState, useEffect, useContext, useRef } from 'react';
import './AllPages.css';
import { AuthContext } from '../App.js';
import { validateEmail, validateDeliveryAddress, validateDeliveryDate, validateCreditCardNumber, validateCreditCardExpiration, validateCVV, validateItemQuantities } from './helperFiles/orderValidation';
import { useLocation, useNavigate } from 'react-router-dom';
import ReactDOMServer from 'react-dom/server';
import axios from 'axios';
import { DetailedOrderSummary } from './ReusableReactComponents';
import logo from '../assets/logo128.png';
import ReactDatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
const moment = require('moment-timezone');
import { useCart } from '../context/CartContext';

const LoadingSpinner = () => {
  return (
    <div className="spinner-container">
      <div className="spinner" aria-label="Loading"></div>
    </div>
  );
};

const PlaceOrder = () => {
  const { user } = useContext(AuthContext);
  const { state } = useLocation();
  const { cartItems, setCartItems, totalCost, clearCart } = useCart();
  const navigate = useNavigate();
  // Create a new date object for the current time in EST
  const dateInEST = moment().tz("America/New_York").set({hour: 11, minute: 0, second: 0, millisecond: 0});
  const formattedDate = dateInEST.format();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  // In PlaceOrder when navigating back
  const handleBackToBuildOrder = () => {
    navigate('/build-order', { state: { orderData } });  // Pass entire orderData
  };

  useEffect(() => {
    // Fetch the decrypted credit card details when the component mounts
    const fetchCreditCardDetails = async () => {
      try {
        const response = await axios.get(`/api/users/forOrderPlacement/${user._id}`);
        setOrderData({
          ...orderData,
          creditCardNumber: response.data.creditCardNumber,
          ccExpirationDate: response.data.creditCardExpiration
        });
      } catch (error) {
        console.error('Failed to fetch credit card details:', error);
      }
    };
    if (user._id) {
      fetchCreditCardDetails();
    }
  }, [user._id]);

const getNextSaturday = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    let nextSaturday;
    if (dayOfWeek === 5 || dayOfWeek === 6) {  // If today is Friday or Saturday
        // Calculate next week's Saturday
        nextSaturday = new Date(today.setDate(today.getDate() + (13 - dayOfWeek)));
    } else {
        // Calculate this week's Saturday
        nextSaturday = new Date(today.setDate(today.getDate() + (6 - dayOfWeek)));
    }
    return nextSaturday;
};


  const shippingCharge = 5; // Flat shipping fee
  const minimumOrderAmount = 30; // Minimum order amount before shipping
  const [availableItems, setAvailableItems] = useState([]);

  const calculateInitialTotalCost = () => {
        const subtotal = cartItems.reduce((acc, item) => acc + (item.quantity * item.unitCost), 0);
        const roundedSubtotal = Math.round(subtotal * 100) / 100; // rounding to 2 decimal places
        const finalTotal = roundedSubtotal + shippingCharge;
        return finalTotal;
    };

  const nextSaturday = getNextSaturday(new Date());

      // Initialize with data passed from BuildOrder or define fallback defaults
  const [orderData, setOrderData] = useState(() => {
        return {
            customerName: user?.name || '',
            customerEmail: user?.email || '',
            deliveryAddress: user?.deliveryAddress || '',
            deliveryDate: nextSaturday,
            creditCardNumber: '',
            ccExpirationDate: '',
            creditCardCVV: '',
            items: state?.cartItems,
            totalCost: state?.orderData?.totalCost || calculateInitialTotalCost() || 0,
        };
    });

  const initialOrderState = {
    customerName: user?.name || '',
    customerEmail: user?.email || '',
    deliveryAddress: user?.deliveryAddress || '',
    deliveryDate: formattedDate,
    creditCardNumber: '',
    ccExpirationDate: '',
    creditCardCVV: '',
    items: state?.cartItems || [],
  }

useEffect(() => {
    const calculateTotalCost = () => {
        const subtotal = cartItems.reduce((acc, item) => acc + (item.quantity * item.unitCost), 0);
        const roundedSubtotal = Math.round(subtotal * 100) / 100; // rounding to 2 decimal places
        const finalTotal = roundedSubtotal + shippingCharge;
        return finalTotal;
    };
    const total = calculateTotalCost();
    setOrderData(oldData => ({ ...oldData, totalCost: total })); // Assuming you want to store totalCost in orderData
}, [cartItems, shippingCharge]);



  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'ccExpirationDate') {
      let formattedValue = value.replace(
        /[^0-9]/g, '' // Remove non-numeric characters
      ).substring(0, 4); // Limit to 4 characters

      // Automatically insert a slash between MM and YY
      if (formattedValue.length > 2) {
        formattedValue = formattedValue.substring(0, 2) + '/' + formattedValue.substring(2);
      }

      setOrderData({
        ...orderData,
        ccExpirationDate: formattedValue
      });
      return;
    }
    setOrderData({ ...orderData, [e.target.name]: e.target.value });
  };

  const filterDate = (date) => {
    const nextSaturday = getNextSaturday(new Date());
    return date.toISOString().split('T')[0] === nextSaturday.toISOString().split('T')[0];
  };

  const handleDateChange = (date) => {
        setOrderData({ ...orderData, deliveryDate: date });
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

  // Calculate total only if it's not already provided
  if (order.totalCost === undefined) {
    const totalCost = transformedItems.reduce((acc, item) => {
      const itemTotal = (item.quantity * item.item.unitCost);
      // Round the item total to two decimal places before adding to accumulator
      const roundedItemTotal = Math.round(itemTotal * 100) / 100;
      return acc + roundedItemTotal;
    }, 0);

    // Optionally, round the final total to two decimal places if needed
    order.totalCost = Math.round(totalCost * 100) / 100;
  }

  return { ...order, items: transformedItems };
};


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const subtotal = cartItems.reduce((acc, item) => acc + (item.quantity * item.unitCost), 0);
    const finalTotal = subtotal + shippingCharge; // Correctly calculate total cost including shipping
    setOrderData(oldData => ({ ...oldData, totalCost: finalTotal }));

    // Check if subtotal meets the minimum required amount before shipping
    if (subtotal < minimumOrderAmount) {
      alert(`Minimum order amount of $${minimumOrderAmount} not met. Please add more items.`);
      return; // Stop further execution if minimum order amount not met
    }

    if (!validateEmail(orderData.customerEmail)) { alert('Please enter a valid email address.'); return; }
    if (!validateDeliveryAddress(orderData.deliveryAddress)) { alert('Please enter a valid delivery address.'); return; }
    //if (!validateDeliveryDate(orderData.deliveryDate)) { alert('Please enter a valid delivery date.'); return; }
    if (!validateCreditCardNumber(orderData.creditCardNumber)) { alert('Please enter a valid credit card number.'); return; }
    if (!validateCreditCardExpiration(orderData.ccExpirationDate)) { alert('Please enter a valid credit card expiration date.'); return; }
    if (!validateCVV(orderData.creditCardCVV)) { alert('Please enter a valid CVV.'); return; }
    if (!validateItemQuantities(cartItems)) { alert('Please ensure all item quantities are valid.'); return; }
    setIsLoading(true);

    const transformedOrder = transformOrderItems({
        ...orderData,
        totalCost: finalTotal  // Use finalTotal directly here
    });
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

    const amountInCents = Math.round(finalTotal * 100); // Convert totalCost to cents and round to the nearest integer

    try {
      const response = await axios.post('/api/orders', {
        orderData: { ...orderData, totalCost: finalTotal }, // Make sure to include updated totalCost here
        paymentMethodId: 'pm_card_visa', // This should be the actual payment method ID
        amount: amountInCents, // Amount in cents
        currency: 'usd',
        emailHtml: orderHtml,
        return_url: `${window.location.origin}/order-summary`
      });

      if (response.status === 200) {
          // New lines: Update inventory after successful order placement
        const stockUpdateData = cartItems.map(item => ({
          itemId: item._id,
          quantity: item.quantity  // Negative because we are decrementing the stock
        }));
        try {
          await axios.put('/api/items/decrement-stock', stockUpdateData);
          // Optionally handle response from the stock update
        } catch (stockError) {
          console.error('Failed to update stock:', stockError);
          // Handle error, perhaps log it or display a message, but don't block order confirmation
        }
        alert('Order submitted and email sent successfully!');
        setOrderData(initialOrderState);
        setCartItems([]);
        const savedOrder = response.data.order;
        const masterOrderNumber = savedOrder.masterOrderNumber;
        navigate('/order-summary', { state: { orderData: transformedOrder, cartItems, masterOrderNumber } });
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
    {isLoading && <LoadingSpinner />}
    {error && <div className="error">{error}</div>}
    <button className="add-button" onClick={handleBackToBuildOrder}>Back to Build Order</button>
      <h3>Customer Information</h3>
      <table className="customer-info-table">
        <tbody>
            <tr>
              <td><label htmlFor="customerName">Customer Name</label></td>
              <td className="input-cell"><input className="input-name" type="text" name="customerName" id="customerName" value={orderData.customerName} onChange={handleChange} required /></td>
            </tr>
            {user.role === 'admin' && (
            <tr>
              <td><label htmlFor="customerEmail">Customer Email</label></td>
              <td className="input-cell"><input className="input-email" type="email" name="customerEmail" id="customerEmail" value={orderData.customerEmail} onChange={handleChange} required /></td>
            </tr>
          )}
          <tr>
            <td><label htmlFor="deliveryAddress">Delivery Address</label></td>
            <td className="input-cell"><input className="input-address" type="text" name="deliveryAddress" id="deliveryAddress" value={orderData.deliveryAddress} onChange={handleChange} required /></td>
          </tr>
          <tr>
          <td><label htmlFor="deliveryDate">Delivery Date</label></td>
          <td className="input-cell"><ReactDatePicker
            className="input-datepicker"
            selected={new Date(orderData.deliveryDate)}
            onChange={handleDateChange}
            dateFormat="yyyy-MM-dd"
            minDate={orderData.deliveryDate}
            maxDate={orderData.deliveryDate}
          /></td>
          </tr>
          <tr>
            <td><label htmlFor="creditCardNumber">Credit Card Number</label></td>
            <td className="input-cell"><input className="input-cc" type="text" name="creditCardNumber" id="creditCardNumber" value={orderData.creditCardNumber} onChange={handleChange} required /></td>
          </tr>
          <tr>
            <td><label htmlFor="creditCardExpiration" >Expiration Date (MM/YY)</label></td>
            <td className="input-cell"><input
              type="text" 
              name="ccExpirationDate" 
              id="ccExpirationDate" 
              value={orderData.ccExpirationDate} 
              placeholder="MM/YY" 
              onChange={handleChange} 
              required 
              className="input-expiration"
            />
        </td>
      </tr>
      <tr>
        <td><label htmlFor="creditCardCVV">Security Code (CVV)</label></td>
          <td className="input-cell"><input 
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
        <p className="total-cost">Shipping Charge: ${shippingCharge.toFixed(2)}</p>
        <p className="total-cost">Total Cost: ${orderData.totalCost.toFixed(2)}</p>
        <div className="submitButton">
          <form onSubmit={handleSubmit}>
            <button className="add-button" type="submit">Submit Order</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PlaceOrder;
