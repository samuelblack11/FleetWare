import React, { createContext, useState, useContext } from 'react';

export const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState([]);
    const [totalCost, setTotalCost] = useState(0);

    const addToCart = (item) => {
        // Logic to add item to cart
    };

    const removeFromCart = (itemId) => {
        // Logic to remove item from cart
    };

    const updateCartItem = (itemId, quantity) => {
        // Logic to update cart item
    };

    const clearCart = () => {
        setCartItems([]);
        setTotalCost(0);
    };

    return (
        <CartContext.Provider value={{ cartItems, setCartItems, totalCost, setTotalCost, addToCart, removeFromCart, updateCartItem, clearCart }}>
            {children}
        </CartContext.Provider>
    );
};
