const express = require('express');
const router  = express.Router();
const {
  requireTeacher, authCtrl, joinCtrl,
  teachersCtrl, studentsCtrl, marksCtrl,
  announcementsCtrl, attendanceCtrl, feesCtrl,
} = require('../controllers/apiController');

// ── Auth ──────────────────────────────────────────────────────────────────────
router.post('/auth/register', authCtrl.register);
router.post('/auth/login',    authCtrl.login);
router.delete('/auth/account', authCtrl.deleteAccount);

// ── Join Requests ─────────────────────────────────────────────────────────────
router.post('/join-request',        joinCtrl.create);
router.get('/join-requests',        joinCtrl.getAll);
router.get('/join-request-status',  joinCtrl.getStatus);
router.put('/join-request/:id',     requireTeacher, joinCtrl.update);

// ── Resource routes helper ────────────────────────────────────────────────────
const resource = (name, ctrl) => {
  router.get(`/${name}`,      ctrl.getAll);
  router.get(`/${name}/:id`,  ctrl.getOne);
  router.post(`/${name}`,     requireTeacher, ctrl.create);
  router.put(`/${name}/:id`,  requireTeacher, ctrl.update);
  router.delete(`/${name}/:id`, requireTeacher, ctrl.remove);
};

resource('teachers',      teachersCtrl);
resource('students',      studentsCtrl);
resource('marks',         marksCtrl);
resource('announcements', announcementsCtrl);
resource('attendance',    attendanceCtrl);
resource('fees',          feesCtrl);

module.exports = router;
