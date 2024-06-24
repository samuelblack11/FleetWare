import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { GenericTable } from './ReusableReactComponents';
import './AllPages.css';
import { format } from 'date-fns';
const moment = require('moment-timezone');

const OperationalOverview = () => {
  const dateInEST = moment().tz("America/New_York").set({hour: 11, minute: 0, second: 0, millisecond: 0});
  const formattedDate = dateInEST.format('YYYY-MM-DD');;
  const [selectedDate, setSelectedDate] = useState(formattedDate);
  const [overviewData, setOverviewData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (selectedDate) {
      fetchOverviewData(selectedDate);
    }
  }, [selectedDate]);

  useEffect(() => {
  }, [overviewData]);

  const aggregateStatusCounts = (items) => {
  const statusCounts = {};
  items.forEach(item => {
    if (statusCounts[item.status]) {
      statusCounts[item.status]++;
    } else {
      statusCounts[item.status] = 1;
    }
  });
  return statusCounts;
  };


const aggregateRouteStatusCounts = (stops, orders) => {
  const orderIds = [];
  const statusCounts = {};

  // Collect orderIds from stops
  stops.forEach(stop => {
    orderIds.push(stop.orderId);
  });

  // Count statuses based on the orderIds
  orders.forEach(order => {
    if (orderIds.includes(order._id)) {
      const status = order.overallStatus;
      if (statusCounts[status]) {
        statusCounts[status] += 1;
      } else {
        statusCounts[status] = 1;
      }
    }
  });
  return statusCounts;
};

  const fetchOverviewData = async (date) => {
    setIsLoading(true);
    try {
      const ordersResponse = await axios.get(`/api/orders/detailed-orders?date=${date}`);
      const pickPlansResponse = await axios.get(`/api/pickPlans?date=${date}`);
      const routesResponse = await axios.get(`/api/deliveryRoutes?date=${date}`);

      const orders = ordersResponse.data;
      const pickPlans = pickPlansResponse.data;
      const routes = routesResponse.data.routes || [];

      // Adding status counts to each pick plan
      const pickPlansWithStatusCounts = pickPlans.map(pickPlan => ({
        ...pickPlan,
        statusCounts: aggregateStatusCounts(pickPlan.items)
      }));


      // Adding status counts to each pick plan
      const routesWithStatusCounts = routes.map(route => ({
        ...route,
        statusCounts: aggregateRouteStatusCounts(route.stops, orders)
      }));

      const numberOfOrders = orders.length;
      const vendorIds = new Set();
      const itemQuantities = {};
      let totalRevenue = 0;

      orders.forEach(order => {
        order.items.forEach(item => {
          vendorIds.add(item.vendorLocationNumber);
          if (!itemQuantities[item.itemName]) {
            itemQuantities[item.itemName] = { quantity: 0, farmName: item.farmName };
          }
          itemQuantities[item.itemName].quantity += item.quantity;
          totalRevenue += item.quantity * item.itemUnitCost; // Assuming unitCost is available
        });
      });

      const numberOfVendors = vendorIds.size;
      const topItems = Object.entries(itemQuantities)
        .sort((a, b) => b[1].quantity - a[1].quantity)
        .slice(0, 5)
        .map(([itemName, details]) => ({
          itemName,
          quantity: details.quantity,
          farmName: details.farmName
        }));

      const pickPlanStatuses = pickPlans.map(plan => ({
        date: plan.date,
        user: plan.user ? plan.user.name : 'Unassigned',
        status: plan.status
      }));

      const routeStatuses = routes.map(route => ({
        startTime: route.startTime,
        driver: route.driver ? route.driver.name : 'Unassigned',
        stops: route.stops.length
      }));

      setOverviewData({
        pickPlansWithStatusCounts,
        routesWithStatusCounts,
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
    { Header: 'Farm Name', accessor: 'farmName' },
    { Header: 'Quantity', accessor: 'quantity' }
  ];

const pickPlanColumns = [

  {
    Header: 'User',
    accessor: 'user.name', // This is correct, assuming 'Picked' is correctly populated
    Cell: ({ row }) => {
      return row.user.name || 'Unassigned';  // Ensure zero is shown if undefined
    }
  },
  {
    Header: '# Not Picked',
    // There's no direct accessor for this because it's a computed value from all statuses except 'Picked'
    Cell: ({ row }) => {
      const pickedCount = row.statusCounts.Picked || 0;
      const totalCount = Object.values(row.statusCounts).reduce((sum, count) => sum + count, 0);
      const notPickedCount = totalCount - pickedCount;  // Subtract 'Picked' count from total to get 'Not Picked'
      return notPickedCount || 0;  // Ensure zero is shown if undefined
    }
  },
  {
    Header: '# Picked',
    accessor: 'statusCounts.Picked', // This is correct, assuming 'Picked' is correctly populated
    Cell: ({ row }) => {
      return row.statusCounts.Picked || 0;  // Ensure zero is shown if undefined
    }
  },
];

const routeColumns = [
  {
    Header: 'Start Time',
    accessor: 'startTime',
    Cell: ({ row }) => {
      const estTime = moment(row.startTime).tz('America/New_York').format('YYYY-MM-DD hh:mm A');
      return estTime;
    }
  },
  {
    Header: 'Driver',
    accessor: 'driver.name',
    Cell: ({ row }) => {
      return row.driver.name || 'Unassigned';  // Ensure it shows 'Unassigned' if undefined
    }
  },
    {
    Header: '# Order Pick in Progress',
    accessor: 'statusCounts.Order Pick in Progress', // Use 'Order Pick in Progress' from statusCounts
    Cell: ({ row }) => {
      return row.statusCounts['Order Pick in Progress'] || 0; // Ensure zero is shown if undefined
    }
  },
  {
    Header: '# Ready For Driver Pickup',
    accessor: 'statusCounts.Ready For Driver Pickup', // Use 'Order Pick in Progress' from statusCounts
    Cell: ({ row }) => {
      return row.statusCounts['Ready For Driver Pickup'] || 0; // Ensure zero is shown if undefined
    }
  },
  {
    Header: '# Out for Delivery',
    accessor: 'statusCounts.Out for Delivery', // Use 'Out for Delivery' from statusCounts
    Cell: ({ row }) => {
      return row.statusCounts['Out for Delivery'] || 0; // Ensure zero is shown if undefined
    }
  },
    {
    Header: '# Delivered',
    accessor: 'statusCounts.Delivered',
    Cell: ({ row }) => {
      return row.statusCounts.Delivered || 0;  // Ensure zero is shown if undefined
    }
  },
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
            <GenericTable data={overviewData.pickPlansWithStatusCounts} columns={pickPlanColumns} />
          </div>
          <div className="overview-routes">
            <h3>Route Status</h3>
            <GenericTable data={overviewData.routesWithStatusCounts} columns={routeColumns} />
          </div>
        </div>
      )}
    </div>
  );
};

export default OperationalOverview;
