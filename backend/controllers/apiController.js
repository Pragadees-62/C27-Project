const {
  User, Teacher, Student, JoinRequest,
  Marks, Attendance, Announcement, Fees
} = require('../models');

// Helper to format Mongoose document to match frontend expectation (uses 'id' instead of '_id')
const formatDoc = (doc) => {
  if (!doc) return null;
  const obj = doc.toObject ? doc.toObject() : doc;
  obj.id = obj._id;
  delete obj._id;
  delete obj.__v;
  return obj;
};

const getRole = (req) => (req.headers["x-role"] || "student").toLowerCase();

const requireTeacher = (req, res, next) => {
  if (getRole(req) !== "teacher") {
    return res.status(403).json({ error: "Forbidden: teacher access only." });
  }
  next();
};

const joinRequestController = {
  create: async (req, res) => {
    try {
      const { studentName, studentUsername, department } = req.body;
      if (!studentName || !department) {
        return res.status(400).json({ error: "studentName and department required." });
      }

      const existing = await JoinRequest.findOne({ studentUsername, status: 'pending' });
      if (existing) return res.status(200).json(formatDoc(existing));

      const newRequest = new JoinRequest({ studentName, studentUsername, department });
      await newRequest.save();

      res.status(201).json(formatDoc(newRequest));
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  
  getAll: async (req, res) => {
    try {
      const dept = req.query.department || "";
      const query = dept ? { department: dept } : {};
      const requests = await JoinRequest.find(query).sort({ _id: -1 });
      res.status(200).json(requests.map(formatDoc));
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  getStatus: async (req, res) => {
    try {
      const uname = req.query.username || "";
      const request = await JoinRequest.findOne({ studentUsername: uname }).sort({ _id: -1 });
      if (request) {
        res.status(200).json(formatDoc(request));
      } else {
        res.status(200).json({ status: "none" });
      }
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { action } = req.body;
      
      const jr = await JoinRequest.findById(id);
      if (!jr) return res.status(404).json({ error: "Request not found." });

      if (action === "accept") {
        jr.status = 'accepted';
        await jr.save();

        const teacher = await Teacher.findOne({ department: jr.department });
        
        const newStudent = new Student({
          name: jr.studentName,
          username: jr.studentUsername,
          department: jr.department,
          mentorId: teacher ? teacher._id : null,
          mentorName: teacher ? teacher.name : '',
          status: 'accepted'
        });
        await newStudent.save();

        res.status(200).json({ status: "accepted", student: formatDoc(newStudent) });
      } else {
        jr.status = 'rejected';
        await jr.save();
        res.status(200).json({ status: "rejected" });
      }
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};

const resourceController = (Model) => ({
  getAll: async (req, res) => {
    try {
      const items = await Model.find();
      res.status(200).json(items.map(formatDoc));
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  getOne: async (req, res) => {
    try {
      const item = await Model.findById(req.params.id);
      if (!item) return res.status(404).json({ error: "Not found." });
      res.status(200).json(formatDoc(item));
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  create: async (req, res) => {
    try {
      // Special check for teacher
      if (Model.modelName === 'Teacher') {
        const existing = await Teacher.findOne({ username: req.body.username });
        if (existing) return res.status(409).json({ error: "Username already exists." });
      }
      
      const item = new Model(req.body);
      await item.save();
      res.status(201).json(formatDoc(item));
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  update: async (req, res) => {
    try {
      const item = await Model.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!item) return res.status(404).json({ error: "Not found." });
      res.status(200).json(formatDoc(item));
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  deleteOne: async (req, res) => {
    try {
      const item = await Model.findByIdAndDelete(req.params.id);
      if (!item) return res.status(404).json({ error: "Not found." });
      res.status(200).json({ message: "Deleted.", item: formatDoc(item) });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
});

module.exports = {
  requireTeacher,
  joinRequestController,
  teachersCtrl: resourceController(Teacher),
  studentsCtrl: resourceController(Student),
  marksCtrl: resourceController(Marks),
  announcementsCtrl: resourceController(Announcement),
  attendanceCtrl: resourceController(Attendance),
  feesCtrl: resourceController(Fees)
};
