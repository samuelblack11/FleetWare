import React, { createContext, useState, useContext, useEffect } from 'react';

export const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState([]);
    const [totalCost, setTotalCost] = useState(0);

    // Add an item to the cart or update its quantity if it already exists
const addToCart = (itemToAdd) => {
    const exists = cartItems.find(item => item._id === itemToAdd._id);
    if (exists) {
        // Update the item quantity if it exists
        setCartItems(cartItems.map(item => 
            item._id === itemToAdd._id ? {...item, quantity: item.quantity + itemToAdd.quantity} : item
        ));
    } else {
        // Add the new item to the cart with isUpdating initialized to false
        setCartItems([...cartItems, {...itemToAdd, isUpdating: false}]);
    }
};

    const updateCartItem = (itemId, quantity) => {
        setCartItems(prevItems =>
            prevItems.map(item =>
                item._id === itemId ? { ...item, quantity: quantity} : item
            )
        );
        console.log(cartItems)
    };

    const toggleItemUpdate = (itemId) => {
        setCartItems(prevItems =>
            prevItems.map(item =>
                item._id === itemId ? { ...item, isUpdating: !item.isUpdating } : item
            )
        );
    };

    // Remove an item from the cart by ID
    const removeFromCart = (itemId) => {
        setCartItems(cartItems.filter(item => item._id !== itemId));
    };

    // Clear the cart
    const clearCart = () => {
        setCartItems([]);
        setTotalCost(0);
    };

    // Calculate total cost whenever cartItems change
    useEffect(() => {
        const newTotalCost = cartItems.reduce((total, item) => total + item.quantity * item.unitCost, 0);
        setTotalCost(newTotalCost);
    }, [cartItems]);

    return (
        <CartContext.Provider value={{
            cartItems,
            setCartItems,
            totalCost,
            addToCart,
            updateCartItem,
            toggleItemUpdate,
            removeFromCart,
            clearCart
        }}>
            {children}
        </CartContext.Provider>
    );
};
