import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

import './CSS/Accomplishment.css';

const Accomplishment = ({ location, onClose }) => {
const [loading, setLoading] = useState(true);
const [accomplishments, setAccomplishments] = useState([]);
const email = location && location.state ? location.state.email : null;

const fetchAccomplishments = async () => {
    try {
    const response = await axios.get(`http://localhost:3000/api/students?email=${email}`);
    const { accomplishments } = response.data;
    if (accomplishments) {
        const parsedAccomplishments = accomplishments.split('. ').filter(acc => acc !== '');
        setAccomplishments(parsedAccomplishments);
    } else {
        setAccomplishments([]);
    }
    setLoading(false);
    } catch (error) {
    console.error('Error fetching accomplishments:', error);
    setLoading(false);
    }
};

useEffect(() => {
    if (email) {
    fetchAccomplishments();
    } else {
    setLoading(false);
    }
}, [email]);

return (
    <div >
    <h2 className="test-score-heading">Accomplishments</h2>
    
    {loading ? (
        <p>Loading...</p>
    ) : accomplishments.length === 0 ? (
        <p className='accomplishment-error-message'>No accomplishments found.</p>
    ) : (
        <div className='accomplishments-container'>
        <div>
        {accomplishments.map((accomplishment, index) => (
            <div key={index}><img src="./uploads/pin.png" alt="Point Icon" className="accomplishments-point-icon" />
            {accomplishment}</div>
        ))}
        </div>
        </div>
    )}
    </div>
);
};

export default Accomplishment;
