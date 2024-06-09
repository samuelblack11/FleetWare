import React, { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import './AllPages.css';
import { AuthContext } from '../App.js';
import OverviewMap from './OverviewMap';
import { GenericTable } from './ReusableReactComponents';
import { LoadScript } from '@react-google-maps/api';
import BarcodeScannerComponent from './BarcodeScannerComponent';
const config = require('../config');

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
  const [currentStop, setCurrentStop] = useState(null);
  const [stopsData, setStopsData] = useState([]);
  const [combinedStops, setCombinedStops] = useState([]);
  const [allOrdersReadyForNavigation, setAllOrdersReadyForNavigation] = useState(false);
  const directionsRendererRef = useRef(null);
  // State definitions
  const [currentLocation, setCurrentLocation] = useState(null);
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);
  const isGoogleApiLoaded = window.google && window.google.maps;

  const handleDeliverClick = (order) => {
    setCurrentOrder(order);
    setShowScanner(true);
  };

  const handleBarcodeScanned = (barcode) => {
    setShowScanner(false);
    if (barcode === `${currentOrder.masterOrderNumber}-${currentOrder.email}`) {
      // Confirm delivery
      if (window.confirm('Do you want to complete the delivery?')) {
        handleDeliverPackage(currentOrder);
      }
    } else {
      alert('Barcode does not match.');
    }
  };

  const handleCloseScanner = () => {
        setShowScanner(false); // Function to close the scanner
    };

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
  getCurrentLocation().then(location => {
    setCurrentLocation(location);
  }).catch(error => {
    console.error('Error getting current location:', error);
  });
}, []);  // Empty dependency array to run only once after the component mounts


  useEffect(() => {
  // Check if all orders are 'Ready for Driver Pickup'
  const areAllOrdersReady = combinedStops.every(stop => stop.orderStatus === 'Ready for Driver Pickup' || 'Out for Delivery');
  setAllOrdersReadyForNavigation(areAllOrdersReady);
  }, [combinedStops]); // Dependency on combinedStops to re-evaluate when stops data changes

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !user._id) {
        return;
  }
      //console.log("Fetching data with formattedDate:", formattedDate, "and driver email:", user.email);
      
      try {
        const response = await axios.get(`/api/deliveryRoutes/specificRoute?date=${formattedDate}&userId=${user._id}`);
        //console.log("API response:", response.data);
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

  useEffect(() => {
    // Assuming routeDetails is already populated
    if (routeDetails && routeDetails.routes.length > 0) {
      const stops = routeDetails.routes[0].stops;
      combineStopsWithStatuses(stops)
        .then(setCombinedStops)
        .catch(error => console.error('Failed to combine stops with statuses:', error));
    }
  }, [routeDetails]);



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
    //console.log("Fully Delivered Orders updated:", fullyDelivered);
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

    let stopList = [stop];
    const orderStatusForStop = await getOrderStatusesFromStops(stopList);

    // If the stop is ready for navigation, open Google Maps with directions
    if (orderStatusForStop[0] === 'Ready for Driver Pickup' || orderStatusForStop[0] === 'Out for Delivery') {
      // Open Google Maps for directions
      const destination = {
        lat: stop.latitude, 
        lng: stop.longitude
      };
      openGoogleMaps(destination.lat, destination.lng);
    }
  } catch (error) {
    console.error('Error updating delivery status:', error);
  }
};

function openGoogleMaps(lat, lng) {
  const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  window.open(url, '_blank'); // Open in a new tab
}



  async function getOrderStatusesFromStops(stops) {
  const orderIds = stops.map(stop => stop.orderId);

  // Perform an HTTP POST request to the new route with the order IDs
  try {
    const response = await axios.post('/api/orders/order-statuses', {
      orderIDs: orderIds  // Send orderIds as part of the request body
    });
    const orderStatusMap = response.data.reduce((map, status) => {
      map[status.orderId] = status.status;  // Map orderId to status
      return map;
    }, {});

    // Map each stop to its corresponding order status
    const orderStatuses = stops.map(stop => orderStatusMap[stop.orderId] || 'Status Not Found');
    //console.log(orderStatuses)
    return orderStatuses;
  } catch (error) {
    console.error('Failed to fetch order statuses:', error);
    throw error;  // Or handle this more gracefully if needed
  }
}


  const handleBack = () => {
    setCurrentStop(null);
  };

  const handleDeliverPackage = async (order) => {
  try {
    console.log(`Delivering package for order ${order.masterOrderNumber}`);
    
    // Find the stop in the route details that matches the current order
    const updatedStops = routeDetails.routes[0].stops.map(stop => {
      if (stop._id === order._id) {
        return { ...stop, status: 'Delivered' }; // Update the status to 'Delivered'
      }
      return stop;
    });

    // Send the updated stops to the backend to update the delivery route
    const response = await axios.put('/api/deliveryRoutes/updateDeliveryStatus', {
      deliveryRouteId: routeDetails.routes[0]._id,
      stops: updatedStops
    });

    // Log the successful update and update state accordingly
    console.log('Delivery status update response:', response.data);
    setRouteDetails({ routes: [response.data.deliveryRoute] });
    updateDeliveredOrders(response.data.deliveryRoute.stops);
    updateCompletedOrders(response.data.deliveryRoute.stops);

    // Display a confirmation alert
    alert('Delivery completed successfully!');
  } catch (error) {
    console.error('Error delivering package:', error);
    alert('Failed to update the delivery status. Please try again.');
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

  async function combineStopsWithStatuses(stops) {
  // Get the order statuses for the given stops
  const orderStatuses = await getOrderStatusesFromStops(stops);

  // Combine the stops with their corresponding order statuses
  const combinedStops = stops.map((stop, index) => ({
    ...stop,
    orderStatus: orderStatuses[index] // Add the status to each stop
  }));
 // console.log(combinedStops)

  return combinedStops;
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
      accessor: 'orderStatus',
      Cell: ({ row }) => (
        <span data-label="Status">{row.orderStatus}</span>
      )
    },
    {
      Header: 'Actions',
      Cell: ({ row }) => (
        <div data-label="Actions">
          <button className="add-button" onClick={() => handleStatusUpdate(row)}
            disabled={row.orderStatus !== 'Out for Delivery'}>
            Navigate
          </button>
          <button className="add-button" onClick={() => handleDeliverClick(row)}
            disabled={row.orderStatus !== 'Out for Delivery'}>
            Deliver
          </button>
        </div>
      )
    }
  ];


function getCurrentLocation() {
    return new Promise((resolve, reject) => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                position => {
                    resolve({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                },
                err => {
                    reject(err);
                }
            );
        } else {
            reject(new Error('Geolocation is not supported by this browser.'));
        }
    });
}

const handleNavigate = (destinationAddress) => {
  setSelectedDestination({ lat: destinationAddress.latitude, lng: destinationAddress.longitude });
};


function updateMapDirections(origin, destination) {
    const directionsService = new window.google.maps.DirectionsService();
    const request = {
        origin: origin,  // current location
        destination: destination,  // stop's location
        travelMode: window.google.maps.TravelMode.DRIVING,
    };
    directionsService.route(request, (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK) {
            // Assuming you have a reference to a DirectionsRenderer component
            directionsRendererRef.current.setDirections(result);
        } else {
            console.error("Error fetching directions", result);
        }
    });
}

 return (
    <>
      {!isGoogleApiLoaded ? (
        <LoadScript googleMapsApiKey={config.googleMapsApiKey}>
          <Content />
        </LoadScript>
      ) : (
        <Content />
      )}
    </>
  );

  function Content() {
    return (
      <div style={{ position: 'relative' }}> {/* Ensure this div is relatively positioned */}
        <h2>Route Plan for {reformatDate(formattedDate)}</h2>
        {routeDetails.routes.length > 0 ? (
          <>
            <OverviewMap stops={routeDetails.routes[0]?.stops || []} />
            <div className="table-container">
              <GenericTable data={combinedStops} columns={columns} fullyPickedOrders={deliveredOrders} />
            </div>
          </>
        ) : (
          <p>No delivery route available for this date.</p>
        )}
        {showScanner && 
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0, 0, 0, 0.5)' }}>
            <BarcodeScannerComponent onScan={handleBarcodeScanned} />
            <button onClick={handleCloseScanner} style={{
              position: 'absolute',
              top: 20,
              left: 20,
              padding: '10px 20px',
              fontSize: '16px',
              color: '#fff',
              backgroundColor: '#f00',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
                    }}>
              Close Scanner
            </button>
          </div>
        }
      </div>
    );
  }
}









export default RouteView;

