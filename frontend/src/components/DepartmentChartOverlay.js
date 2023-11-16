import React, { useEffect, useState} from 'react';
import { Chart, LinearScale, CategoryScale, DoughnutController, ArcElement, LineController, LineElement } from 'chart.js/auto';
import ClassWiseAnalytics from './ClassWiseAnalytics.js';

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
    const average = (subject.scores / maxScore) * 100;     return {
      subject_name: subject.subject_name,
      average_score: average,
    };
  });
  const overallAverage = subjectAverages.reduce((total, subject) => total + subject.average_score, 0) /subjectAverages.length;
  const hasTestScore = !isNaN(overallAverage);
  let overall_score;
  if (hasTestScore) {
        overall_score = ((parseFloat(presentPercentage) + parseFloat(overallAverage) ) / 2).toFixed(2);
  } else {
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
    absentees,   };
};

const calculateYearWiseAttendance = (students, selectedDepartment) => {
  const currentDate = new Date();
  let firstYearPresentCount = 0;
  let firstYearAbsentCount = 0;
  let secondYearPresentCount = 0;
  let secondYearAbsentCount = 0;
  let thirdYearPresentCount = 0;
  let thirdYearAbsentCount = 0;
  let finalYearPresentCount = 0;
  let finalYearAbsentCount = 0;
    students.forEach((student) => {
    if (student.role === 'student' && student.department === selectedDepartment) {
      const year = student.class; 
      const isPresent = student.present_array.some((dateStr) => new Date(dateStr).toDateString() === currentDate.toDateString());
      const isAbsent = student.leave_array.some((dateStr) => new Date(dateStr).toDateString() === currentDate.toDateString());
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

const DepartmentChartOverlay = ({ department, students }) => {
  const selectedDepartment=department;
  const [selectedYear, setSelectedYear] = useState('');
  const { presentPercentage, absentPercentage, presentCount, totalCount } = calculateOverallAttendance(
    students,
    selectedDepartment
  ); 
  const [showAttendanceOverlay, setShowAttendanceOverlay] = useState(false);
  useEffect(() => {
    createChart();
    createYearWiseTestChart();
    createOverallDepartmentPerformanceChart();
    createGenderDepartmentLineChart();
  }, [department, students]);

  const createChart=()=>{
    Chart.register(LinearScale, CategoryScale, DoughnutController, ArcElement);
    const canvas = document.getElementById('department-chart-overlay');
    const ctx = canvas.getContext('2d');
    if (typeof canvas.chart !== 'undefined') {
      canvas.chart.destroy();
    }
    const chartWidth = 625;
    const chartHeight = 250;
    canvas.width = chartWidth;
    canvas.height = chartHeight;
    const departmentStudents = students.filter((student) => student.department === department);
    const tableData = departmentStudents.map((student) => {
    const studentName = student.name;       
    const studentTestAverage = calculateStudentTestAverage(student);
    return { studentName, studentTestAverage };
    });
    const overallTestAverage =tableData.reduce((total, data) => total + parseFloat(data.studentTestAverage), 0) / departmentStudents.length;
    const attendanceAverage = departmentStudents.reduce((total, student) => total + parseFloat(student.total_attendance / student.total_days * 100), 0) / departmentStudents.length;
    const testScoreColor = 'rgb(0, 79, 152)';
    const attendanceColor = 'rgb( 8, 37, 103)';
    canvas.chart=new Chart(ctx, {
      type: 'pie',
      data: {
        labels: ['Test Score', 'Attendance'],
        datasets: [
          {
            data: [
              isNaN(overallTestAverage) ? 0 : parseFloat(overallTestAverage),
              isNaN(attendanceAverage) ? 0 : parseFloat(attendanceAverage),              ],
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
            position: 'right',
            labels: {
              color: 'black',},
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
    const tableElement = document.getElementById('department-students-table');
    if (tableElement) {
      tableElement.innerHTML = '';
      const table = document.createElement('table');
      const headerRow = table.insertRow();
      const nameHeader = headerRow.insertCell();
      const averageHeader = headerRow.insertCell();
      nameHeader.textContent = 'Student Name';
      averageHeader.textContent = 'Overall Average (%)';
        tableData.forEach((data) => {
        const row = table.insertRow();
        const nameCell = row.insertCell();
        const averageCell = row.insertCell();
        nameCell.textContent = data.studentName;
        averageCell.textContent = isNaN(data.studentAverage) ? 'NaN' : `${Math.round(data.studentAverage)}%`;
      });
      tableElement.appendChild(table);
    }
  }
  const createOverallDepartmentPerformanceChart = () => {
    Chart.register(LinearScale, CategoryScale, DoughnutController, ArcElement);
    const canvas = document.getElementById('department-chart-test');
    const ctx = canvas.getContext('2d');
    if (typeof canvas.chart !== 'undefined') {
      canvas.chart.destroy();
      }
        const chartWidth = 625;
        const chartHeight = 250;
        canvas.width = chartWidth;
        canvas.height = chartHeight;
      const departmentStudents = students.filter((student) => student.department === department);
      const tableData = departmentStudents.map((student) => {
      const studentName = student.name;       const studentAverage = calculateStudentAverage(student);
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
            display: false,           },
          datalabels: {
            color: 'black',
            anchor: 'end',
            align: 'end',
            font: {
              weight: 'bold',
            },
            formatter: (value) => (value > 0 ? value.toString() : ''),           },
        },
        scales: {
          x: {
            ticks: {
              color: 'rgba(0, 0, 0, 0.7)',             },
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
  function calculateYearlyTestAverage(students, year) {
    const studentsInYear = students.filter((student) => student.class === year && student.department === department);
    const totalStudents = studentsInYear.length;
    if (totalStudents === 0) return NaN;
    const totalAverage =
      studentsInYear.reduce((total, student) => total + parseFloat(calculateStudentTestAverage(student)), 0) /
      totalStudents;
    return totalAverage;
  }
  function calculateStudentTestAverage (student){
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
      const maxScore = 100;
      const subjectAverages = subjectScores.map((subject) => {
      if (subject.scores === "NaN") {
          return {
          subject_name: subject.subject_name,
          average_score: "NaN",
          };
      }
      const average = (subject.scores / maxScore) * 100;       return {
          subject_name: subject.subject_name,
          average_score: average,
      };
      });
      const overallAverage =
      subjectAverages.reduce((total, subject) => total + subject.average_score, 0) /
      subjectAverages.length;
    return overallAverage;
  }
  const createYearWiseTestChart = () => {
    Chart.register(LinearScale, CategoryScale, DoughnutController, ArcElement);
    const canvas = document.getElementById('year-chart-test');
    const ctx = canvas.getContext('2d');
    if (typeof canvas.chart !== 'undefined') {
      canvas.chart.destroy();
      }
        const chartWidth = 625;
        const chartHeight = 250;
        canvas.width = chartWidth;
        canvas.height = chartHeight;
    const firstYearAverage = calculateYearlyTestAverage(students, 'First year');
    const secondYearAverage = calculateYearlyTestAverage(students, 'Second year');
    const thirdYearAverage = calculateYearlyTestAverage(students, 'Third year');
    const finalYearAverage = calculateYearlyTestAverage(students, 'Final year');
    const yearLabels = ['First year', 'Second year', 'Third year', 'Final year'];
    canvas.chart=new Chart(ctx, {
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
        responsive: false,         
        maintainAspectRatio: false,
        scales: {
          x: {
            display: true,
            title: {
              display: false,
            },
            ticks: {
              color: 'black',
            },
            grid: {
              display: false,             
            },
          },
          y: {
            display: true,
            title: {
              display: false,             
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

const calculateAverageByGender = (iatIndex, gender) => {
  const filteredStudents = students.filter((student) => student.gender === gender && student.department===department);
  const studentsWithScores = filteredStudents.filter((student) => student.subjects.some((subject) => subject.scores[`iat_${iatIndex}`]));
  const totalScore = studentsWithScores.reduce((total, student) => {
  const iatScore = parseInt(student.subjects.find((subject) => subject.scores[`iat_${iatIndex}`])?.scores[`iat_${iatIndex}`]);
  return total + iatScore;
  }, 0);
  const averageScore = totalScore / studentsWithScores.length;
  return averageScore;
};
  const createGenderDepartmentLineChart = () => {
      Chart.register(LinearScale, CategoryScale, LineController, LineElement);
      const canvas = document.getElementById('iat-performance-chart-department');
      const ctx = canvas.getContext('2d');
      if (typeof canvas.chart !== 'undefined') {
          canvas.chart.destroy();
      }
      const chartWidth = 625;
      const chartHeight = 250;
      canvas.width = chartWidth;
      canvas.height = chartHeight;
      const maleAverages = [1, 2, 3].map((iatIndex) => calculateAverageByGender(iatIndex, 'male'));
      const femaleAverages = [1, 2, 3].map((iatIndex) => calculateAverageByGender(iatIndex, 'female'));
      canvas.chart=new Chart(ctx, {
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
  const handleCloseOverlay = () => {
    setShowAttendanceOverlay(false);
};
const handleTodayClick=()=>{
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
    const textarea = document.createElement('textarea');
    textarea.value = classAttendanceText;
    document.body.appendChild(textarea);
        textarea.select();
    document.execCommand('copy');
        document.body.removeChild(textarea);
        alert('Class-wise attendance details copied to the clipboard!');
  };
  const yearWiseAttendance = calculateYearWiseAttendance(students, department);
  const { firstYear, secondYear, thirdYear, finalYear } = yearWiseAttendance;
  return (
    <div>
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
            <p>Students Present Today: {presentCount}</p>
            <p>Total Students: {totalCount}</p>
            <button className="copy-button" onClick={handleCopyClassAttendance}>
    Copy Report
  </button>
            </div>
            <br></br>
            <br></br>
      <div className='year-attendance-container'>
        <h2>First Year Attendance</h2>
        <p>Total Students: {firstYear.totalCount}</p>
        <p>Present Count {firstYear.presentCount}</p>
        <p>Present Percentage: {firstYear.presentPercentage}%</p>
      </div>
      <div className='year-attendance-container'>
        <h2>Second Year Attendance</h2>
        <p>Total Students: {secondYear.totalCount}</p>
        <p>Present Count {secondYear.presentCount}</p>
        <p>Present Percentage: {secondYear.presentPercentage}%</p>
      </div>
      <div className='year-attendance-container'>
        <h2>Third Year Attendance</h2>
        <p>Total Students: {thirdYear.totalCount}</p>
        <p>Present Count {thirdYear.presentCount}</p>
        <p>Present Percentage: {thirdYear.presentPercentage}%</p>
      </div>
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
      <div className='menu'>
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
        <ClassWiseAnalytics students={students} department={department} year={selectedYear}/>
        </div>
        }
    </div>
  );
};
export default DepartmentChartOverlay;
