import React from 'react';

const CartTable = ({ cartItems, inputQuantities, updatingItems, setInputQuantities, confirmUpdate, toggleItemUpdate, removeFromCart }) => {
    return (
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
                {cartItems.map((item) => (
                    <tr key={item._id}>
                        <td>{item.itemName}</td>
                        <td>
                            {item.isUpdating ? (
                                <input
                                    type={inputQuantities[item._id] === '' ? "text" : "number"}
                                    value={inputQuantities[item._id] === '' ? '' : (inputQuantities[item._id] || item.quantity)}
                                    onChange={e => {
                                        const newValue = e.target.value;
                                        setInputQuantities(item._id, newValue === '' ? '' : newValue);
                                    }}
                                    className="mini-cart-quantity-input"
                                />
                            ) : (
                                item.quantity
                            )}
                        </td>
                        <td>${item.unitCost.toFixed(2)}</td>
                        <td>${(item.quantity * item.unitCost).toFixed(2)}</td>
                        <td>
                            {item.isUpdating ? (
                                <button className="add-button" onClick={() => confirmUpdate(item._id)}>
                                    Confirm
                                </button>
                            ) : (
                                <button className="add-button" onClick={() => toggleItemUpdate(item._id)}>
                                    Update
                                </button>
                            )}
                            <button className="delete-btn" onClick={() => removeFromCart(item._id)}>Delete</button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

export default CartTable;
