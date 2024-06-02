import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import './AllPages.css';
import { AuthContext } from '../App.js';
import { GenericTable } from './ReusableReactComponents';

function PickView() {
  const { user } = useContext(AuthContext); // Access user from AuthContext
  const today = new Date();
  const formattedDate = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
  const [pickPlanDetails, setPickPlanDetails] = useState(null);
  const [pickPlanExists, setPickPlanExists] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !user._id) { // Assuming user.id is the driver's ID
        return;
      }


      try {
        const response = await axios.get(`/api/pickPlans/specificPickPlan?date=${formattedDate}&userId=${user._id}`);
        console.log("API response:", response.data);
        setPickPlanExists(response.data.exists);

        if (response.data.exists) {
          setPickPlanDetails(response.data.pickPlans[0]); // Assuming pickPlans is an array with one element
        } else {
          setPickPlanDetails(null);
        }
      } catch (error) {
        console.error("Error fetching route plan details:", error);
        setPickPlanDetails(null);
      }
    };

    fetchData();

    const handler = setTimeout(fetchData, 500); // Delayed fetch to ensure user info is loaded
    return () => clearTimeout(handler);
  }, [user, formattedDate]);

  const handleStatusUpdate = async (item) => {
    try {
      const response = await axios.put('/api/pickPlans/updatePickStatus', {
        pickPlanId: pickPlanDetails._id,
        itemId: item._id,
        newStatus: item.status === 'Not Picked' ? 'Picked' : 'Not Picked'
      });
      console.log('Status update response:', response.data);
      setPickPlanDetails(response.data.pickPlan);
    } catch (error) {
      console.error('Error updating pick status:', error);
    }
  };

  function reformatDate(selectedDate) {
    const dateParts = selectedDate.split('-');
    const year = dateParts[0].substr(2);
    const month = dateParts[1];
    const day = dateParts[2];

    return `${month}/${day}/${year}`;
  }

  const columns = [
    { Header: 'Location Number', accessor: 'vendorLocationNumber' },
    { Header: 'Farm Name', accessor: 'farmName' },
    { Header: 'Item Name', accessor: 'itemName' },
    { Header: 'Quantity', accessor: 'quantity' },
    { Header: 'Order #', accessor: 'masterOrderNumber' },
    {
      Header: 'Status',
      accessor: 'status',
      Cell: ({ row }) => (
        <span>{row.status}</span>
      )
    },
    {
      Header: 'Actions',
      Cell: ({ row }) => (
        <button className="add-button" onClick={() => handleStatusUpdate(row)}>Update Status</button>
      )
    }
  ];

  return (
    <div>
      <h2>Pick Plan for {reformatDate(formattedDate)}</h2>
      {pickPlanDetails ? (
        <GenericTable data={pickPlanDetails.items} columns={columns} />
      ) : (
        <p>No pick plan available for this date.</p>
      )}
    </div>
  );
}

export default PickView;

