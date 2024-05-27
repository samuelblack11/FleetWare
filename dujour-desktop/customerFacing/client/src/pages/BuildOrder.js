import React, { useState, useEffect, useContext} from 'react';
import axios from 'axios';
import './AllPages.css';
import { AuthContext } from '../App.js';
import { fetchUserByEmail, submitFinalOrder, incrementUserOrderNumber } from './helperFiles/placeOrder';
import { validateEmail, validateDeliveryAddress, validateDeliveryDate, validateCreditCardNumber, validateCreditCardExpiration, validateCVV, validateItemQuantities } from './helperFiles/orderValidation';
import { GenericPopup } from './ReusableReactComponents'; // Import your GenericPopup component
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShoppingCart } from '@fortawesome/free-solid-svg-icons';
import { useLocation, useNavigate } from 'react-router-dom';

const BuildOrder = () => {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const { cartItems: initialCartItems, totalCost: initialTotalCost } = location.state || { cartItems: [], totalCost: 0 };

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
  const [cartItems, setCartItems] = useState(initialCartItems); // Items added to the cart
  const [totalCost, setTotalCost] = useState(0);
  const [popupVisible, setPopupVisible] = useState(false);
  const [selectedItemDetails, setSelectedItemDetails] = useState(null);
  const [cartDropdownVisible, setCartDropdownVisible] = useState(false);
  const [filterField, setFilterField] = useState('');
  const [filterValue, setFilterValue] = useState('');
  const navigate = useNavigate();
  const handleConfirmOrder = () => {
    navigate('/place-order', { state: { cartItems, totalCost } });
  };
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

    useEffect(() => {
    const calculateTotalCost = () => {
      const total = cartItems.reduce((acc, item) => acc + (item.quantity * item.unitCost), 0);
      setTotalCost(total);
    };
    calculateTotalCost();
  }, [cartItems]);


  const filteredItems = availableItems.filter(item => {
  if (!filterField || !filterValue) {
    return true; // No filtering if filterField or filterValue is empty
  }

  if (filterField === 'item.itemName') {
    return item.itemName.toLowerCase().includes(filterValue.toLowerCase());
  }

  if (filterField === 'item.farm.name') {
    return item.farm.name.toLowerCase().includes(filterValue.toLowerCase());
  }

  return true;
});

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
  const updatedCartItems = cartItems.filter(item => item._id !== itemId); // Use _id if available
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

const displayItemDetails = (itemToAdd) => {
  const stockItem = availableItems.find(item => item._id === itemToAdd._id);

  if (!stockItem) {
    alert('Item not found.');
    return;
  }

  setSelectedItemDetails(stockItem);
  setPopupVisible(true);
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

// Inside BuildOrder component, define CartSidebar
const CartSidebar = ({ cartItems, totalCost, removeItemFromCart, handleConfirmOrder, handleItemQuantityChange, toggleUpdateItem }) => {
  return (
    <div className="cart-sidebar">
      <h2>Cart</h2>
      <div className="table-container">
        <table className="table-align">
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
              <tr key={item.id || index}>
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
                  <button className="add-button" onClick={() => toggleUpdateItem(index)}>
                    {item.isUpdating ? "Confirm" : "Update"}
                  </button>
                  <button className="delete-btn" onClick={() => removeItemFromCart(item._id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="total-cost">Total Cost: ${totalCost.toFixed(2)}</p>
      <button onClick={handleConfirmOrder} className="add-button">Confirm Order</button>
    </div>
  );
};

useEffect(() => {
  const adjustCartSidebar = () => {
    const buildCartSection = document.querySelector('.build-cart-section');
    const cartSidebar = document.querySelector('.cart-sidebar');
    if (buildCartSection && cartSidebar) {
      const buildCartRect = buildCartSection.getBoundingClientRect();
      cartSidebar.style.top = `${buildCartRect.top}px`;
      cartSidebar.style.height = `${buildCartRect.height}px`;
      buildCartSection.style.marginRight = `${cartSidebar.offsetWidth}px`; // Adjust margin-right to avoid overlap
    }
  };

  if (cartItems.length > 0) {
    adjustCartSidebar();
    window.addEventListener('resize', adjustCartSidebar);
  } else {
    const buildCartSection = document.querySelector('.build-cart-section');
    if (buildCartSection) {
      buildCartSection.style.marginRight = '0';
    }
    window.removeEventListener('resize', adjustCartSidebar);
  }

  return () => window.removeEventListener('resize', adjustCartSidebar);
}, [cartItems]);

return (
  <div className="build-order-container">
    {cartItems.length > 0 && (
      <CartSidebar 
        cartItems={cartItems} 
        totalCost={totalCost} 
        removeItemFromCart={removeItemFromCart} 
        handleConfirmOrder={handleConfirmOrder} 
        handleItemQuantityChange={handleItemQuantityChange}
        toggleUpdateItem={toggleUpdateItem}
      />
    )}
    <div className="build-cart-section">
      <h2>Build Your Cart</h2>
      <div>
        <select value={filterField} onChange={(e) => setFilterField(e.target.value)}>
          <option value="">Select a field to filter by</option>
          <option value="item.itemName">Item Name</option>
          <option value="item.farm.name">Farm</option>
        </select>
        <input
          type="text"
          placeholder="Filter value"
          value={filterValue}
          onChange={(e) => setFilterValue(e.target.value)}
        />
      </div>
      <table>
        <thead>
          <tr>
            <th>Item Name</th>
            <th>Farm</th>
            <th>Unit Cost</th>
            <th>Quantity</th>
            <th>Line Item Cost</th>
            <th>Farm Details</th>
            <th>Add to Cart</th>
          </tr>
        </thead>
        <tbody>
          {filteredItems.map((item, index) => (
            <tr key={index}>
              <td>{item.itemName}</td>
              <td>{item.farm.name}</td>
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
              <td><button onClick={() => displayItemDetails(item)} className="add-button">Details</button></td>
              <td>
                <button onClick={() => handleAddToCart(item)} className="add-button">Add to Cart</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <GenericPopup show={popupVisible} onClose={() => setPopupVisible(false)}>
      {selectedItemDetails && (
        <div>
          <h2>{selectedItemDetails.farm.name}</h2>
          <p>{selectedItemDetails.farm.description}</p>
        </div>
      )}
    </GenericPopup>
  </div>
);
};

export default BuildOrder;