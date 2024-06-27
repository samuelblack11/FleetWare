import React from 'react';
import ReactDatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

const CustomerInfoForm = ({ orderData, handleChange, handleDateChange, isAdmin }) => {
    return (
        <table className="customer-info-table">
            <tbody>
                <tr>
                    <td><label htmlFor="customerName">Customer Name</label></td>
                    <td className="input-cell">
                        <input
                            className="input-name"
                            type="text"
                            name="customerName"
                            id="customerName"
                            value={orderData.customerName}
                            onChange={handleChange}
                            required
                        />
                    </td>
                </tr>
                {isAdmin && (
                    <tr>
                        <td><label htmlFor="customerEmail">Customer Email</label></td>
                        <td className="input-cell">
                            <input
                                className="input-email"
                                type="email"
                                name="customerEmail"
                                id="customerEmail"
                                value={orderData.customerEmail}
                                onChange={handleChange}
                                required
                            />
                        </td>
                    </tr>
                )}
                <tr>
                    <td><label htmlFor="deliveryAddress">Delivery Address</label></td>
                    <td className="input-cell">
                        <input
                            className="input-address"
                            type="text"
                            name="deliveryAddress"
                            id="deliveryAddress"
                            value={orderData.deliveryAddress}
                            onChange={handleChange}
                            required
                        />
                    </td>
                </tr>
                <tr>
                    <td><label htmlFor="deliveryDate">Delivery Date</label></td>
                    <td className="input-cell">
                        <ReactDatePicker
                            className="input-datepicker"
                            selected={new Date(orderData.deliveryDate)}
                            onChange={handleDateChange}
                            dateFormat="yyyy-MM-dd"
                        />
                    </td>
                </tr>
                <tr>
                    <td><label htmlFor="creditCardNumber">Credit Card Number</label></td>
                    <td className="input-cell">
                        <input
                            className="input-cc"
                            type="text"
                            name="creditCardNumber"
                            id="creditCardNumber"
                            value={orderData.creditCardNumber}
                            onChange={handleChange}
                            required
                        />
                    </td>
                </tr>
                <tr>
                    <td><label htmlFor="creditCardExpiration">Expiration Date (MM/YY)</label></td>
                    <td className="input-cell">
                        <input
                            type="text"
                            name="ccExpirationDate"
                            id="ccExpirationDate"
                            value={orderData.ccExpirationDate}
                            placeholder="MM/YY"
                            onChange={handleChange}
                            required
                            className="input-expiration"
                        />
                    </td>
                </tr>
                <tr>
                    <td><label htmlFor="creditCardCVV">Security Code (CVV)</label></td>
                    <td className="input-cell">
                        <input
                            type="text"
                            name="creditCardCVV"
                            id="creditCardCVV"
                            value={orderData.creditCardCVV}
                            onChange={handleChange}
                            required
                            className="input-cvv"
                        />
                    </td>
                </tr>
            </tbody>
        </table>
    );
};

export default CustomerInfoForm;
