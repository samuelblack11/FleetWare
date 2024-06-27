import React from 'react';

const CartSummaryDisplay = ({ shippingCharge, discountedShipping, orderData }) => {
    return (
        <div className="cart-summary">
            <div>
                {discountedShipping !== shippingCharge && (
                    <h3>
                        <span className="original-cost" style={{ textDecoration: 'line-through' }}>
                            Shipping Charge: ${shippingCharge.toFixed(2)}
                        </span>
                        <span className="discounted-cost">
                            ${discountedShipping.toFixed(2)}
                        </span>
                    </h3>
                )}
                {discountedShipping === shippingCharge && (
                    <h3>Shipping Charge: ${shippingCharge.toFixed(2)}</h3>
                )}
            </div>
            <div>
                {orderData.totalCost !== orderData.totalCostPreDiscount && (
                    <h3>
                        <span className="original-cost" style={{ marginRight: '7px' }}>
                            Total Cost:
                        </span>
                        <span className="original-cost" style={{ textDecoration: 'line-through', marginRight: '7px' }}>
                            ${orderData.totalCostPreDiscount.toFixed(2)}
                        </span>
                        <span className="discounted-cost">
                            ${orderData.totalCost.toFixed(2)}
                        </span>
                    </h3>
                )}
                {orderData.totalCost === orderData.totalCostPreDiscount && (
                    <h3>Total Cost: ${orderData.totalCost.toFixed(2)}</h3>
                )}
            </div>
        </div>
    );
};

export default CartSummaryDisplay;
