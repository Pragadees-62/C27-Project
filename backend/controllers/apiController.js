const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const {
  User, Teacher, Student, JoinRequest,
  Marks, Attendance, Announcement, Fees, fmt,
} = require('../models');

const JWT_SECRET   = process.env.JWT_SECRET   || 'sms_secret';
const TEACHER_CODE = process.env.TEACHER_CODE || 'Teachers2026';

// ── Middleware ────────────────────────────────────────────────────────────────
const requireTeacher = (req, res, next) => {
  const role = (req.headers['x-role'] || '').toLowerCase();
  if (role !== 'teacher') return res.status(403).json({ error: 'Forbidden: teacher only.' });
  next();
};

// ── Auth ──────────────────────────────────────────────────────────────────────
const authCtrl = {
  register: async (req, res) => {
    try {
      const { fullname, email, password, role, department, teacherCode } = req.body;

      if (!fullname || !email || !password || !role)
        return res.status(400).json({ error: 'fullname, email, password and role are required.' });

      if (role === 'student' && !department)
        return res.status(400).json({ error: 'Department is required for students.' });

      if (role === 'teacher') {
        if (teacherCode !== TEACHER_CODE)
          return res.status(403).json({ error: 'Invalid teacher code.' });
        if (!department)
          return res.status(400).json({ error: 'Department is required for teachers.' });
      }

      const existing = await User.findOne({ email: email.toLowerCase() });
      if (existing) return res.status(409).json({ error: 'Email already registered.' });

      const hashed = await bcrypt.hash(password, 10);
      const user   = new User({ fullname, email: email.toLowerCase(), password: hashed, role, department });
      await user.save();

      // If teacher → create Teacher profile so students can find them
      let teacherId = null;
      if (role === 'teacher') {
        const existing = await Teacher.findOne({ email: email.toLowerCase() });
        if (!existing) {
          const t = new Teacher({ name: fullname, email: email.toLowerCase(), department });
          await t.save();
          teacherId = t._id.toString();
        } else {
          teacherId = existing._id.toString();
        }
        user.teacherId = teacherId;
        await user.save();
      }

      const token = jwt.sign({ id: user._id, role, email: user.email, department }, JWT_SECRET, { expiresIn: '7d' });

      res.status(201).json({
        token,
        user: { id: user._id, fullname, email: user.email, role, department, teacherId },
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  login: async (req, res) => {
    try {
      const { email, password, role } = req.body;
      if (!email || !password || !role)
        return res.status(400).json({ error: 'email, password and role are required.' });

      const user = await User.findOne({ email: email.toLowerCase(), role });
      if (!user) return res.status(401).json({ error: `No ${role} account found with that email.` });

      const match = await bcrypt.compare(password, user.password);
      if (!match) return res.status(401).json({ error: 'Incorrect password.' });

      const token = jwt.sign(
        { id: user._id, role: user.role, email: user.email, department: user.department },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.status(200).json({
        token,
        user: {
          id:         user._id,
          fullname:   user.fullname,
          email:      user.email,
          role:       user.role,
          department: user.department,
          teacherId:  user.teacherId,
        },
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};

// ── Join Requests ─────────────────────────────────────────────────────────────
const joinCtrl = {
  create: async (req, res) => {
    try {
      const { studentName, studentEmail, department } = req.body;
      if (!studentName || !studentEmail || !department)
        return res.status(400).json({ error: 'studentName, studentEmail and department required.' });

      const existing = await JoinRequest.findOne({ studentEmail: studentEmail.toLowerCase(), status: 'pending' });
      if (existing) return res.status(200).json(fmt(existing));

      const jr = new JoinRequest({ studentName, studentEmail: studentEmail.toLowerCase(), department });
      await jr.save();
      res.status(201).json(fmt(jr));
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  getAll: async (req, res) => {
    try {
      const dept  = req.query.department || '';
      const query = dept ? { department: dept } : {};
      const list  = await JoinRequest.find(query).sort({ requestedAt: -1 });
      res.status(200).json(list.map(fmt));
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  getStatus: async (req, res) => {
    try {
      const email = (req.query.email || '').toLowerCase();
      const jr    = await JoinRequest.findOne({ studentEmail: email }).sort({ requestedAt: -1 });
      res.status(200).json(jr ? fmt(jr) : { status: 'none' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  update: async (req, res) => {
    try {
      const jr = await JoinRequest.findById(req.params.id);
      if (!jr) return res.status(404).json({ error: 'Request not found.' });

      const { action } = req.body;
      if (action === 'accept') {
        jr.status = 'accepted';
        await jr.save();

        const teacher = await Teacher.findOne({ department: jr.department });

        // Upsert student profile
        let student = await Student.findOne({ email: jr.studentEmail });
        if (!student) {
          student = new Student({
            name:       jr.studentName,
            email:      jr.studentEmail,
            department: jr.department,
            mentorId:   teacher ? teacher._id : null,
            mentorName: teacher ? teacher.name : '',
            status:     'accepted',
          });
        } else {
          student.status     = 'accepted';
          student.mentorId   = teacher ? teacher._id : student.mentorId;
          student.mentorName = teacher ? teacher.name : student.mentorName;
        }
        await student.save();

        res.status(200).json({ status: 'accepted', student: fmt(student) });
      } else {
        jr.status = 'rejected';
        await jr.save();
        res.status(200).json({ status: 'rejected' });
      }
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};

// ── Generic resource CRUD ─────────────────────────────────────────────────────
const crud = (Model) => ({
  getAll: async (req, res) => {
    try {
      const items = await Model.find().sort({ _id: -1 });
      res.status(200).json(items.map(fmt));
    } catch (err) { res.status(500).json({ error: err.message }); }
  },
  getOne: async (req, res) => {
    try {
      const item = await Model.findById(req.params.id);
      if (!item) return res.status(404).json({ error: 'Not found.' });
      res.status(200).json(fmt(item));
    } catch (err) { res.status(500).json({ error: err.message }); }
  },
  create: async (req, res) => {
    try {
      const item = new Model(req.body);
      await item.save();
      res.status(201).json(fmt(item));
    } catch (err) { res.status(500).json({ error: err.message }); }
  },
  update: async (req, res) => {
    try {
      const item = await Model.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!item) return res.status(404).json({ error: 'Not found.' });
      res.status(200).json(fmt(item));
    } catch (err) { res.status(500).json({ error: err.message }); }
  },
  remove: async (req, res) => {
    try {
      const item = await Model.findByIdAndDelete(req.params.id);
      if (!item) return res.status(404).json({ error: 'Not found.' });
      res.status(200).json({ message: 'Deleted.', item: fmt(item) });
    } catch (err) { res.status(500).json({ error: err.message }); }
  },
});

module.exports = {
  requireTeacher,
  authCtrl,
  joinCtrl,
  teachersCtrl:      crud(Teacher),
  studentsCtrl:      crud(Student),
  marksCtrl:         crud(Marks),
  announcementsCtrl: crud(Announcement),
  attendanceCtrl:    crud(Attendance),
  feesCtrl:          crud(Fees),
};
