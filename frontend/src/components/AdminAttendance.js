import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './CSS/AdminAttendance.css';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const AdminAttendance = ({students, department, instituteName}) => {

const [loading, setLoading] = useState(false);
const selectedDepartment = department;
const [selectedYear, setSelectedYear] = useState("");
const [searchQuery, setSearchQuery] = useState('');
const [date, setDate] = useState('');
const [message, setMessage] = useState('');
const navigate = useNavigate();
const [allStudentsAttendance, setAllStudentsAttendance] = useState({});
const [movingLabel, setMovingLabel] = useState('');
const [labelWidth, setLabelWidth] = useState(0);
const [dateError, setDateError] = useState(false);
const [isDateChosen, setIsDateChosen] = useState(false); 

const handleLabelMove = (department) => {
    setMovingLabel(departmentShortNames[department] || department);
};

useEffect(() => {
    setDateError(false);
}, [date]);

useEffect(() => {
    const updateLabelWidth = () => {
    const label = document.querySelector('.toggle-label');
    if (label) {
        setLabelWidth(label.offsetWidth);
    }
    };

    updateLabelWidth();

    window.addEventListener('resize', updateLabelWidth);
    return () => {
    window.removeEventListener('resize', updateLabelWidth);
    };
}, [selectedDepartment]);

useEffect(() => {
    const timer = setTimeout(() => {
    setMovingLabel('');
    }, 400);

    return () => clearTimeout(timer);
}, [selectedDepartment]);

useEffect(() => {
    const tableContainer = document.querySelector('.attendance-table-container');

    if (tableContainer) {
    tableContainer.addEventListener('scroll', handleTableScroll);
    }

    return () => {
    if (tableContainer) {
        tableContainer.removeEventListener('scroll', handleTableScroll);
    }
    };
}, []);

useEffect(() => {
    const defaultPresentData = {};
    students.forEach((student) => {
    defaultPresentData[student.email] = true;
    });
    setAllStudentsAttendance(defaultPresentData);
}, [students]);



function handleTableScroll(event) {
    const tableContainer = event.currentTarget;
    const distanceScrolled = tableContainer.scrollTop;
    const tableHeader = tableContainer.querySelector('th');

    if (distanceScrolled >= 40) {
    const blurIntensity = Math.min(4, (distanceScrolled - 40) / 10);
    const transparency = Math.min(0.8, (distanceScrolled - 40) / 400);

    tableHeader.style.backdropFilter = `blur(${blurIntensity}px)`;
    tableHeader.style.backgroundColor = `rgba(41, 50, 65, ${transparency})`;

    tableContainer.style.paddingLeft = '5px';
    tableContainer.style.paddingRight = '5px';
    } else {
    tableHeader.style.backdropFilter = 'blur(0)';
    tableHeader.style.backgroundColor = 'rgba(41, 50, 65, 0.8)';

    tableContainer.style.paddingLeft = '0';
    tableContainer.style.paddingRight = '0';
    }
}

const sortStudentsByName = (students) => {
    const yearOrder = ["First year", "Second year", "Third year", "Final year"];
  
    return students.sort((a, b) => {
      const yearIndexA = yearOrder.indexOf(a.class);
      const yearIndexB = yearOrder.indexOf(b.class);
  
      const yearComparison = yearIndexA - yearIndexB;
      if (yearComparison !== 0) return yearComparison;
  
      return a.name.localeCompare(b.name);
    });
  };


const groupStudentsByYear = (students) => {
    const groupedStudents = {
      "First year": [],
      "Second year": [],
      "Third year": [],
      "Final year": [],
    };
  
    students.forEach((student) => {
      groupedStudents[student.class].push(student);
    });
  
    return groupedStudents;
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
    const tableContainer = document.querySelector('.attendance-table-container');
    const headerHeight = document.querySelector('.attendance-table-container th').offsetHeight;
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
      (selectedDepartment === "" || student.department === selectedDepartment) &&
      (selectedYear === "" || student.class === selectedYear) &&
      (student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(student.registerNumber)
          .toLowerCase()
          .includes(searchQuery.toLowerCase()))
  );
  

const handleUpdateAttendance = async () => {
    if (!isDateChosen) {    
    setDateError(true);
    setLoading(false);
    return; 
    }
    setLoading(true);
    try {
    const selectedDepartmentStudents = students.filter(
        (student) => student.department === selectedDepartment && student.class===selectedYear
    );

    const presentDataForSelectedDept = {};
    selectedDepartmentStudents.forEach((student) => {
        presentDataForSelectedDept[student.email] = allStudentsAttendance[student.email] || false;
    });
    await axios.post('http://localhost:3000/api/update_all_attendance', {
        date,
        present: presentDataForSelectedDept,
        selectedDepartment,
        selectedYear,
        instituteName,
    });

    setMessage('Attendance updated successfully!');
    setTimeout(() => {
        setMessage('');
    }, 5000);
    const updatedAllStudentsAttendance = { ...allStudentsAttendance };
    students.forEach((student) => {
        if (!presentDataForSelectedDept.hasOwnProperty(student.email)) {
        updatedAllStudentsAttendance[student.email] = false;
        }
    });
    setAllStudentsAttendance(updatedAllStudentsAttendance);

    setDate('');
    setIsDateChosen(false);
    } catch (error) {
    console.error('Error updating attendance:', error);
    setMessage('An error occurred while updating attendance');
    }

    setLoading(false);
};
console.log("ins name"+instituteName);
const renderTableHeader = () => {
    if (selectedYear === '') {
    return (
        <thead>
        <tr>
            <th>Sl.no</th>
            <th>Register No</th>
            <th>Name</th>
            <th>Department</th>
            <th>Year</th>
        </tr>
        </thead>
    );
    } else {
    return (
        <thead>
        <tr>
            <th>Sl.no</th>
            <th>Register No</th>
            <th>Name</th>
            <th>Department</th>
            <th>Year</th>
            <th>Attendance</th>
        </tr>
        </thead>
    );
    }
};

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
    const sortedStudents = sortStudentsByName(students);
    let serialNumber = 1;
    return sortedStudents.map((student) => (
      <tr key={student._id}>
        <td>{serialNumber++}</td>
        <td>{student.registerNumber}</td>
        <td>{student.name}</td>
        <td>{departmentShortNames[student.department] || student.department}</td>
        <td>{student.class}</td>
        {selectedYear && (
          <td>
            <input
              type="checkbox"
              checked={allStudentsAttendance[student.email] || false}
              onChange={(e) => {
                const { checked } = e.target;
                setAllStudentsAttendance((prevAttendance) => ({
                  ...prevAttendance,
                  [student.email]: checked,
                }));
              }}
            />
          </td>
        )}
      </tr>
    ));
  };
  
return (
    <div>
        <h2 className='department-wise-chart-heading'>Attendance for {selectedDepartment}</h2>
    <div className='attendance-content-container'>

        <div className="department-selection">
<div className="toggle-switch-container">
  <label
    className={`switch ${selectedYear === "" ? "active all-years" : ""}`}
    onMouseEnter={() => handleLabelMove("")}
  >
    <input
      type="checkbox"
      checked={selectedYear === ""}
      onChange={() => setSelectedYear("")}
    />
    <span className="slider"></span>
    <span className={`toggle-label ${selectedYear === "" ? "active all-years" : ""}`}>
      All
    </span>
  </label>
  {Object.keys(groupStudentsByYear(students)).map((year) => (
    <React.Fragment key={year}>
      <label
        className={`switch ${selectedYear === year ? "active" : ""}`}
        onMouseEnter={() => handleLabelMove(year)}
      >
        <input
          type="checkbox"
          checked={selectedYear === year}
          onChange={() => setSelectedYear(year)}
        />
        <span className="slider"></span>
        <span className="toggle-label">{year}</span>
      </label>
    </React.Fragment>
  ))}
</div>

        </div>

        <div className="students-container">
        <div className="bars">
            {selectedYear && (
                <div>
            <div className="update-all-container">
                <div className="date-container">
                <input
                    className={`date-box ${dateError ? 'error' : ''}`}
                    type="date"
                    value={date}
                    onChange={(e) => {
                    setDate(e.target.value);
                    setIsDateChosen(true); 
                    setDateError(false); 
                    }}
                    required
                />
                </div>
            </div>
            </div>
            )}

            <div className="attendance-search-bar-container">
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
                placeholder="Search"
            />
            <button onClick={handleSearch}>
                <FontAwesomeIcon icon={faSearch} />
            </button>    
            </div>
            </div>
            {selectedYear && (
            <div>
                <button
                className="update-all-button"
                onClick={handleUpdateAttendance}
                >
                {loading ? 'Loading...' : 'Update'}
                </button>
                {dateError&&<p className='success-message'>please select date!</p>}
            </div>
            )}
        </div>
        {filteredStudents.length > 0 ? (
            <div className="attendance-table-container" style={{ height: `${Math.min(500, Math.max(150, filteredStudents.length * 50))}px`, overflow: 'auto' }}>
            <table>
                {renderTableHeader()}
                <tbody>{renderTableRows(filteredStudents)}</tbody>
            </table>
            </div>
        ) : (
            <p className="error-message">No student data available.</p>
        )}

        {message && <p className={`success-message`}>{message}</p>}
        </div>
    </div>
    </div>
);
};

export default AdminAttendance;
