import React from 'react';

// Helper function to calculate attendance percentage
const calculateAttendancePercentage = (presentCount, absentCount) => {
const totalDays = presentCount + absentCount;
if (totalDays === 0) return 0;
return ((presentCount / totalDays) * 100).toFixed(2);
};

// Function to calculate overall attendance for students
const calculateOverallAttendance = (students) => {
// Filter students with the role "student"
const studentList = students.filter((student) => student.role === "student");

if (studentList.length === 0) {
    return (
    <div>
        <p>Present Percentage: 0%</p>
        <p>Absent Percentage: 0%</p>
    </div>
    );
}

// Get the current date
const currentDate = new Date();

// Initialize present and absent counters
let presentCount = 0;
let absentCount = 0;

// Iterate through each student to count their present and absent days
studentList.forEach((student) => {
    student.present_array.forEach((dateStr) => {
    const date = new Date(dateStr);
    if (date.toDateString() === currentDate.toDateString()) {
        presentCount++;
    }
    });

    student.leave_array.forEach((dateStr) => {
    const date = new Date(dateStr);
    if (date.toDateString() === currentDate.toDateString()) {
        absentCount++;
    }
    });
});

// Calculate present and absent percentage
const presentPercentage = calculateAttendancePercentage(presentCount, absentCount);
const absentPercentage = calculateAttendancePercentage(absentCount, presentCount);

return (
    <div>
    <p>Present Percentage: {presentPercentage}%</p>
    <p>Absent Percentage: {absentPercentage}%</p>
    </div>
);
};

export default calculateOverallAttendance;
