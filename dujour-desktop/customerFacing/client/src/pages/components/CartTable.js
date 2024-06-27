import React from 'react';

const CartTable = ({ cartItems, inputQuantities, updatingItems, setInputQuantities, confirmUpdate, toggleUpdateItem, removeFromCart }) => {
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
                            {updatingItems[item._id] ? (
                                <input
                                    type="number"
                                    value={inputQuantities[item._id]}
                                    onChange={(e) => setInputQuantities({ ...inputQuantities, [item._id]: e.target.value })}
                                    className="mini-cart-quantity-input"
                                    min="1"
                                />
                            ) : (
                                item.quantity
                            )}
                        </td>
                        <td>${item.unitCost.toFixed(2)}</td>
                        <td>${(inputQuantities[item._id] * item.unitCost).toFixed(2)}</td>
                        <td>
                            {updatingItems[item._id] ? (
                                <button className="add-button" onClick={() => confirmUpdate(item._id)}>Confirm</button>
                            ) : (
                                <button className="add-button" onClick={() => toggleUpdateItem(item._id)}>Update</button>
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
