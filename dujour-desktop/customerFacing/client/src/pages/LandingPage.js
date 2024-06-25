import React from 'react';
import './AllPages.css';
import marketImage from '../assets/marketImage.png';
import {  Link } from 'react-router-dom';

function LandingPage() {
  return (
    <div className="landing-page">
      <div className="hero">
        <img src={marketImage} alt="Farm to Consumer" />
        <div className="overlay-text">
          <h1>A Farm to Consumer Service</h1>
          <button className="add-button">
            <Link to="/build-order">Shop Now</Link>
          </button>
        </div>
      </div>
      <div className="mission-statement">
        <p className="about-dujour">Through logistical excellence, technological innovation, and partnerships with American farmers,
           Dujour delivers the freshest, regionally grown food directly to your doorstep.
        </p>
      </div>
      <div className="values">
        <div className="value-box">
        <div className="about-dujour">
          Eat Local, Eat Clean

        </div>
        <div className="value-desc">
          ""

        </div>
        </div>
        <div className="value-box">
        <div className="about-dujour">
          Support Local Farmers

        </div>
        <div className="value-desc">
          ""

        </div>
        </div>
        <div className="value-box">
        <div className="about-dujour">
          Logistical Excellence

        </div>
        <div className="value-desc">
          ""

        </div>
        </div>



      </div>
      <div className="contact-form">
        <form>
          <input type="text" placeholder="Name" />
          <input type="email" placeholder="Email" />
          <textarea placeholder="Message"></textarea>
          <button type="submit">Send</button>
        </form>
      </div>
    </div>
  );
}


export default LandingPage;
