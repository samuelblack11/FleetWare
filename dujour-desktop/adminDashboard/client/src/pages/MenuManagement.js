import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AllPages.css';
import { GenericTable, GenericPopup } from './ReusableReactComponents';

const ItemForm = ({ item, onSave, farms }) => {
  // Initialize form state with item data if editing, or blank for adding
  const [formState, setFormState] = useState({
    itemName: item ? item.itemName : '',
    unitCost: item ? item.unitCost : '',
    quantityAvailable: item ? item.quantityAvailable : '',
    farm: item && item.farm ? item.farm._id : ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormState(prevState => ({ ...prevState, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // API call to add or update item
    try {
      if (item) {
        await axios.put(`/api/items/${item._id}`, formState);
      } else {
        await axios.post('/api/items', formState);
      }
      onSave(); // Trigger fetching items and closing popup
    } catch (error) {
      console.error('Failed to save item:', error);
      // Handle error (show message to user, etc.)
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="itemName">Item Name:</label>
      <input
        id="itemName"
        name="itemName"
        type="text"
        value={formState.itemName}
        onChange={handleChange}
        required
      />
      <label htmlFor="unitCost">Unit Cost:</label>
      <input
        id="unitCost"
        name="unitCost"
        type="number"
        value={formState.unitCost}
        onChange={handleChange}
        required
      />
      <label htmlFor="quantityAvailable">Quantity Available:</label>
      <input
        id="quantityAvailable"
        name="quantityAvailable"
        type="number"
        value={formState.quantityAvailable}
        onChange={handleChange}
        required
      />

      <label htmlFor="farm">Farm:</label>
      <select
        id="farm"
        name="farm"
        value={formState.farm}
        onChange={handleChange}
        required
      >
        <option value="">Select a farm</option>
        {farms.map(farm => (
          <option key={farm._id} value={farm._id}>{farm.name}</option>
        ))}
      </select>

      <button type="submit" className="add-button">Save Item</button>
    </form>
  );
};

const FarmForm = ({ farm, onSave }) => {
  const [formState, setFormState] = useState({
    name: farm ? farm.name : '',
    vendorLocationNumber: farm ? farm.vendorLocationNumber : '',
    address: farm ? farm.address : '',
    contactNumber: farm ? farm.contactNumber : ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormState(prevState => ({ ...prevState, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // API call to add or update farm
    try {
      if (farm) {
        await axios.put(`/api/farms/${farm._id}`, formState);
      } else {
        await axios.post('/api/farms', formState);
      }
      onSave(); // Trigger fetching farms and closing popup
    } catch (error) {
      console.error('Failed to save farm:', error);
      // Handle error (show message to user, etc.)
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="name">Farm Name:</label>
      <input
        id="name"
        name="name"
        type="text"
        value={formState.name}
        onChange={handleChange}
        required
      />
      <label htmlFor="vendorLocationNumber">Stall #:</label>
      <input
        id="vendorLocationNumber"
        name="vendorLocationNumber"
        type="number"
        value={formState.vendorLocationNumber}
        onChange={handleChange}
        required
      />
      <label htmlFor="description">Description</label>
      <textarea
        id="description"
        name="description"
        type="text"
        value={formState.description}
        onChange={handleChange}
        rows="4"
        columns="70"
      />
      <label htmlFor="address">Address:</label>
      <input
        id="address"
        name="address"
        type="text"
        value={formState.address}
        onChange={handleChange}
        required
      />

      <label htmlFor="phoneNumber">Contact Number:</label>
      <input
        id="phoneNumber"
        name="phoneNumber"
        type="text"
        value={formState.phoneNumber}
        onChange={handleChange}
      />

      <label htmlFor="emailAddress">Email:</label>
      <input
        id="emailAddress"
        name="emailAddress"
        type="text"
        value={formState.emailAddress}
        onChange={handleChange}
      />

      <button type="submit" className="add-button">Save Farm</button>
    </form>
  );
};


const MenuManagement = () => {
    const [items, setItems] = useState([]);
    const [farms, setFarms] = useState([]);
    const [showItemPopup, setShowItemPopup] = useState(false);
    const [showFarmPopup, setShowFarmPopup] = useState(false);
    const [currentItem, setCurrentItem] = useState(null); // null for adding, object for editing
    const [currentFarm, setCurrentFarm] = useState(null);

    const ActiveStatusCheckbox = ({ isActive, onChange, itemId }) => {
    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <input
                type="radio"
                name={`activeStatus-${itemId}`}
                checked={isActive === true}
                onChange={() => onChange(true, itemId)}
                style={{ marginRight: 5 }}
            /> Yes
            <input
                type="radio"
                name={`activeStatus-${itemId}`}
                checked={isActive === false}
                onChange={() => onChange(false, itemId)}
                style={{ marginLeft: 20, marginRight: 5 }}
            /> No
        </div>
    );
};

const updateActiveStatus = async (newStatus, itemId) => {
    try {
        const response = await axios.put(`/api/items/${itemId}`, { activeStatus: newStatus });
        fetchItems(); // Re-fetch items to update the UI based on the new data
    } catch (error) {
        console.error('Error updating item:', error);
    }
};



    const columns = [
  {
    Header: 'Item Name',
    accessor: 'itemName', // The key from the item data
  },
    {
    Header: 'Unit Cost',
    accessor: 'unitCost', // The key from the item data
  },
  {
    Header: 'Farm',
    Cell: ({ row }) => row.farm ? row.farm.name : 'No Farm Assigned'
  },
  {
    Header: 'Quantity Available',
    accessor: 'quantityAvailable',
  },

  {
    Header: 'Active',
    accessor: 'activeStatus',
    Cell: ({ row }) => (
        <ActiveStatusCheckbox
            isActive={row.activeStatus}
            onChange={updateActiveStatus}
            itemId={row._id}
        />
    ),
  },

  {
    Header: 'Actions',
    accessor: 'actions',
    Cell: ({ row }) => (
      <>
        <button onClick={() => handleAddEditItem(row)} className="edit-btn">Edit</button>
        <button onClick={() => handleDeleteItem(row._id)} className="delete-btn">Delete</button>
      </>
    ),
  }
];

    const farmColumns = [
  {
    Header: 'Name',
    accessor: 'name', // The key from the item data
  },
    {
    Header: 'Stall #',
    accessor: 'vendorLocationNumber', // The key from the item data
  },
    {
    Header: 'Description',
    accessor: 'description', // The key from the item data
    },
    {
    Header: 'Address',
    accessor: 'address', // The key from the item data
  },
  {
    Header: 'Phone Number',
    accessor: 'phoneNumber',
  },
  {
    Header: 'Email',
    accessor: 'emailAddress',
  },
  {
    Header: 'Actions',
    accessor: 'actions',
    Cell: ({ row }) => (
      <>
        <button onClick={() => handleAddEditFarm(row)} className="edit-btn">Edit</button>
        <button onClick={() => handleDeleteFarm(row._id)} className="delete-btn">Delete</button>
      </>
    ),
  }
];

    useEffect(() => {
        fetchItems();
        fetchFarms();
    }, []);

    const fetchItems = async () => {
        try {
            const response = await axios.get('/api/items');
            setItems(response.data);
        } catch (error) {
            console.error('Failed to fetch items:', error);
        }
    };

    const fetchFarms = async () => {
        try {
            const response = await axios.get('/api/farms');
            setFarms(response.data);
        } catch (error) {
            console.error('Failed to fetch farms:', error);
        }
    };

    const handleAddEditItem = (item = null) => {
        setCurrentItem(item); // Set currentItem for editing, null for adding
        setShowItemPopup(true);
    };

    const handleAddEditFarm = (farm = null) => {
        setCurrentFarm(farm); // Set currentFarm for editing, null for adding
        setShowFarmPopup(true);
    };

    const handleCloseItemPopup = () => {
        setShowItemPopup(false);
        setCurrentItem(null); // Reset after closing
        fetchItems(); // Refresh items list
    };

    const handleCloseFarmPopup = () => {
        setShowFarmPopup(false);
        setCurrentFarm(null); // Reset after closing
        fetchFarms(); // Refresh farms list
    };

    const handleDeleteItem = async (id) => {
        try {
            await axios.delete(`/api/items/${id}`);
            fetchItems(); // Refresh items list after deletion
        } catch (error) {
            console.error('Failed to delete item:', error);
        }
    };


    const handleDeleteFarm = async (farmId) => {
    try {
        // Fetch all items
        const itemsResponse = await axios.get('/api/items');
        const items = itemsResponse.data;
        // Filter items by farm ID
        const itemsToDelete = items.filter(item => item.farm._id === farmId);

        // Delete each filtered item
        for (const item of itemsToDelete) {
            await axios.delete(`/api/items/${item._id}`);
        }
        fetchItems();
        // Delete the farm after all associated items are deleted
        await axios.delete(`/api/farms/${farmId}`);

        // Refresh farms list after deletion
        fetchFarms();
    } catch (error) {
        console.error('Failed to delete farm or its associated items:', error);
    }
};

    return (
        <div className="menu-management-container">
        <h3 class="page-header">Menu Management</h3>
        <div className="button-group">
            <button onClick={() => handleAddEditItem()} className="add-button">Add Menu Item</button>
            <button onClick={() => handleAddEditFarm()} className="add-button">Add Farm</button>
            </div>
            {showItemPopup && (
                <GenericPopup show={showItemPopup} onClose={handleCloseItemPopup}>
                    <ItemForm item={currentItem} farms={farms} onSave={handleCloseItemPopup} />
                </GenericPopup>
            )}

            {showFarmPopup && (
                <GenericPopup show={showFarmPopup} onClose={handleCloseFarmPopup}>
                    <FarmForm farm={currentFarm} onSave={handleCloseFarmPopup} />
                </GenericPopup>
            )}

            <div className="menu-items-table">
            <h3>Available Items</h3>
            <GenericTable 
                data={items} 
                columns={columns} 
                handleEditClick={handleAddEditItem} 
                deleteCargo={handleDeleteItem} 
                />
            </div>
            <div className="farms-table">
            <h3>Farms</h3>
            <GenericTable 
                data={farms} 
                columns={farmColumns} 
                handleEditClick={handleAddEditFarm} 
                deleteCargo={handleDeleteFarm} 
                />
            </div>
        </div>
    );
};
export default MenuManagement;
