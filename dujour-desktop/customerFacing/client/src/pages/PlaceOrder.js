
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
import usePromoCode from './hooks/usePromoCode';
import useNextSaturday from './hooks/useNextSaturday';
import CartTable from './components/CartTable'; // make sure the path is correct
import CartSummaryDisplay from './components/CartSummaryDisplay'; // make sure the path is correct
import CustomerInfoForm from './components/CustomerInfoForm'; // make sure the path is correct

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
  const { cartItems, setCartItems, totalCost, clearCart, updateCartItem, removeFromCart,toggleItemUpdate,confirmOrder} = useCart();

  const navigate = useNavigate();
  // Create a new date object for the current time in EST
  const dateInEST = moment().tz("America/New_York").set({hour: 11, minute: 0, second: 0, millisecond: 0});
  const formattedDate = dateInEST.format();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const shippingCharge = 5; // Flat shipping fee
  const minimumOrderAmount = 30; // Minimum order amount before shipping
  const [availableItems, setAvailableItems] = useState([]);
  const [discountedTotalCost, setDiscountedTotalCost] = useState(null);
  const [discountedShipping, setDiscountedShipping] = useState(shippingCharge);
  const [inputQuantities, setInputQuantities] = useState({});
  const [updatingItems, setUpdatingItems] = useState({});
  const [editQuantities, setEditQuantities] = useState({});
  const [promoDiscount, setPromoDiscount] = useState(0);

    const applyPromoEffect = (promoData) => {
        if (promoData.type === "freeShipping") {
          setDiscountedShipping(0); // Set discounted shipping to 0
          const newTotalCost = orderData.totalCost - shippingCharge; // Subtract current shipping charge from total cost
          setOrderData(prev => ({
            ...prev,
            totalCost: newTotalCost
        }));
        } else if (promoData.type === "discount" && promoData.amount) {
            setOrderData(prev => ({
                ...prev,
                totalCost: Math.max(0, prev.totalCost * (1-(promoData.amount/100)))
            }));
        }
    };

    const resetOrderState = () => {
    setDiscountedShipping(shippingCharge); // Reset shipping to default
    setPromoCode('');                     // Clear promo code
    setPromoDiscount(0);                  // Reset any discounts
    clearCart();                          // Assuming this clears the cart items
    // Add any other state resets needed for a new order
};


    const { promoCode, promoData, setPromoCode, promoError, handlePromoSubmit } = usePromoCode(applyPromoEffect);

    // Use `promoData` here as needed, for example:
    useEffect(() => {
      if (promoData) {
        console.log("Promo data received:", promoData);
      }
    }, [promoData]);
      // In PlaceOrder when navigating back
      const handleBackToBuildOrder = () => {
        navigate('/build-order', { state: { orderData } });  // Pass entire orderData
      };

useEffect(() => {
    const editStates = {};
    cartItems.forEach(item => {
        editStates[item._id] = false; // Initially, no items are being updated
    });
    setUpdatingItems(editStates);
}, [cartItems]);

useEffect(() => {
    const subtotal = cartItems.reduce((acc, item) => acc + (item.quantity * item.unitCost), 0);
    const finalTotal = subtotal + discountedShipping; // Use discounted shipping
    setOrderData(prev => ({
        ...prev,
        totalCost: finalTotal,
        totalCostPreDiscount: subtotal + shippingCharge // Always calculate pre-discount using the original shipping charge
    }));
}, [cartItems, discountedShipping]); // Updated to trigger recalculation when discountedShipping changes


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

  const calculateInitialTotalCost = () => {
        const subtotal = cartItems.reduce((acc, item) => acc + (item.quantity * item.unitCost), 0);
        const roundedSubtotal = Math.round(subtotal * 100) / 100; // rounding to 2 decimal places
        const finalTotal = roundedSubtotal + shippingCharge;
        return finalTotal;
    };

  const nextSaturday = useNextSaturday();

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
            items: cartItems,
            totalCost: state?.orderData?.totalCost + shippingCharge || calculateInitialTotalCost() || 0,
            totalCostPreDiscount: state?.orderData?.totalCost + shippingCharge || calculateInitialTotalCost() || 0,
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
    items: [],
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
    const nextSaturday = useNextSaturday();
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


const handleQuantityChange = (itemId, quantity) => {
  setEditQuantities(prev => ({ ...prev, [itemId]: quantity }));
};

const removeItemFromCart = (itemId) => {
  removeFromCart(itemId);
};


const toggleUpdateItem = (itemId) => {
  setUpdatingItems(prev => ({ ...prev, [itemId]: !prev[itemId] }));
};

const confirmUpdate = (itemId) => {
    const quantityStr = editQuantities[itemId];
    const quantity = quantityStr.trim() === '' ? 0 : Number(quantityStr);  // Convert empty input to 0 or any default value

    if (!isNaN(quantity) && quantity >= 0) {
        updateCartItem(itemId, quantity);
        toggleItemUpdate(itemId);  // Toggle off the editing mode
    }
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


const validateFormFields = () => {
    const errors = {};


    const addressValidation = validateDeliveryAddress(orderData.deliveryAddress);
    // Handle different types of validation errors
    if (!addressValidation.isValid) {
      alert(`${addressValidation.error}`);
      //setError(addressValidation.error);
      setIsLoading(false);
      return;
    }

    if (!validateEmail(orderData.customerEmail)) { alert('Please enter a valid email address.'); return; }
    if (!validateCreditCardNumber(orderData.creditCardNumber)) { alert('Please enter a valid credit card number.'); return; }
    if (!validateCreditCardExpiration(orderData.ccExpirationDate)) { alert('Please enter a valid credit card expiration date.'); return; }
    if (!validateCVV(orderData.creditCardCVV)) { alert('Please enter a valid CVV.'); return; }
    if (!validateItemQuantities(cartItems)) { alert('Please ensure all item quantities are valid.'); return; }


    return errors;
}


  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    // Check the delivery address

    const formErrors = validateFormFields();
    if (Object.keys(formErrors).length > 0) {
        // Handle errors, e.g., show them to the user
        console.error(formErrors);
        return;
    }

    const subtotal = cartItems.reduce((acc, item) => acc + (item.quantity * item.unitCost), 0);

    // Check if subtotal meets the minimum required amount before shipping
    if (subtotal < minimumOrderAmount) {
      alert(`Minimum order amount of $${minimumOrderAmount} not met. Please add more items.`);
      return; // Stop further execution if minimum order amount not met
    }
    setIsLoading(true);
    const transformedOrder = transformOrderItems({
        ...orderData,
        totalCost: orderData.totalCost,
        promoApplied: promoDiscount > 0 || discountedShipping !== shippingCharge,
        originalShippingCharge: shippingCharge,
        discountedShipping: discountedShipping,
        originalTotalCost: orderData.totalCostPreDiscount
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

    const amountInCents = Math.round(orderData.totalCost * 100); // Convert totalCost to cents and round to the nearest integer
    console.log("99999")
    console.log(orderData)


    try {
      const response = await axios.post('/api/orders', {
        orderData, // Make sure to include updated totalCost here
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
        alert('Order submitted successfully!');
        setOrderData(initialOrderState);
        resetOrderState();
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
        <CustomerInfoForm
          orderData={orderData}
          handleChange={handleChange}
          handleDateChange={handleDateChange}
          isAdmin={user.role === 'admin'}
        />
      <div className="cart-summary">
        <h3>Cart Summary</h3>
          <CartTable
            cartItems={cartItems}
            inputQuantities={editQuantities}
            updatingItems={item => item.isUpdating}
            setInputQuantities={handleQuantityChange}
            confirmUpdate={confirmUpdate}
            toggleItemUpdate={toggleItemUpdate}
            removeFromCart={removeFromCart}
          />
        <div className="promo-code-container">
          <form onSubmit={handlePromoSubmit}>
            <input type="text"
            placeholder="Enter promo code"
            className="promo-code-input"
            value={promoCode} 
            onChange={(e) => setPromoCode(e.target.value)}
            />
            <button type="submit" className="add-button">Apply</button>
          </form>
          {promoError && <div className="promo-error-message">{promoError}</div>}
        </div>
          <CartSummaryDisplay
              shippingCharge={shippingCharge}
              discountedShipping={discountedShipping}
              orderData={{
                  totalCost: orderData.totalCost,
                  totalCostPreDiscount: orderData.totalCostPreDiscount
              }}
          />
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
