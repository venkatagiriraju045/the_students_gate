import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './CSS/Home.css';

const Home = () => {
const [loginAs, setLoginAs] = useState('student');
const [loginEmail, setLoginEmail] = useState('');
const [loginPassword, setLoginPassword] = useState('');
const [loginError, setLoginError] = useState('');
const [loginSuccess, setLoginSuccess] = useState(false);
const [loading, setLoading] = useState(false);

const serverPort = 3000;
const serverURL = `http://localhost:${serverPort}`;

const navigate = useNavigate();

const handleLoginEmailChange = (e) => {
    setLoginEmail(e.target.value);
};

const handleLoginPasswordChange = (e) => {
    setLoginPassword(e.target.value);
};

const handleLogin = async (e) => {
    e.preventDefault();

    try {
    const response = await axios.post(`${serverURL}/api/login`, {
        email: loginEmail,
        password: loginPassword,
    });

    const message = response.data.message;

    localStorage.setItem('loggedInEmail', loginEmail);

    setLoginSuccess(true);
    navigate('/Profile');
    } catch (error) {
    setLoginError('Invalid email or password. Please try again.');
    }
};

const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
    const response = await axios.post(`${serverURL}/api/admin-login`, {
        email: loginEmail, // Use 'loginEmail' for admin login
        password: loginPassword, // Use 'loginPassword' for admin login
    });

    if (response.data.success) {
        if (loginEmail !== 'a@k') {
        navigate('/DepartmentMenu', { state: { email: loginEmail } });
        } else {
        navigate('/admin-home', { state: { email: loginEmail } });
        }
    } else {
        setLoginError('Invalid email or password');
    }
    } catch (error) {
    console.error('Error authenticating admin:', error);
    setLoginError('An error occurred while authenticating admin');
    }

    setLoading(false);
};

return (
    <div>
    <div className="home-container">
        <p id="college-name">Knowledge Institute of Technology<span id="place-name">, Salem</span></p>

        <div className="home-page-content-container">
        <div className="form-container-menu">
            <div className="welcome-message">
            <img src="/uploads/menu-image.jpeg" alt="menu image" className="menu-image" />
            </div>
        </div>
        <div className="left-message">
            <div className="login-page-container">
            <div className="login-container">
                <h2>{loginAs === 'student' ? 'Student Login' : 'Admin Login'}</h2>
                {loginError && <p className="login-error">{loginError}</p>}
                {loginSuccess && <p className="login-success">Login successful!</p>}
                <form onSubmit={loginAs === 'student' ? handleLogin : handleSubmit}>
                <div className="form-group">
                    <label>Email:</label>
                    <input
                    type="email"
                    value={loginEmail}
                    onChange={handleLoginEmailChange}
                    required
                    />
                </div>
                <div className="form-group">
                    <label>Password:</label>
                    <input
                    type="password"
                    value={loginPassword}
                    onChange={handleLoginPasswordChange}
                    required
                    />
                </div>
                <div className="form-group">
                    <br></br>
                    <br></br>

<div className='radio-buttons'>
<label className="radio-label">
    <input
    type="radio"
    value="student"
    checked={loginAs === 'student'}
    onChange={() => setLoginAs('student')}
    />
    Student
</label>
<label className="radio-label">
    <input
    type="radio"
    value="admin"
    checked={loginAs === 'admin'}
    onChange={() => setLoginAs('admin')}
    />
    Admin
</label>
</div>
</div>
<br></br>
                    <br></br>
<div className="form-buttons">
<button type="button" className="back-button" onClick={() => window.location.href = "https://kiot.ac.in/"}>
    Go back
</button>
<button type="submit" className="login-button">
    Login
</button>
</div>
                </form>
            </div>
            </div>
        </div>
        </div>
    </div>
    </div>
);
};

export default Home;
