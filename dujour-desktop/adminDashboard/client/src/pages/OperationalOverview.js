import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { GenericTable } from './ReusableReactComponents';
import './AllPages.css';

const OperationalOverview = () => {
  const today = new Date();
  const formattedDate = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
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
    console.log("Updated pickPlansWithStatusCounts:", overviewData?.pickPlansWithStatusCounts);
      console.log("Updated routesWithStatusCounts:", overviewData?.routesWithStatusCounts);
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
  console.log("======")
  console.log(statusCounts)
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

      console.log("::::::")
      console.log(routesWithStatusCounts)
      console.log(orders)

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

      pickPlans.forEach(pickPlan => {
        if (pickPlan.user && pickPlan.user.name) {
          console.log(`Driver Name: ${pickPlan.user.name}`);
        } else {
          console.log('Driver Name: Unassigned');
        }
      });

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

      //console.log("****")
      //console.log(pickPlans)
      //console.log("!!!!!")
      //console.log(pickPlanStatuses)
      console.log("%%%%%")
      console.log(pickPlansWithStatusCounts)
      console.log(pickPlansWithStatusCounts[0].user.name)

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
      //console.log("Row data in # Picked:", row);  // Log the row data accessed in this cell
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
      return formatEST(row.startTime);
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




  const formatEST = (utcDateString) => {
    // Parse the UTC date string
    const utcDate = new Date(utcDateString);
    // Check if the date is valid
    if (isNaN(utcDate)) {
      return 'Invalid Date';
    }

    // Convert to EST (Eastern Standard Time)
    // Note: toLocaleString with options is used for correct time zone conversion
    const estDate = new Date(utcDate.toLocaleString('en-US', { timeZone: 'America/New_York' }));

    // Get date components
    const year = estDate.getFullYear();
    const month = String(estDate.getMonth() + 1).padStart(2, '0');
    const day = String(estDate.getDate()).padStart(2, '0');

    // Get time components
    let hours = estDate.getHours();
    const minutes = String(estDate.getMinutes()).padStart(2, '0');
    const seconds = String(estDate.getSeconds()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    hours = String(hours).padStart(2, '0');

    // Format the date and time
    return `${month}/${day}/${year} ${hours}:${minutes}:${seconds} ${ampm}`;
  };

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
