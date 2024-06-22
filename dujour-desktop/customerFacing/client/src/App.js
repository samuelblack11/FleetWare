import React, { useState, useRef, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import './App.css';
import logo from './assets/logo128.png';
import OrderHistory from './pages/OrderHistory';
import Login from './pages/Login';
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
  return (
    <div className="menu-bar">
      <AboutDujourButton />
      <OrderHistoryButton />
      <SettingsButton />
    </div>
  );
}

const AboutDujourButton = () => {
  return (
    <button className="add-button">
      <Link 
        to="/about-dujour" 
        style={{ 
          color: 'white', 
          textDecoration: 'none' 
        }}
      >
        About Dujour
      </Link>
    </button>
  );
};

const OrderHistoryButton = () => {
  return (
    <button className="add-button">
      <Link 
        to="/order-history" 
        style={{ 
          color: 'white', 
          textDecoration: 'none' 
        }}
      >
        Order History
      </Link>
    </button>
  );
};

function SettingsButton() {
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext); // Use the context to access logout method
  const dropdownRef = useRef(null);

  const toggleDropdown = () => setShowDropdown(!showDropdown);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setShowDropdown(false); // Close dropdown after navigation
  };

  const handleAccountNavigation = () => {
    navigate('/my-account');
    setShowDropdown(false); // Close dropdown after navigation
  };

  // Use an effect to add an event listener to the dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownRef]);

  return (
    <div className="settings-button-container" ref={dropdownRef}>
      <button onClick={toggleDropdown} className="add-button">
        Settings
      </button>
      {showDropdown && (
        <div className="dropdown-menu">
          <button onClick={handleAccountNavigation} className="add-button">My Account</button>
          <button onClick={handleLogout} className="add-button">Logout</button>
        </div>
      )}
    </div>
  );
}


function LogoutButton() {
  const navigate = useNavigate(); // Now it's called within the context of <Router>
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <button onClick={handleLogout} className="logout-button">
      Logout
    </button>
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
            <div className="header-logo">
              <Link to="/">
                <img src={logo} className="logo" alt="Dujour Logo" />
              </Link>
            </div>
            <div className="header-content">
              <h2 className="header-title">Dujour: A Farm to Consumer Concept</h2>
              {user && <MenuBar />}
            </div>
          </div>
          <Routes>
            {user ? (
              <>
                <Route path="/" element={<BuildOrder />} /> {/* Default route for authenticated users */}
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
