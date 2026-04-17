const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { User, Teacher, Student, JoinRequest, Marks, Attendance, Announcement, Fees } = require('../models');

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

      const existing = await User.findByEmail(email);
      if (existing) return res.status(409).json({ error: 'Email already registered.' });

      const hashed = await bcrypt.hash(password, 10);
      const userRecord = { fullname, email: email.toLowerCase(), password: hashed, role, department, createdAt: new Date().toISOString() };

      let teacherId = null;
      if (role === 'teacher') {
        let t = await Teacher.findByEmail(email);
        if (!t) t = await Teacher.create({ name: fullname, email, department });
        teacherId = t.id;
        userRecord.teacherId = teacherId;
      }

      await User.create(userRecord);

      const token = jwt.sign({ email: userRecord.email, role, department }, JWT_SECRET, { expiresIn: '7d' });
      res.status(201).json({ token, user: { fullname, email: userRecord.email, role, department, teacherId } });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  login: async (req, res) => {
    try {
      const { email, password, role } = req.body;
      if (!email || !password || !role)
        return res.status(400).json({ error: 'email, password and role are required.' });

      const user = await User.findByEmail(email);
      if (!user || user.role !== role)
        return res.status(401).json({ error: `No ${role} account found with that email.` });

      const match = await bcrypt.compare(password, user.password);
      if (!match) return res.status(401).json({ error: 'Incorrect password.' });

      const token = jwt.sign({ email: user.email, role: user.role, department: user.department }, JWT_SECRET, { expiresIn: '7d' });
      res.status(200).json({
        token,
        user: { fullname: user.fullname, email: user.email, role: user.role, department: user.department, teacherId: user.teacherId || null },
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  deleteAccount: async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: 'email required.' });
      await User.deleteByEmail(email);
      await Student.deleteByEmail(email);
      await JoinRequest.deleteByEmail(email);
      res.status(200).json({ message: 'Account deleted.' });
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

      // Check for existing pending request
      const existing = await JoinRequest.findByEmail(studentEmail);
      const pending   = existing.find(r => r.status === 'pending');
      if (pending) return res.status(200).json(pending);

      const jr = await JoinRequest.create({ studentName, studentEmail, department, status: 'pending' });
      res.status(201).json(jr);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  getAll: async (req, res) => {
    try {
      const dept = req.query.department || '';
      const list = dept
        ? await JoinRequest.findByDept(dept)
        : await JoinRequest.findAll();
      // Sort newest first
      list.sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt));
      res.status(200).json(list);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  getStatus: async (req, res) => {
    try {
      const email = (req.query.email || '').toLowerCase();
      const list  = await JoinRequest.findByEmail(email);
      list.sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt));
      res.status(200).json(list[0] || { status: 'none' });
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
        await JoinRequest.update(jr.id, { status: 'accepted' });

        const teachers = await Teacher.findByDept(jr.department);
        const teacher  = teachers[0] || null;

        let student = await Student.findByEmail(jr.studentEmail);
        if (!student) {
          student = await Student.create({
            name:       jr.studentName,
            email:      jr.studentEmail,
            department: jr.department,
            mentorId:   teacher ? teacher.id   : null,
            mentorName: teacher ? teacher.name : '',
            status:     'accepted',
          });
        } else {
          await Student.update(student.id, {
            ...student,
            status:     'accepted',
            mentorId:   teacher ? teacher.id   : student.mentorId,
            mentorName: teacher ? teacher.name : student.mentorName,
          });
          student = await Student.findById(student.id);
        }

        res.status(200).json({ status: 'accepted', student });
      } else {
        await JoinRequest.update(jr.id, { status: 'rejected' });
        await User.deleteByEmail(jr.studentEmail);
        await Student.deleteByEmail(jr.studentEmail);
        res.status(200).json({ status: 'rejected' });
      }
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};

// ── Generic CRUD controller factory ──────────────────────────────────────────
const crudCtrl = (Model) => ({
  getAll: async (req, res) => {
    try {
      const items = await Model.findAll();
      items.sort((a, b) => (b.createdAt || b.id || '').localeCompare(a.createdAt || a.id || ''));
      res.status(200).json(items);
    } catch (err) { res.status(500).json({ error: err.message }); }
  },
  getOne: async (req, res) => {
    try {
      const item = await Model.findById(req.params.id);
      if (!item) return res.status(404).json({ error: 'Not found.' });
      res.status(200).json(item);
    } catch (err) { res.status(500).json({ error: err.message }); }
  },
  create: async (req, res) => {
    try {
      const item = await Model.create(req.body);
      res.status(201).json(item);
    } catch (err) { res.status(500).json({ error: err.message }); }
  },
  update: async (req, res) => {
    try {
      const item = await Model.update(req.params.id, req.body);
      if (!item) return res.status(404).json({ error: 'Not found.' });
      res.status(200).json(item);
    } catch (err) { res.status(500).json({ error: err.message }); }
  },
  remove: async (req, res) => {
    try {
      const existing = await Model.findById(req.params.id);
      if (!existing) return res.status(404).json({ error: 'Not found.' });
      await Model.deleteById(req.params.id);
      res.status(200).json({ message: 'Deleted.', item: existing });
    } catch (err) { res.status(500).json({ error: err.message }); }
  },
});

// ── Teachers getAll — also includes GSI query by dept ────────────────────────
const teachersCtrl = {
  ...crudCtrl(Teacher),
  getAll: async (req, res) => {
    try {
      const items = await Teacher.findAll();
      res.status(200).json(items);
    } catch (err) { res.status(500).json({ error: err.message }); }
  },
};

module.exports = {
  requireTeacher,
  authCtrl,
  joinCtrl,
  teachersCtrl,
  studentsCtrl:      crudCtrl(Student),
  marksCtrl:         crudCtrl(Marks),
  announcementsCtrl: crudCtrl(Announcement),
  attendanceCtrl:    crudCtrl(Attendance),
  feesCtrl:          crudCtrl(Fees),
};
