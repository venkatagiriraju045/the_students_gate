const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors({
    origin: ["https://edutainment-nine.vercel.app"],
    methods: ["POST", "GET"],
    credentials: true
}));

const PORT = process.env.PORT || 3000;

const MONGODB_URI = 'mongodb+srv://Venkatagiriraju:King%40123@kiot.mmjm1ma.mongodb.net/test?retryWrites=true&w=majority';

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const userSchema = new mongoose.Schema({
    email: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: String }, // Add a role property for users
    admin_password: { type: String }, // Add admin_password property for admin users
    subjects: [
        {
            subject_code: { type: String },
            subject_name: { type: String },
            scores: {
                iat_1: { type: String },
                iat_2: { type: String },
                iat_3: { type: String },
            },
        },
    ],
    class: { type: String },
    department: { type: String },
    total_attendance: { type: Number },
    total_days: { type: Number },
    training_score: { type: Number },
    present_array: [{ type: Date }],
    leave_array: [{ type: Date }],
    messages: { type: String },
    accomplishments: { type: String },
    institute_name: { type: String },
    role: { type: String },
}, { versionKey: false });

const User = mongoose.model('students', userSchema);

app.use(express.json());

app.post('/api/signup', async (req, res) => {
    const { email, password, role } = req.body;

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const newUser = new User({ email, password, role });
        await newUser.save();

        res.status(200).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.post('/api/admin-login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const admin = await User.findOne({ email, role: 'admin', admin_password: password });
        if (!admin) {
            return res.status(401).json({ message: 'Authentication failed' });
        }

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error authenticating admin:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.get('/api/students', async (req, res) => {
    const { email } = req.query;

    try {
        const student = await User.findOne({ email });
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        res.status(200).json(student);
    } catch (error) {
        console.error('Error fetching student data:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.get('/api/students_data', async (req, res) => {
    try {
        // Extract the filtering parameters from the query string
        const { role, department, instituteName } = req.query;

        // Create a filter object to match the specified fields
        const filter = {
            role: role, // Filter by role
            department: department, // Filter by department
            institute_name: instituteName, // Filter by institute_name
        };
        // Use the filter to find students
        const students = await User.find(filter);

        res.status(200).json(students);
    } catch (error) {
        console.error('Error fetching students data:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});
app.get('/api/admin_students_data', async (req, res) => {
    try {
        // Extract the filtering parameters from the query string
        const { role, instituteName } = req.query;

        // Create a filter object to match the specified fields
        const filter = {
            role: role, // Filter by role
            institute_name: instituteName, // Filter by institute_name
        };
        // Use the filter to find students
        const students = await User.find(filter);

        res.status(200).json(students);
    } catch (error) {
        console.error('Error fetching students data:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const student = await User.findOne({ email, password });
        if (!student) {
            return res.status(401).json({ message: 'Authentication failed' });
        }
        res.status(200).json({ success: true, message: 'Login successful' });
    } catch (error) {
        console.error('Error authenticating student:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.post('/api/attendance', async (req, res) => {
    const { email, date, present } = req.body;

    try {
        const student = await User.findOne({ email });
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        student.total_attendance += present ? 1 : 0;
        student.total_days += 1;

        await student.save();

        res.status(200).json({ message: 'Attendance updated successfully' });
    } catch (error) {
        console.error('Error updating attendance:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.post('/api/update_all_attendance', async (req, res) => {
    const { date, present, selectedDepartment, selectedYear , instituteName} = req.body;

    try {
        const students = await User.find({ department: selectedDepartment, class: selectedYear, institute_name: instituteName });

        for (const student of students) {
            if (present[student.email]) {
                if (!student.present_array.includes(date)) {
                    student.present_array.push(date);
                }
                const leaveDateIndex = student.leave_array.indexOf(date);
                if (leaveDateIndex !== -1) {
                    student.leave_array.splice(leaveDateIndex, 1);
                }
            } else {
                if (!student.leave_array.includes(date)) {
                    student.leave_array.push(date);
                }

                const presentDateIndex = student.present_array.indexOf(date);
                if (presentDateIndex !== -1) {
                    student.present_array.splice(presentDateIndex, 1);
                }
            }

            student.total_attendance = student.present_array.length;
            student.total_days = student.present_array.length + student.leave_array.length;

            await student.save();
        }

        res.status(200).json({ message: 'Attendance updated successfully for the selected department' });
    } catch (error) {
        console.error('Error updating attendance for the selected department:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.post('/api/send_message', async (req, res) => {
    const { message, selectedDepartment } = req.body;

    try {
        const students = await User.find({ department: selectedDepartment });

        for (const student of students) {
            student.messages = message;

            await student.save();
        }

        res.status(200).json({ message: 'Message sent successfully to all students in the selected department' });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.post('/api/update_accomplishments', async (req, res) => {
    const { email, accomplishments } = req.body;

    try {
        // Find the student by email
        const student = await User.findOne({ email });
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Update the accomplishments field for the student
        student.accomplishments = accomplishments;

        // Save the updated student document
        await student.save();

        res.status(200).json({ message: 'Accomplishments updated successfully' });
    } catch (error) {
        console.error('Error updating accomplishments:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.post('/api/update_messages', async (req, res) => {
    const { email, messages } = req.body;

    try {
        // Find the student by email
        const student = await User.findOne({ email });
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Replace the existing message with the new message for the student
        student.messages = messages;

        // Save the updated student document
        await student.save();

        res.status(200).json({ message: 'Message updated successfully' });
    } catch (error) {
        console.error('Error updating message:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Define a route that returns a "Hello, World!" message
app.get('/', (req, res) => {
    const message = "Hello, World!";
    res.send(`<html><body><h1>${message}</h1></body></html>`);
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
