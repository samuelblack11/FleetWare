import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import './App.css';
import logo from './assets/logo128.png';
import Login from './pages/Login';
import RouteView from './pages/RouteView';
import PickView from './pages/PickView';

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
  const today = new Date();
  const formattedDate = `${('0' + (today.getMonth() + 1)).slice(-2)}/${('0' + today.getDate()).slice(-2)}/${today.getFullYear()}`;
  return (
    <div className="container">
      <div className="button-grid">
        <h2>Welcome</h2>
        <h3>Choose Your Work Mode for {formattedDate}</h3>
        <Link to="/pick-view"><button className="dashboard-button">Pick</button></Link>
        <Link to="/route-view"><button className="dashboard-button">Deliver</button></Link>
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
          {user && <MenuBar />} {/* Positioned to the right */}
        </div>
          <Routes>
            {user ? (
              <>
                <Route path="/" element={<ButtonGrid />} />
                <Route path="/route-view" element={<RouteView />} />
                <Route path="/pick-view" element={<PickView />} />
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
