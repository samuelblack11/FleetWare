import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import './AllPages.css';
import { AuthContext } from '../App.js';
import { useNavigate } from 'react-router-dom';

const MyAccount = () => {
  const { user, login } = useContext(AuthContext); // Access the user and login from AuthContext
  const [originalUser, setOriginalUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatedUser, setUpdatedUser] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      setOriginalUser(user);
      setUpdatedUser({ ...user, password: '' }); // Clear the password field initially
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
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const changedFields = getChangedFields(originalUser, updatedUser);
    console.log("^^^^");
    console.log(changedFields);

    if (Object.keys(changedFields).length === 0) {
      alert('Please update at least one field.');
      return;
    }

    console.log(user._id);
    axios.put(`/api/users/${user._id}`, changedFields)
      .then(response => {
        alert('User updated successfully!');
        console.log("@@@@@@@");
        console.log(response.data);

        // Update each attribute in updatedUser based on the response
        const updatedUserData = { ...updatedUser };
        for (const key in response.data) {
          if (response.data.hasOwnProperty(key)) {
            updatedUserData[key] = response.data[key];
          }
        }

        login(updatedUserData); // Update context with new user data
        navigate('/'); // Navigate to the home page or another page if needed
        console.log("User After Update:", updatedUserData); // This will now reflect the updated user data
      })
      .catch(error => {
        console.error('There was an error updating the user data!', error);
      });
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
              <td><input type="text" name="creditCardInfo" id="creditCardInfo" value={updatedUser.creditCardInfo} onChange={handleChange} /></td>
            </tr>
            <tr>
              <td><label htmlFor="password">Password:</label></td>
              <td><input type="password" name="password" id="password" value={updatedUser.password} onChange={handleChange} /></td>
            </tr>
          </tbody>
        </table>
        <button className="add-button" type="submit">Update Profile</button>
      </form>
    </div>
  );
};

export default MyAccount;
