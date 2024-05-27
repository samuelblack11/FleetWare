import axios from 'axios';

// Function to fetch specific user by email
export const fetchUserByEmail = async (email) => {
  try {
    const response = await axios.get(`/api/users/email/${email}`);
    return response.data;
  } catch (error) {
    throw new Error('Error fetching user data');
  }
};

// Function to submit the final order
export const submitFinalOrder = async (finalOrderData) => {
  try {
    const response = await axios.post('/api/orders', finalOrderData);
    return response;
  } catch (error) {
    throw new Error('Error submitting order');
  }
};

// Function to increment the user's last order number
export const incrementUserOrderNumber = async (email) => {
  try {
    await axios.put(`/api/users/email/${email}/incrementOrderNumber`);
  } catch (error) {
    throw new Error('Error incrementing order number');
  }
};
