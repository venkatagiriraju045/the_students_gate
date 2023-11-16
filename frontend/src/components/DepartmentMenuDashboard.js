import React, { useEffect, useState } from 'react';
import { Chart, LinearScale, CategoryScale, DoughnutController, ArcElement, LineController, LineElement } from 'chart.js/auto';
import DepartmentClassWise from './DepartmentClassWise.js';


function calculateStudentAverage(student) {
  const totalAttendance = student.total_attendance;
  const totalDays = student.total_days;
  const presentPercentage = ((totalAttendance / totalDays) * 100).toFixed(2);

  const maxScore = 100;
  const subjectScores = student.subjects.map((subject) => {
    const { scores } = subject;
    if (!scores || typeof scores !== "object") {
      // If scores are missing or not an object, return NaN for this subject
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
    const average = (subject.scores / maxScore) * 100; // Scale the average score based on the maximum score
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
    // Calculate overall score with test score
    overall_score = ((parseFloat(presentPercentage) + parseFloat(overallAverage)) / 2).toFixed(2);
  } else {
    // Calculate overall score only with attendance, without test 
    overall_score = parseFloat(presentPercentage).toFixed(2);
  }

  return overall_score;
}
const calculateAttendancePercentage = (presentCount, absentCount) => {
  const totalDays = presentCount + absentCount;
  if (totalDays === 0) return { percentage: 0, count: 0, absentees: [] };
  const percentage = ((presentCount / totalDays) * 100).toFixed(2);
  return { percentage, count: presentCount, absentees: [] };
};

const calculateOverallAttendance = (students, selectedDepartment) => {
  const studentList = students.filter((student) => student.role === 'student' && student.department === selectedDepartment);

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
  const absentees = []; // Array to store the names of absentees

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
    absentees, // Include the list of absentees in the result
  };
};
const calculateYearWiseAttendance = (students, selectedDepartment) => {
  const currentDate = new Date();

  // Initialize variables to store attendance counts for each class
  let firstYearPresentCount = 0;
  let firstYearAbsentCount = 0;
  let secondYearPresentCount = 0;
  let secondYearAbsentCount = 0;
  let thirdYearPresentCount = 0;
  let thirdYearAbsentCount = 0;
  let finalYearPresentCount = 0;
  let finalYearAbsentCount = 0;

  // Loop through the students and calculate attendance for each class
  students.forEach((student) => {
    if (student.role === 'student' && student.department === selectedDepartment) {
      const year = student.class; // Assuming the student object has the 'class' property indicating the year of study

      // Determine if the student is present or absent for the current date
      const isPresent = student.present_array.some((dateStr) => new Date(dateStr).toDateString() === currentDate.toDateString());
      const isAbsent = student.leave_array.some((dateStr) => new Date(dateStr).toDateString() === currentDate.toDateString());

      // Update the attendance counts based on the student's class and attendance status
      if (year === 'First year') {
        if (isPresent) {
          firstYearPresentCount++;
        } else if (isAbsent) {
          firstYearAbsentCount++;
        }
      } else if (year === 'Second year') {
        if (isPresent) {
          secondYearPresentCount++;
        } else if (isAbsent) {
          secondYearAbsentCount++;
        }
      } else if (year === 'Third year') {
        if (isPresent) {
          thirdYearPresentCount++;
        } else if (isAbsent) {
          thirdYearAbsentCount++;
        }
      } else if (year === 'Final year') {
        if (isPresent) {
          finalYearPresentCount++;
        } else if (isAbsent) {
          finalYearAbsentCount++;
        }
      }
    }
  });

  // Calculate percentages for each class using the existing calculateAttendancePercentage function
  const firstYearAttendance = calculateAttendancePercentage(firstYearPresentCount, firstYearAbsentCount);
  const secondYearAttendance = calculateAttendancePercentage(secondYearPresentCount, secondYearAbsentCount);
  const thirdYearAttendance = calculateAttendancePercentage(thirdYearPresentCount, thirdYearAbsentCount);
  const finalYearAttendance = calculateAttendancePercentage(finalYearPresentCount, finalYearAbsentCount);

  return {
    firstYear: {
      presentPercentage: firstYearAttendance.percentage,
      presentCount: firstYearAttendance.count,
      totalCount: firstYearPresentCount + firstYearAbsentCount,
    },
    secondYear: {
      presentPercentage: secondYearAttendance.percentage,
      presentCount: secondYearAttendance.count,
      totalCount: secondYearPresentCount + secondYearAbsentCount,
    },
    thirdYear: {
      presentPercentage: thirdYearAttendance.percentage,
      presentCount: thirdYearAttendance.count,
      totalCount: thirdYearPresentCount + thirdYearAbsentCount,
    },
    finalYear: {
      presentPercentage: finalYearAttendance.percentage,
      presentCount: finalYearAttendance.count,
      totalCount: finalYearPresentCount + finalYearAbsentCount,
    },
  };
};


const DepartmentMenuDashboard = ({ department, students }) => {
  const selectedDepartment = department;
  const [selectedYear, setSelectedYear] = useState('');
  const { presentPercentage, absentPercentage, presentCount, totalCount } = calculateOverallAttendance(
    students,
    selectedDepartment
  );
  const [showAttendanceOverlay, setShowAttendanceOverlay] = useState(false);

  useEffect(() => {
    const createChart = () => {
      Chart.register(LinearScale, CategoryScale, DoughnutController, ArcElement);
      const canvas = document.getElementById('department-chart-overlay');
      const ctx = canvas.getContext('2d');

      if (typeof canvas.chart !== 'undefined') {
        canvas.chart.destroy();
      }

      // Set the desired fixed dimensions for the chart
      const chartWidth = 570;
      const chartHeight = 225;

      // Set the canvas width and height to match the chart dimensions
      canvas.width = chartWidth;
      canvas.height = chartHeight;

      // Get the data for the selected department
      const departmentStudents = students.filter((student) => student.department === department);

      // Calculate overall average for each student in the selected department
      const tableData = departmentStudents.map((student) => {
        const studentName = student.name; // Assuming the student object has a 'name' property
        const studentTestAverage = calculateStudentTestAverage(student);

        return { studentName, studentTestAverage };
      });

      // Calculate overall average for the selected department
      const overallTestAverage = tableData.reduce((total, data) => total + parseFloat(data.studentTestAverage), 0) / departmentStudents.length;
      const attendanceAverage = departmentStudents.reduce((total, student) => total + parseFloat(student.total_attendance / student.total_days * 100), 0) / departmentStudents.length;

      // Separate the colors for each field
      const testScoreColor = 'rgb(0, 79, 152)';
      const attendanceColor = 'rgb( 8, 37, 103)';

      canvas.chart = new Chart(ctx, {
        type: 'pie',
        data: {
          labels: ['Test Score', 'Attendance'],
          datasets: [
            {
              data: [
                isNaN(overallTestAverage) ? 0 : parseFloat(overallTestAverage), // Test Score
                isNaN(attendanceAverage) ? 0 : parseFloat(attendanceAverage),  // Attendance
              ],
              backgroundColor: [testScoreColor, attendanceColor],
              borderColor: ['rgb(0, 79, 152)', 'rgb( 8, 37, 103)'],
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
              position: 'right', // Display the legend on the left side
              labels: {
                color: 'black', // Set the font color for the labels
              },
            },
            annotation: {
              annotations: {
                value: {
                  type: 'text',
                  color: 'black', // Change the annotation font color to black
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
      const tableElement = document.getElementById('department-students-table');
      if (tableElement) {
        tableElement.innerHTML = '';
        const table = document.createElement('table');

        // Create table header
        const headerRow = table.insertRow();
        const nameHeader = headerRow.insertCell();
        const averageHeader = headerRow.insertCell();
        nameHeader.textContent = 'Student Name';
        averageHeader.textContent = 'Overall Average (%)';

        // Create table rows
        tableData.forEach((data) => {
          const row = table.insertRow();
          const nameCell = row.insertCell();
          const averageCell = row.insertCell();
          nameCell.textContent = data.studentName;
          averageCell.textContent = isNaN(data.studentAverage) ? 'NaN' : `${Math.round(data.studentAverage)}%`;
        });

        tableElement.appendChild(table);
      }
      //

    }
    const createYearWiseTestChart = () => {
      Chart.register(LinearScale, CategoryScale, DoughnutController, ArcElement);
      const canvas = document.getElementById('year-chart-test');
      const ctx = canvas.getContext('2d');

      if (typeof canvas.chart !== 'undefined') {
        canvas.chart.destroy();
      }

      // Set the desired fixed dimensions for the chart
      const chartWidth = 570;
      const chartHeight = 225;

      // Set the canvas width and height to match the chart dimensions
      canvas.width = chartWidth;
      canvas.height = chartHeight;

      const firstYearAverage = calculateYearlyTestAverage(students, 'First year');
      const secondYearAverage = calculateYearlyTestAverage(students, 'Second year');
      const thirdYearAverage = calculateYearlyTestAverage(students, 'Third year');
      const finalYearAverage = calculateYearlyTestAverage(students, 'Final year');

      const yearLabels = ['First year', 'Second year', 'Third year', 'Final year'];

      canvas.chart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: yearLabels,
          datasets: [
            {
              label: 'Yearly Average',
              data: [firstYearAverage, secondYearAverage, thirdYearAverage, finalYearAverage],
              borderColor: 'rgb(0, 123, 255)',
              borderWidth: 2,
              pointBackgroundColor: 'rgb(0, 123, 255)',
              pointRadius: 5,
              pointHoverRadius: 7,
              fill: false,
            },
          ],
        },
        options: {
          responsive: false, // Set responsive to false to prevent resizing based on container size
          maintainAspectRatio: false,
          scales: {
            x: {
              display: true,
              title: {
                display: false, // Hide the x-axis title
              },
              ticks: {
                color: 'black',
              },
              grid: {
                display: false, // Hide the x-axis grid lines
              },
            },
            y: {
              display: true,
              title: {
                display: false, // Hide the y-axis title
              },
              ticks: {
                color: 'black',
                beginAtZero: true,
                stepSize: 20,
                max: 100,
              },
              grid: {
                color: 'rgba(0, 0, 0, 0.2)',
                drawBorder: false,
                borderDash: [5, 5],
              },
            },
          },
          plugins: {
            legend: {
              display: false,
            },
            datalabels: {
              display: false,
            },
          },
        },
      });
    };
    const createOverallDepartmentPerformanceChart = () => {
      Chart.register(LinearScale, CategoryScale, DoughnutController, ArcElement);
      const canvas = document.getElementById('department-chart-test');
      const ctx = canvas.getContext('2d');

      if (typeof canvas.chart !== 'undefined') {
        canvas.chart.destroy();
      }

      // Set the desired fixed dimensions for the chart
      const chartWidth = 570;
      const chartHeight = 225;

      // Set the canvas width and height to match the chart dimensions
      canvas.width = chartWidth;
      canvas.height = chartHeight;

      const departmentStudents = students.filter((student) => student.department === department);

      // Calculate overall average for each student in the selected department
      const tableData = departmentStudents.map((student) => {
        const studentName = student.name; // Assuming the student object has a 'name' property
        const studentAverage = calculateStudentAverage(student);

        return { studentName, studentAverage };
      });

      // Remove the highest bin value (100) from the bins array
      const bins = [90, 80, 70, 60, 50, 40, 0];
      const binLabels = bins.map((bin, index) => (index === 0 ? `${bin}+` : `${bin}-${bins[index - 1]}`));

      // Count how many students fall into each bin/range
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

      // Separate colors for each bin/range
      const testScoreColors = [
        'rgb(0, 85, 98)',
        'rgb(14, 129, 116)',
        'rgb(110, 186, 140)',
        'rgb(185, 242, 161)',
        'rgb(147, 193, 160)',
        'rgb(211, 255, 204)',
        'rgb(250, 20, 20)',
      ];

      // Create and render the Test Scores Bar Chart
      canvas.chart = new Chart(ctx, {
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
              display: false, // Hide the legend since we don't need it for this chart
            },
            datalabels: {
              color: 'black', // Set the font color for the datalabels inside the chart
              anchor: 'end',
              align: 'end',
              font: {
                weight: 'bold',
              },
              formatter: (value) => (value > 0 ? value.toString() : ''), // Show only non-zero values as labels
            },
          },
          scales: {
            x: {
              ticks: {
                color: 'rgba(0, 0, 0, 0.7)', // Set the font color for x-axis labels
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
                color: 'black', // Set the font color for the y-axis ticks
                stepSize: 1, // Show integer values on the y-axis
                beginAtZero: true, // Start the y-axis at 0
              },
            },
          },
        },
      });
    };
    const createGenderDepartmentLineChart = () => {
      Chart.register(LinearScale, CategoryScale, LineController, LineElement);
      const canvas = document.getElementById('iat-performance-chart-department');
      const ctx = canvas.getContext('2d');
      if (typeof canvas.chart !== 'undefined') {
        canvas.chart.destroy();
      }

      // Set the desired fixed dimensions for the chart
      const chartWidth = 570;
      const chartHeight = 225;

      // Set the canvas width and height to match the chart dimensions
      canvas.width = chartWidth;
      canvas.height = chartHeight;

      // Get the average scores for males and females for each iat
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
                // Add any annotations you want (if needed)
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
    function calculateYearlyTestAverage(students, year) {
      const studentsInYear = students.filter((student) => student.class === year && student.department === department);
      const totalStudents = studentsInYear.length;
      if (totalStudents === 0) return NaN;
  
      const totalAverage =
        studentsInYear.reduce((total, student) => total + parseFloat(calculateStudentTestAverage(student)), 0) /
        totalStudents;
  
  
      return totalAverage;
    }
    const calculateAverageByGender = (iatIndex, gender) => {
      const filteredStudents = students.filter((student) => student.gender === gender && student.department === department);
  
      // Filter out students who have scores for the given iatIndex
      const studentsWithScores = filteredStudents.filter((student) => student.subjects.some((subject) => subject.scores[`iat_${iatIndex}`]));
  
      // Calculate the total score and count of students with scores for the iatIndex
      const totalScore = studentsWithScores.reduce((total, student) => {
        const iatScore = parseInt(student.subjects.find((subject) => subject.scores[`iat_${iatIndex}`])?.scores[`iat_${iatIndex}`]);
        return total + iatScore;
      }, 0);
  
      const averageScore = totalScore / studentsWithScores.length;
      return averageScore;
    };
  
    if (students){
    createChart();
    createYearWiseTestChart();
    createOverallDepartmentPerformanceChart();
    createGenderDepartmentLineChart();
    }

  }, [department, students]);


  function calculateStudentTestAverage(student) {
    const subjectScores = student.subjects.map((subject) => {
      const { scores } = subject;
      if (!scores || typeof scores !== "object") {
        // If scores are missing or not an object, return NaN for this subject
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

    const maxScore = 100;

    const subjectAverages = subjectScores.map((subject) => {
      if (subject.scores === "NaN") {
        return {
          subject_name: subject.subject_name,
          average_score: "NaN",
        };
      }
      const average = (subject.scores / maxScore) * 100; // Scale the average score based on the maximum score
      return {
        subject_name: subject.subject_name,
        average_score: average,
      };
    });

    const overallAverage =
      subjectAverages.reduce((total, subject) => total + subject.average_score, 0) /
      subjectAverages.length;

    return overallAverage;
  }

  const handleCloseOverlay = () => {
    setShowAttendanceOverlay(false);
  };

  const handleTodayClick = () => {
    setShowAttendanceOverlay(true);
  }

  const handleMenuClick = (year) => {
    setSelectedYear(year);
  };
  const handleCopyClassAttendance = () => {
    const yearWiseAttendance = calculateYearWiseAttendance(students, selectedDepartment);
    const { firstYear, secondYear, thirdYear, finalYear } = yearWiseAttendance;

    const classAttendanceText = `
      
      Year-wise Attendance:
      
      First Year:
        Total Students: ${firstYear.totalCount}
        Present Count: ${firstYear.presentCount}
        Present Percentage: ${firstYear.presentPercentage}%
        
      Second Year:
        Total Students: ${secondYear.totalCount}
        Present Count: ${secondYear.presentCount}
        Present Percentage: ${secondYear.presentPercentage}%
        
      Third Year:
        Total Students: ${thirdYear.totalCount}
        Present Count: ${thirdYear.presentCount}
        Present Percentage: ${thirdYear.presentPercentage}%

      Final Year:
        Total Students: ${finalYear.totalCount}
        Present Count: ${finalYear.presentCount}
        Present Percentage: ${finalYear.presentPercentage}%

      Overall Attendance:

        Total Students: ${totalCount}
        No. of Students Present: ${presentCount}
        Overall Attendance Percentage: ${presentPercentage}%
        
    `;

    // Create a new textarea element (it's not visible on the page)
    const textarea = document.createElement('textarea');
    textarea.value = classAttendanceText;
    document.body.appendChild(textarea);

    // Select the text inside the textarea and copy it to the clipboard
    textarea.select();
    document.execCommand('copy');

    // Remove the textarea element from the DOM
    document.body.removeChild(textarea);

    // Optionally, show a notification that the text has been copied
    alert('Class-wise attendance details copied to the clipboard!');
  };

  const yearWiseAttendance = calculateYearWiseAttendance(students, department);
  const { firstYear, secondYear, thirdYear, finalYear } = yearWiseAttendance;



  return (
    <div>
      {showAttendanceOverlay && (
        <div className="dep-admin-overlay">
          <div className="dep-admin-overlay-content">
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
                  Copy Report
                </button>
              </div>
              <br></br>
              <br></br>
              {/* Display First Year Attendance */}
              <div className='year-attendance-container'>
                <h2>First Year Attendance</h2>
                <p>Total Students: {firstYear.totalCount}</p>
                <p>Present Count {firstYear.presentCount}</p>
                <p>Present Percentage: {firstYear.presentPercentage}%</p>

              </div>

              {/* Display Second Year Attendance */}
              <div className='year-attendance-container'>
                <h2>Second Year Attendance</h2>
                <p>Total Students: {secondYear.totalCount}</p>
                <p>Present Count {secondYear.presentCount}</p>
                <p>Present Percentage: {secondYear.presentPercentage}%</p>
              </div>

              {/* Display Third Year Attendance */}
              <div className='year-attendance-container'>
                <h2>Third Year Attendance</h2>
                <p>Total Students: {thirdYear.totalCount}</p>
                <p>Present Count {thirdYear.presentCount}</p>
                <p>Present Percentage: {thirdYear.presentPercentage}%</p>
              </div>

              {/* Display Final Year Attendance */}
              <div className='year-attendance-container'>
                <h2>Final Year Attendance</h2>
                <p>Total Students: {finalYear.totalCount}</p>
                <p>Present Count {finalYear.presentCount}</p>
                <p>Present Percentage: {finalYear.presentPercentage}%</p>
              </div>
              <br></br>
            </div>
          </div>
        </div>
      )}


      <div className='admin-year-choosing-menu '>
        <div className='department-header-container'>
          <h2 className='department-wise-chart-heading'>{department} Department</h2>
          <div className='menu-buttons'>
            <a href="#class-wise-page"><button className="today-button" onClick={handleTodayClick}>Attendance</button></a>
            <a href="#class-wise-page"><button onClick={() => handleMenuClick('First year')}>First year</button></a>
            <a href="#class-wise-page"><button onClick={() => handleMenuClick('Second year')}>Second year</button></a>
            <a href="#class-wise-page"><button onClick={() => handleMenuClick('Third year')}>Third year</button></a>
            <a href="#class-wise-page"><button onClick={() => handleMenuClick('Final year')}>Final year</button></a>
          </div>
        </div>
      </div>
      <div className='profile-chart-container'>
        <div className='overall-department-performance-chart-container'>
          <div className='inside-container'>
            <div className='sub-charts-container'>
              <canvas id="department-chart-overlay"></canvas>
            </div>
          </div>
          <p className='chart-heads'>Overall Performance</p>
        </div>


        <div className='overall-department-performance-chart-container'>
          <div className='inside-container'>
            <div className='sub-charts-container'>
              <canvas id="department-chart-test"></canvas>
            </div>
          </div>
          <p className='chart-heads'>Overall Activities</p>
        </div>
      </div>

      <div className='profile-chart-container'>

        <div className='overall-department-performance-chart-container'>
          <div className='inside-container'>
            <div className='sub-charts-container'>
              <canvas id="year-chart-test"></canvas>
              <p className='chart-heads'>Year Wise Test Performance</p>
            </div>
          </div>
        </div>
        <div className='overall-department-performance-chart-container'>

          <div className='inside-container'>
            <div className='sub-charts-container'>
              <canvas id="iat-performance-chart-department"></canvas>
              <p className='chart-heads'>Gender Wise IAT Performance</p>
            </div>
          </div>
        </div>
      </div>
      {selectedYear &&
        <div id='class-wise-page' className='class-wise-analytics-page'>
          <DepartmentClassWise students={students} department={department} year={selectedYear} />
        </div>
      }

      {/*<div id="department-students-table"></div>*/}
    </div>
  );
};

export default DepartmentMenuDashboard;
