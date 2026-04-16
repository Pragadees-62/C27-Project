const express = require('express');
const router = express.Router();
const {
  requireTeacher, joinRequestController,
  teachersCtrl, studentsCtrl, marksCtrl,
  announcementsCtrl, attendanceCtrl, feesCtrl
} = require('../controllers/apiController');

// Join Requests
router.post('/join-request', joinRequestController.create);
router.get('/join-requests', joinRequestController.getAll);
router.get('/join-request-status', joinRequestController.getStatus);
router.put('/join-request/:id', requireTeacher, joinRequestController.update);

// Helper to map standard resource routes
const createResourceRoutes = (resourceName, ctrl) => {
  router.get(`/${resourceName}`, ctrl.getAll);
  router.get(`/${resourceName}/:id`, ctrl.getOne);
  router.post(`/${resourceName}`, requireTeacher, ctrl.create);
  router.put(`/${resourceName}/:id`, requireTeacher, ctrl.update);
  router.delete(`/${resourceName}/:id`, requireTeacher, ctrl.deleteOne);
};

createResourceRoutes('teachers', teachersCtrl);
createResourceRoutes('students', studentsCtrl);
createResourceRoutes('marks', marksCtrl);
createResourceRoutes('announcements', announcementsCtrl);
createResourceRoutes('attendance', attendanceCtrl);
createResourceRoutes('fees', feesCtrl);

module.exports = router;
