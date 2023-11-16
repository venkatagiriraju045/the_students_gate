import React, { useEffect, useState } from 'react';
import { Chart, LinearScale, CategoryScale, DoughnutController, ArcElement, LineController, LineElement} from 'chart.js/auto';
import './CSS/DepartmentChartOverlay.css';
import ClassAttendance from './ClassAttendance.js';

const calculateAttendancePercentage = (presentCount, absentCount) => {
const totalDays = presentCount + absentCount;
if (totalDays === 0) return { percentage: 0, count: 0, absentees: [] };
const percentage = ((presentCount / totalDays) * 100).toFixed(2);
return { percentage, count: presentCount, absentees: [] };
};
const calculateOverallAttendance = (students, selectedDepartment, selectedYear) => {
const studentList = students.filter((student) => student.role === 'student' && student.department === selectedDepartment && student.class===selectedYear);
if (studentList.length === 0) {
    return {
    presentPercentage: 0,
    absentPercentage: 0,
    presentCount: 0,
    totalCount: 0,
    absentees: [],
    };
}
const currentDate = new Date();
let presentCount = 0;
let absentCount = 0;
const absentees = []; 
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
        absentees.push(student);
    }
    });
});
const presentResult = calculateAttendancePercentage(presentCount, absentCount);
const absentResult = calculateAttendancePercentage(absentCount, presentCount);
return {
    presentPercentage: presentResult.percentage,
    absentPercentage: absentResult.percentage,
    presentCount: presentResult.count,
    totalCount: studentList.length,
    absentees, };
};

const ClassWiseAnalytics = ({ students, department , year}) => {
    const classStudents = students.filter((student) => student.class === year && student.department === department);
    const [showAttendanceOverlay, setShowAttendanceOverlay] = useState(false);
    const selectedDepartment=department;
    const selectedYear=year;
    const { presentPercentage, absentPercentage, presentCount, totalCount, absentees } = calculateOverallAttendance(
    students,
    selectedDepartment, selectedYear
    ); 
    Chart.register(LinearScale, CategoryScale, DoughnutController, ArcElement, LineController, LineElement);
    useEffect(() => {
        createClassOverallChart();
        createOverallClassPerformanceChart();
        createGenderLineChart();
        createHostelerChart(); 
        }, [students, department, year]);

function calculateStudentTestAverage(student) {
    const maxScore = 100;
    const subjectScores = student.subjects.map((subject) => {
    const { scores } = subject;
    if (!scores || typeof scores !== "object") {
                return {
        subject_name: subject.subject_name,
        scores: "NaN",  
        };
    }
    const validScores = Object.values(scores).filter((score) => !isNaN(parseInt(score)));
    const subjectScore =
        validScores.length > 0
        ? validScores.reduce((total, score) => total + parseInt(score), 0) / validScores.length
        : "NaN";
    return {
        subject_name: subject.subject_name,
        scores: subjectScore,
    };
    });
    const subjectAverages = subjectScores.map((subject) => {
    if (subject.scores === "NaN") {
        return {
        subject_name: subject.subject_name,
        average_score: "NaN",
        };
    }
    const average = (subject.scores / maxScore) * 100;     return {
        subject_name: subject.subject_name,
        average_score: average,
    };
    });
    const overallAverage =
    subjectAverages.reduce((total, subject) => total + subject.average_score, 0) /
    subjectAverages.length;
    return overallAverage;
}
const createClassOverallChart=()=>{
    Chart.register(LinearScale, CategoryScale, DoughnutController, ArcElement);
    const canvas = document.getElementById('class-overall-chart');
    const ctx = canvas.getContext('2d');
    if (typeof canvas.chart !== 'undefined') {
        canvas.chart.destroy();
    }
        const chartWidth = 410;
    const chartHeight = 240;
        canvas.width = chartWidth;
    canvas.height = chartHeight;
        const testScoreColor ='rgb(14, 129, 116)';
const attendanceColor = 'rgb(185, 242, 161)';
        const classStudents = students.filter((student) => student.class === year && student.department===department);
        const tableData = classStudents.map((student) => {
        const studentName = student.name;         const studentAverage = calculateStudentTestAverage(student);
        return { studentName, studentAverage };
    });
const overallTestAverage =tableData.reduce((total, data) => total + parseFloat(data.studentAverage), 0) / classStudents.length;
const studentAttendanceAverages = classStudents.map((student) => {
const attendanceAverage = parseFloat((student.total_attendance / student.total_days) * 100).toFixed(2);
return isNaN(attendanceAverage) ? 0 : parseFloat(attendanceAverage);
});
const attendanceAverage = studentAttendanceAverages.reduce((total, attendance) => total + attendance, 0) / classStudents.length;
canvas.chart = new Chart(ctx, {
    type: 'pie',
    data: {
        labels: ['Test Score', 'Attendance'],
        datasets: [
            {
                data: [
                    isNaN(overallTestAverage) ? 0 : parseFloat(overallTestAverage), 
                    isNaN(attendanceAverage) ? 0 : parseFloat(attendanceAverage),],
                backgroundColor: [testScoreColor, attendanceColor],
                borderColor: [ 
                'rgb(14, 129, 116)',
                'rgb(185, 242, 161)',],
                borderWidth: 1,
            },
        ],
    },
    options: {
        responsive: false,
        maintainAspectRatio: false,
        plugins: {
        legend: {
            display: true,
            position: 'right', 
            labels: {
            color: 'black', 
            },
        },
        annotation: {
            annotations: {
            value: {
                type: 'text',
                color: 'black', 
                fontSize: 24,
                fontStyle: 'bold',
                textAlign: 'center',
                value: `${isNaN(overallTestAverage) ? 'NaN' : Math.round(overallTestAverage)}%`,
                x: '50%',
                y: '50%',
            },
            },
        },
        },
    },
    });
}

const createOverallClassPerformanceChart = () => {
Chart.register(LinearScale, CategoryScale, DoughnutController, ArcElement);
const canvas = document.getElementById('class-chart-test');
const ctx = canvas.getContext('2d');
if (typeof canvas.chart !== 'undefined') {
    canvas.chart.destroy();
}
const chartWidth = 410;
const chartHeight = 240;
canvas.width = chartWidth;
canvas.height = chartHeight;
const classStudents = students.filter((student) => student.class === year && student.department===department);
const tableData = classStudents.map((student) => {
    const studentName = student.name; 
    const studentAverage = calculateStudentAverage(student);
    return { studentName, studentAverage };
});
const bins = [90, 80, 70, 60, 50, 40, 0];
const binLabels = bins.map((bin, index) => (index === 0 ? `${bin}+` : `${bin}-${bins[index - 1]}`));
const testScoreCounts = Array(bins.length).fill(0);
tableData.forEach((data) => {
    if (!isNaN(data.studentAverage)) {
    const score = parseFloat(data.studentAverage);
    for (let i = 0; i < bins.length; i++) {
        if (score >= bins[i]) {
        testScoreCounts[i]++;
        break;
        }
    }
    }
});
const testScoreColors = [
    'rgb(0, 85, 98)',
    'rgb(14, 129, 116)',
    'rgb(110, 186, 140)',
    'rgb(185, 242, 161)',
    'rgb(147, 193, 160)',
    'rgb(211, 255, 204)',
    'rgb(250, 20, 20)',
];
canvas.chart=new Chart(ctx, {
    type: 'bar',
    data: {
    labels: binLabels,
    datasets: [
        {
        data: testScoreCounts,
        backgroundColor: testScoreColors,
        borderColor: 'transparent',
        borderWidth: 1,
        },
    ],
    },
    options: {
    responsive: false,
    maintainAspectRatio: false,
    plugins: {
        legend: {
        display: false,
        },
        datalabels: {
        color: 'black', 
        anchor: 'end',
        align: 'end',
        font: {
            weight: 'bold',
        },
        formatter: (value) => (value > 0 ? value.toString() : ''), 
        },
    },
    scales: {
        x: {
        ticks: {
            color: 'rgba(0, 0, 0, 0.7)', 
        },
        grid: {
            display: true,
        },
        },
        y: {
        grid: {
            display: true,
        },
        ticks: {
            color: 'black', 
            stepSize: 1, 
            beginAtZero: true,
        },
        },
    },
    },
});
};
const calculateAverageByGender = (iatIndex, gender) => {
    const filteredStudents = students.filter((student) => student.gender === gender && student.department === department && student.class === year);
    const studentsWithScores = filteredStudents.filter((student) => student.subjects.some((subject) => subject.scores[`iat_${iatIndex}`]));
    const totalScore = studentsWithScores.reduce((total, student) => {
        const iatScore = parseInt(student.subjects.find((subject) => subject.scores[`iat_${iatIndex}`])?.scores[`iat_${iatIndex}`]);
        return total + iatScore;
    }, 0);
    const averageScore = totalScore / studentsWithScores.length;
    return averageScore;
};
const createGenderLineChart = () => {
    Chart.register(LinearScale, CategoryScale, LineController, LineElement);
    const canvas = document.getElementById('iat-performance-chart');
    const ctx = canvas.getContext('2d');
    if (typeof canvas.chart !== 'undefined') {
        canvas.chart.destroy();
    }
    const chartWidth = 410;
    const chartHeight = 240;
    canvas.width = chartWidth;
    canvas.height = chartHeight;
    const maleAverages = [1, 2, 3].map((iatIndex) => calculateAverageByGender(iatIndex, 'male'));
    const femaleAverages = [1, 2, 3].map((iatIndex) => calculateAverageByGender(iatIndex, 'female'));
    canvas.chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['iat1', 'iat2', 'iat3'],
            datasets: [
                {
                    label: 'Male',
                    data: maleAverages,
                    borderColor: 'rgb( 0, 127, 255)',
                    fill: true,
                },
                {
                    label: 'Female',
                    data: femaleAverages,
                    borderColor: 'rgb(0, 204, 153)',
                    fill: true,
                },
            ],
        },
        options: {
            responsive: false,
            maintainAspectRatio: false,
            plugins: {

                legend: {
                    display: true,
                    position: 'right',
                    labels: {
                        color: 'black',
                    },
                },
                annotation: {
                    annotations: {
                    },
                },
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: false,
                        text: 'IAT',
                        color: 'black',
                    },
                    ticks: {
                        color: 'black',
                    },
                },
                y: {
                    display: true,
                    title: {
                        display: false,
                        text: 'Scores',
                        color: 'black',
                    },
                    ticks: {
                        color: 'black',
                        beginAtZero: true,
                        stepSize: 20,
                    },
                },
            },
        },
    });
};

function calculateStudentAverage(student) {
    const totalAttendance = student.total_attendance;
    const totalDays = student.total_days;
    const presentPercentage = ((totalAttendance / totalDays) * 100).toFixed(2);
    const maxScore = 100;
    const subjectScores = student.subjects.map((subject) => {
    const { scores } = subject;
    if (!scores || typeof scores !== "object") {
        return {
        subject_name: subject.subject_name,
        scores: "NaN",  
        };
    }
    const validScores = Object.values(scores).filter((score) => !isNaN(parseInt(score)));
    const subjectScore =
        validScores.length > 0
        ? validScores.reduce((total, score) => total + parseInt(score), 0) / validScores.length
        : "NaN";
    return {
        subject_name: subject.subject_name,
        scores: subjectScore,
    };
    });
    const subjectAverages = subjectScores.map((subject) => {
    if (subject.scores === "NaN") {
        return {
        subject_name: subject.subject_name,
        average_score: "NaN",
        };
    }
    const average = (subject.scores / maxScore) * 100;
    return {
        subject_name: subject.subject_name,
        average_score: average,
    };
    });
    const overallAverage =
    subjectAverages.reduce((total, subject) => total + subject.average_score, 0) /
    subjectAverages.length;
    const hasTestScore = !isNaN(overallAverage);
    let overall_score;
    if (hasTestScore) {
    overall_score = ((parseFloat(presentPercentage) + parseFloat(overallAverage)) / 2).toFixed(2);
    } else {
    overall_score = parseFloat(presentPercentage).toFixed(2);
    }
    return overall_score;
}
const calculateAverageByType = (type) => {
    const filteredStudents = students.filter(
        student => student.type === type && student.class === year && student.department === department
    );
    const iatAverages = [0, 0, 0]; 
    const iatCounts = [0, 0, 0];
    filteredStudents.forEach(student => {
        student.subjects.forEach(subject => {
        if (subject.scores.iat_1 !== undefined) {
            iatAverages[0] += parseInt(subject.scores.iat_1);
            iatCounts[0]++;
        }
        if (subject.scores.iat_2 !== undefined) {
            iatAverages[1] += parseInt(subject.scores.iat_2);
            iatCounts[1]++;
        }
        if (subject.scores.iat_3 !== undefined) {
            iatAverages[2] += parseInt(subject.scores.iat_3);
            iatCounts[2]++;
        }
        });
    });
    for (let i = 0; i < 3; i++) {
        if (iatCounts[i] > 0) {
            iatAverages[i] /= iatCounts[i];
        }
    }
    return iatAverages;
};

const createHostelerChart = () => {
    Chart.register(LinearScale, CategoryScale, LineController, LineElement);
    const canvas = document.getElementById('iat-performance-hosteler-chart');
    const ctx = canvas.getContext('2d');
    if (typeof canvas.chart !== 'undefined') {
        canvas.chart.destroy();
    }    
    const chartWidth = 415;
    const chartHeight = 240;
    canvas.width = chartWidth;
    canvas.height = chartHeight;
    const hostelAverages = calculateAverageByType('hostel');
    const dayScholarAverages = calculateAverageByType('day-scholar');
    canvas.chart = new Chart(ctx, {
        type: 'line',
        data: {
        labels: ['iat1', 'iat2', 'iat3'],
        datasets: [
            {
            label: 'Hosteler Average',
            data: hostelAverages,
            borderColor: 'rgb(255, 79, 0)',
            borderWidth: 2,
            fill: true,
            },
            {
            label: 'Day Scholar Average',
            data: dayScholarAverages,
            borderColor: 'rgb(253, 255, 0)',
            borderWidth: 2,
            fill: true,
            },
        ],
        },
        options: {
        responsive: false,
        maintainAspectRatio: false,
        scales: {
            x: {
            display: true,
            title: {
                display: false,
                text: 'IAT',
                color: 'black',
            },
            ticks: {
                color: 'black',
            },
            },
            y: {
            display: true,
            title: {
                display: false,
                text: 'Scores',
                color: 'black',
            },
            ticks: {
                color: 'black',
                beginAtZero: true,
                stepSize: 20,
            },
            },
        },
        plugins: {
            legend: {
            display: true,
            position: 'top',
            },
        },
        },
    });
    };
const handleCloseOverlay = () => {
    setShowAttendanceOverlay(false);
};
const handleTodayClick=()=>{
    setShowAttendanceOverlay(true);
}
const handleCopyClassAttendance = () => {
    const classAttendanceText = `
    Present Percentage: ${presentPercentage}%
    Absent Percentage: ${absentPercentage}%
    Students Present Today: ${presentCount}
    Total Students: ${totalCount}
    
    ${absentees.length > 0 ? 
        `Absentees:
        ${absentees.map((student, index) => (
        `
        ${index + 1}. ${student.registerNumber}, ${student.name}`
        )).join('\n')}` : "No absentees."}
    `;

    const textarea = document.createElement('textarea');
    textarea.value = classAttendanceText;
    document.body.appendChild(textarea);

    textarea.select();
    document.execCommand('copy');

    document.body.removeChild(textarea);

    alert('Class-wise attendance details copied to the clipboard!');
};

return (
    <div>
        <div className='department-header-container'>
        <div className='class-wise-header'>
            <h2 className='department-wise-chart-heading'>Class-Wise Analytics</h2>
            </div>
            <a href="#class-wise-page"><button href="#"className="today-button"onClick={handleTodayClick}>Attendance</button></a>
        </div>
    {showAttendanceOverlay && (
            <div className="overlay">
                <div className="overlay-content">
                <button className="close-button" id="close-button" onClick={handleCloseOverlay}>
                    Close
                </button>
            <div className="attendance-details-container">
            <div className='main-attendance-details'>
            <p className='present-details-percentage'>Present Percentage: {presentPercentage}%</p>
            <p className='absent-details-percentage'>Absent Percentage: {absentPercentage}%</p>
            <p>Students Present Today: {presentCount}</p>
            <p>Total Students: {totalCount}</p>
            <button className="copy-button" onClick={handleCopyClassAttendance}>
                Copy Class Report
            </button>
            </div>
            <br></br>
            <br></br>
            <br></br>
            <h2>Absentees:</h2>
            <div className='admin-table-container'>
            {absentees.length > 0 ? (
            <table>
                <thead>
                <tr>
                    <th>Sl.No</th>
                    <th>Register number</th>
                    <th>Name</th>
                </tr>
                </thead>
                <tbody>
                {absentees.map((student, index) => (
                    <tr key={student.registerNumber}>
                    <td>{index + 1}</td>
                    <td>{student.registerNumber}</td>
                    <td>{student.name}</td>
                    </tr>
                ))}
                </tbody>
            </table>
            ) : (
            <p>No absentees for the selected class.</p>
            )}</div>
                </div>
                </div>
            </div>
            )}
    <div className='overlay-chart-container'>
    <div className='overall-department-performance-chart-container'>
        <div className='inside-container'>
            <div className='sub-charts-container'>
            <canvas id="class-overall-chart"></canvas>
            <p className='chart-heads'>Overall Performance</p>
            </div>
            </div>
            </div>
            <div className='overall-department-performance-chart-container'>
        <div className='inside-container'>
            <div className='sub-charts-container'>
            <canvas id="class-chart-test"></canvas>
            <p className='chart-heads'>Overall Test Performance</p>
            </div>     
            </div>
            </div>  
            <div className='overall-department-performance-chart-container'>
        <div className='inside-container'>
            <div className='sub-charts-container'>
            <canvas id="iat-performance-chart"></canvas>
            <p className='chart-heads'>Gender Wise IAT Performance</p>
            </div>
            </div>
            </div>
    </div>
    <div className='overlay-chart-container'>
    <div className='monthly-class-attendance-chart-container'>
        <div className='inside-container'>
            <div className='sub-charts-container'>
            <canvas id="iat-performance-hosteler-chart"></canvas>
    <p className='chart-heads'>Hostel / Day-Scholar Performance</p>
    </div>
    </div>
    </div>
        <ClassAttendance classStudents={classStudents} />
    </div>
        </div>
);
};
export default ClassWiseAnalytics;
