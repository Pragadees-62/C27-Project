const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { Teacher, Student, Marks, Announcement, Attendance, Fees } = require('./models');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const seedData = async () => {
  try {
    await Teacher.deleteMany({});
    await Student.deleteMany({});
    await Marks.deleteMany({});
    await Announcement.deleteMany({});
    await Attendance.deleteMany({});
    await Fees.deleteMany({});

    console.log('Old Data Destroyed...');

    const teachers = [
      { name: 'Mr. Smith', email: 'smith@school.com', department: 'CSE' },
      { name: 'Ms. Johnson', email: 'johnson@school.com', department: 'ECE' },
      { name: 'Mr. Brown', email: 'brown@school.com', department: 'IT' }
    ];
    
    const createdTeachers = await Teacher.insertMany(teachers);

    const students = [
      { name: 'Alice', email: 'alice@school.com', department: 'CSE', mentorId: createdTeachers[0]._id, mentorName: 'Mr. Smith', status: 'accepted' },
      { name: 'Bob', email: 'bob@school.com', department: 'ECE', mentorId: createdTeachers[1]._id, mentorName: 'Ms. Johnson', status: 'accepted' }
    ];
    
    await Student.insertMany(students);

    const marks = [
      { student: 'Alice', subject: 'CSE', score: 88 },
      { student: 'Bob', subject: 'ECE', score: 74 }
    ];
    await Marks.insertMany(marks);

    const announcements = [
      { title: 'Welcome!', message: 'New semester starts today.' }
    ];
    await Announcement.insertMany(announcements);

    const attendance = [
      { student: 'Alice', date: '2026-04-15', status: 'Present' },
      { student: 'Bob', date: '2026-04-15', status: 'Absent' }
    ];
    await Attendance.insertMany(attendance);

    const fees = [
      { student: 'Alice', amount: 5000, status: 'Paid' },
      { student: 'Bob', amount: 5000, status: 'Pending' }
    ];
    await Fees.insertMany(fees);

    console.log('Data Imported!');
    process.exit();
  } catch (error) {
    console.error(`Error with data import: ${error.message}`);
    process.exit(1);
  }
};

seedData();
