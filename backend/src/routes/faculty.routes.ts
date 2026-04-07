import { Router } from 'express';
import { facultyController } from '../controllers';
import { authenticate, authorize, upload } from '../middlewares';

const router = Router();

// All routes require faculty authentication
router.use(authenticate, authorize('faculty'));

// Assignments
router.get('/assignments', facultyController.getMyAssignments);
router.get('/assignments/:assignmentId/students', facultyController.getStudentsForAssignment);

// Subjects
router.get('/subjects', facultyController.getMySubjects);

// Attendance
router.post('/attendance', facultyController.markAttendance);
router.get('/attendance/:assignmentId', facultyController.getAttendanceForDate);
router.get('/attendance/:assignmentId/summary', facultyController.getAttendanceSummary);

// Mark Components
router.post('/marks/components', facultyController.createMarkComponent);
router.get('/marks/components/:assignmentId', facultyController.getMarkComponents);
router.delete('/marks/components/:componentId', facultyController.deleteMarkComponent);

// Marks
router.post('/marks', facultyController.enterMarks);
router.get('/marks/:assignmentId', facultyController.getMarksForAssignment);

// Materials
router.post('/materials', upload.single('file'), facultyController.uploadMaterial);
router.get('/materials/:subjectId', facultyController.getMaterials);
router.delete('/materials/:materialId', facultyController.deleteMaterial);

export default router;
