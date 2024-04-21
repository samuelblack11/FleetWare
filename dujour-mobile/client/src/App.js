import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import './App.css';
import logo from './assets/logo128.png';
import Login from './pages/Login';
import TodayRoute from './pages/TodayRoute';
import RouteHistory from './pages/RouteHistory';
import Performance from './pages/Performance';
import Settings from './pages/Settings';

export const AuthContext = createContext(null);


function useAuth() {
  return useContext(AuthContext);
}

function ButtonGrid() {
  const { user } = useAuth();
  // Render buttons based on user role
  return (
    <div className="container">
      <div className="button-grid">
        <Link to="/today-route"><button className="dashboard-button">Today's Route</button></Link>
        <Link to="/route-history"><button className="dashboard-button">Route History</button></Link>
        <Link to="/performance"><button className="dashboard-button">Performance</button></Link>
        <Link to="/settings"><button className="dashboard-button">Settings & Support</button></Link>
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
          <div className="header-content">
            <Link to="/">
              <img src={logo} className="logo" alt="Dujour Logo" />
            </Link>
            <h2 className="header-title">Dujour: A Farm to Consumer Concept</h2>
          </div>
          {user && <SettingsButton />} {/* Positioned to the right */}
        </div>
          <Routes>
            {user ? (
              <>
                <Route path="/" element={<ButtonGrid />} />
                {user.role === 'admin' && (
                  <>
                  </>
                )}
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
