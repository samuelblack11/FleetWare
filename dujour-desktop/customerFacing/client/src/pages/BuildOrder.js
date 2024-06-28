import React, { useState, useEffect, useContext, useLayoutEffect} from 'react';
import axios from 'axios';
import './AllPages.css';
import { AuthContext } from '../App.js';
import { fetchUserByEmail, submitFinalOrder, incrementUserOrderNumber } from './helperFiles/placeOrder';
import { validateEmail, validateDeliveryAddress, validateDeliveryDate, validateCreditCardNumber, validateCreditCardExpiration, validateCVV, validateItemQuantities } from './helperFiles/orderValidation';
import { GenericPopup, FarmInfoModal } from './ReusableReactComponents'; // Import your GenericPopup component
import { useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import CartTable from './components/CartTable'; // make sure the path is correct
import CartSidebar from './components/CartSidebar'; // make sure the path is correct
import useAdjustTableContainerMargin from './components/useAdjustTableContainerMargin'; // Adjust the path as necessary

const BuildOrder = () => {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const { cartItems, setCartItems, updateCartItem, toggleItemUpdate, addToCart, removeFromCart, totalCost } = useCart();
  const initialOrderState = {customerEmail: '',deliveryAddress: '',deliveryDate: '',creditCardNumber: '',creditCardExpiration: '',creditCardCVV: '',};
  const [orderData, setOrderData] = useState(initialOrderState);
  const [availableItems, setAvailableItems] = useState([]); // Items fetched from the server
  const [popupVisible, setPopupVisible] = useState(false);
  const [selectedItemDetails, setSelectedItemDetails] = useState(null);
  const [cartDropdownVisible, setCartDropdownVisible] = useState(false);
  const [filterField, setFilterField] = useState('');
  const [filterValue, setFilterValue] = useState('');
  const [showFarmInfo, setShowFarmInfo] = useState(false);
  const [selectedFarm, setSelectedFarm] = useState(null); 
  const [imageSources, setImageSources] = useState({}); // State to store image paths
  const minimumOrderAmount = 30; // Minimum order amount before shipping
  const [error, setError] = useState('');
  useAdjustTableContainerMargin(cartItems);

  const getNextRelevantSaturday = () => {
    const date = new Date();
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 5 || dayOfWeek === 6) {  // If it's Friday or Saturday
        // Return next week's Saturday
        return new Date(date.getFullYear(), date.getMonth(), date.getDate() + (13 - dayOfWeek)).toISOString().split('T')[0];
    } else {
        // Return this week's Saturday
        return new Date(date.getFullYear(), date.getMonth(), date.getDate() + (6 - dayOfWeek)).toISOString().split('T')[0];
    }
};



  // When you need to show the modal
  const handleShowFarmInfo = (farm) => {
    setSelectedFarm(farm);
    setShowFarmInfo(true);
  };


  // When you need to close the modal
  const handleCloseFarmInfo = () => {
    setShowFarmInfo(false);
    setSelectedFarm(null);
  };

  const navigate = useNavigate();

  const handleConfirmOrder = () => {
    if (cartItems.reduce((total, item) => total + item.unitCost * item.quantity, 0) < minimumOrderAmount) {
      setError(`Minimum order amount of $${minimumOrderAmount} not reached.`);
      return;
    }
    navigate('/place-order'); // Navigate with necessary data if needed
  };
const fetchAvailableItems = async () => {
    try {
        const response = await axios.get('/api/items');
        const relevantSaturday = getNextRelevantSaturday(); // Determine the relevant Saturday

        const filteredItems = response.data
            .filter(item =>
                item.activeStatus === true &&  // Only include items that are active
                item.forDeliveryOn.split('T')[0] === relevantSaturday // And scheduled for the relevant Saturday
            )
            .map(item => ({
                ...item,
                quantity: 0,
                unitCost: item.unitCost || 0,
            }));
            console.log(filteredItems)

        setAvailableItems(filteredItems); // Set the filtered and enhanced items
        fetchImages(filteredItems); // Fetch images for the filtered items
    } catch (error) {
        console.error("Error fetching items:", error);
    }
};

const fetchImages = async (items) => {
    const newImageSources = {};
    for (const item of items) {
        const imageName = item.itemName.replace('/', '-').toLowerCase(); // Clean item name for safe file paths
        const farmFolderName = item.farm.name.replace(/\s+/g, '-').toLowerCase(); // Convert farm name to a folder-friendly format
        try {
            // Dynamically import the image from the path based on the farm name and item name
            const imagePath = await import(`../assets/farms/${farmFolderName}/${imageName}.png`);
            newImageSources[item.itemName] = imagePath.default;
        } catch (e) {
            console.log(`Failed to load image for ${item.itemName}:`, e);
            newImageSources[item.itemName] = 'fallback-image-path.png'; // Provide a fallback image path if loading fails
        }
    }
    setImageSources(newImageSources);
};

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
    fetchAvailableItems();
  }, []);

  // Inside BuildOrder component
  useEffect(() => {
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

const removeItemFromCart = (itemId) => {
  removeFromCart(itemId);
};

  const handleUpdateQuantity = (itemId, quantity) => {
    updateCartItem(itemId, quantity);
  };

  const handleAddToCart = (item) => {
    addToCart(item);
  };

const handleQuantityChange = (index, quantity) => {
  const newItems = [...availableItems];
  newItems[index] = { ...newItems[index], quantity: Number(quantity) };
  setAvailableItems(newItems);
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

return (
  <div className="build-order-container">
    <div className="slider-container" style={{ margin: "5px 0" }}>
    </div>
    <div className="content-container">
      <div className="build-cart-section">
        <h2>Build Your Cart</h2>
        <h3>For Delivery On {getNextRelevantSaturday(new Date())}</h3>
        <div className="filter-form">
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
        <div className="card-container" style={{ gridTemplateColumns: cartItems.length > 0 ? 'repeat(3, 1fr)' : 'repeat(4, 1fr)' }}>
          {filteredItems.map((item, index) => (
            <div className="item-card" key={index}>
              <img 
                src={imageSources[item.itemName]} 
                alt={item.itemName} 
                className="item-image"
              />
              <div className="item-details">
                <h4>{item.itemName}</h4>
                <p>{item.farm.name}</p>
                <p>${item.unitCost.toFixed(2)}</p>
                <div>
                  <input
                    className="input-quantity"
                    type="number"
                    min="0"
                    value={item.quantity || ''}
                    onChange={(e) => handleQuantityChange(index, e.target.value)}
                  />
                  <p>${(item.quantity * item.unitCost).toFixed(2)}</p>
                </div>
                <button onClick={() => handleAddToCart(item)} className="add-button">Add to Cart</button>
                <button onClick={() => displayItemDetails(item)} className="add-button">Farm Details</button>
              </div>
            </div>
          ))}
        </div>
      </div>
      {cartItems.length > 0 && (
        // In BuildOrder component rendering:
        <CartSidebar />
      )}
    </div>
    <GenericPopup show={popupVisible} onClose={() => setPopupVisible(false)}>
      {selectedItemDetails && (
        <div>
          <h2>{selectedItemDetails.farm.name}</h2>
          <p>{selectedItemDetails.farm.description}</p>
        </div>
      )}
    </GenericPopup>
    <FarmInfoModal show={showFarmInfo} farm={selectedFarm} onClose={handleCloseFarmInfo} />
  </div>
);
};

export default BuildOrder;