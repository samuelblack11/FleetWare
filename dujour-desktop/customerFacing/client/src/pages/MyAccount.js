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
      setUpdatedUser({ ...user, password: '', creditCardNumber: '', ccExpirationDate: '', cvv: '' });
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
  // Check if the field is 'password' and if it is blank, do not update it


  if (name === 'password' && value === '') {
    return;
  }

  if (name === 'ccExpirationDate') {
    let formattedValue = value.replace(
      /[^0-9]/g, '' // Remove non-numeric characters
    ).substring(0, 4); // Limit to 4 characters

    // Automatically insert a slash between MM and YY
    if (formattedValue.length > 2) {
      formattedValue = formattedValue.substring(0, 2) + '/' + formattedValue.substring(2);
    }

    setUpdatedUser({
      ...updatedUser,
      ccExpirationDate: formattedValue
    });
    return;
  }



  setUpdatedUser({
    ...updatedUser,
    [name]: type === 'checkbox' ? checked : value,
  });
};

  const handleSubmit = (e) => {
  e.preventDefault();
  const changedFields = getChangedFields(originalUser, updatedUser);

  // Remove password from updates if it's empty and was not filled out by the user
  if (changedFields.password === '') {
    delete changedFields.password;
  }
  // Similar check for the credit card number
  if (changedFields.creditCardNumber === '') {
    delete changedFields.creditCardNumber;
  }

    // Similar check for the credit card number
  if (changedFields.ccExpirationDate === '') {
    delete changedFields.ccExpirationDate;
  }

  console.log("Changed Fields:", changedFields);

  if (Object.keys(changedFields).length === 0) {
    alert('No changes made.');
    return;
  }

  axios.put(`/api/users/${user._id}`, changedFields)
    .then(response => {
      alert('User updated successfully!');
      const updatedUserData = { ...updatedUser, ...response.data };
      login(updatedUserData); // Update context with new user data
      navigate('/'); // Navigate to the home page
    })
    .catch(error => {
      console.error('Error updating user data:', error);
      alert('Failed to update user data. Please try again.');
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
              <td><label htmlFor="name">Customer Name:</label></td>
              <td className="input-cell"><input type="text" name="name" id="name" value={updatedUser.name} onChange={handleChange}  className="input-name"/></td>
            </tr>
            <tr>
              <td><label htmlFor="email">Customer Email:</label></td>
              <td className="input-cell"><input type="email" name="email" id="email" value={updatedUser.email} onChange={handleChange} className="input-email"  /></td>
            </tr>
            <tr>
              <td><label htmlFor="deliveryAddress">Delivery Address:</label></td>
              <td className="input-cell"><input type="text" name="deliveryAddress" id="deliveryAddress" value={updatedUser.deliveryAddress} onChange={handleChange} className="input-address"  /></td>
            </tr>
            <tr>
              <td><label htmlFor="creditCardNumber">Credit Card Number:</label></td>
              <td className="input-cell">
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <input type="text" name="creditCardNumber" id="creditCardNumber" value={updatedUser.creditCardNumber} onChange={handleChange} />
                <small>Previously stored card information not displayed.</small>
                </div>
              </td>
            </tr>
              <tr>
                <td><label htmlFor="ccExpirationDate">Expiration Date (MM/YY):</label></td>
                <td className="input-cell">
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <input type="text" name="ccExpirationDate" id="ccExpirationDate" value={updatedUser.ccExpirationDate} onChange={handleChange} className="input-expiration"/>
                        <small>Previously stored card information not displayed.</small>
                    </div>
                </td>
            </tr>
            <tr>
              <td><label htmlFor="password">Password:</label></td>
                <td className="input-cell">
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <input type="text" name="password" id="password" value={updatedUser.password} onChange={handleChange} />
                  <small>Password not displayed.</small>
                </div>
                </td>
            </tr>
          </tbody>
        </table>
        <button className="add-button" type="submit">Update Profile</button>
      </form>
    </div>
  );
};

export default MyAccount;
