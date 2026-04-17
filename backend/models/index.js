const mongoose = require('mongoose');

// ── User (auth) ───────────────────────────────────────────────────────────────
const UserSchema = new mongoose.Schema({
  fullname:   { type: String, required: true },
  email:      { type: String, required: true, unique: true, lowercase: true },
  password:   { type: String, required: true },
  role:       { type: String, enum: ['student', 'teacher'], required: true },
  department: { type: String, default: '' },   // student dept OR teacher dept
  teacherId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', default: null },
  createdAt:  { type: Date, default: Date.now },
});

// ── Teacher profile ───────────────────────────────────────────────────────────
const TeacherSchema = new mongoose.Schema({
  name:       { type: String, required: true },
  email:      { type: String, required: true, unique: true, lowercase: true },
  department: { type: String, required: true },
});

// ── Student profile ───────────────────────────────────────────────────────────
const StudentSchema = new mongoose.Schema({
  name:       { type: String, required: true },
  email:      { type: String, required: true, unique: true, lowercase: true },
  department: { type: String, default: '' },
  mentorId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', default: null },
  mentorName: { type: String, default: '' },
  status:     { type: String, enum: ['pending','accepted','rejected'], default: 'accepted' },
});

// ── Join Request ──────────────────────────────────────────────────────────────
const JoinRequestSchema = new mongoose.Schema({
  studentName:  { type: String, required: true },
  studentEmail: { type: String, required: true, lowercase: true },
  department:   { type: String, required: true },
  status:       { type: String, enum: ['pending','accepted','rejected'], default: 'pending' },
  requestedAt:  { type: Date, default: Date.now },
});

// ── Academic data ─────────────────────────────────────────────────────────────
const MarksSchema = new mongoose.Schema({
  student: { type: String, required: true },
  subject: { type: String, required: true },
  score:   { type: Number, required: true, min: 0, max: 100 },
});

const AttendanceSchema = new mongoose.Schema({
  student: { type: String, required: true },
  date:    { type: String, required: true },
  status:  { type: String, enum: ['Present','Absent','Late'], default: 'Present' },
  department: { type: String, default: '' },
});

const AnnouncementSchema = new mongoose.Schema({
  title:     { type: String, required: true },
  message:   { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const FeesSchema = new mongoose.Schema({
  student:    { type: String, required: true },
  amount:     { type: Number, required: true, min: 0 },
  status:     { type: String, enum: ['Pending','Paid','Overdue'], default: 'Pending' },
  department: { type: String, default: '' },
});

const fmt = (doc) => {
  if (!doc) return null;
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  obj.id = obj._id?.toString();
  delete obj._id;
  delete obj.__v;
  return obj;
};

module.exports = {
  User:         mongoose.models.User         || mongoose.model('User',         UserSchema),
  Teacher:      mongoose.models.Teacher      || mongoose.model('Teacher',      TeacherSchema),
  Student:      mongoose.models.Student      || mongoose.model('Student',      StudentSchema),
  JoinRequest:  mongoose.models.JoinRequest  || mongoose.model('JoinRequest',  JoinRequestSchema),
  Marks:        mongoose.models.Marks        || mongoose.model('Marks',        MarksSchema),
  Attendance:   mongoose.models.Attendance   || mongoose.model('Attendance',   AttendanceSchema),
  Announcement: mongoose.models.Announcement || mongoose.model('Announcement', AnnouncementSchema),
  Fees:         mongoose.models.Fees         || mongoose.model('Fees',         FeesSchema),
  fmt,
};
