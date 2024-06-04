import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import './AllPages.css';
import { AuthContext } from '../App.js';
import OverviewMap from './OverviewMap';
import InteractiveMap from './InteractiveMap';
import { GenericTable } from './ReusableReactComponents';

function RouteView() {
  const authContext = useContext(AuthContext);
  const today = new Date();
  const formattedDate = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
  const { user } = useContext(AuthContext);
  const [routeDetails, setRouteDetails] = useState({ routes: [] });
  const [orders, setOrders] = useState([]);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [routePlanExists, setRoutePlanExists] = useState(false);
  const [deliveredOrders, setDeliveredOrders] = useState([]);
  const [completedOrders, setCompletedOrders] = useState([]);
  const [showMap, setShowMap] = useState(false);
  const [currentStop, setCurrentStop] = useState(null);

  const handleBounceBack = () => {
    const container = document.querySelector('.table-container');
    if (container) {
      const maxScrollLeft = container.scrollWidth - container.clientWidth;

      if (container.scrollLeft > 0) {
        container.scrollLeft = 0;
      } else if (container.scrollLeft < maxScrollLeft) {
        container.scrollLeft = maxScrollLeft;
      }
    }
  };

  useEffect(() => {
    const container = document.querySelector('.table-container');
    if (container) {
      container.addEventListener('scroll', handleBounceBack);
    }

    return () => {
      if (container) {
        container.removeEventListener('scroll', handleBounceBack);
      }
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !user._id) {
        return;
      }

      console.log("Fetching data with formattedDate:", formattedDate, "and driver email:", user.email);
      
      try {
        const response = await axios.get(`/api/deliveryRoutes/specificRoute?date=${formattedDate}&userId=${user._id}`);
        console.log("API response:", response.data);
        setRoutePlanExists(response.data.exists);

        if (response.data.exists) {
          setRouteDetails({ routes: response.data.routes });
          updateDeliveredOrders(response.data.routes[0].stops);
        } else {
          setRouteDetails({ routes: [] });
        }
      } catch (error) {
        console.error("Error fetching route details:", error);
        setRouteDetails({ routes: [] });
      }
    };

    fetchData();

    const handler = setTimeout(fetchData, 500);
    return () => clearTimeout(handler);
  }, [user, formattedDate]);

  useEffect(() => {}, [routeDetails]);

  const updateDeliveredOrders = (stops) => {
    const deliveredOrders = stops.reduce((acc, stop) => {
      acc[stop.masterOrderNumber] = acc[stop.masterOrderNumber] || [];
      acc[stop.masterOrderNumber].push(stop.status === 'Delivered');
      return acc;
    }, {});

    const fullyDelivered = Object.keys(deliveredOrders).filter(orderNumber => 
      deliveredOrders[orderNumber].every(status => status)
    );

    setDeliveredOrders(fullyDelivered);
    console.log("Fully Delivered Orders updated:", fullyDelivered);
  };

  const handleStatusUpdate = async (stop) => {
    try {
      let updatedStops;
      if (stop.status === 'Out for Delivery') {
        updatedStops = routeDetails.routes[0].stops.map(s => 
          s._id === stop._id ? { ...s, status: 'Scheduled' } : s
        );
      } else {
        updatedStops = routeDetails.routes[0].stops.map(s => ({
          ...s,
          status: 'Out for Delivery'
        }));
      }

      const response = await axios.put('/api/deliveryRoutes/updateDeliveryStatus', {
        deliveryRouteId: routeDetails.routes[0]._id,
        stops: updatedStops
      });

      console.log('Status update response:', response.data);
      setRouteDetails({ routes: [response.data.deliveryRoute] });
      updateDeliveredOrders(response.data.deliveryRoute.stops);
      updateCompletedOrders(response.data.deliveryRoute.stops);

      if (stop.status !== 'Out for Delivery') {
        // Open navigation to the address of the clicked stop
        setShowMap(true);
        setCurrentStop(stop);
      }
    } catch (error) {
      console.error('Error updating delivery status:', error);
    }
  };

  const handleBack = () => {
    setShowMap(false);
    setCurrentStop(null);
  };

  const handleDeliverPackage = async () => {
    try {
      // Deliver the package logic here
      console.log(`Delivering package for stop ${currentStop._id}`);
      // Update stop status to 'Delivered'
      const updatedStops = routeDetails.routes[0].stops.map(s => 
        s._id === currentStop._id ? { ...s, status: 'Delivered' } : s
      );

      const response = await axios.put('/api/deliveryRoutes/updateDeliveryStatus', {
        deliveryRouteId: routeDetails.routes[0]._id,
        stops: updatedStops
      });

      console.log('Delivery status update response:', response.data);
      setRouteDetails({ routes: [response.data.deliveryRoute] });
      updateDeliveredOrders(response.data.deliveryRoute.stops);
      updateCompletedOrders(response.data.deliveryRoute.stops);
      setShowMap(false);
    } catch (error) {
      console.error('Error delivering package:', error);
    }
  };

  const updateCompletedOrders = (stops) => {
    const deliveredOrders = stops.reduce((acc, stop) => {
      if (!acc[stop.masterOrderNumber]) {
        acc[stop.masterOrderNumber] = {
          orderID: stop.orderId,
          statuses: []
        };
      }
      acc[stop.masterOrderNumber].statuses.push(stop.status === 'Delivered');
      return acc;
    }, {});

    const completed = Object.keys(deliveredOrders).filter(masterOrderNumber => 
      deliveredOrders[masterOrderNumber].statuses.every(status => status)
    ).map(masterOrderNumber => ({
      masterOrderNumber,
      orderID: deliveredOrders[masterOrderNumber].orderID,
      status: 'Order Delivered'
    }));

    setCompletedOrders(completed);
  };

  function reformatDate(selectedDate) {
    const dateParts = selectedDate.split('-');
    const year = dateParts[0].substr(2);
    const month = dateParts[1];
    const day = dateParts[2];
    return `${month}/${day}/${year}`;
  }

  const columns = [
    { 
      Header: 'Order #', 
      accessor: 'masterOrderNumber', 
      Cell: ({ row }) => <span data-label="Order #">{row.masterOrderNumber}</span> 
    },
    { 
      Header: 'Address', 
      accessor: 'address', 
      Cell: ({ row }) => <span data-label="Address">{row.address}</span> 
    },
    {
      Header: 'Status',
      accessor: 'status',
      Cell: ({ row }) => (
        <span data-label="Status">{row.status}</span>
      )
    },
    {
      Header: 'Actions',
      Cell: ({ row }) => (
        <div data-label="Actions">
          <button className="add-button" onClick={() => handleStatusUpdate(row)}>
            {row.status === 'Out for Delivery' ? 'Revert Status' : 'Navigate'}
          </button>
        </div>
      )
    }
  ];

  return (
    <div>
      {showMap ? (
        <InteractiveMap 
          stop={currentStop}
          stops={routeDetails.routes[0]?.stops || []}
          onBack={handleBack}
          onDeliver={handleDeliverPackage}
        />
      ) : (
        <>
          <h2>Route Plan for {reformatDate(formattedDate)}</h2>
          {routeDetails.routes.length > 0 ? (
            <>
              <OverviewMap stops={routeDetails.routes[0].stops} />
              <div className="table-container">
                <GenericTable data={routeDetails.routes[0].stops} columns={columns} fullyPickedOrders={deliveredOrders} />
              </div>
            </>
          ) : (
            <p>No delivery route available for this date.</p>
          )}
        </>
      )}
    </div>
  );
}

export default RouteView;

