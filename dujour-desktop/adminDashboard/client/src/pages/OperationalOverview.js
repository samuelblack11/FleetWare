import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { GenericTable } from './ReusableReactComponents';
import './AllPages.css';

const OperationalOverview = () => {
  const [selectedDate, setSelectedDate] = useState('');
  const [overviewData, setOverviewData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (selectedDate) {
      fetchOverviewData(selectedDate);
    }
  }, [selectedDate]);

  const fetchOverviewData = async (date) => {
    setIsLoading(true);
    try {
      const ordersResponse = await axios.get(`/api/orders/detailed-orders?date=${date}`);
      const pickPlansResponse = await axios.get(`/api/pickPlans?date=${date}`);
      const routesResponse = await axios.get(`/api/deliveryRoutes?date=${date}`);

      const orders = ordersResponse.data;
      const pickPlans = pickPlansResponse.data;
      const routes = routesResponse.data.routes || [];

      const numberOfOrders = orders.length;
      const vendorIds = new Set();
      const itemQuantities = {};
      let totalRevenue = 0;

      orders.forEach(order => {
        order.items.forEach(item => {
          vendorIds.add(item.vendorLocationNumber);
          itemQuantities[item.itemName] = (itemQuantities[item.itemName] || 0) + item.quantity;
          totalRevenue += item.quantity * item.itemUnitCost; // Assuming unitCost is available
        });
      });

      const numberOfVendors = vendorIds.size;
      const topItems = Object.entries(itemQuantities)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([itemName, quantity]) => ({ itemName, quantity }));

      console.log("||||||||")
      console.log(pickPlans)
      console.log("------")
      pickPlans.forEach(pickPlan => {
        if (pickPlan.driver && pickPlan.driver.Name) {
          console.log(`Driver Name: ${pickPlan.driver.Name}`);
        } else {
          console.log('Driver Name: Unassigned');
        }
      });


      const pickPlanStatuses = pickPlans.map(plan => ({
        date: plan.date,
        driver: plan.driver ? plan.driver.Name : 'Unassigned',
        status: plan.status
      }));

      const routeStatuses = routes.map(route => ({
        startTime: route.startTime,
        driver: route.driverId ? route.driverId.name : 'Unassigned',
        stops: route.stops.length
      }));

      setOverviewData({
        numberOfOrders,
        numberOfVendors,
        topItems,
        totalRevenue,
        pickPlanStatuses,
        routeStatuses
      });
    } catch (error) {
      console.error('Error fetching overview data:', error);
      setError('Failed to fetch overview data.');
    }
    setIsLoading(false);
  };

  const handleChange = (setter) => (e) => setter(e.target.value);

  const summaryColumns = [
    { Header: 'Metric', accessor: 'metric' },
    { Header: 'Value', accessor: 'value' }
  ];

  const summaryData = [
    { metric: 'Number of Orders', value: overviewData?.numberOfOrders },
    { metric: 'Number of Vendors', value: overviewData?.numberOfVendors },
    { metric: 'Total Revenue', value: `$${overviewData?.totalRevenue.toFixed(2)}` }
  ];

  const topItemsColumns = [
    { Header: 'Item Name', accessor: 'itemName' },
    { Header: 'Quantity', accessor: 'quantity' }
  ];

  const pickPlanColumns = [
    {
    Header: 'Date',
    accessor: 'date',
    Cell: ({ row }) => {
      const date = new Date(row.date);
      const formattedDate = new Intl.DateTimeFormat('en-US', {
        timeZone: 'UTC'
      }).format(date);
      return formattedDate;
    }
  },
    {
    Header: 'Driver',
    accessor: 'driver',
    Cell: ({ row }) => {
      return row.driver ? row.driver : 'Unassigned';
    }
  },

    { Header: 'Status', accessor: 'status' }
  ];

  const routeColumns = [
    { Header: 'Start Time', accessor: row => new Date(row.startTime).toLocaleString() },
    { Header: 'Driver', accessor: 'driver' },
    { Header: 'Stops', accessor: 'stops' }
  ];

  return (
    <div className="operational-overview-container">
      <h2>Operational Overview</h2>
      <div className="form-group">
        <label htmlFor="dateSelect">Select Date:</label>
        <input
          type="date"
          id="dateSelect"
          value={selectedDate}
          onChange={handleChange(setSelectedDate)}
        />
      </div>
      {isLoading && <div className="spinner">Loading...</div>}
      {error && <p className="error">{error}</p>}
      {overviewData && (
        <div className="overview-content">
          <div className="overview-tables">
            <div className="table-container">
              <h3>Summary</h3>
              <GenericTable data={summaryData} columns={summaryColumns} />
            </div>
            <div className="table-container">
              <h3>Top 5 Most Purchased Items</h3>
              <GenericTable data={overviewData.topItems} columns={topItemsColumns} />
            </div>
          </div>
          <div className="overview-pick-plans">
            <h3>Pick Plan Status</h3>
            <GenericTable data={overviewData.pickPlanStatuses} columns={pickPlanColumns} />
          </div>
          <div className="overview-routes">
            <h3>Route Status</h3>
            <GenericTable data={overviewData.routeStatuses} columns={routeColumns} />
          </div>
        </div>
      )}
    </div>
  );
};

export default OperationalOverview;
