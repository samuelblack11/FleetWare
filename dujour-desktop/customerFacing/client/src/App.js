import React, { useState, useRef, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import './App.css';
import logo from './assets/logo128.png';
import OrderHistory from './pages/OrderHistory';
import Login from './pages/Login';
import LandingPage from './pages/LandingPage';
import BuildOrder from './pages/BuildOrder';
import PlaceOrder from './pages/PlaceOrder';
import AboutDujour from './pages/AboutDujour';
import MyAccount from './pages/MyAccount';
import OrderSummary from './pages/OrderSummary';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faShoppingCart } from '@fortawesome/free-solid-svg-icons';
import { CartProvider } from './context/CartContext'; // Import the CartProvider
import { CartContext } from './context/CartContext'; // Ensure this path is correct based on your file structure
import { useCart } from './context/CartContext';

export const AuthContext = createContext(null);

function useAuth() {
  return useContext(AuthContext);
}

function MenuBar() {
  const { cartItems, setCartItems, addToCart, removeFromCart } = useCart();
  const [cartItemCount, setCartItemCount] = useState(0);
  const [cartDropdownVisible, setCartDropdownVisible] = useState(false);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const cartDropdownRef = useRef(null);
  const dropdownRef = useRef(null);
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();

  // Effect to calculate the total number of items in the cart
  useEffect(() => {
    const itemCount = cartItems.reduce((total, item) => total + item.quantity, 0);
    setCartItemCount(itemCount);
  }, [cartItems]); // Update count when cartItems changes

  const toggleDropdown = () => {
    setDropdownVisible(!dropdownVisible);
  };

  const toggleCartDropdown = () => {
    setCartDropdownVisible(!cartDropdownVisible);
  };

  const handleClickOutside = (event) => {
    if (cartDropdownRef.current && !cartDropdownRef.current.contains(event.target)) {
      setCartDropdownVisible(false);
    }
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setDropdownVisible(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
   const handleLogout = () => {
    logout();
    navigate('/login');
  };

function MiniCartDropdown({ cartItems, setCartItems, navigate }) {


  function handleItemQuantityChange(index, quantity) {
    const newQuantity = parseInt(quantity, 10);
    const newCartItems = cartItems.map((item, idx) => {
        if (idx === index) {
            return { ...item, quantity: newQuantity };
        }
        return item;
    });
    setCartItems(newCartItems);
}


  const removeItemFromCart = (itemId) => {
    const updatedCartItems = cartItems.filter(item => item._id !== itemId); // Use _id if available
    setCartItems(updatedCartItems);
  };

    return (
      <div className="mini-cart-dropdown" ref={cartDropdownRef}>
        {cartItems.length > 0 ? (
          <div>
            <table className="mini-cart-table">
              <thead>
              <tr>
                <th>Item</th>
                <th>Quantity</th>
                <th>Cost</th>
                <th>Actions</th>
              </tr>
            </thead>
              <tbody>
                {cartItems.map((item, index) => (
                  <tr key={item._id || index}>
                    <td>{item.itemName}</td>
                    <td>
                      <input
                        type="number"
                        value={item.quantity}
                        min="1"
                        onChange={(e) => handleItemQuantityChange(index, e.target.value)}
                        className="mini-cart-quantity-input"
                      />
                    </td>
                    <td>${(item.quantity * item.unitCost).toFixed(2)}</td>
                    <td>
                      <button onClick={() => removeItemFromCart(item._id)} className="delete-btn">Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mini-cart-footer">
              <p>Order Total: ${cartItems.reduce((total, item) => total + item.quantity * item.unitCost, 0).toFixed(2)}</p>
              <button onClick={() => navigate('/place-order')} className="add-button">Checkout</button>
            </div>
          </div>
        ) : (
          <p>Your cart is empty.</p>
        )}
      </div>
    );
}

  return (
    <div className="menu">
      <div className="left-buttons">
        <button>
          <Link to="/build-order">Shop</Link>
        </button>
        <button>
          <Link to="/">Dujour</Link>
        </button>
        <button>
          <Link to="/about-dujour">About</Link>
        </button>
      </div>
      <div className="right-buttons">

        <div className="dropdown-container" ref={dropdownRef}>
          <button onClick={toggleDropdown}>
            <FontAwesomeIcon icon={faUser} /> 
          </button>
          {dropdownVisible && (
            <div className="dropdown-menu">
            <button>
              <Link to="/my-account">Account Details</Link>
            </button>
            <button>
              <Link to="/order-history">Order History</Link>
            </button >
              <button onClick={handleLogout} style={{ 
                  color: 'white', 
                  display: 'block', 
                  marginLeft: 'auto', 
                  marginRight: 'auto', 
                  width: 'fit-content'
                }}
              >Logout</button>
            </div>
          )}
        </div>
        <div className="dropdown-container">
          <button onClick={toggleCartDropdown}>
            <FontAwesomeIcon icon={faShoppingCart} />
            {cartItemCount > 0 && <span className="cart-item-count">{cartItemCount}</span>}
          </button>
            {cartDropdownVisible && (
              <MiniCartDropdown 
                cartItems={cartItems}
                setCartItems={setCartItems}
                navigate={navigate}
              />
            )}
        </div>
      </div>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null); // Store user role and authentication status
  const [backgroundClass, setBackgroundClass] = useState('');

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  useEffect(() => {
    // Check local storage for user info on initial load
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (storedUser) {
      setUser(storedUser);
    }
  }, []);

  // Component to listen to location changes
  const LocationListener = () => {
    const location = useLocation();
    useEffect(() => {
      setBackgroundClass(location.pathname === '/' ? '' : 'route-background');
    }, [location]);

    return null;
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      <Router>
        <CartProvider>
        <LocationListener />
        <div className={`App ${backgroundClass}`}>
          <div className="header-container">
          <div className="upper-app-header">
            <div className="header-logo">
              <Link to="/">
                <img src={logo} className="logo" alt="Dujour Logo" />
              </Link>
              <div className="american-flag">
                🇺🇸
              </div>
            </div>
            </div>
            <div className="header-content">
              {user && <MenuBar />}
            </div>
          </div>
          <Routes>
            {user ? (
              <>
                <Route path="/" element={<LandingPage />} /> {/* Default route for authenticated users */}
                <Route path="/landing-page" element={<LandingPage />} />
                <Route path="/build-order" element={<BuildOrder />} />
                <Route path="/place-order" element={<PlaceOrder />} />
                <Route path="/order-history" element={<OrderHistory />} />
                <Route path="/about-dujour" element={<AboutDujour />} />
                <Route path="/my-account" element={<MyAccount />} />
                <Route path="/order-summary" element={<OrderSummary />} />
              </>
            ) : (
              <>
                <Route path="/" element={<Login />} />
                <Route path="*" element={<Navigate to="/" />} />
              </>
            )}
          </Routes>
        </div>
      </CartProvider>
      </Router>
    </AuthContext.Provider>
  );
}

export default App;
