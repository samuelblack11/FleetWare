import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import './AllPages.css';
import { AuthContext } from '../App.js';
import { useNavigate } from 'react-router-dom';

const MyAccount = () => {
  const { user, login } = useContext(AuthContext); // Access the user and login from AuthContext
  const [maskedCreditCard, setMaskedCreditCard] = useState('');
  const [maskedPassword, setMaskedPassword] = useState('');
  const [originalUser, setOriginalUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatedUser, setUpdatedUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      setMaskedCreditCard(maskCreditCard(user.creditCardInfo || ''));
      setMaskedPassword(maskPassword(user.password || ''));
      setOriginalUser(user); // Store the original user data
      setUpdatedUser(user); // Initialize the updated user data
      setLoading(false);
    }
  }, [user]);

  const getChangedFields = (original, updated) => {
    const changedFields = {};
    for (const key in updated) {
      if (updated[key] !== original[key]) {
        changedFields[key] = updated[key];
      }
    }
    return changedFields;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setUpdatedUser({
      ...updatedUser,
      [name]: type === 'checkbox' ? checked : value,
    });

    if (name === 'creditCardInfo') {
      setMaskedCreditCard(maskCreditCard(value));
    } else if (name === 'password') {
      setMaskedPassword(maskPassword(value));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const changedFields = getChangedFields(originalUser, updatedUser);
    if (Object.keys(changedFields).length === 0) {
      alert('Please update at least one field.');
      return;
    }
    axios.put(`/api/users/${user._id}`, changedFields)
      .then(response => {
        alert('User updated successfully!');
        login(response.data); // Update context with new user data
        navigate('/'); // Navigate to the home page or another page if needed
      })
      .catch(error => {
        console.error('There was an error updating the user data!', error);
      });
  };


  // Mask all but the last 4 digits of the credit card number
  const maskCreditCard = (number) => {
    if (!number) return '';
    return number.slice(0, -4).replace(/./g, '*') + number.slice(-4);
  };

  // Mask the password with asterisks
  const maskPassword = (password) => {
    if (!password) return '';
    return password.replace(/./g, '*');
  };

  if (loading) {
    return <div>Loading...</div>; // Display loading message while fetching data
  }

  if (!user) {
    return <div>No user data available</div>; // Handle case when user data is not available
  }

  return (
    <div>
      <h1>User Profile</h1>
      <form onSubmit={handleSubmit}>
        <table className="customer-info-table">
          <tbody>
            <tr>
              <td><label htmlFor="email">Customer Email:</label></td>
              <td><input type="email" name="email" id="email" value={updatedUser.email} onChange={handleChange} /></td>
            </tr>
            <tr>
              <td><label htmlFor="deliveryAddress">Delivery Address:</label></td>
              <td><input type="text" name="deliveryAddress" id="deliveryAddress" value={updatedUser.deliveryAddress} onChange={handleChange} /></td>
            </tr>
            <tr>
              <td><label htmlFor="creditCardInfo">Credit Card Number:</label></td>
              <td><input type="text" name="creditCardInfo" id="creditCardInfo" value={maskedCreditCard} onChange={handleChange} /></td>
            </tr>
            <tr>
              <td><label htmlFor="password">Password:</label></td>
              <td><input type="text" name="password" id="password" value={maskedPassword} onChange={handleChange} /></td>
            </tr>
          </tbody>
        </table>
        <button className="add-button" type="submit">Update Profile</button>
      </form>
    </div>
  );
};

export default MyAccount;