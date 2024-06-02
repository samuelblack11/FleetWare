

export const validateEmail = (email) => {
  // Simple email validation pattern
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const validateDeliveryAddress = (address) => {
  // This regex pattern specifically looks for an address in the format:
  // "2300 Clarendon Blvd, Arlington, VA 22201"
  // It checks for:
  // 1. A street number: one or more digits.
  // 2. A street name: can include alphabetic characters, spaces, and possibly descriptors like "Blvd", "St", "Ave", etc.
  // 3. A city name: alphabetic characters and possibly spaces.
  // 4. A state abbreviation: exactly two uppercase letters.
  // 5. A ZIP code: exactly five digits.
  const regex = /^\d+\s+[A-Za-z\s]+\w+,\s+[A-Za-z\s]+,\s+[A-Z]{2}\s\d{5}$/;
  return regex.test(address.trim());
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

