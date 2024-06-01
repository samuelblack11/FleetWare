import axios from 'axios';

// Luhn Algorithm for Credit Card Number Validation
const validateCreditCardNumber = (number) => {
  const regex = new RegExp("^[0-9]{13,19}$");
  if (!regex.test(number)) return false;

  let sum = 0;
  let shouldDouble = false;
  for (let i = number.length - 1; i >= 0; i--) {
    let digit = parseInt(number.charAt(i));

    if (shouldDouble) {
      if ((digit *= 2) > 9) digit -= 9;
    }

    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return (sum % 10) === 0;
};

// CVV Validation
const validateCVV = (cvv, cardType) => {
  const cvvRegex = cardType === "AMEX" ? /^[0-9]{4}$/ : /^[0-9]{3}$/;
  return cvvRegex.test(cvv);
};

// Expiration Date Validation
const validateExpirationDate = (expDate) => {
  const regex = /^(0[1-9]|1[0-2])\/?([0-9]{4}|[0-9]{2})$/;
  if (!regex.test(expDate)) return false;

  const today = new Date();
  const [month, year] = expDate.split('/');
  const expiryDate = new Date(`20${year}`, month);

  return expiryDate > today;
};

// Example usage in a form
const handleSubmit = (e) => {
  e.preventDefault();

  const cardNumber = orderData.creditCardNumber;
  const cvv = orderData.creditCardCVV;
  const expDate = orderData.creditCardExpiration;

  if (!validateCreditCardNumber(cardNumber)) {
    alert("Invalid credit card number");
    return;
  }

  if (!validateCVV(cvv, "VISA")) { // Change "VISA" to the actual card type if available
    alert("Invalid CVV");
    return;
  }

  if (!validateExpirationDate(expDate)) {
    alert("Invalid expiration date");
    return;
  }

  // Proceed with form submission
  console.log("Form is valid");
};
