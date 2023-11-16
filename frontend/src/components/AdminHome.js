import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import html2canvas from 'html2canvas';
import { useNavigate, useLocation } from 'react-router-dom';
import { Chart, LinearScale, CategoryScale, BarController, BarElement, DoughnutController, ArcElement } from 'chart.js/auto';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import './CSS/AdminHome.css';
import AdminAttendance from './AdminAttendance.js';
import UpdateAccom from './UpdateAccom';
import DepartmentChartOverlay from './DepartmentChartOverlay.js';

const calculateAttendancePercentage = (presentCount, absentCount) => {
    const totalDays = presentCount + absentCount;
    if (totalDays === 0) return { percentage: 0, count: 0 };
    const percentage = ((presentCount / totalDays) * 100).toFixed(2);
    return { percentage, count: presentCount };
};

const calculateOverallAttendance = (students) => {
    const studentList = students.filter((student) => student.role === 'student');
    if (studentList.length === 0) {
        return {
            presentPercentage: 0,
            absentPercentage: 0,
            presentCount: 0,
            totalCount: 0,
            departments: {},
        };
    }
    const currentDate = new Date();
    let presentCount = 0;
    let absentCount = 0;
    const departments = {};
    studentList.forEach((student) => {
        if (!departments[student.department]) {
            departments[student.department] = {
                presentCount: 0,
                absentCount: 0,
                totalCount: 0,
            };
        }
        student.present_array.forEach((dateStr) => {
            const date = new Date(dateStr);
            if (date.toDateString() === currentDate.toDateString()) {
                presentCount++;
                departments[student.department].presentCount++;
            }
        });
        student.leave_array.forEach((dateStr) => {
            const date = new Date(dateStr);
            if (date.toDateString() === currentDate.toDateString()) {
                absentCount++;
                departments[student.department].absentCount++;
            }
        });
        departments[student.department].totalCount++;
    });
    const presentResult = calculateAttendancePercentage(presentCount, absentCount);
    const absentResult = calculateAttendancePercentage(absentCount, presentCount);
    return {
        presentPercentage: presentResult.percentage,
        absentPercentage: absentResult.percentage,
        presentCount: presentResult.count,
        totalCount: studentList.length,
        departments,
    };
};

const AdminHome = () => {
    const location = useLocation();
    const { email, instituteName } = location.state || {};
    const [students, setStudents] = useState([]);
    const [adminData, setAdminData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showAttendanceForm, setShowAttendanceForm] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showMessageForm, setShowMessageForm] = useState(false);
    const [selectedDepartment, setSelectedDepartment] = useState(null);
    const [showOverlay, setShowOverlay] = useState(false);
    const [showUpdateAccom, setShowUpdateAccom] = useState(false);
    const { presentPercentage, absentPercentage, presentCount, totalCount, departments } = calculateOverallAttendance(students);
    const [showAttendanceOverlay, setShowAttendanceOverlay] = useState(false);
    const [showConfirmationPrompt, setShowConfirmationPrompt] = useState(false);
    const [institute, setInstitute] = useState(null);
    const [deviceType, setDeviceType] = useState(null);
    useEffect(() => {
        // Detect device type and set the state
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        setDeviceType(isMobile ? 'mobile' : 'desktop');
    }, []);


    useEffect(() => {
        const fetchStudentData = async () => {
            try {
                const response = await axios.get('http://localhost:3000/api/admin_students_data', {
                    params: {
                        role: 'student', // Filter by role
                        instituteName: instituteName, // Filter by institute_name
                    }
                });
                setInstitute(instituteName);
                console.log(getInstituteFullName(instituteName));
                const studentData = response.data;
                setStudents(studentData); // Set the students state variable
                setLoading(false);
            } catch (error) {
                console.error('Error fetching student data:', error);
                setError(error);
                setLoading(false);
            }
        };

        fetchStudentData();
    }, []);


    useEffect(() => {
        if (!showUpdateAccom && !showMessageForm && !showAttendanceForm && students.length > 0) {
            createOverallChart();
            createDepartmentCharts(students);
        }
    }, [showAttendanceForm, showMessageForm, showUpdateAccom, students]);

    useEffect(() => {
        const tableContainer = document.querySelector('.admin-table-container');

        if (tableContainer) {
            tableContainer.addEventListener('scroll', handleTableScroll);
        }

        return () => {
            if (tableContainer) {
                tableContainer.removeEventListener('scroll', handleTableScroll);
            }
        };
    }, []);


    function getInstituteFullName(institute) {
        const instituteNameMap = {
            "KIOT": "KNOWLEDGE INSTITUTE OF TECHNOLOGY",
            "MHS": "MUNICIPAL HIGHER SECONDARY SCHOOL",
            "PSG": "PSG ENGINEERING COLLEGE",
        };
        return instituteNameMap[institute] || institute;
    }

    function handleTableScroll(event) {
        const tableContainer = event.currentTarget;
        const distanceScrolled = tableContainer.scrollTop;
        const tableHeader = tableContainer.querySelector('th');

        if (distanceScrolled >= 40) {
            const blurIntensity = Math.min(4, (distanceScrolled - 40) / 10);
            const transparency = Math.min(0.8, (distanceScrolled - 40) / 400);

            tableHeader.style.backdropFilter = `blur(${blurIntensity}px)`;
            tableHeader.style.backgroundColor = `rgba(41, 50, 65, ${transparency})`;

        } else {
            tableHeader.style.backdropFilter = 'blur(0)';
            tableHeader.style.backgroundColor = 'rgba(41, 50, 65, 0.8)';
            tableContainer.style.paddingLeft = '0';
            tableContainer.style.paddingRight = '0';
        }
    }
    const calculateOverallScore = (student) => {
        const { total_attendance, total_days, subjects } = student;
        if (
            isNaN(total_attendance) ||
            isNaN(total_days) ||
            !Array.isArray(subjects)
        ) {
            return NaN;
        }

        const subjectScores = subjects.map((subject) => {
            const { scores } = subject;
            if (!scores || typeof scores !== "object") {
                return NaN;
            }

            const validScores = Object.values(scores).filter(
                (score) => !isNaN(parseInt(score))
            );
            const subjectScore =
                validScores.length > 0
                    ? validScores.reduce((total, score) => total + parseInt(score), 0) /
                    validScores.length
                    : NaN;
            return subjectScore;
        });

        const attendancePercentage = (total_attendance / total_days) * 100;
        const validSubjectScores = subjectScores.filter((score) => !isNaN(score));
        const subjectScoreAverage =
            validSubjectScores.length > 0
                ? validSubjectScores.reduce((total, score) => total + score, 0) /
                validSubjectScores.length
                : NaN;

        const hasTestScore = !isNaN(subjectScoreAverage);

        if (total_attendance === 0) {
            const averageScore = subjectScoreAverage;
            return averageScore.toFixed(2);
        } else if (hasTestScore) {
            const overallScoreWithTest =
                (attendancePercentage + subjectScoreAverage) / 2;
            return overallScoreWithTest.toFixed(2);
        } else {
            return attendancePercentage.toFixed(2);
        }
    };
    const calculateTestScoreAverage = (student) => {
        const { subjects } = student;
        const subjectScores = subjects.map((subject) => {
            const { scores } = subject;
            if (!scores || typeof scores !== "object") {
                return NaN;
            }
            const validScores = Object.values(scores).filter(
                (score) => !isNaN(parseInt(score))
            );
            const subjectScore =
                validScores.length > 0
                    ? validScores.reduce((total, score) => total + parseInt(score), 0) /
                    validScores.length
                    : NaN;
            return subjectScore;
        });
        const validSubjectScores = subjectScores.filter((score) => !isNaN(score));
        const testScoreAverage =
            validSubjectScores.length > 0
                ? validSubjectScores.reduce((total, score) => total + score, 0) /
                validSubjectScores.length
                : NaN;

        return testScoreAverage.toFixed(2);
    };

    const sortStudentsByName = (students) => {
        return students.sort((a, b) => a.name.localeCompare(b.name));
    };

    const groupStudentsByDepartment = (students) => {
        const groupedStudents = {};
        students.forEach((student) => {
            const department = student.department;
            if (!groupedStudents[department]) {
                groupedStudents[department] = [student];
            } else {
                groupedStudents[department].push(student);
            }
        });
        return groupedStudents;
    };
    const createOverallChart = () => {
        Chart.register(LinearScale, CategoryScale, BarController, BarElement, DoughnutController, ArcElement);
        const canvas = document.getElementById('overall-chart-sample');
        const ctx = canvas.getContext('2d');
        const chartWidth = 250;
        const chartHeight = 250;
        canvas.width = chartWidth;
        canvas.height = chartHeight;
        const overallScores = students.map((student) => calculateOverallScore(student));
        const filteredScores = overallScores.filter((score) => score >= 0);
        const averageScore = filteredScores.reduce((total, score) => total + parseFloat(score), 0) / filteredScores.length;

        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['100-90', '90-80', '80-70', '70-60', '60-50', '50-40', 'Below 40'],
                datasets: [
                    {
                        data: [
                            filteredScores.filter((score) => score >= 90 && score <= 100).length,
                            filteredScores.filter((score) => score >= 80 && score < 90).length,
                            filteredScores.filter((score) => score >= 70 && score < 80).length,
                            filteredScores.filter((score) => score >= 60 && score < 70).length,
                            filteredScores.filter((score) => score >= 50 && score < 60).length,
                            filteredScores.filter((score) => score >= 40 && score < 50).length,
                            filteredScores.filter((score) => score < 40).length,
                        ],
                        backgroundColor: [
                            'rgb(0, 85, 98)',
                            'rgb(14, 129, 116)',
                            'rgb(110, 186, 140)',
                            'rgb(185, 242, 81)',
                            'rgb(185, 242, 161)',
                            'rgb(226, 242, 187)',
                            'rgb(251, 20, 20)',
                        ],
                        borderColor: ['rgba(66, 82, 79, 0.4)', 'rgba(66, 82, 79,0.4)'],
                        borderWidth: 0,
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
                    annotation: {
                        annotations: {
                            value: {
                                type: 'text',
                                fontColor: 'black',
                                fontSize: 16,
                                fontStyle: 'bold',
                                textAlign: 'center',
                                value: `${averageScore.toFixed(2)}%`,
                                x: '50%',
                                y: '50%',
                            },
                        },
                    },
                },
                cutout: '65%',
            },
            plugins: [
                {
                    id: 'customLabel',
                    afterDraw: (chart) => {
                        const width = chart.width;
                        const height = chart.height;
                        const ctx = chart.ctx;
                        ctx.save();
                        ctx.fillStyle = 'rgb(0,0,0)';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.font = '30px NovaFlat-Regular';
                        ctx.fillText(`${averageScore.toFixed(2)}%`, width / 2, height / 2);
                        ctx.restore();
                    },
                },
            ],
        });
    };
    const calculateOverallAverageByDepartment = (students) => {
        const groupedStudents = groupStudentsByDepartment(students);
        const departmentAverages = {};
        Object.keys(groupedStudents).forEach((department) => {
            const departmentStudents = groupedStudents[department];
            const overallScores = departmentStudents.map((student) => calculateOverallScore(student));
            const filteredScores = overallScores.filter((score) => score >= 0);
            const averageScore = filteredScores.reduce((total, score) => total + parseFloat(score), 0) / filteredScores.length;
            departmentAverages[department] = averageScore;
        });
        return departmentAverages;
    };

    const createDepartmentCharts = (students) => {
        const sortedStudents = sortStudentsByName(students);
        const groupedStudents = groupStudentsByDepartment(sortedStudents);
        const departmentAverages = calculateOverallAverageByDepartment(students);
        const departmentNames = ['CSBS', 'CSE', 'IT', 'EEE', 'AIDS', 'MECH', 'ECE', 'CIVIL'];
        Chart.register(LinearScale, CategoryScale, BarController, BarElement, DoughnutController, ArcElement);
        const chartWidth = 120;
        const chartHeight = 190;
        const handleDepartmentChartClick = (department) => {
            setSelectedDepartment(department);
            setShowOverlay(true);
        };
        Object.keys(departmentAverages).forEach((department, index) => {
            const averageScore = departmentAverages[department];
            const departmentStudents = groupedStudents[department];
            const overallScores = departmentStudents.map((student) => calculateOverallScore(student));
            const filteredScores = overallScores.filter((score) => score >= 0);
            const departmentData = [
                Math.max(filteredScores.filter((score) => score >= 90 && score <= 100).length, 0),
                Math.max(filteredScores.filter((score) => score >= 80 && score < 90).length, 0),
                Math.max(filteredScores.filter((score) => score >= 70 && score < 80).length, 0),
                Math.max(filteredScores.filter((score) => score >= 60 && score < 70).length, 0),
                Math.max(filteredScores.filter((score) => score >= 50 && score < 60).length, 0),
                Math.max(filteredScores.filter((score) => score >= 40 && score < 50).length, 0),
                Math.max(filteredScores.filter((score) => score < 40).length, 0),
            ];
            const canvas = document.createElement('canvas');
            canvas.id = `department-chart-${department}`;
            const chartContainer = document.querySelector('.department-chart-container');
            chartContainer.appendChild(canvas);
            const ctx = canvas.getContext('2d');
            canvas.width = chartWidth;
            canvas.height = chartHeight;
            new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['100-90', '90-80', '80-70', '70-60', '60-50', '50-40', 'Below 40'],
                    datasets: [
                        {
                            data: departmentData,
                            backgroundColor: [
                                'rgb(0, 85, 98)',
                                'rgb(14, 129, 116)',
                                'rgb(110, 186, 140)',
                                'rgb(185, 242, 81)',
                                'rgb(185, 242, 161)',
                                'rgb(226, 242, 187)',
                                'rgb(251, 25, 20)',
                            ],
                            borderColor: ['rgba(66, 82, 79, 0.4)', 'rgba(66, 82, 79,0.4)'],
                            borderWidth: 0,
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
                        annotation: {
                            annotations: {
                                value: {
                                    type: 'text',
                                    fontColor: 'black',
                                    fontSize: 16,
                                    fontStyle: 'bold',
                                    textAlign: 'center',
                                    value: `${averageScore.toFixed(2)}%`,
                                    x: '50%',
                                    y: '50%',
                                },
                            },
                        },
                    },
                    cutout: '75%',
                },
                plugins: [
                    {
                        id: 'customLabel',
                        afterDraw: (chart) => {
                            const width = chart.width;
                            const height = chart.height;
                            const ctx = chart.ctx;
                            const departmentName = departmentNames[index];
                            ctx.save();
                            ctx.fillStyle = 'rgba(0,0,0, 0.63)';
                            ctx.textAlign = 'center';
                            ctx.textBaseline = 'middle';
                            ctx.font = '24px NovaFlat-Regular';
                            ctx.fillText(departmentName, width / 2, height - 10);
                            ctx.fillStyle = 'rgb(0,0,0)';
                            ctx.textAlign = 'center';
                            ctx.textBaseline = 'middle';
                            ctx.font = '16px NovaFlat-Regular';
                            ctx.fillText(`${averageScore.toFixed(2)}%`, width / 2, height / 2);
                            ctx.restore();
                        },
                    },
                ],
            });
            canvas.addEventListener('click', () => handleDepartmentChartClick(department));
        });
    };

    const navigate = useNavigate();
    const handleLogout = () => {
        setShowConfirmationPrompt(false);
        navigate('/');
    };

    if (loading) {
        return <div>
            <div className="loading-overlay">
                <div className="loading-spinner"></div>
                <p className="loading-text">   Loading... Please wait!</p>
            </div>
        </div>;
    }

    if (error) {
        return <p>Error fetching student data: {error.message}</p>;
    }

    const sortedStudents = sortStudentsByName(students);

    const groupedStudents = groupStudentsByDepartment(sortedStudents);
    const departmentShortNames = {
        "Information Technology": "IT",
        "Computer Science and Engineering": "CSE",
        "Electrical and Electronics Engineering": "EEE",
        "Artificial Intelligence and Data Science": "AI&DS",
        "Mechanical Engineering": "MECH",
        "Computer Science and Business Systems": "CSBS",
        "Electrical and Communication Engineering": "ECE",
        "Civil Engineering": "CIVIL",
    };
    const renderTableRows = (students) => {
        let serialNumber = 1;
        return students.map((student) => (
            <tr key={student._id}>
                <td>{serialNumber++}</td>
                <td>{student.registerNumber}</td>
                <td>{student.name}</td>
                <td>{student.email}</td>
                <td>{departmentShortNames[student.department] || student.department}</td>
                <td>{student.class}</td>
                <td>{calculateTestScoreAverage(student)}</td>
                <td>{((student.total_attendance / student.total_days) * 100).toFixed(2)}</td>
                <td>{calculateOverallScore(student)}</td>
            </tr>
        ));
    };

    const handleSearch = () => {
        const searchInput = searchQuery.toLowerCase();
        const tableRows = document.querySelectorAll('tbody tr');
        let matchedRows = [];
        for (const row of tableRows) {
            const rowData = row.innerText.toLowerCase();
            const matchingScore = calculateMatchingScore(rowData, searchInput);
            if (matchingScore > 0) {
                matchedRows.push({ row, matchingScore });
            }
        }
        if (matchedRows.length > 0) {
            matchedRows.sort((a, b) => a.row.offsetTop - b.row.offsetTop);
            const tableContainer = document.querySelector('.admin-table-container');
            const headerHeight = document.querySelector('.admin-table-container th').offsetHeight;
            const paddingTop = headerHeight + 5;
            const closestRow = matchedRows[0];
            tableContainer.scrollTop = closestRow.row.offsetTop - paddingTop;
        } else {
            setSearchQuery('');
        }
    };
    const calculateMatchingScore = (text, searchInput) => {
        const regex = new RegExp(searchInput, 'g');
        const matches = text.match(regex);
        return matches ? matches.length : 0;
    };
    const filteredStudents = students.filter(
        (student) =>
        (student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            student.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
            String(student.registerNumber).toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const handleDownloadImage = () => {
        html2canvas(document.body).then((canvas) => {
            const dataURL = canvas.toDataURL('image/png');
            const downloadLink = document.createElement('a');
            downloadLink.href = dataURL;
            downloadLink.download = 'admin_home.png';
            downloadLink.click();
        });
    };
    const handleCloseOverlay = () => {
        setSelectedDepartment(null);
        setShowOverlay(false);
        setShowAttendanceOverlay(false);
    };
    const handleTodayClick = () => {
        setShowAttendanceOverlay(true);

    }

    const handleCopyAttendance = () => {
        const overallAttendanceDetailsText = `
            Present Percentage: ${presentPercentage}%
            Absent Percentage: ${absentPercentage}%
            Students Present Today: ${presentCount} / ${totalCount}
        `;

        const departmentAttendanceDetailsText = Object.entries(departments).map(([department, departmentData]) => (
            `
            ${department}
            Present Percentage: ${calculateAttendancePercentage(departmentData.presentCount, departmentData.absentCount).percentage}%
            Students Present Today: ${departmentData.presentCount} / ${departmentData.totalCount}
            `
        )).join('\n');

        const attendanceDetailsText = overallAttendanceDetailsText + '\n\n' + departmentAttendanceDetailsText;
        const textarea = document.createElement('textarea');
        textarea.value = attendanceDetailsText;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        alert('Attendance details copied to clipboard!');
    };
    if (deviceType === 'mobile') {
        return (
            <div className="mobile-warning-overlay-message">
                <p>You are logged in on a mobile device. Please logout from the mobile device to access this page on a computer or laptop.</p>
            </div>
        );
    }
    return (
        <div>
            <div className="main-admin-page-container">
                <div>
                    <header className="admin-header">
                        <p className="admin-header-dialogue">{getInstituteFullName(institute)}</p>
                        <div className='top-buttons'>
                            <button className="home-attendance-button" onClick={handleTodayClick}>
                                Attendance
                            </button>
                            <button className="logout-button" onClick={() => setShowConfirmationPrompt(true)}>
                                Logout
                            </button>
                            {showConfirmationPrompt && (
                                <div className="logout-overlay">
                                    <div className="confirmation-container">
                                        <p>Are you sure you want to logout?</p>
                                        <button className="confirm-button" onClick={handleLogout}>Yes</button>
                                        <button className="cancel-button" onClick={() => setShowConfirmationPrompt(false)}>No</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </header>
                </div>
                <main className="principal-content-container" >
                    {isLoading && (
                        <div className="loading-overlay">
                            <div className="loading-spinner"></div>
                            <p className="loading-text">   Loading please wait...</p>
                        </div>
                    )}
                    {showAttendanceOverlay && (
                        <div className="overlay">
                            <div className="overlay-content">
                                <button className="main-admin-overlay-close-button" onClick={handleCloseOverlay}>
                                    Close
                                </button>
                                <div className="attendance-details-container">
                                    <div className='main-attendance-details'>
                                        <p className='present-details-percentage'>Present Percentage: {presentPercentage}%</p>
                                        <p className='absent-details-percentage'>Absent Percentage: {absentPercentage}%</p>
                                        <p>Students Present Today: {presentCount} / {totalCount}</p>
                                        <button className="copy-button" onClick={handleCopyAttendance}>
                                            Copy-Text
                                        </button>
                                    </div>
                                    <div className='flex-container' >
                                        {Object.entries(departments).map(([department, departmentData]) => (
                                            <div className='attendance-sub-container'>
                                                <div key={department} className='department-attendance-details'>
                                                    <p >{department}</p>
                                                    <p className='present-details-percentage'>Present Percentage: {calculateAttendancePercentage(departmentData.presentCount, departmentData.absentCount).percentage}%</p>
                                                    <p>Students Present Today: {departmentData.presentCount} / {departmentData.totalCount}</p>
                                                </div>
                                            </div>
                                        ))}</div>
                                </div>
                            </div>
                        </div>
                    )}
                    {showOverlay && (
                        <div className="overlay">
                            <div className="admin-overlay-content">
                                <DepartmentChartOverlay department={selectedDepartment} students={students} />
                                <button className="main-admin-overlay-close-button" onClick={handleCloseOverlay}>
                                    Close
                                </button>
                            </div>
                        </div>
                    )}
                    <div className='home-contents'>
                        <div className="admin-chart-container">
                            <div>
                                <canvas id="overall-chart-sample"></canvas>
                                <h2 className='overall-chart-heading'>Overall Performance</h2>
                            </div>
                            <div className='department-chart-container'>
                            </div>
                        </div>
                        <div className="admin-students-container">
                            <div className="search-bar-container">
                                <div className='search-bar'>
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                handleSearch();
                                            }
                                        }}
                                        placeholder="Search by name, register number, email or department"
                                    />
                                    <button onClick={handleSearch}>
                                        <FontAwesomeIcon icon={faSearch} />
                                    </button>
                                </div>
                            </div>
                            {filteredStudents.length > 0 ? (
                                <div className="admin-table-container" style={{ height: '200px', overflow: 'auto' }}>
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Sl.no</th>
                                                <th>Register No</th>
                                                <th>Name</th>
                                                <th>Email</th>
                                                <th>Department</th>
                                                <th>Year</th>
                                                <th>Test Score (%)</th>
                                                <th>Attendance (%)</th>
                                                <th>Average Overall Score (%)</th>
                                            </tr>
                                        </thead>
                                        <tbody>{renderTableRows(filteredStudents)}</tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className='error-message'>No student data available.</p>
                            )}
                        </div>
                    </div>
                </main>
                <footer className="main-admin-footer">
                    &copy; The Students Gate-2023.
                    <div className="download-button-container">
                        <button className="download-button" onClick={handleDownloadImage}>
                            Download
                        </button>
                    </div>
                </footer>
            </div>
        </div>
    );
};
export default AdminHome;
