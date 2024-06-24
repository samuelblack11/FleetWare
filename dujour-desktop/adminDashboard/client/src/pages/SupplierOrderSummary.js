import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../App';
import './AllPages.css';
import { GenericTable } from './ReusableReactComponents';

const getSaturdays = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    let thisSaturday = new Date(today);
    let nextSaturday = new Date(today);

    thisSaturday.setDate(today.getDate() + (6 - dayOfWeek));  // Always the nearest Saturday
    nextSaturday.setDate(today.getDate() + (13 - dayOfWeek)); // The Saturday after the nearest

    return {
        thisSaturday: thisSaturday.toISOString().split('T')[0],
        nextSaturday: nextSaturday.toISOString().split('T')[0]
    };
};


const SupplierWeeklyOrderSummary = () => {
    const { user } = useContext(AuthContext);
    const [ordersSummaryThisSaturday, setOrdersSummaryThisSaturday] = useState([]);
    const [ordersSummaryNextSaturday, setOrdersSummaryNextSaturday] = useState([]);
    const [farmId, setFarmId] = useState(null);
    const { thisSaturday, nextSaturday } = getSaturdays();

const fetchFarmIdByName = async (farmName) => {
    try {
        const response = await axios.get(`/api/farms/byname/${encodeURIComponent(farmName)}`);
        return response.data._id;  // Assuming the farm object has an _id field
    } catch (error) {
        console.error('Error fetching farm by name:', error);
        return null;  // Handle null case in your logic
    }
};


     useEffect(() => {
        if (user.name) {
            fetchFarmIdByName(user.name).then(setFarmId);
        }
    }, [user.name]);

    useEffect(() => {
        const fetchOrders = async () => {
            if (!farmId) return;
            try {
                const allOrdersResponse = await axios.get('/api/orders');
                processOrders(allOrdersResponse.data, thisSaturday, setOrdersSummaryThisSaturday);
                if (new Date().getDay() === 5 || new Date().getDay() === 6) { // If today is Friday or Saturday
                    processOrders(allOrdersResponse.data, nextSaturday, setOrdersSummaryNextSaturday);
                }
            } catch (error) {
                console.error('Error fetching order summary:', error);
            }
        };

        if (user && user.name && farmId) {
            fetchOrders();
        }
    }, [user, farmId, thisSaturday, nextSaturday]);

    const processOrders = (orders, saturday, setOrdersSummary) => {
        const filteredOrders = orders.filter(order =>
            order.items.some(item =>
                item.item.farm === farmId && order.deliveryDate.split('T')[0] === saturday
            )
        );

        const itemsSummary = filteredOrders.reduce((acc, order) => {
            order.items.forEach(item => {
                if (item.item.farm === farmId) {
                    const itemName = item.item.itemName;
                    if (acc[itemName]) {
                        acc[itemName].totalOrdered += item.quantity;
                    } else {
                        acc[itemName] = {
                            itemName,
                            totalOrdered: item.quantity,
                            deliveryDate: saturday
                        };
                    }
                }
            });
            return acc;
        }, {});

        setOrdersSummary(Object.values(itemsSummary));
    };

    return (
        <div className="order-summary-container">
            <h2>Weekly Item Totals</h2>
            <h3>for {user.name}</h3>
            <h3>on {thisSaturday}</h3>
            <GenericTable data={ordersSummaryThisSaturday} columns={columns} />
            {new Date().getDay() === 5 || new Date().getDay() === 6 && (
                <>
                    <h3>on {nextSaturday}</h3>
                    <GenericTable data={ordersSummaryNextSaturday} columns={columns} />
                </>
            )}
        </div>
    );
};

const columns = [
    { Header: 'Item Name', accessor: 'itemName' },
    { Header: 'Total Ordered', accessor: 'totalOrdered' },
];

export default SupplierWeeklyOrderSummary;
