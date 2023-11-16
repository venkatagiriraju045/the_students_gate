import React, { useState, useEffect } from 'react';
import Chart from 'chart.js/auto';
import './CSS/AttendanceCalendar.css';
import './CSS/ClassAttendance.css';

const AttendanceCalendar = ({ classStudents}) => {

const [currentDate, setCurrentDate] = useState(new Date());
useEffect(() => {
    if (!classStudents.length) {
        return;
    }
    const canvas = document.getElementById('attendanceClassMonthlyChart');
    const ctx = canvas.getContext('2d');
    const attendanceData = getAttendancePercentageByMonth();
    if (typeof canvas.chart !== 'undefined') {
    canvas.chart.destroy();
    }
    const chartWidth =855 ;
    const chartHeight = 240;
    canvas.width = chartWidth;
    canvas.height = chartHeight;
    canvas.chart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
        ],
        datasets: [
        {
            label: 'Attendance Percentage',
            data: attendanceData,
            borderColor: 'rgb(0, 127, 255)',
            borderWidth: 2,
            fill: true,
        },
        ],
    },
    options: {
        responsive: false,
        maintainAspectRatio: false,
        scales: {
        y: {
            beginAtZero: true,
            suggestedMax: 100,
            ticks: {
            stepSize: 10,
            color: 'rgba(0, 0, 0, 0.6)',
            },
        },
        x: {
            ticks: {
            color: 'rgba(0,0,0, 0.6)',
            },
        },
        },
    },
    });
}, [currentDate, classStudents]);

const presentDates = classStudents.flatMap((student) => student.present_array.map((dateStr) => new Date(dateStr)));
const absentDates = classStudents.flatMap((student) => student.leave_array.map((dateStr) => new Date(dateStr)));


const getAttendancePercentageByMonth = () => {
    const presentAttendanceByMonth = [];
    const year = currentDate.getFullYear();
    for (let month = 0; month < 12; month++) {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const totalSchoolDaysInMonth = getSchoolDaysCount(firstDayOfMonth, lastDayOfMonth);
    const daysPresentInMonth = presentDates.filter((date) => date.getMonth() === month).length;
    const daysAbsentInMonth = absentDates.filter((date) => date.getMonth() === month).length;
    const totalDaysAttendedInMonth = daysPresentInMonth + daysAbsentInMonth;
    const percentagePresentInMonth = ((daysPresentInMonth / totalDaysAttendedInMonth) * 100).toFixed(2);
    presentAttendanceByMonth.push(percentagePresentInMonth);
    }
    return presentAttendanceByMonth;
};

const getSchoolDaysCount = (startDate, endDate) => {
    let count = 0;
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
    count++;
    currentDate.setDate(currentDate.getDate() + 1);
    }
    return count;
};




return (
    <div className='monthly-class-attendance-chart-container'>
        <div className='inside-container'>
            <div className='sub-charts-container'>
            <canvas id="attendanceClassMonthlyChart"></canvas>
            <p className='chart-heads'>Class Attendance</p>
            </div>
        </div>
    </div>
);
};

export default AttendanceCalendar;
