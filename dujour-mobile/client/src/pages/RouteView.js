import React, { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import './AllPages.css';
import { AuthContext } from '../App.js';
import OverviewMap from './OverviewMap';
import { GenericTable } from './ReusableReactComponents';
import { GoogleMap, LoadScript } from '@react-google-maps/api';
import BarcodeScannerComponent from './BarcodeScannerComponent';
const moment = require('moment-timezone');

function RouteView() {
  const authContext = useContext(AuthContext);
  const dateInEST = moment().tz("America/New_York");
  const formattedDate = moment(dateInEST).format('YYYY-MM-DD');
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
  const [scanAction, setScanAction] = useState(null);  // 'pickup' or 'delivery'
  const [allOrdersPickedUp, setAllOrdersPickedUp] = useState(false);

  const handleDeliverClick = (order) => {
    setCurrentOrder(order);
    setScanAction('delivery');  // Set action as 'delivery'
    setShowScanner(true);
  };

  const handleBarcodeScanned = (barcode) => {
  setShowScanner(false);
  if (scanAction === 'pickup') {
    // Logic for pickup
    const expectedBarcodes = routeDetails.routes[0]?.stops.map(order => `Dujour-${order.masterOrderNumber}-${order.customerEmail}`);
    if (expectedBarcodes.includes(barcode)) {
      handlePickupPackage(routeDetails.routes[0]?.stops.find(order => `Dujour-${order.masterOrderNumber}-${order.customerEmail}` === barcode));
    } else {
      alert(`Invalid barcode for pickup. Expected one of ${expectedBarcodes.join(', ')}, got: ${barcode}`);
    }
  } else if (scanAction === 'delivery') {
    // Logic for delivery
    if (barcode === `Dujour-${currentOrder.masterOrderNumber}-${currentOrder.customerEmail}`) {
      if (window.confirm('Do you want to complete the delivery?')) {
        handleDeliverPackage(currentOrder);
      }
    } else {
      alert(`Expecting Barcode for delivery: Dujour-${currentOrder.masterOrderNumber}-${currentOrder.customerEmail}, but got: ${barcode}`);
    }
  }
};


const handlePickupPackage = async (order) => {
  try {
    console.log(`Picking up package for order ${order.orderId}`);
    const response = await axios.put(`/api/orders/pickupPackage/${order.orderId}`)
    // Log the successful update and update state accordingly
    console.log('Pickup status update response:', response.data);
    //setRouteDetails({ routes: [response.data.deliveryRoute] });
    if (response.status === 200) {
      alert('Pickup completed successfully!');
    }
    // Display a confirmation alert
    fetchRouteDetails();
  } catch (error) {
    console.error('Error delivering package:', error);
    alert('Failed to update the delivery status. Please try again.');
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
        console.log(formattedDate)
        //const dateForAPICall = 
        const response = await axios.get(`/api/deliveryRoutes/specificRoute?date=${formattedDate}&userId=${user._id}`);
        //console.log("API response:", response.data);
        setRoutePlanExists(response.data.exists);

        if (response.data.exists) {
          setRouteDetails({ routes: response.data.routes });
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
  // Check if route details are properly populated with at least one route
  if (routeDetails.routes.length > 0) {
    const stops = routeDetails.routes[0].stops;

    // Combine the stops with their statuses
    combineStopsWithStatuses(stops)
      .then(combinedStops => {
        setCombinedStops(combinedStops);

        // After successfully combining statuses, check if all orders are picked up
        const allPickedUp = combinedStops.every(stop => stop.orderStatus === 'Picked up by Driver');
        setAllOrdersPickedUp(allPickedUp);

        console.log("+++++++ Combined stops data:", combinedStops);
        console.log("All orders picked up:", allPickedUp);
      })
      .catch(error => {
        console.error('Failed to combine stops with statuses:', error);
      });
  } else {
    // If no routes are available, ensure dependent states are reset
    setCombinedStops([]);
    setAllOrdersPickedUp(false);
  }
}, [routeDetails]);


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

  const handleBack = () => {
    setCurrentStop(null);
  };

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
    console.log("(((")
    console.log(orderStatuses)
    return orderStatuses;
  } catch (error) {
    console.error('Failed to fetch order statuses:', error);
    throw error;  // Or handle this more gracefully if needed
  }
}

  const handleDeliverPackage = async (order) => {
  try {
    console.log(`Delivering package for order ${order.orderId}`);

    const response = await axios.put(`/api/orders/deliverPackage/${order.orderId}`)

    // Log the successful update and update state accordingly
    console.log('Delivery status update response:', response.data);
    //setRouteDetails({ routes: [response.data.deliveryRoute] });
    if (response.status === 200) {
      alert('Delivery completed successfully!');

      // Assuming the API returns the updated order object,
      // and it includes a status property you can check
      const updatedOrder = response.data.order;
      if (updatedOrder.overallStatus === 'Delivered') {
        setDeliveredOrders(prevOrders => [...prevOrders, updatedOrder]);
    }
  }
    // Display a confirmation alert
    fetchRouteDetails();
  } catch (error) {
    console.error('Error delivering package:', error);
    alert('Failed to update the delivery status. Please try again.');
  }
};

// Function to fetch route details
const fetchRouteDetails = async () => {
  try {
    const response = await axios.get(`/api/deliveryRoutes/specificRoute?date=${formattedDate}&userId=${user._id}`);
    setRouteDetails({ routes: response.data.routes });
    console.log("Data refetched successfully.");
  } catch (error) {
    console.error("Error fetching updated route details:", error);
  }
}

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
 console.log(combinedStops)

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
    accessor: row => `_id`,
    Cell: ({ row }) => {
      let buttonLabel = 'Pick Up';
      let buttonAction = () => {};
      let buttonDisabled = true; // Start with disabled true, modify based on conditions

      switch (row.orderStatus) {
        case 'Ready for Driver Pickup':
          buttonLabel = 'Pick Up';
          buttonAction = () => {
            setCurrentOrder(row);
            setCurrentStop(row);
            setScanAction('pickup');
            setShowScanner(true);
          };
          buttonDisabled = false;
          break;
        case 'Picked up by Driver':
          buttonLabel = 'Navigate';
          buttonAction = () => handleStatusUpdate(row);
          buttonDisabled = !allOrdersPickedUp; // Enable only if all orders are picked up
          break;
        case 'Out for Delivery':
          buttonLabel = 'Deliver';
          buttonAction = () => handleDeliverClick(row);
          buttonDisabled = false;
          break;
        case 'Delivered':
          buttonDisabled = true;
          break;
        default:
          buttonDisabled = true;
          break;
      }

      return (
        <div data-label="Actions">
          <button className="add-button" onClick={buttonAction} disabled={buttonDisabled}>
            {buttonLabel}
          </button>
        </div>
      );
    }
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

 return (
    <>
      {!isGoogleApiLoaded ? (
        <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}>
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
              <BarcodeScannerComponent actionType={scanAction} onScan={handleBarcodeScanned} />
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