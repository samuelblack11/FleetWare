import React, { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import { GenericTable, GenericPopup, DetailedOrderPopup} from './ReusableReactComponents';
import './AllPages.css';
import { AuthContext } from '../App.js';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import QRCode from 'qrcode';
import logo from '../assets/logo128.png';
const moment = require('moment-timezone');
import ReactDatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

const OrderForm = ({ order, onSave, onClose, isEditable }) => {
  const initialState = order || {
    customerName: '',
    customerEmail: '',
    deliveryAddress: '',
    deliveryDate: '',
    items: [{ itemName: '', quantity: '', pickupAddress: '' }],
  };

  const [orderData, setOrderData] = useState(initialState);

  const handleChange = (e, index) => {
    if (index !== undefined) {
      // Handle change for items array
      const updatedItems = orderData.items.map((item, i) => 
        i === index ? { ...item, [e.target.name]: e.target.value } : item
      );
      setOrderData({ ...orderData, items: updatedItems });
    } else {
      // Handle change for other fields
      setOrderData({ ...orderData, [e.target.name]: e.target.value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const method = order ? 'put' : 'post';
      const url = order ? `/api/orders/${order._id}` : '/api/orders';
      await axios[method](url, orderData);
      onSave(); // Close the popup and refresh the list
    } catch (error) {
      console.error('Error saving order:', error);
    }
  };

  const addItemField = () => {
    const newItem = { itemName: '', quantity: '', pickupAddress: '' };
    setOrderData({ ...orderData, items: [...orderData.items, newItem] });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Customer Name:</label>
        <input type="text" name="customerName" value={orderData.customerName} onChange={handleChange} readOnly={!isEditable} />
      </div>
      <div>
        <label>Customer Email:</label>
        <input type="text" name="customerEmail" value={orderData.customerEmail} onChange={handleChange} readOnly={!isEditable} />
      </div>
      <div>
        <label>Order Status</label>
        <input type="text" name="overallStatus" value={orderData.overallStatus} onChange={handleChange} readOnly={!isEditable} />
      </div>
      <div>
      <div>
        <label>Total Cost:</label>
        <input type="number" name="totalCost" value={orderData.totalCost} onChange={handleChange} readOnly={!isEditable} />
      </div>
        <label>Delivery Address:</label>
        <input type="text" name="deliveryAddress" value={orderData.deliveryAddress} onChange={handleChange} readOnly={!isEditable} />
      </div>
      <div>
        <label>Delivery Date:</label>
        <input type="date" name="deliveryDate" value={orderData.deliveryDate} onChange={handleChange} readOnly={!isEditable} />
      </div>
      {orderData.items.map((item, index) => (
        <div key={index}>
          <label>Item Name:</label>
          <input type="text" name="itemName" value={item.itemName} onChange={(e) => handleChange(e, index)} readOnly={!isEditable} />
          <label>Quantity:</label>
          <input type="number" name="quantity" value={item.quantity} onChange={(e) => handleChange(e, index)} readOnly={!isEditable} />
          <label>Pickup Address:</label>
          <input type="text" name="pickupAddress" value={item.pickupAddress} onChange={(e) => handleChange(e, index)} readOnly={!isEditable} />
        </div>
      ))}
      <button type="button" onClick={addItemField} className="add-button">Ok</button>
    </form>
  );
};

const OrderManagement = ({ mode }) => {
  const [orders, setOrders] = useState([]);
  const [showOrderPopup, setShowOrderPopup] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [filterField, setFilterField] = useState('');
  const [filterValue, setFilterValue] = useState('');
  const [editingRowIndex, setEditingRowIndex] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const { user } = useContext(AuthContext); // Get user info from context
  const [filterDate, setFilterDate] = useState(null);

  useEffect(() => {
    console.log("****")
    console.log("Current mode:", mode);
    if (mode === 'myOrders') {
      fetchMyOrders(); // Function to fetch only the current user's orders
    } else {
      fetchOrders(); // Fetch all orders
    }
  }, [mode]);

    const fetchMyOrders = async () => {
      try {
        const allOrdersResponse = await axios.get('/api/orders');
        const myOrders = allOrdersResponse.data.filter(order => order.customerEmail === user.email);
        setOrders(myOrders);
      } catch (error) {
        console.error('Error fetching orders:', error);
      }
    };

  const fetchOrders = async () => {
    try {
      const response = await axios.get('/api/orders');
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const handleEditClick = (rowIndex, currentStatus) => {
  setEditingRowIndex(rowIndex);
  setNewStatus(currentStatus);
};

const handleStatusChange = async (rowIndex, orderId) => {
  try {
    await axios.put(`/api/orders/${orderId}`, { overallStatus: newStatus });
    fetchOrders(); // Refresh orders after update
    setEditingRowIndex(null); // Exit editing mode
  } catch (error) {
    console.error('Error updating order status:', error);
  }
};

const handleCancelEdit = () => {
  setEditingRowIndex(null); // Exit editing mode
};

  const handleSaveOrder = async (orderData) => {
    const method = orderData._id ? 'put' : 'post';
    const url = orderData._id ? `/api/orders/${orderData._id}` : '/api/orders';

    try {
      await axios[method](url, orderData);
      fetchOrders();
    } catch (error) {
      console.error('Error saving order:', error);
    }
    setShowOrderPopup(false);
  };

  const deleteOrder = async (id) => {
    try {
      await axios.delete(`/api/orders/${id}`);
      fetchOrders(); // Refresh the list after deletion
    } catch (error) {
      console.error('Error deleting order:', error);
    }
  };

const filteredOrders = orders.filter(order => {
  // Return all orders if no filter field is selected or no value/date is set
  if (!filterField || (!filterValue && !filterDate)) {
    return true;
  }

  // Special handling for date filtering
  if (filterField === 'deliveryDate' && filterDate) {
    // Normalize both dates to the start of the day for a fair comparison
    const orderDate = new Date(order.deliveryDate).setHours(0, 0, 0, 0);
    const selectedDate = new Date(filterDate).setHours(0, 0, 0, 0);
    return orderDate === selectedDate;
  }

  // Handle other fields assuming they are strings
  if (filterValue) {
    const orderValue = String(order[filterField]).toLowerCase();
    return orderValue.includes(filterValue.toLowerCase());
  }

  return false;
});


const statusOptions = [
  'Order Confirmed', 
  'Preparing for Order Pick', 
  'Order Pick in Progress', 
  'Ready for Driver Pick Up', 
  'Out for Delivery', 
  'Delivered'
];

  const columns = [
  { Header: 'Customer Name', accessor: 'customerName' },
  { Header: 'Customer Email', accessor: 'customerEmail' },
    {
    Header: 'Order Status',
    accessor: 'overallStatus',
    Cell: ({ row, rowIndex }) => {
      if (editingRowIndex === rowIndex) {
        return (
          <select
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        );
      }
      return row.overallStatus;
    }
  },
    {
    Header: 'Order Cost',
    accessor: 'totalCost',
    Cell: ({ row }) => `$${parseFloat(row.totalCost.toFixed(2))}`
  },
  { Header: 'Delivery Address', accessor: 'deliveryAddress' },
    {
    Header: 'Delivery Date',
    accessor: 'deliveryDate',
    Cell: ({ row }) => {
      const date = new Date(row.deliveryDate);
      const formattedDate = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York'
      }).format(date);
      return formattedDate;
    }
  },
{
  Header: 'Actions',
  accessor: 'actions', // Assigning a unique accessor for the actions column
  Cell: ({ row }) => {
    const isDraft = row.overallStatus === 'draft';
    return (
      <>
        <button onClick={() => {
          setCurrentOrder(row);
          setShowOrderPopup(true);
        }} className="edit-btn">{isDraft && mode === 'myOrders' ? 'View/Update' : 'View'}</button>
      {mode !== 'myOrders' && <button onClick={() => {
        deleteOrder(row._id); // Assuming row.original contains your order data
      }} className="delete-btn">Delete</button>}
      </>
    );
  }
},
  {
    Header: 'Print',
    id: 'print',
    accessor: 'print',
    Cell: ({ row }) => (
      <>
        <button className="add-button" onClick={() => generateAndOpenPDF(row)}>Print Label</button>
      </>
    )
  }
  ];

const generateAndOpenPDF = async (order) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const barcodeData = `Dujour-${order.masterOrderNumber}-${order.customerEmail}`;

  // Convert QR code to data URL
  const qrCodeDataURL = await QRCode.toDataURL(barcodeData, { errorCorrectionLevel: 'H' });
  
  // Define HTML content with appropriate styling for QR code and content
  const labelContent = `
    <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px; width: 190mm;">
      <img src="${logo}" alt="Logo" style="width: 100px;"/> <!-- Ensure logo variable is correctly defined -->
      <h2>Dujour Delivery</h2>
      <p>${order.customerName}</p>
      <p>${order.deliveryAddress}</p>
      <p><strong>Delivery Date:</strong> ${new Date(order.deliveryDate).toLocaleDateString()}</p>
      <img src="${qrCodeDataURL}" style="width: 100px; margin-top: 10px;"/>
    </div>
  `;

  // Render the HTML content to a temporary div element
  const tempDiv = document.createElement("div");
  tempDiv.style.position = 'absolute';
  tempDiv.style.left = '-9999px';
  tempDiv.innerHTML = labelContent;
  document.body.appendChild(tempDiv);

  // Convert HTML to canvas with a higher scale for better QR code quality
  const canvas = await html2canvas(tempDiv, {
    scale: 3, // Improve quality
    logging: true,
    useCORS: true
  });
  document.body.removeChild(tempDiv);

  // Convert canvas to data URL
  const imgData = canvas.toDataURL('image/png');

  // Ensure the PDF fits the image; adjust sizes and margins accordingly
  doc.addImage(imgData, 'PNG', 10, 10, doc.internal.pageSize.getWidth() - 20, canvas.height / canvas.width * (doc.internal.pageSize.getWidth() - 20));
  
  // Open PDF in a new window
  window.open(doc.output('bloburl'), '_blank');
};



  return (
    <div>
      <h3 className="page-header">{mode == 'myOrders' ? 'My Orders' : 'Order Management'}</h3>
      <div>
  <select value={filterField} onChange={(e) => {
    setFilterField(e.target.value);
    // Reset values appropriately when changing filter types
    setFilterValue('');
    setFilterDate(null);
  }}>
    <option value="">Select a field to filter by</option>
    <option value="customerName">Customer Name</option>
    <option value="overallStatus">Order Status</option>
    <option value="deliveryAddress">Delivery Address</option>
    <option value="deliveryDate">Delivery Date</option>
  </select>
  {filterField === 'deliveryDate' ? (
    <ReactDatePicker
      selected={filterDate}
      onChange={date => setFilterDate(date)}
      dateFormat="yyyy-MM-dd"
    />
  ) : (
    <input
      type="text"
      placeholder="Filter value"
      value={filterValue}
      onChange={(e) => setFilterValue(e.target.value)}
    />
  )}
</div>

      <GenericTable data={filteredOrders} columns={columns} />
      {showOrderPopup && (
      <DetailedOrderPopup
        show={showOrderPopup}
        order={currentOrder}
        onClose={() => setShowOrderPopup(false)}
      />
    )}
    </div>
  );
};

export default OrderManagement;