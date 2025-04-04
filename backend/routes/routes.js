const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');

// Initiate Controllers here ---
const userController = require('../controllers/studentController');
const adminController = require('../controllers/adminController');
const { authenticateJWT, getUserProfile, authenticateAdminJWT, getAdminProfile, logout } = require('../controllers/services/authJWT');
const StudentFormController = require('../controllers/studentFormController');
const RoomsController = require('../controllers/roomController');
const ApprovedController = require('../controllers/approvedController');
const AnalyticsController = require('../controllers/analyticsController');
const PaymentController = require('../controllers/paymentController');
const RenewalController = require('../controllers/renewalController');
const TriggerAutoDelete = require('../controllers/autoDeleteController');


const { upload } = require('../db/awsConfig');
// ================================================================
// Controller Routers here ===
// ================================================================

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login requests per windowMs
  message: { error: 'Too many login attempts. Please try again later.' }, // Return JSON response
  handler: (req, res) => {
      res.status(429).json({ error: 'Too many login attempts. Please try again later.' });
  }
});



// ================================================================
// Student Users
router.post('/user/register', userController.registerStudent);
router.post('/user/login', loginLimiter, userController.loginStudent);
router.get('/verify-email', userController.verifyEmail);
router.post('/user/resend-verification', userController.resendVerificationEmail);
router.post('/user/forgot-password', userController.forgotPassword);
router.post('/user/reset-password', userController.resetPassword);

// ================================================================

// ================================================================
// Admin Users


const pinLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 PIN validation requests per windowMs
  message: { error: 'Too many PIN validation attempts. Please try again later.' }, // Return JSON response
  handler: (req, res) => {
      res.status(429).json({ error: 'Too many PIN validation attempts. Please try again later.' });
  }
});

router.post('/admin/register',  adminController.registerAdmin);
router.post('/admin/login', loginLimiter, adminController.loginAdmin);
router.post('/admin/validate-pin', pinLimiter, adminController.validatePin);
// ================================================================

// ================================================================
// MIDDLEWARE authenticate safe routes
router.get('/admin/profile', authenticateAdminJWT, getAdminProfile);
router.get('/user/profile', authenticateJWT, getUserProfile);

router.post('/admin/logout', authenticateAdminJWT, logout);
router.post('/user/logout', authenticateJWT, logout);
// ================================================================

// STUDENT SUBMIT FORMS routes ====
router.post('/user/submit', authenticateJWT, upload.single('profilePicture'), StudentFormController.submitForm);
router.post('/user/renewal/renew-student', authenticateJWT, RenewalController.renewStudent); // Student Button
router.get('/user/check-cooldown/:studentNo', authenticateJWT, StudentFormController.checkCooldown);
router.get('/user/check-ifrenewal', authenticateJWT, RenewalController.checkIfStudentIsInRenewal);
router.get('/user/check-approval/:studentNo', authenticateJWT, StudentFormController.checkApprovalStatus);
router.get('/user/check-submission/:studentNo', authenticateJWT, StudentFormController.checkStatus);
router.get('/user/renewal-status', authenticateJWT, RenewalController.checkRenewalSession);
router.get('/user/check-renewal/:studentNo', authenticateJWT, RenewalController.getRenewalStatus);
router.delete('/user/cancel-renewal', authenticateJWT, RenewalController.cancelRenewal);
router.delete('/user/cancel-form', authenticateJWT, StudentFormController.cancelForm);
router.get('/user/student-info/:studentNo', authenticateJWT, StudentFormController.getStudentInfo);
router.put('/user/update-info', authenticateJWT, upload.single('profilePicture'), RenewalController.updateStudent);


// Public Access for both end users
router.get('/available-slots', StudentFormController.getAvailableSlots);
router.post('/contact', StudentFormController.contactForm);

// ADMIN views the Forms routes ==== FOR NEW STUDENTS
router.get('/admin/get-queue', authenticateAdminJWT, StudentFormController.countPendings);
router.get('/admin/view-queue', authenticateAdminJWT, StudentFormController.getStudentQueue);
router.get('/admin/view-student/:_id', authenticateAdminJWT, StudentFormController.getStudentFormById);
router.put('/admin/:_id/schedule', authenticateAdminJWT, StudentFormController.setScreeningSchedule);
router.put('/admin/:_id/checklist', authenticateAdminJWT, StudentFormController.updateChecklistItem);
router.delete('/admin/reject/:_id', authenticateAdminJWT, StudentFormController.rejectStudentForm);
router.put('/admin/approve/:studentNo', authenticateAdminJWT, StudentFormController.approveStudent);
router.get('/admin/check-approved/:studentNo', authenticateAdminJWT, StudentFormController.checkIfAlreadyApproved)

// ADMIN views the Forms routes ==== FOR RENEWAL STUDENTS
router.post('/admin/renewal/set-deadline', authenticateAdminJWT, RenewalController.setRenewalDeadline);
router.get('/admin/view-renewal', authenticateAdminJWT, RenewalController.getRenewalQueue);
router.get('/admin/view-renewal/:_id', authenticateAdminJWT, RenewalController.getRenewalStudentByID);
router.put('/admin/schedule-renewal/:_id', authenticateAdminJWT, RenewalController.setScreeningSchedule);
router.put('/admin/checklist-renewal/:_id', authenticateAdminJWT, RenewalController.updateChecklistItem);
router.put('/admin/approve-renewal/:studentNo', authenticateAdminJWT, RenewalController.approveRenewal);
router.delete('/admin/reject-renewal/:_id', authenticateAdminJWT, RenewalController.rejectRenewal);

//ADMIN ADMISSION FORMS ====
router.post('/admin/admission-submit', authenticateAdminJWT, StudentFormController.admissionForm)



// Admin locks the form
router.post('/admin/toggle-forms-lock', authenticateAdminJWT, StudentFormController.toggleFormSubmissionLock);
router.get('/form-submission-status', StudentFormController.getFormSubmissionLockStatus);


// ADMIN get all the approved students ====
router.get('/admin/approved-students', authenticateAdminJWT, ApprovedController.getApprovedStudents);
router.get('/admin/renewal-students', authenticateAdminJWT, RenewalController.getAllRenewalStudents);
router.get('/admin/get-all-students', authenticateAdminJWT, ApprovedController.getStudents);
router.get('/admin/view-approved-student/:_id', authenticateAdminJWT, ApprovedController.getStudentById);
router.delete('/admin/remove-approved-student/:_id', authenticateAdminJWT, ApprovedController.removeStudent);
router.put('/admin/update-approved-student/:_id', authenticateAdminJWT, ApprovedController.updateStudent);


// Admin Room Allocation ====
router.get('/admin/unassigned-students', authenticateAdminJWT, RoomsController.fetchUnassignedStudents);
router.get('/admin/available-rooms', authenticateAdminJWT, RoomsController.fetchAvailableRooms);
router.post('/admin/assign-room', authenticateAdminJWT, RoomsController.assignRoomToStudent);
router.get('/admin/students-assigned-rooms', authenticateAdminJWT, RoomsController.fetchStudentsWithRooms);
router.delete('/admin/remove-student-room/:_id', authenticateAdminJWT, RoomsController.removeStudentRoom);
router.get('/admin/occupied-rooms', authenticateAdminJWT, RoomsController.fetchOccupiedRooms);
router.get('/admin/all-available-rooms', authenticateAdminJWT, RoomsController.getAllAvailableRoomCounts);


// ADMIN View User Lists
router.get('/admin/getAdmins', authenticateAdminJWT, adminController.getAllAdmins);
router.get('/admin/getAdmin/:_id', authenticateAdminJWT, adminController.getAdminById);
router.delete('/admin/delete/:_id', authenticateAdminJWT, adminController.deleteUser);
router.put('/admin/edit/:_id', authenticateAdminJWT, adminController.updateUser);


// ADMIN ANALYTICS ====
router.get('/admin/analytics/submissionsMnY', authenticateAdminJWT, AnalyticsController.getMonthlyYearlySubmission);
router.get('/admin/analytics/rejecnapproveRate', authenticateAdminJWT, AnalyticsController.getApprovalRejectionRates);
router.get('/admin/analytics/gender-based-analytics', authenticateAdminJWT, AnalyticsController.getGenderBasedAnalytics);
router.get('/admin/analytics/year-level-count', authenticateAdminJWT, AnalyticsController.getYearLevelAnalyticsController);
router.get('/admin/analytics/payment-method-analytics', authenticateAdminJWT, AnalyticsController.getPaymentMethodAnalytics)
router.get('/admin/analytics/province-analytics', authenticateAdminJWT, AnalyticsController.getProvinceAnalytics);
router.get('/admin/analytics/available-months-years', authenticateAdminJWT, AnalyticsController.getAvailableMonthsAndYears);

// Admin Student Payments ====
router.post('/admin/payments/add-payment', authenticateAdminJWT, PaymentController.addPayment);
router.get('/admin/payments/get-all-students', authenticateAdminJWT, PaymentController.getAllCurrentStudents);
router.get('/admin/payments/:studentNo', authenticateAdminJWT, PaymentController.getStudentPayments);

// Admin Activity Logs ====
router.get('/admin/activity-logs', authenticateAdminJWT, adminController.getActivityLogs)



// TRIGGER ONCE
router.post('/admin/trigger-auto-delete', authenticateAdminJWT, TriggerAutoDelete.triggerAutoDeleteExpiredForms);
router.post('/admin/initialize-rooms', authenticateAdminJWT, RoomsController.createRooms); // NOTE: this will be initiated only once, IF there are updates of rooms initiate again
// router.post('/admin/trigger-auto-delete-renewals', authenticateAdminJWT, RenewalController.triggerAutoDeleteExpiredRenewals); 


module.exports = router;