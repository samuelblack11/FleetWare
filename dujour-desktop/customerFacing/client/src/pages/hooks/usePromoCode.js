import { useState } from 'react';
import axios from 'axios';

const usePromoCode = () => {
    const [promoCode, setPromoCode] = useState('');
    const [promoError, setPromoError] = useState('');
    const [isPromoApplied, setIsPromoApplied] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const applyPromoCode = (promoDetails) => {
        // You might need to adjust this logic based on your back-end implementation
        if (promoDetails.isValid) {
            setIsPromoApplied(true);
            // Assuming promoDetails contains the new price or discount percentage
            // You can do your price calculation here or just return the details to the component
        } else {
            setIsPromoApplied(false);
        }
    };

    const handlePromoSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setPromoError('');
        try {
            const response = await axios.post('/api/orders/promocode', { promoCode });
            applyPromoCode(response.data);
        } catch (error) {
            setPromoError('Failed to validate promo code.');
            setIsPromoApplied(false);
        } finally {
            setIsLoading(false);
        }
    };

    return {
        promoCode,
        setPromoCode,
        promoError,
        isPromoApplied,
        handlePromoSubmit,
        isLoading
    };
};

export default usePromoCode;
