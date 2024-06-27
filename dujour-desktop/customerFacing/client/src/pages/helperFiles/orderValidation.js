

export const validateEmail = (email) => {
  // Simple email validation pattern
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const validateDeliveryAddress = (address) => {
  // Define allowed city-state pairs
  const allowedLocations = [
    { city: "Arlington", state: "VA" }
    // Add more locations as needed
  ];

  // Regex pattern for checking the address format
  const regex = /^\d+\s+[A-Za-z\s]+\w+,\s+([A-Za-z\s]+),\s+([A-Z]{2})\s\d{5}$/;

  // Execute the regex pattern on the trimmed address
  const match = address.trim().match(regex);

  // If the regex does not match, return an error message for format
  if (!match) {
    return { isValid: false, error: "Invalid address format" };
  }

  // Extract the city name and state from the regex match
  const cityName = match[1].trim();
  const state = match[2];

  // Check if the extracted city and state are in the allowed locations
  const isLocationAllowed = allowedLocations.some(location => 
    location.city.toLowerCase() === cityName.toLowerCase() && location.state === state
  );

  // If the location is not allowed, return an error message for location restriction
  if (!isLocationAllowed) {
    return { isValid: false, error: "We're sorry, delivery is currently only available in the Arlington area." };
  }

  // If everything is correct, return isValid as true
  return { isValid: true };
};



export const validateDeliveryDate = (dateString) => {
  console.log("Validating delivery date:", dateString);

  // Parse the input date string as UTC
  const [year, month, day] = dateString.split('-').map(Number);
  const deliveryDate = new Date(Date.UTC(year, month - 1, day));
  console.log("Parsed delivery date:", deliveryDate);

  // Get the current date and reset the time to midnight in UTC
  const today = new Date();
  const todayUTC = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
  console.log("Today's date:", todayUTC);

  // Also reset the time of the delivery date to midnight in UTC
  console.log("Delivery date after resetting time:", deliveryDate);

  // Ensure the delivery date is not in the past
  if (deliveryDate < todayUTC) {
    console.log("Delivery date cannot be in the past.");
    return false; // Delivery date is in the past
  }

  // Check if the year is within a realistic range (e.g., 1900 to 2100)
  const yearCheck = deliveryDate.getUTCFullYear();
  if (yearCheck < 1900 || yearCheck > 2100) {
    console.log("Year out of realistic range.");
    return false; // Year is out of range
  }

  // If all checks pass, the delivery date is considered valid
  return true;
};




export const validateCreditCardNumber = (number) => {
  // Allow spaces or dashes between number groups, accept 13 to 19 digits
  const sanitizedNumber = number.replace(/[\s-]/g, ''); // Remove spaces and dashes
  return /^\d{13,19}$/.test(sanitizedNumber);
};

export const validateCreditCardExpiration = (expiration) => {
  // Allow "MMYY" or "MM/YY" format
  return /^(0[1-9]|1[0-2])(\/)?\d{2}$/.test(expiration);
};

export const validateCVV = (cvv) => {
  // 3 or 4 digits
  return /^\d{3,4}$/.test(cvv);
};

export const validateItemQuantities = (cartItems) => {
  // Check if every item in the cart has a valid quantity (positive integer)
  return cartItems.every(item => Number.isInteger(item.quantity) && item.quantity > 0);
};

