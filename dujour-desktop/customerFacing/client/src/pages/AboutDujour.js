import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { GenericTable, DetailedOrderPopup } from './ReusableReactComponents';
import './AllPages.css';
import { AuthContext } from '../App.js';


// Define a functional component
const AboutDujour = () => {
  return (
    <div className="about-dujour">
      <p>
        Dujour is a last mile delivery service that connects regional farms with consumers.
        Operating from the Old Town Farmer's Market, Dujour bundles produce, meat, dairy,
        and baked goods from the market’s vendors to deliver the freshest products available
        in Northern Virginia. Dujour and its partners are dedicated to building a healthier
        community by connecting it to nearby food sources and steering it away from the ultra-processed
        foods that dominate our grocery stores. We achieve this through logistical excellence,
        technological innovation, and a commitment to partnering with American farmers.
        Over 200 years ago, George Washington sent his produce to this market.
        Today, Dujour aims to build on this legacy by making regional food more accessible than
        ever before. Join us in this mission by placing your order today.
      </p>
      <br />
    </div>
  );


return (
  AboutDujour
);
};

export default AboutDujour;