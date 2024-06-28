// usePromoCode.js
import { useState } from 'react';
import axios from 'axios';

const usePromoCode = (applyPromoEffect) => {
  const [promoCode, setPromoCode] = useState('');
  const [promoData, setPromoData] = useState(null);
  const [promoError, setPromoError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [promoApplied, setPromoApplied] = useState(false);

const handlePromoSubmit = async (e) => {
    e.preventDefault();  // Prevent the default form submission behavior
    if (promoApplied) {
        alert("Promo code has already been applied.");
        return;
    }
    setIsLoading(true);
    try {
     const response = await axios.post('/api/orders/promocode', { promoCode });
        if (response.data) {
            setPromoData(response.data);
            applyPromoEffect(response.data);
            setPromoApplied(true); 
        }
      setIsLoading(false);
    } catch (error) {
      setPromoError('Failed to fetch promo data');
      setIsLoading(false);
    }
};


  return { promoCode, setPromoCode, promoData, promoError, isLoading, handlePromoSubmit };
};

export default usePromoCode;
