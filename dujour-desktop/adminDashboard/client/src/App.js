import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import './App.css';
import logo from './assets/logo128.png';
import MenuManagement from './pages/MenuManagement';
import OrderManagement from './pages/OrderManagement';
import RouteOptimization from './pages/RouteOptimization';
import DriverManagement from './pages/DriverManagement';
import Login from './pages/Login';
import BuildOrder from './pages/BuildOrder';
import PlaceOrder from './pages/PlaceOrder';
import OrderSummary from './pages/OrderSummary';
import OrderPicking from './pages/OrderPicking';
import OperationalOverview from './pages/OperationalOverview';


export const AuthContext = createContext(null);

function useAuth() {
  return useContext(AuthContext);
}

function MenuBar() {
  return (
    <div className="menu-bar">
      <SettingsButton />
    </div>
  );
}

function ButtonGrid() {
  const { user } = useAuth();
  // Render buttons based on user role
  return (
    <div className="container">
      <div className="button-grid">
        <Link to="/build-order"><button className="dashboard-button">Build Order</button></Link>
        {user.role === 'admin' && (
          <>
            <Link to="/menu-management"><button className="dashboard-button">Menu Management</button></Link>
            <Link to="/order-management"><button className="dashboard-button">Order Management</button></Link>
            <Link to="/order-picking"><button className="dashboard-button">Order Picking</button></Link>
            <Link to="/route-optimization"><button className="dashboard-button">Route Optimization & Driver Assignment</button></Link>
            <Link to="/operational-overview"><button className="dashboard-button">Operational Overview</button></Link>
          </>
        )}
      </div>
    </div>
  );
}

function SettingsButton() {
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);

  const toggleDropdown = () => setShowDropdown(!showDropdown);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="settings-button-container">
      <button onClick={toggleDropdown} className="settings-button">
        Settings
      </button>
      {showDropdown && (
        <div className="dropdown-menu">
          <Link to="/my-account" className="dropdown-item">My Account</Link>
          <button onClick={handleLogout} className="dropdown-item">Logout</button>
        </div>
      )}
    </div>
  );
}

function LogoutButton() {
  const navigate = useNavigate(); // Now it's called within the context of <Router>
  const { logout } = useContext(AuthContext);

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

    const handleLogout = () => {
    logout(); // Call the logout function from your AuthContext
    navigate('/'); // Redirect to login page
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
                <Route path="/" element={<ButtonGrid />} />
                {user.role === 'admin' && (
                  <>
                    <Route path="/menu-management" element={<MenuManagement />} />
                    <Route path="/order-management" element={<OrderManagement mode="allOrders" />} />
                    <Route path="/order-picking" element={<OrderPicking />} />
                    <Route path="/route-optimization" element={<RouteOptimization />} />
                    <Route path="/driver-management" element={<DriverManagement />} />
                    <Route path="/operational-overview" element={<OperationalOverview />} />
                  </>
                )}
                <Route path="/build-order" element={<BuildOrder />} />
                <Route path="/place-order" element={<PlaceOrder />} />
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
