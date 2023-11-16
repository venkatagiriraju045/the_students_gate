import React, { useState, useEffect } from 'react';
import Chart from 'chart.js/auto';
import './CSS/AttendanceCalendar.css';

const AttendanceCalendar = ({ student }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    useEffect(() => {
        const canvas = document.getElementById('attendanceMonthlyChart');
        const ctx = canvas.getContext('2d');
        const attendanceData = getAttendancePercentageByMonth();
        if (typeof canvas.chart !== 'undefined') {
            canvas.chart.destroy();
        }
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
                        fill: false,
                    },
                ],
            },
            options: {
                responsive: true,
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
                            color: 'rgba(0, 0,0, 0.6)',
                        },
                    },
                },
            },
        });
    }, [currentDate, student]);

    if (!student || !student.present_array || !student.leave_array) {
        return <div>no data found</div>;
    }
    const presentDates = student.present_array.map((dateStr) => new Date(dateStr));
    const absentDates = student.leave_array.map((dateStr) => new Date(dateStr));
    const isDatePresent = (date) =>
        presentDates.some((d) => d.toDateString() === date.toDateString());
    const isDateAbsent = (date) =>
        absentDates.some((d) => d.toDateString() === date.toDateString());
    const getDayWithLeadingZeros = (date) => {
        return date.toLocaleDateString(undefined, { day: '2-digit' });
    };

    

    const getAttendancePercentageByMonth = () => {
        const presentAttendanceByMonth = [];
        for (let month = 0; month < 12; month++) {
            const daysPresentInMonth = presentDates.filter(
                (date) => date.getMonth() === month
            ).length;
            const daysAbsentInMonth = absentDates.filter(
                (date) => date.getMonth() === month
            ).length;
            const totalDaysAttendedInMonth = daysPresentInMonth + daysAbsentInMonth;
            const percentagePresentInMonth = ((daysPresentInMonth / totalDaysAttendedInMonth) * 100).toFixed(2);
            presentAttendanceByMonth.push(percentagePresentInMonth);
        }
        return presentAttendanceByMonth;
    };



    const currentMonth = currentDate.getMonth();

    const generateCalendar = (year, month) => {
        const calendar = [];
        const firstDayOfMonth = new Date(year, month, 1);
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        let firstDayOfWeek = firstDayOfMonth.getDay();
        firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
        for (let i = 0; i < firstDayOfWeek; i++) {
            calendar.push(<div key={`empty-${i}`} className="empty-date"></div>);
        }
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            let dateBlockClass = isDatePresent(date) ? 'present-date' : isDateAbsent(date) ? 'absent-date' : '';
            if (currentDate.toDateString() === date.toDateString()) {
                dateBlockClass += ' current-date';
            }
            calendar.push(
                <div key={day} className={`date-block ${dateBlockClass}`}>
                    {getDayWithLeadingZeros(date)}
                </div>
            );
        }
        return calendar;
    };

    const totalDaysPresent = presentDates.length;
    const totalDaysAbsent = absentDates.length;
    const totalDays = totalDaysPresent + totalDaysAbsent;
    const percentagePresent = ((totalDaysPresent / totalDays) * 100).toFixed(2);
    return (
        <div className="attendance-calendar">
            <div className="attendance-summary">
                <div className='attendance-present-details'>
                    <h2 className='attendance-overlay-heading'>Attendance Details for {student.name}</h2>
                    <p className='attendance-details'>Present Days: {totalDaysPresent}</p>
                    <p className='attendance-details'>Total Days: {totalDays}</p>
                    <p className='attendance-details'>Percentage of Present: {percentagePresent}%</p>
                    <canvas id="attendanceMonthlyChart"></canvas>
                </div>
            </div>
            <div className='calendar-container'>
                <div className='calendar-header'>
                    <button
                        className="month-nav"
                        onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentMonth - 1))}
                    >
                        &lt;
                    </button>
                    <h2 className='month-name'>{currentDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</h2>
                    <button
                        className="month-nav"
                        onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentMonth + 1))}
                    >
                        &gt;
                    </button>
                </div>
                <div className="header-blocks">
                    <div className="head-block">Mon</div>
                    <div className="head-block">Tue</div>
                    <div className="head-block">Wed</div>
                    <div className="head-block">Thu</div>
                    <div className="head-block">Fri</div>
                    <div className="head-block">Sat</div>
                    <div className="head-block">Sun</div>
                </div>
                <div className="calendar-grid">{generateCalendar(currentDate.getFullYear(), currentMonth)}</div>
            </div>
        </div>
    );
};
export default AttendanceCalendar;