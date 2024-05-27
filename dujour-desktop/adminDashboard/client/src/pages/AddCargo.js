import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AllPages.css';

const Popup = ({ message, onClose }) => (
  <div className="popup">
    <div className="popup-inner">
      <p>{message}</p>
      <button onClick={onClose}>OK</button>
    </div>
  </div>
);


const AddCargo = () => {
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    cargoLength: '',
    cargoWidth: '',
    cargoHeight: '',
    cargoWeight: '',
    cargoCategory: '',
    cargoHazardous: false,
    cargoValue: '',
    pickupAddress: '',
    deliveryAddress: '',
    deliveryDate: '',
    deliveryStatus: 'pendingPickup'
  });

  const [validationErrors, setValidationErrors] = useState({});
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [cargoCategories, setCargoCategories] = useState([]);

  useEffect(() => {
  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/cargoCategories');
      setCargoCategories(response.data);
    } catch (error) {
      console.error("Error fetching cargo categories", error);
    }
  };


  fetchCategories();
}, []);



  const handleChange = (e) => {
    const { name, type, value, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;

    setFormData({
      ...formData,
      [name]: newValue
    });

    // Reset validation error for this field
    setValidationErrors({
      ...validationErrors,
      [name]: false
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // New validation logic
    const newValidationErrors = {};

    // Email validation
    if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.customerEmail)) {
      newValidationErrors.customerEmail = true;
    }

    // Number validation for cargo dimensions and weight
    ['cargoLength', 'cargoWidth', 'cargoHeight', 'cargoWeight', 'cargoValue'].forEach(field => {
      if (isNaN(formData[field]) || formData[field] === '') {
        newValidationErrors[field] = true;
     }
    });

    // Check if there are any validation errors
    if (Object.keys(newValidationErrors).length > 0) {
      setValidationErrors(newValidationErrors);
      return; // Stop submission if there are errors
   }

    try {
      const response = await axios.post('/api/cargo', formData);
      console.log(response.data);
      setPopupMessage('Cargo data saved successfully!');
      setShowPopup(true);
    } catch (error) {
      console.error('Error submitting form', error);
      setPopupMessage('Error saving data. Please try again.');
      setShowPopup(true);
    }
  };

  const handleCurrencyChange = (e) => {
  const { value } = e.target;
  const numericValue = value.replace(/[^0-9.]/g, ''); // Remove non-numeric characters
  setFormData({
    ...formData,
    cargoValue: numericValue
  });
};

// Example of a useForm custom hook
function useForm(initialValues) {
  const [formData, setFormData] = useState(initialValues);
  // Include validation logic and other form-related operations here
  return [formData, setFormData];
}

const fields = [
  { id: "customerName", label: "Customer Name", type: "text", validationError: "customerName" },
  { id: "customerEmail", label: "Customer Email", type: "email", validationError: "customerEmail" },
  { id: "cargoLength", label: "Cargo Length (ft)", type: "number", validationError: "cargoLength" },
  { id: "cargoWidth", label: "Cargo Width (ft)", type: "number", validationError: "cargoWidth" },
  { id: "cargoHeight", label: "Cargo Height (ft)", type: "number", validationError: "cargoHeight" },
  { id: "cargoWeight", label: "Cargo Weight (lbs)", type: "number", validationError: "cargoWeight" },
  { id: "cargoValue", label: "Cargo Approximate Value", type: "text", validationError: "cargoValue", isCurrency: true },
  { id: "pickupAddress", label: "Pickup Address", type: "text", validationError: "pickupAddress" },
  { id: "deliveryAddress", label: "Delivery Address", type: "text", validationError: "deliveryAddress" },
  { id: "deliveryDate", label: "Deliver by Date", type: "date", validationError: "deliveryDate" },
  { id: "cargoCategory", label: "Cargo Category", type: "select", validationError: "cargoCategory" },
  { id: "cargoHazardous", label: "Cargo Hazardous Flag", type: "select", validationError: "cargoHazardous", options: [{value: false, label: "False"}, {value: true, label: "True"}] },
];

return (
  <div className="add-cargo-container">
    <h2 className="add-cargo-header">Add Cargo</h2>
    <form id="addCargoForm" className="add-cargo-form" onSubmit={handleSubmit}>
      {fields.map((field) => (
        <div className="form-group" key={field.id}>
          <label htmlFor={field.id}>{field.label}:</label>
          {field.type === "select" ? (
            <select
              id={field.id}
              name={field.id}
              value={formData[field.id]}
              onChange={handleChange}
              required
              className={validationErrors[field.validationError] ? 'error' : ''}
            >
              {field.id === "cargoHazardous" ? field.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              )) : (
                <>
                  <option value="">Select a Category</option>
                  {cargoCategories.map((category) => (
                    <option key={category.key} value={category.key}>
                      {category.value}
                    </option>
                  ))}
                </>
              )}
            </select>
          ) : (
            <input
              type={field.type}
              id={field.id}
              name={field.id}
              value={formData[field.id]}
              onChange={field.id === "cargoValue" ? handleCurrencyChange : handleChange}
              required
              className={validationErrors[field.validationError] ? 'error' : ''}
            />
          )}
          {field.id === "cargoValue" && (
            <div className="currency-input-container">
              <span className="currency-symbol">$</span>
            </div>
          )}
        </div>
      ))}
      <div className="submitButton">
        <button type="submit">Submit</button>
      </div>
    </form>
    {showPopup && (
      <Popup
        message={popupMessage}
        onClose={() => {
          setShowPopup(false);
          if (popupMessage === 'Cargo data saved successfully!') {
            window.location.href = '/';
          }
        }}
      />
    )}
  </div>
  );
};

export default AddCargo;
