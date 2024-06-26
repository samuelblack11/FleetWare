import React, { useState } from 'react';
import axios from 'axios';
import './AllPages.css';
import marketImage from '../assets/marketImage.png';
import marketImage2 from '../assets/marketImage2.png';
import {  Link } from 'react-router-dom';

function LandingPage() {
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    message: ''
  });

  const handleChange = (e) => {
    setFormState({ ...formState, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/users/send-email', formState);
      console.log(response.data.message);
      alert('Email sent successfully!');
    } catch (error) {
      console.error('Failed to send email', error);
      alert('Failed to send email.');
    }
  };
  return (
    <div className="landing-page">
      <div className="hero">
        <img className = "landingPageImage" src={marketImage} alt="Farm to Consumer" />
        <div className="overlay-text">
          <h1>Get Back to Your Roots</h1>
          <button className="shop-now-button">
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
        <div className="value-title">
          Farm to Consumer
        </div>
        <div className="value-desc">
          Logistical excellence is the backbone of our last mile delivery service. We utilize
          advanced technology and a dedicated mobile app to seamlessly coordinate product pickup,
          order sortation, and delivery without a storefront intermediary.
        </div>
        </div>
        <div className="value-box">
        <div className="value-title">
          Eat Local, Eat Clean
        </div>
        <div className="value-desc">
          We believe in the power of local, sustainable agriculture to nourish our bodies and our communities.
          By sourcing fresh, regionally grown produce, we ensure that our customers receive the highest quality foods, 
          free from harmful chemicals and excessive processing.
        </div>
        </div>
        <div className="value-box">
        <div className="value-title">
          Support Regional Farmers
        </div>
        <div className="value-desc">
          We are committed to strengthening our communities by building partnerships with regional farmers.
          By choosing to support regional agriculture, we help farmers expand their reach to consumers,
          enabling them to continue cultivating the fresh, high-quality produce we all rely on.
          This support boosts local economies and preserves the rich agricultural heritage of our regions.
        </div>
        </div>
      </div>
      <div className="hero">
        <img className = "landingPageImage" src={marketImage2} alt="Farm to Consumer" />
        <div className="overlay-text">
          <h1>Begin buying directly from farmers in your area today</h1>
        </div>
      </div>
     <div className="contact-form">
        <div className="value-title">
          Contact Us
        </div>
        <div className="value-desc">
          Have a question? Fill out our contact form and someone from our team will be in touch within 48 hours.
        </div>
        <form onSubmit={handleSubmit}>
          <input 
            type="text" 
            placeholder="Name" 
            name="name"
            value={formState.name} 
            onChange={handleChange} 
          />
          <input 
            type="email" 
            placeholder="Email" 
            name="email" 
            value={formState.email} 
            onChange={handleChange} 
          />
          <textarea 
            placeholder="Message" 
            name="message" 
            value={formState.message} 
            onChange={handleChange} 
          ></textarea>
          <button type="submit">Send</button>
        </form>
      </div>
    </div>
  );
}


export default LandingPage;
