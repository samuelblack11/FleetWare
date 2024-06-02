// ReusableReactComponents.js
import React from 'react';
import logo from '../assets/logo128.png';

export const GenericTable = ({ data, columns, handleEditClick, deleteCargo }) => {
  return (
    <table>
      <thead>
        <tr>
          {columns.map((column, index) => (
            <th key={column.accessor || index}>{column.Header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row) => (
          <tr key={row._id}>
            {columns.map((column, index) => {
              const accessor = column.accessor || `static-${index}`;
              const cellKey = `${row._id}-${accessor}`;
              return (
                <td key={cellKey}>
                  {column.Cell 
                    ? column.Cell({ row, handleEditClick, deleteCargo }) 
                    : accessor.startsWith('static')
                      ? <button onClick={() => handleEditClick(row)}>Edit</button>
                      : row[accessor]}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
};




export const GenericPopup = ({ show, children, onClose }) => {
  if (!show) {
    return null;
  }

  return (
    <div className="popup">
      <div className="popup-inner">
        {children}
        <button className="delete-btn" onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
};

export const DetailedOrderSummary = ({ show, order, onClose, forConfirmation, isPopup, buttonTitle }) => {
  if (!show) {
    return null;
  }

  // Helper function to calculate the total cost of an item
  const calculateItemTotal = (item) => (item.quantity * item.item.unitCost).toFixed(2);

  return (
    <div className={isPopup ? "popup" : "order-summary"}>
      <div className={isPopup ? "popup-inner" : ""}>
        <h2>Order Details</h2>
        {buttonTitle === "View Order History" && (
          <>
            <img src={logo} className="logo" alt="Dujour Logo" />
            <h3>Thank You For Your Purchase!</h3>
            <p>We look forward to delivering you regionally grown and supremely fresh food right to your doorstep.</p>
          </>
        )}
        <p><strong>Order Number:</strong> {order.masterOrderNumber}</p>
        <p><strong>Customer Email:</strong> {order.customerEmail}</p>
        <p><strong>Delivery Address:</strong> {order.deliveryAddress}</p>
        <p><strong>Delivery Date:</strong> {new Date(order.deliveryDate).toLocaleDateString()}</p>
        {!forConfirmation && (
          <p><strong>Order Status:</strong> {order.status}</p>
        )}
        <p><strong>Total Cost:</strong> ${order.totalCost.toFixed(2)}</p>
        <table>
          <thead>
            <tr>
              <th>Item Name</th>
              <th>Quantity</th>
              <th>Unit Cost</th>
              <th>Product Cost</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, index) => (
              <tr key={index}>
                <td>{item.item.itemName}</td>
                <td>{item.quantity}</td>
                <td>${item.item.unitCost.toFixed(2)}</td>
                <td>${calculateItemTotal(item)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {buttonTitle === "View Order History" && (
          <p>To view your order history and check the status of this order, click the link below:</p>
        )}
        <button onClick={onClose} className="add-button">{buttonTitle}</button>
      </div>
    </div>
  );
};

