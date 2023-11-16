import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Chart, LinearScale, CategoryScale, Title, Tooltip, BarController, BarElement, LineController, LineElement } from 'chart.js';

import './CSS/Test_Score.css';
import ComparisonChart from './ComparisonChart';
function calculateIATAverages(testScores) {
    const iatAverages = [0, 0, 0];

    testScores.forEach(subject => {
        iatAverages[0] += parseInt(subject?.scores?.iat_1) || 0;
        iatAverages[1] += parseInt(subject?.scores?.iat_2) || 0;
        iatAverages[2] += parseInt(subject?.scores?.iat_3) || 0;
    });

    const iatCounts = [0, 0, 0]; // Initialize array to store subject counts for each IAT

    testScores.forEach(subject => {
        if (subject?.scores?.iat_1 !== undefined) iatCounts[0]++;
        if (subject?.scores?.iat_2 !== undefined) iatCounts[1]++;
        if (subject?.scores?.iat_3 !== undefined) iatCounts[2]++;
    });

    for (let i = 0; i < 3; i++) {
        if (iatCounts[i] > 0) {
            iatAverages[i] /= iatCounts[i];
        }
    }

    return iatAverages;
}

const TestScore = ({ email, department, year, instituteName }) => {
    const [testScores, setTestScores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isClosed] = useState(false);
    const [students, setStudents] = useState([]);
    const [isDataFetched, setIsDataFetched] = useState(false); // New state to track data fetching
    const subjectAverages = calculateSubjectAverages(testScores);
    const { highestSubject, lowestSubject } = findHighLowSubjects(subjectAverages);
    const [iat1Available, setIat1Available] = useState(true);
    const [iat2Available, setIat2Available] = useState(true);
    const [iat3Available, setIat3Available] = useState(true);

    useEffect(() => {
        const fetchStudentData = async () => {
            try {
                const response = await axios.get('http://localhost:3000/api/students_data', {
                    params: {
                        role: 'student', // Filter by role
                        department: department, // Filter by department
                        instituteName: instituteName, // Filter by institute_name
                    }
                });
                const studentData = response.data.filter((data) => data.class === year);
                setStudents(studentData);
                setLoading(false);
                setIsDataFetched(true); // Set the flag to true after data fetch

            } catch (error) {
                console.error('Error fetching student data:', error);
                setLoading(false);
            }
        };

        fetchStudentData();
    }, [department, instituteName, year]);

    useEffect(() => {
        const fetchTestScores = async () => {
            try {
                const response = await axios.get(`http://localhost:3000/api/students?email=${email}`);
                const { subjects } = response.data;
                setTestScores(subjects);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching test scores:', error);
                setLoading(false);
            }
        };

        if (email) {
            fetchTestScores();
        } else {
            setLoading(false);
        }
    }, [email]);

    useEffect(() => {
        if (testScores.length > 0 && isDataFetched) { // Render only when both data sets are fetched

            const iat1Scores = testScores.map((subject) => subject?.scores['iat_1'] || 0);
            const iat2Scores = testScores.map((subject) => subject?.scores['iat_2'] || 0);
            const iat3Scores = testScores.map((subject) => subject?.scores['iat_3'] || 0);


            if (iat1Scores.some((score) => score !== 0)) {
            } else {
                setIatAvailability('iat_1', false);
            }
            if (iat2Scores.some((score) => score !== 0)) {
            } else {
                setIatAvailability('iat_2', false);
            }
            if (iat3Scores.some((score) => score !== 0)) {
            } else {
                setIatAvailability('iat_3', false);
            }
            
            const createChart = () => {
                Chart.register(LinearScale, CategoryScale, Title, Tooltip, LineController, LineElement);
                const canvas = document.getElementById('iat-performance-student-chart');
                const ctx = canvas.getContext('2d');
                if (typeof canvas.chart !== 'undefined') {
                    canvas.chart.destroy();
                }
                const labels = testScores.map((subject) => subject?.subject_code || '');
                const filteredTestScores = testScores.filter((subject) => {
                    return (
                        subject?.scores?.iat_1 !== undefined ||
                        subject?.scores?.iat_2 !== undefined ||
                        subject?.scores?.iat_3 !== undefined
                    );
                });


                const datasets = [];

                if (iat1Available) {
                    datasets.push({
                        label: 'IAT 1',
                        data: filteredTestScores.map((subject) => subject?.scores?.iat_1 || 0),
                        borderColor: 'rgb(185, 242, 161)',
                        borderWidth: 2,
                    });
                }

                if (iat2Available) {
                    datasets.push({
                        label: 'IAT 2',
                        data: filteredTestScores.map((subject) => subject?.scores?.iat_2 || 0),
                        borderColor: 'rgb(113, 224, 81)',
                        borderWidth: 2,
                    });
                }

                if (iat3Available) {
                    datasets.push({
                        label: 'IAT 3',
                        data: filteredTestScores.map((subject) => subject?.scores?.iat_3 || 0),
                        borderColor: 'rgb(14, 129, 116)',
                        borderWidth: 2,
                    });
                }

                canvas.chart = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: datasets,
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: true,
                        scales: {
                            x: {
                                beginAtZero: true,
                                ticks: {
                                    color: 'rgba(0,0,0, 0.7)',
                                },
                            },
                            y: {
                                beginAtZero: true,
                                max: 100,
                                ticks: {
                                    color: 'rgba(0,0,0, 0.7)',
                                },
                            },
                        },
                        plugins: {
                            legend: {
                                display: true,
                                labels: {
                                    color: 'rgba(0,0,0, 0.7)',
                                },
                            },
                        },
                        interaction: {
                            mode: 'index',
                        },
                    },
                });
            };

            const createComparisonChart = () => {
                Chart.register(LinearScale, CategoryScale, BarController, BarElement);

                const canvas = document.getElementById('iat-comparison-chart');
                const ctx = canvas.getContext('2d');
                if (typeof canvas.chart !== 'undefined') {
                    canvas.chart.destroy();
                }

                const iatAverages = calculateIATAverages(testScores);
                const classAverages = calculateClassIATAverages(students);

                const lowestIATScores = [100, 100, 100]; // Assuming the maximum score is 100
                const highestIATScores = [0, 0, 0];


                students.forEach(student => {
                    student.subjects.forEach(subject => {
                        const iat1 = parseInt(subject.scores.iat_1) || 0;
                        const iat2 = parseInt(subject.scores.iat_2) || 0;
                        const iat3 = parseInt(subject.scores.iat_3) || 0;

                        lowestIATScores[0] = Math.min(lowestIATScores[0], iat1);
                        lowestIATScores[1] = Math.min(lowestIATScores[1], iat2);
                        lowestIATScores[2] = Math.min(lowestIATScores[2], iat3);

                        highestIATScores[0] = Math.max(highestIATScores[0], iat1);
                        highestIATScores[1] = Math.max(highestIATScores[1], iat2);
                        highestIATScores[2] = Math.max(highestIATScores[2], iat3);
                    });
                });

                canvas.chart = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: ['IAT 1', 'IAT 2', 'IAT 3'],
                        datasets: [
                            {
                                label: 'Lowest Score',
                                data: lowestIATScores,
                                backgroundColor: 'rgba(255, 206, 86, 0.5)',
                                borderWidth: 0,
                            },
                            {
                                label: 'Your Performance',
                                data: iatAverages,
                                backgroundColor: 'rgba(75, 192, 192, 0.5)',
                                borderWidth: 0,
                            },
                            {
                                label: 'Class Average',
                                data: classAverages,
                                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                                borderWidth: 0,
                            },
                            {
                                label: 'Highest Score',
                                data: highestIATScores,
                                backgroundColor: 'rgba(255, 99, 132, 0.5)',
                                borderWidth: 0,
                            },
                        ],
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: true,
                        scales: {
                            x: {
                                beginAtZero: true,
                                ticks: {
                                    color: 'rgba(0,0,0, 0.7)',
                                },
                            },
                            y: {
                                beginAtZero: true,
                                ticks: {
                                    color: 'rgba(0,0,0, 0.7)',
                                },
                            },
                        },
                        plugins: {
                            legend: {
                                display: true,
                                labels: {
                                    color: 'rgba(0,0,0, 0.7)',
                                },
                            },
                        },
                    },
                });
            };
            const createLineChart = () => {
                Chart.register(LinearScale, CategoryScale, LineController, LineElement);

                const canvas = document.getElementById('subject-line-chart');
                const ctx = canvas.getContext('2d');
                if (typeof canvas.chart !== 'undefined') {
                    canvas.chart.destroy();
                }

                const labels = testScores.map((subject) => subject?.subject_code || '');
                const studentScores = [];

                testScores.forEach((subject) => {
                    const iat1 = parseInt(subject?.scores?.iat_1) || null;
                    const iat2 = parseInt(subject?.scores?.iat_2) || null;
                    const iat3 = parseInt(subject?.scores?.iat_3) || null;

                    // Check if at least one iat score is available
                    if (iat1 !== null || iat2 !== null || iat3 !== null) {
                        const validScores = [iat1, iat2, iat3].filter((score) => score !== null);
                        const totalScore = validScores.reduce((sum, score) => sum + score, 0) / validScores.length;
                        studentScores.push(totalScore);
                    }
                });

                canvas.chart = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: [
                            {
                                label: 'Your Performance',
                                data: studentScores,
                                borderColor: 'rgb(14, 129, 116)',
                                backgroundColor: 'rgba(14, 129, 116, 0.2)',
                                borderWidth: 2,
                                fill: true,
                                tension: 0.4,
                                pointRadius: 3,
                            },
                        ],
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: true,
                        scales: {
                            x: {
                                beginAtZero: true,
                                ticks: {
                                    color: 'rgba(0,0,0, 0.7)',
                                },
                            },
                            y: {
                                beginAtZero: true,
                                ticks: {
                                    color: 'rgba(0,0,0, 0.7)',
                                },
                            },
                        },
                        plugins: {
                            legend: {
                                display: true,
                                labels: {
                                    color: 'rgba(0,0,0, 0.7)',
                                },
                            },
                        },
                    },
                });
            };


            if (testScores.length > 0 && isDataFetched) {
                createChart();
                createComparisonChart();
                createLineChart();
            }
        }
    }, [testScores, isDataFetched, iat1Available, iat2Available, iat3Available, students]); // Include iat availability states in the dependency array


    const setIatAvailability = (iatType, value) => {
        switch (iatType) {
            case 'iat_1':
                setIat1Available(value);
                break;
            case 'iat_2':
                setIat2Available(value);
                break;
            case 'iat_3':
                setIat3Available(value);
                break;
            default :
                break;
        }
    };

    const calculateClassIATAverages = (students) => {
        const classIatAverages = [0, 0, 0]; // Initialize array to store averages for each IAT
        const iatCounts = [0, 0, 0];

        students.forEach(student => {
            student.subjects.forEach(subject => {
                if (subject.scores.iat_1 !== undefined) {
                    classIatAverages[0] += parseInt(subject.scores.iat_1);
                    iatCounts[0]++;
                }
                if (subject.scores.iat_2 !== undefined) {
                    classIatAverages[1] += parseInt(subject.scores.iat_2);
                    iatCounts[1]++;
                }
                if (subject.scores.iat_3 !== undefined) {
                    classIatAverages[2] += parseInt(subject.scores.iat_3);
                    iatCounts[2]++;
                }
            });
        });

        for (let i = 0; i < 3; i++) {
            if (iatCounts[i] > 0) {
                classIatAverages[i] /= iatCounts[i];
            }
        }


        return classIatAverages;
    };


    function calculateSubjectAverages(testScores) {
        const subjectAverages = {}; // Create an object to store subject averages

        testScores.forEach((subject) => {
            const subjectName = subject?.subject_name || '';
            const iat1 = parseInt(subject?.scores?.iat_1) || 0;
            const iat2 = parseInt(subject?.scores?.iat_2) || 0;
            const iat3 = parseInt(subject?.scores?.iat_3) || 0;

            const totalScore = iat1 + iat2 + iat3;
            const averageScore = totalScore / 3;

            subjectAverages[subjectName] = averageScore;
        });

        return subjectAverages;
    };

    function findHighLowSubjects(subjectAverages) {
        let highestSubject = null;
        let lowestSubject = null;

        for (const subjectName in subjectAverages) {
            if (!highestSubject || subjectAverages[subjectName] > subjectAverages[highestSubject]) {
                highestSubject = subjectName;
            }

            if (!lowestSubject || subjectAverages[subjectName] < subjectAverages[lowestSubject]) {
                lowestSubject = subjectName;
            }
        }

        return { highestSubject, lowestSubject };
    };

    if (loading) {
        return <p>Loading test scores...</p>;
    }

    if (isClosed) {
        return null; // Don't render the component if it's closed
    }

    if (!testScores || testScores.length === 0) {
        return <p>No test scores found.</p>;
    }

    return (
        <div className="test-scrollable-container">
            <div className="high-low-score-container">
                <div className="high-score-subjects">
                    <h3>Highest Scoring Subject</h3>
                    <ul>
                        <li><strong>Subject:</strong> {highestSubject}</li>
                        <li><strong>Scored:</strong> {subjectAverages[highestSubject].toFixed(2)}</li>
                    </ul>
                </div>
                <div className="low-score-subjects">
                    <h3>Lowest Scoring Subject</h3>
                    <ul>
                        <li><strong>Subject:</strong> {lowestSubject}</li>
                        <li><strong>Scored: </strong>{subjectAverages[lowestSubject].toFixed(2)}</li>
                    </ul>
                </div>
            </div>

            <div className="test-score-chart-container">
                <h2 id="chart-names">Score table</h2>
                <div className="test-score-table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Subject Code</th>
                                <th>Subject Name</th>
                                <th>IAT 1</th>
                                <th>IAT 2</th>
                                <th>IAT 3</th>
                            </tr>
                        </thead>
                        <tbody>
                            {testScores.map((subject, index) => (
                                <tr key={index}>
                                    <td>{subject?.subject_code || ''}</td>
                                    <td>{subject?.subject_name || ''}</td>
                                    <td>{subject?.scores?.iat_1 || 'NaN'}</td>
                                    <td>{subject?.scores?.iat_2 || 'NaN'}</td>
                                    <td>{subject?.scores?.iat_3 || 'NaN'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <ComparisonChart email={email} department={department} year={year} testScores={testScores} students={students} />
            <div className="test-score-content-container">
                <div className="test-score-chart-container">
                    <h2 id="chart-names">Subject wise IAT performance</h2>
                    <canvas id="iat-performance-student-chart"></canvas>
                </div>
            </div>
            <div className="test-score-chart-container">
                <h2 id="chart-names">Your IAT wise comparison</h2>
                <canvas id="iat-comparison-chart"></canvas>
            </div>
            <div className="test-score-chart-container">
                <h2 id="chart-names">Overall IAT scores average in each subjests</h2>
                <canvas id="subject-line-chart"></canvas>
            </div>
        </div>
    );
};
export default TestScore;
