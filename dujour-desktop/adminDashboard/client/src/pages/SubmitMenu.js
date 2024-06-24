import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../App';
import './AllPages.css';
import { GenericTable, GenericPopup } from './ReusableReactComponents';

const ItemForm = ({ item, onSave }) => {
  const [formState, setFormState] = useState({
    itemName: item ? item.itemName : '',
    unitCost: item ? item.unitCost : '',
    originalQuantity: item ? item.originalQuantity : '',
    quantityAvailable: item ? item.quantityAvailable : '',
  });
    const { user } = useContext(AuthContext); // Access the user context

    const getNextSaturday = (currentDate) => {
    const date = new Date(currentDate);
    const dayOfWeek = date.getDay();

    if (dayOfWeek === 5 || dayOfWeek === 6) {
        // If today is Friday or Saturday, add enough days to reach the next week's Saturday
        date.setDate(date.getDate() + (13 - dayOfWeek));
    } else {
        // Otherwise, just find the next Saturday
        date.setDate(date.getDate() + (6 - dayOfWeek));
    }

    // Format and return the date as "MM/dd/yyyy"
    return date.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
};

  useEffect(() => {
    if (item) {
      setFormState({
        itemName: item.itemName,
        unitCost: item.unitCost,
        quantityAvailable: item.quantityAvailable,
      });
    }
  }, [item]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormState(prevState => ({
         ...prevState,
         [name]: value,
        originalQuantity: name === 'quantityAvailable' ? value : prevState.originalQuantity
        }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const farmResponse = await axios.get(`/api/farms/byname/${encodeURIComponent(user.name)}`);
      const farm = farmResponse.data;

      const itemData = {
        ...formState,
        farm: farm._id,
        originalQuantity: formState.quantityAvailable,
        forDeliveryOn: new Date(getNextSaturday(new Date())),
        activeStatus: false
      };

      const apiPath = item ? `/api/items/${item._id}` : '/api/items';
      const method = item ? axios.put : axios.post;
      await method(apiPath, itemData);
      onSave(); // Refresh items after saving
    } catch (error) {
      console.error('Failed to save item:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="itemName">Item Name:</label>
      <input id="itemName" name="itemName" type="text" value={formState.itemName} onChange={handleChange} required />
      <label htmlFor="unitCost">Unit Cost:</label>
      <input id="unitCost" name="unitCost" type="number" value={formState.unitCost} onChange={handleChange} required />
      <label htmlFor="quantityAvailable">Quantity Available:</label>
      <input id="quantityAvailable" name="quantityAvailable" type="number" value={formState.quantityAvailable} onChange={handleChange} required />
      <button type="submit" className="add-button">Save Item</button>
    </form>
  );
};

const SubmitMenu = () => {
    const { user } = useContext(AuthContext);
    const [items, setItems] = useState([]);
    const [showItemPopup, setShowItemPopup] = useState(false);
    const [currentItem, setCurrentItem] = useState(null);

    useEffect(() => {
        fetchItems();
    }, []);

    const fetchItems = async () => {
        try {
            const response = await axios.get('/api/items');
            setItems(response.data.filter(item => item.farm && item.farm.name === user.name));
        } catch (error) {
            console.error('Failed to fetch items:', error);
        }
    };

    const handleAddEditItem = (item = null) => {
        setCurrentItem(item);
        setShowItemPopup(true);
    };

    const handleCloseItemPopup = () => {
        setShowItemPopup(false);
        setCurrentItem(null);
        fetchItems();
    };

    const handleDeleteItem = async (id) => {
        try {
            await axios.delete(`/api/items/${id}`);
            fetchItems();
        } catch (error) {
            console.error('Failed to delete item:', error);
        }
    };

    const columns = [
        { Header: 'Item Name', accessor: 'itemName' },
        { Header: 'Unit Cost', accessor: 'unitCost' },
        { Header: 'Original Quantity', accessor: 'originalQuantity' },
        { Header: 'Quantity Available', accessor: 'quantityAvailable' },
        { Header: 'Active', accessor: 'activeStatus', Cell: ({ row }) => row.activeStatus ? 'Yes' : 'No' },
        { Header: 'Actions', Cell: ({ row }) => (
        <>
            <button onClick={() => handleAddEditItem(row)} className="edit-btn" disabled={row.activeStatus}>Edit</button>
            <button onClick={() => handleDeleteItem(row._id)} className="delete-btn" disabled={row.activeStatus}>Delete</button>
        </>
        )}
    ];


const getNextSaturday = (currentDate) => {
    const date = new Date(currentDate);
    const dayOfWeek = date.getDay();

    if (dayOfWeek === 5 || dayOfWeek === 6) {
        // If today is Friday or Saturday, add enough days to reach the next week's Saturday
        date.setDate(date.getDate() + (13 - dayOfWeek));
    } else {
        // Otherwise, just find the next Saturday
        date.setDate(date.getDate() + (6 - dayOfWeek));
    }

    // Format and return the date as "MM/dd/yyyy"
    return date.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
};

    return (
        <div className="menu-management-container">
            <h3>Weekly Menu Submission for {user.name}</h3>
            <h4>For Delivery On: {getNextSaturday(new Date())}</h4>
            <button onClick={() => handleAddEditItem()} className="add-button">Add New Menu Item</button>
            {showItemPopup && (
                <GenericPopup show={showItemPopup} onClose={handleCloseItemPopup}>
                    <ItemForm item={currentItem} onSave={handleCloseItemPopup} />
                </GenericPopup>
            )}
            <div className="menu-items-table">
                <GenericTable data={items} columns={columns} />
            </div>
        </div>
    );
};

export default SubmitMenu;
