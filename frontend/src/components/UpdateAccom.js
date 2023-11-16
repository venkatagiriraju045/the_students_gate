import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './CSS/UpdateAccom.css';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const UpdateAccom = () => {
const [students, setStudents] = useState([]);
const [loading, setLoading] = useState(true);
const [appMessage, setAppMessage] = useState('');
const [message, setMessage] = useState('');
const [messagePreview, setMessagePreview] = useState('');
const [searchQuery, setSearchQuery] = useState('');
const [searchedStudent, setSearchedStudent] = useState(null);

useEffect(() => {
    const fetchStudentData = async () => {
    try {
        const response = await axios.get('http://localhost:3000/api/students_data');
        const studentData = response.data.filter((data) => data.role === 'student');
        setStudents(studentData);
        setLoading(false);
    } catch (error) {
        console.error('Error fetching student data:', error);
        setLoading(false);
    }
    };
    fetchStudentData();
}, []);

const handleAccomplishmentsChange = (e) => {
    setMessage(e.target.value);
    handlePreviewUpdate(e);
};

const handlePreviewUpdate = (e) => {
    const messageText = e.target.value;
    const sentences = messageText.split('.').filter(sentence => sentence.trim() !== '');
    setMessagePreview(
    sentences.map((sentence, index) => (
        <div key={index} className='message'>
        <div className='message-content'>
            <div className="message-point">
            <img src="./uploads/pin.png" alt="Point Icon" className="point-icon" />
            <p className="sentence-text">{sentence.trim()}</p>
            </div>
        </div>
        </div>
    ))
    );
    setMessage(messageText);
};

const findStudent = () => {
    const lowerCaseQuery = searchQuery.toLowerCase();
    const foundStudent = students.find(
    (student) =>
        student.name.toLowerCase() === lowerCaseQuery ||
        String(student.registerNumber).toLowerCase() === lowerCaseQuery
    );
    setSearchedStudent(foundStudent);
};

const updateStudentAccomplishments = async () => {
    if (!message.trim()) {
    setAppMessage('Please enter a valid accomplishment!');
    return;
    }

    setLoading(true);

    try {
    // Send the POST request to update accomplishments
    const accomplishmentsToUpdate = searchedStudent.accomplishments
        ? `${searchedStudent.accomplishments}. ${message.trim()}`
        : message.trim();

    await axios.post('http://localhost:3000/api/update_accomplishments', {
        email: searchedStudent.email,
        accomplishments: accomplishmentsToUpdate,
    });

    setAppMessage('Accomplishment updated successfully!');
    setTimeout(() => {
        setAppMessage('');
    }, 5000);
    setLoading(false);
    } catch (error) {
    console.error('Error updating accomplishments:', error);
    setAppMessage('An error occurred while updating the accomplishment');
    setLoading(false);
    }
};


return (
    <div>
    <div className="attendance-content-container">
        <div className="search-bar-container">
        <div className='search-bar'>
            <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
                if (e.key === 'Enter') {
                findStudent();
                }
            }}
            placeholder="Search by name, register number, email or department"
            />
            <button onClick={findStudent}>
            <FontAwesomeIcon icon={faSearch} />
            </button>
        </div>
        </div>
        <div className='message-students-container'>
        {searchedStudent === null && (
        <div className="message-to-select">
            <img src="/uploads/present.png" alt="Present Icon" className="present-icon" />
            <h3>Search the students using the name or register number!</h3>
        </div>
        )}
        {searchedStudent && searchedStudent !== '' && (
            <div className="message-form">
            <p className="message-title-message">{searchedStudent.name}'s Existing Accomplishments</p>
            <div className="existing-message-container">
                <div className="message">
                <div className="message-content">
                    {searchedStudent.accomplishments && searchedStudent.accomplishments.split('. ').map((sentence, index) => (
                    <div key={index} className="message-point">
                        <img src="./uploads/pin.png" alt="Point Icon" className="point-icon" />
                        <p className="sentence-text">{sentence.trim()}</p>
                    </div>
                    ))}
                </div>
                </div>
            </div>
            <div className='input-field-container'>
                <div className='input-field'>
                <input
                    type='text'
                    value={message}
                    onChange={handleAccomplishmentsChange}
                    placeholder="Enter your accomplishment here"
                />
                <button
                    className="send-button"
                    onClick={updateStudentAccomplishments}
                    disabled={loading}
                >
                    <img src="./uploads/send-icon.png" alt="Send Icon" className="send-icon" />
                </button>
                </div>
            </div>
            <p className="message-title-message">Update preview</p>

            <div className="new-message-container">
                {messagePreview}
            </div>
            
            {appMessage && <p className={`success-message`}>{appMessage}</p>}
            </div>
        )}
        </div>
    </div>
    </div>
);
};

export default UpdateAccom;
