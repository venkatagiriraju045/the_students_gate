import React from 'react';
import { Route, Routes } from 'react-router-dom';
import Profile from './components/Profile';
import Home from './components/Home';
import AdminLogin from './components/AdminLogin';
import AdminAttendance from './components/AdminAttendance';
import AdminHome from './components/AdminHome';
import DepartmentMenu from './components/DepartmentMenu';

const AppRouter = () => {
return (
    <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/profile" element={<Profile />} />
    <Route path="/admin-login" element={<AdminLogin />} />
    <Route path="/admin-home" element={<AdminHome/>}/>
    <Route path="/DepartmentMenu" element={<DepartmentMenu/>}/>
    <Route path="/admin-attendance" element={<AdminAttendance />} />
    </Routes>
);
};

export default AppRouter;
