import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, useLocation} from 'react-router-dom';
import './App.css';
import logo from './assets/logo128.png';
import OperationsOverview from './pages/OperationsOverview';
import AnalyticsReporting from './pages/AnalyticsReporting';
import MenuManagement from './pages/MenuManagement';
import BuildOrder from './pages/BuildOrder';
import OrderManagement from './pages/OrderManagement';
import RouteOptimization from './pages/RouteOptimization';
import DriverManagement from './pages/DriverManagement';
import SettingsSupport from './pages/SettingsSupport';

//<Link to="/operations-overview"><button className="dashboard-button">Operations Overview</button></Link>
//<Link to="/analytics-reporting"><button className="dashboard-button">Analytics & Reporting</button></Link>
//<Link to="/settings-support"><button className="dashboard-button">Settings & Support</button></Link>

function ButtonGrid() {
  return (
    <div className="container">
      <div className="button-grid">
        <Link to="/menu-management"><button className="dashboard-button">Menu Management</button></Link>
        <Link to="/build-order"><button className="dashboard-button">Build Order</button></Link>
        <Link to="/order-management"><button className="dashboard-button">Order Management</button></Link>
        <Link to="/route-optimization"><button className="dashboard-button">Route Optimization</button></Link>
        <Link to="/driver-management"><button className="dashboard-button">Driver Management</button></Link>
      </div>
    </div>
  );
}

function App() {
  const [backgroundClass, setBackgroundClass] = useState('');

  // Component to listen to location changes
  const LocationListener = () => {
    const location = useLocation();
    useEffect(() => {
      // Update background class based on the path
      setBackgroundClass(location.pathname === '/' ? '' : 'route-background');
    }, [location]);

    return null; // This component doesn't render anything
  };

  return (
    <Router>
      <LocationListener /> {/* This component listens to location changes */}
      {/* Add the dynamic class along with the 'App' class */}
      <div className={`App ${backgroundClass}`}>
        <div className="header-container">
        <Link to="/">
          <img src={logo} className="logo" alt="Dujour Logo" />
        </Link>

        <h2 class = "header-title">Dujour: A Farm to Consumer Concept</h2>

        </div>
        <Routes>
          {/* This disable-next-line command prevents the escape character from creating distracting color coding*/}
          // eslint-disable-next-line
          <Route path="/" element={<ButtonGrid />} />
          <Route path="/operations-overview" element={<OperationsOverview />} />
          <Route path="/analytics-reporting" element={<AnalyticsReporting />} />
          <Route path="/menu-management" element={<MenuManagement />} />
          <Route path="/build-order" element={<BuildOrder />} />
          <Route path="/order-management" element={<OrderManagement />} />
          <Route path="/route-optimization" element={<RouteOptimization />} />
          <Route path="/driver-management" element={<DriverManagement />} />
          <Route path="/settings-support" element={<SettingsSupport />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;