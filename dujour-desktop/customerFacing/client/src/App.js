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
export const AuthContext = createContext(null);

function useAuth() {
  return useContext(AuthContext);
}

function MenuBar() {
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const dropdownRef = useRef(null);
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const toggleDropdown = () => {
    setDropdownVisible(!dropdownVisible);
  };

  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setDropdownVisible(false);
    }
  };

   const handleLogout = () => {
    logout();
    navigate('/login');
  };


  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
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
            My Account
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

        <button>
          <Link to="/cart">Cart</Link>
        </button>
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
      </Router>
    </AuthContext.Provider>
  );
}

export default App;
