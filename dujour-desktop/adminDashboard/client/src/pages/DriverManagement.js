import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { GenericTable, GenericPopup } from './ReusableReactComponents';
import './AllPages.css';

const DriverForm = ({ driver, onSave, onClose }) => {
  const initialState = driver || {
    Name: '',
    Address: '',
    LicenseNumber: '',
    LicenseExpiration: '',
    PhoneNumber: '',
    Email: '',
    EmergencyContact: '',
    DateOfHiring: '',
    Position: '',
    Department: '',
    DrivingRecord: '',
    TrainingRecords: '',
    StandardVehicleAssignment: '',
    PerformanceReviews: ''
  };
  
  const [driverData, setDriverData] = useState(initialState);

  const handleChange = (e) => {
    setDriverData({ ...driverData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent form submission if you're using a form
    try {
      await onSave(driverData);
      onClose();
    } catch (error) {
      console.error('Error saving driver:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {Object.keys(initialState).map((key) => (
        <div key={key}>
          <label>{key.replace(/([A-Z])/g, ' $1').trim()}:</label>
          <input 
            type="text" // Adjust types as needed, e.g., 'date' for LicenseExpiration
            name={key} 
            value={driverData[key]} 
            onChange={handleChange} 
          />
        </div>
      ))}
      <button type="submit">Save Driver</button>
    </form>
  );
};

const DriverManagement = () => {
  const [drivers, setDrivers] = useState([]);
  const [showDriverPopup, setShowDriverPopup] = useState(false);
  const [currentDriver, setCurrentDriver] = useState(null);

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      const response = await axios.get('/api/drivers');
      setDrivers(response.data);
    } catch (error) {
      console.error('Error fetching drivers:', error);
    }
  };

  const handleSaveDriver = async (driverData) => {
    const method = driverData._id ? 'put' : 'post';
    const url = driverData._id ? `/api/drivers/${driverData._id}` : '/api/drivers';

    try {
      await axios[method](url, driverData);
      fetchDrivers();
      setShowDriverPopup(false);
    } catch (error) {
      console.error('Error saving driver:', error);
    }
  };

  const deleteDriver = async (id) => {
    try {
      await axios.delete(`/api/drivers/${id}`);
      fetchDrivers();
    } catch (error) {
      console.error('Error deleting driver:', error);
    }
  };

  const driverColumns = [
    { Header: 'Name', accessor: 'Name' },
    // Include other columns as needed
    {
      Header: 'Actions',
      accessor: 'actions',
      Cell: ({ row }) => (
        <>
          <button onClick={() => {
            setCurrentDriver(row.original);
            setShowDriverPopup(true);
          }} className="edit-btn">Edit</button>
          <button onClick={() => deleteDriver(row.original._id)} className="delete-btn">Delete</button>
        </>
      )
    }
  ];

  return (
    <div className="driver-management-container">
      <h3 class="page-header">Driver Management</h3>
      <button className="add-button" onClick={() => {
        setCurrentDriver(null);
        setShowDriverPopup(true);
      }}>Add Driver</button>
      <GenericTable data={drivers} columns={driverColumns} />
      {showDriverPopup && (
        <GenericPopup show={showDriverPopup} onClose={() => setShowDriverPopup(false)}>
          <DriverForm driver={currentDriver} onSave={handleSaveDriver} onClose={() => setShowDriverPopup(false)} />
        </GenericPopup>
      )}
    </div>
  );
};

export default DriverManagement;
