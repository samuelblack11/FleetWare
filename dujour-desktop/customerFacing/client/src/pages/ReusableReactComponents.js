// ReusableReactComponents.js
import React from 'react';

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

export const DetailedOrderPopup = ({ show, order, onClose }) => {
  if (!show) {
    return null;
  }

  // Helper function to calculate the total cost of an item
  const calculateItemTotal = (item) => (item.quantity * item.unitCost).toFixed(2);

  // Calculate the total order cost
  const totalOrderCost = order.items.reduce((total, item) => total + item.quantity * item.unitCost, 0).toFixed(2);

  return (
    <div className="popup">
      <div className="popup-inner">
        <h3>Order Details</h3>
        <p><strong>Customer Email:</strong> {order.customerEmail}</p>
        <p><strong>Delivery Address:</strong> {order.deliveryAddress}</p>
        <p><strong>Delivery Date:</strong> {new Date(order.deliveryDate).toLocaleDateString()}</p>
        <p><strong>Order Status:</strong> {order.status}</p>
        <p><strong>Total Cost:</strong> ${totalOrderCost}</p>
        <table>
          <thead>
            <tr>
              <th>Item Name</th>
              <th>Quantity</th>
              <th>Unit Cost</th>
              <th>Total Cost</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, index) => (
              <tr key={index}>
                <td>{item.itemName}</td>
                <td>{item.quantity}</td>
                <td>${item.unitCost.toFixed(2)}</td>
                <td>${calculateItemTotal(item)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <button onClick={onClose} className="add-button">Close</button>
      </div>
    </div>
  );
};
