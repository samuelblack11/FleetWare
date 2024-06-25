import React, { useState } from 'react';
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
          <h1>A Farm to Consumer Service</h1>
          <h2>Get Back to Your Roots</h2>
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
        <div className="value-box">
        <div className="value-title">
          Logistical Excellence
        </div>
        <div className="value-desc">
          Our last mile delivery service utilizes advanced technology and a dedicated mobile app
          to seamlessly coordinate the pickup of products from multiple farmers at the market,
          ensuring orders are accurately sorted and promptly delivered.
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
          Have a question? Fill out our contact form and someone from oru team will be in touch within 48 hours.
        </div>
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
