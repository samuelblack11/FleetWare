import React from 'react';

const CartSummaryDisplay = ({ shippingCharge, discountedShipping, orderData }) => {
    return (
        <div className="cart-summary">
            <div>
                {discountedShipping === 0 ? (
                    <h3>
                        <span className="original-cost"  style={{ marginRight: '7px'}} >
                            Shipping Charge:
                        </span>
                        <span className="original-cost" style={{ textDecoration: 'line-through', marginRight: '7px' }}>
                            ${shippingCharge.toFixed(2)}
                        </span>
                        <span className="discounted-cost">
                            $0.00
                        </span>
                    </h3>
                ) : (
                    <h3>
                        <span className="original-cost"  style={{ marginRight: '7px'}} >
                            Shipping Charge:
                        </span>
                        <span className="original-cost">
                          ${discountedShipping.toFixed(2)}
                        </span>
                    </h3>
                )}
            </div>
            <div>
                {orderData.totalCost !== orderData.totalCostPreDiscount && (
                    <h3>
                      <span className="original-cost" style={{ marginRight: '7px'}}>
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
                    <h3>
                      <span className="original-cost" style={{ marginRight: '7px'}}>
                          Total Cost: 
                      </span>
                      <span className="original-cost">
                          ${orderData.totalCost.toFixed(2)} 
                      </span>
                    </h3>
                )}
            </div>
        </div>
    );
};


export default CartSummaryDisplay;
