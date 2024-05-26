
import React, { useState, useEffect, useContext} from 'react';
import axios from 'axios';
import './AllPages.css';
import { AuthContext } from '../App.js';
import { fetchUserByEmail, submitFinalOrder, incrementUserOrderNumber } from './helperFiles/placeOrder';
import { validateEmail, validateDeliveryAddress, validateDeliveryDate, validateCreditCardNumber, validateCreditCardExpiration, validateCVV, validateItemQuantities } from './helperFiles/orderValidation';


return(
	<div className="customer-info-section">
  <h3>Customer Information</h3>
  <table className="customer-info-table">
    <tbody>
       {user.role === 'admin' && (
      <tr>
        <td><label htmlFor="customerEmail">Customer Email:</label></td>
        <td><input type="email" name="customerEmail" id="customerEmail" value={orderData.customerEmail} onChange={handleChange} required /></td>
      </tr>
        )}
      <tr>
        <td><label htmlFor="deliveryAddress">Delivery Address:</label></td>
        <td><input type="text" name="deliveryAddress" id="deliveryAddress" value={orderData.deliveryAddress} onChange={handleChange} required /></td>
      </tr>
      <tr>
        <td><label htmlFor="deliveryDate">Delivery Date:</label></td>
        <td><input type="date" name="deliveryDate" id="deliveryDate" value={orderData.deliveryDate} onChange={handleChange} required /></td>
      </tr>
      <tr>
        <td><label htmlFor="creditCardNumber">Credit Card Number:</label></td>
        <td><input type="text" name="creditCardNumber" id="creditCardNumber" value={orderData.creditCardNumber} onChange={handleChange} required /></td>
    </tr>
    <tr>
        <td><label htmlFor="creditCardExpiration">Expiration Date:</label></td>
        <td><input type="text" name="creditCardExpiration" id="creditCardExpiration" value={orderData.creditCardExpiration} placeholder="MM/YY" onChange={handleChange} required /></td>
    </tr>
    <tr>
        <td><label htmlFor="creditCardCVV">Security Code (CVV):</label></td>
        <td><input type="text" name="creditCardCVV" id="creditCardCVV" value={orderData.creditCardCVV} onChange={handleChange} required /></td>
    </tr>
    </tbody>
  </table>
</div>
  <div className="cart-summary">
  <h3>Cart Summary</h3>
    <table>
    <thead>
      <tr>
        <th>Item Name</th>
        <th>Quantity</th>
        <th>Unit Cost</th>
        <th>Line Item Cost</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
  {cartItems.map((item, index) => (
    <tr key={item.id}>
      <td>{item.itemName}</td>
      <td>
        {item.isUpdating ? (
          <input
            type="number"
            value={item.quantity}
            onChange={(e) => handleItemQuantityChange(index, e.target.value)}
            autoFocus
          />
        ) : (
          item.quantity
        )}
      </td>
      <td>${item.unitCost.toFixed(2)}</td>
      <td>${(item.quantity * item.unitCost).toFixed(2)}</td>
      <td className="actions-cell">
        <button className="add-button" onClick={() => toggleUpdateItem(index)}>{item.isUpdating ? "Confirm" : "Update"}</button>
        <button className="delete-btn" onClick={() => removeItemFromCart(item.id)}>Delete</button>
      </td>
    </tr>
  ))}
</tbody>

  </table>
  <p className="total-cost">Total Cost: ${cartItems.reduce((acc, item) => acc + (item.quantity * item.unitCost), 0).toFixed(2)}</p>
      <div className="submitButton">
        <form onSubmit={handleSubmit}>
        <div className="submitButton">
          <button className="submit-btn" type="submit">Submit Order</button>
        </div>
        </form>
      </div>
    </div>
);