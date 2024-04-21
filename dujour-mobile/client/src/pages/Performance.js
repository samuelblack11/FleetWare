import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import './AllPages.css';
import { AuthContext } from '../App.js';

// Assuming 'Performance' should be the name of the component
function Performance() {
  // You can use state, context, and effects here if needed
  const authContext = useContext(AuthContext);

  return (
    <div className="build-order-container">
    </div>
  );
}

export default Performance;
