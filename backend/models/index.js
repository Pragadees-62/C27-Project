const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  role: { type: String, enum: ['student', 'teacher'], required: true },
});

const TeacherSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  department: { type: String, required: true }
});

// Create model, but delete it if already compiled (to prevent OverwriteModelError in some dev envs)
const Teacher = mongoose.models.Teacher || mongoose.model('Teacher', TeacherSchema);

const StudentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  department: { type: String, default: '' },
  mentorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', default: null },
  mentorName: { type: String, default: '' },
  status: { type: String, default: 'accepted' }
});

const Student = mongoose.models.Student || mongoose.model('Student', StudentSchema);

const JoinRequestSchema = new mongoose.Schema({
  studentName: { type: String, required: true },
  studentEmail: { type: String, required: true },
  department: { type: String, required: true },
  status: { type: String, default: 'pending' },
  requestedAt: { type: Date, default: Date.now }
});

const JoinRequest = mongoose.models.JoinRequest || mongoose.model('JoinRequest', JoinRequestSchema);

const MarksSchema = new mongoose.Schema({
  student: { type: String, required: true },
  subject: { type: String, required: true },
  score: { type: Number, required: true }
});

const Marks = mongoose.models.Marks || mongoose.model('Marks', MarksSchema);

const AttendanceSchema = new mongoose.Schema({
  student: { type: String, required: true },
  date: { type: String, required: true },
  status: { type: String, default: 'Present' }
});

const Attendance = mongoose.models.Attendance || mongoose.model('Attendance', AttendanceSchema);

const AnnouncementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const Announcement = mongoose.models.Announcement || mongoose.model('Announcement', AnnouncementSchema);

const FeesSchema = new mongoose.Schema({
  student: { type: String, required: true },
  amount: { type: Number, required: true },
  status: { type: String, default: 'Pending' }
});

const Fees = mongoose.models.Fees || mongoose.model('Fees', FeesSchema);

const User = mongoose.models.User || mongoose.model('User', UserSchema);

module.exports = {
  User,
  Teacher,
  Student,
  JoinRequest,
  Marks,
  Attendance,
  Announcement,
  Fees
};
