import React, { useState, useEffect } from 'react';
import { Chart, LinearScale, CategoryScale, BarController, BarElement } from 'chart.js';

import './CSS/Test_Score.css';
import './CSS/ComparisonChart.css';

const ComparisonChart = ({ testScores, students }) => {
    const [iat1Available, setIat1Available] = useState(true);
    const [iat2Available, setIat2Available] = useState(true);
    const [iat3Available, setIat3Available] = useState(true);
    const iat1Scores = testScores.map((subject) => subject?.scores['iat_1'] || 0);
    const iat2Scores = testScores.map((subject) => subject?.scores['iat_2'] || 0);
    const iat3Scores = testScores.map((subject) => subject?.scores['iat_3'] || 0);



    useEffect(() => {
        if (testScores.length > 0 && students.length > 0) {
            createChartIfYourScoresAvailable('iat_1');
            createChartIfYourScoresAvailable('iat_2');
            createChartIfYourScoresAvailable('iat_3');

        }
    }, [testScores, students]);

    const createChartIfYourScoresAvailable = (iatType) => {
        console.log("Checking availability for iatType:", iatType);

        if(iatType === 'iat_1'){
        if (iat1Scores.some((score) => score !== 0)) {
            
            console.log("Creating chart for iatType:", iatType);

            console.log("Creating chart for avail:"+ iat1Available);

            createChart('iat_1');
            console.log("Scores on iat1:", iat1Scores);

        } else {
            setIatAvailability('iat_1', false);
            console.log("Creating chart for avail:"+ iat1Available);


        }
    }

        // Similar checks for iat_2 and iat_3
        if(iatType === 'iat_2'){
            if (iat2Scores.some((score) => score !== 0)) {
                
                console.log("Creating chart for iatType:", iatType);
    
                console.log("Creating chart for avail:"+ iat2Available);
    
                createChart('iat_2');
                console.log("Scores on iat1:", iat2Scores);
    
            } else {
                setIatAvailability('iat_2', false);
                console.log("Creating chart for avail:"+ iat2Available);
    
    
            }
        }

        if(iatType === 'iat_3'){
            if (iat3Scores.some((score) => score !== 0)) {
                
                console.log("Creating chart for iatType:", iatType);
    
                console.log("Creating chart for avail:"+ iat3Available);
    
                createChart('iat_3');
                console.log("Scores on iat1:", iat3Scores);
    
            } else {
                setIatAvailability('iat_3', false);
                console.log("Creating chart for avail:"+ iat3Available);
    
    
            }
        }

        console.log("Finished checking for iatType:", iatType);

    }


    const calculateLowestAndHighestScores = (iatType) => {
        let lowestScores = [];
        let highestScores = [];
        if (students.length > 0) {
            for (let i = 0; i < testScores.length; i++) {
                const subject = testScores[i];
                let lowestIAT = Infinity;
                let highestIAT = -Infinity;
                for (let j = 0; j < students.length; j++) {
                    const student = students[j];
                    if (student.subjects && student.subjects.length > 0) {
                        for (let k = 0; k < student.subjects.length; k++) {
                            const studentSubject = student.subjects[k];
                            if (studentSubject.subject_name === subject.subject_name) {
                                const iat = parseInt(studentSubject.scores[iatType]) || 0;
                                lowestIAT = Math.min(lowestIAT, iat);
                                highestIAT = Math.max(highestIAT, iat);
                            }
                        }
                    }
                }
                lowestScores.push(lowestIAT);
                highestScores.push(highestIAT);
            }
        }
        return { lowestScores, highestScores };
    };

    function calculateClassIATSubjectAverages(students, iatType) {
        const classAverages = [];
        students[0]?.subjects.forEach((subject) => {
            const iatTotal = students.reduce((total, student) => {
                const iat =
                    parseInt(student?.subjects?.find((sub) => sub.subject_name === subject.subject_name)?.scores[iatType]) || 0;
                return total + iat;
            }, 0);
            const totalScore = iatTotal / students.length;
            classAverages.push(totalScore);
        });
        return classAverages;
    }

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
        }
    };

    const createChart = (iatType) => {
        // Register the required scales and controllers
        Chart.register(LinearScale, CategoryScale, BarController, BarElement);

        const canvas = document.getElementById(`iat-performance-student-chart-${iatType}`);
        const ctx = canvas.getContext('2d');
        if (typeof canvas.chart !== 'undefined') {
            canvas.chart.destroy();
        }

        const labels = testScores.map((subject) => subject?.subject_code || '');
        const iatScores = testScores.map((subject) => subject?.scores[iatType] || 0);
        const classIatAverages = calculateClassIATSubjectAverages(students, iatType);
        const lowestScoresAndHighestScores = calculateLowestAndHighestScores(iatType);
        const lowestScores = lowestScoresAndHighestScores.lowestScores;
        const highestScores = lowestScoresAndHighestScores.highestScores;
        console.log("iat type : " + iatType);

        console.log("low score : " + lowestScores);
        console.log("high score : " + highestScores);
        canvas.chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: `Lowest score (IAT ${iatType})`,
                        data: lowestScores,
                        backgroundColor: 'rgba(255, 206, 86, 0.5)', // Classic Blue
                        borderColor: 'rgba(255, 206, 86, 0.5)', // Classic Blue
                        borderWidth: 0,
                    },
                    {
                        label: `Your score (IAT ${iatType})`,
                        data: iatScores,
                        backgroundColor: 'rgba(75, 192, 192, 0.5)', // Sky Blue
                        borderColor: 'rgba(75, 192, 192, 0.5)', // Sky Blue
                        borderWidth: 0,
                    },
                    {
                        label: `Class average (IAT ${iatType})`,
                        data: classIatAverages,
                        backgroundColor: 'rgba(54, 162, 235, 0.5)', // Light Blue
                        borderColor: 'rgba(54, 162, 235, 0.5)', // Light Blue
                        borderWidth: 0,
                    },
                    {
                        label: `Highest score (IAT ${iatType})`,
                        data: highestScores,
                        backgroundColor: 'rgba(255, 99, 132, 0.5)', // Navy Blue
                        borderColor: 'rgba(255, 99, 132, 0.5)', // Navy Blue
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
                        max: 100,
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
            },
        });
    };


    return (
        <div className="iat-comparison-with-class">
            {testScores.length > 0 && students.length > 0 ? (
                <>
                    {iat1Available &&
                        <div className="comparing-chart-container">
                            <h2>IAT 1</h2>
                            {
                                calculateLowestAndHighestScores('iat_1').lowestScores.some(score => score !== 0) ||
                                    calculateLowestAndHighestScores('iat_1').highestScores.some(score => score !== 0) ? (
                                    <canvas id="iat-performance-student-chart-iat_1"></canvas>
                                ) : (
                                    <p>No data available for IAT 1</p>
                                )
                            }
                        </div>
                    }
                    {iat2Available &&

                        <div className="comparing-chart-container">
                            <h2>IAT 2</h2>
                            {calculateLowestAndHighestScores('iat_2').lowestScores.some(score => score !== 0) ||
                                calculateLowestAndHighestScores('iat_2').highestScores.some(score => score !== 0) ? (
                                <canvas id="iat-performance-student-chart-iat_2"></canvas>
                            ) : (
                                <p>No data available for IAT 2</p>
                            )}
                        </div>
                    }
                    {iat3Available &&

                        <div className="comparing-chart-container">
                            <h2>IAT 3</h2>
                            {calculateLowestAndHighestScores('iat_3').lowestScores.some(score => score !== 0) ||
                                calculateLowestAndHighestScores('iat_3').highestScores.some(score => score !== 0) ? (
                                <canvas id="iat-performance-student-chart-iat_3"></canvas>
                            ) : (
                                <p>No data available for IAT 3</p>
                            )}
                        </div>}
                </>
            ) : (
                <p>Loading data...</p>
            )}
        </div>
    );

};

export default ComparisonChart;
