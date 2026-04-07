import { Router } from 'express';
import { adminController } from '../controllers';
import { authenticate, authorize } from '../middlewares';

const router = Router();

// All routes require admin authentication
router.use(authenticate, authorize('admin'));

// Stats
router.get('/stats', adminController.getStats);

// Departments
router.route('/departments')
  .get(adminController.getDepartments)
  .post(adminController.createDepartment);

router.route('/departments/:id')
  .get(adminController.getDepartmentById)
  .patch(adminController.updateDepartment)
  .delete(adminController.deleteDepartment);

// Courses
router.route('/courses')
  .get(adminController.getCourses)
  .post(adminController.createCourse);

router.route('/courses/:id')
  .get(adminController.getCourseById)
  .patch(adminController.updateCourse)
  .delete(adminController.deleteCourse);

// Subjects
router.route('/subjects')
  .get(adminController.getSubjects)
  .post(adminController.createSubject);

router.route('/subjects/:id')
  .get(adminController.getSubjectById)
  .patch(adminController.updateSubject)
  .delete(adminController.deleteSubject);

// Students
router.route('/students')
  .get(adminController.getStudents)
  .post(adminController.registerStudent);

router.route('/students/:id')
  .get(adminController.getStudentById)
  .patch(adminController.updateStudent)
  .delete(adminController.deleteStudent);

// Faculty
router.route('/faculty')
  .get(adminController.getFacultyList)
  .post(adminController.registerFaculty);

router.route('/faculty/:id')
  .get(adminController.getFacultyById)
  .patch(adminController.updateFaculty)
  .delete(adminController.deleteFaculty);

// Teaching Assignments
router.route('/assignments')
  .get(adminController.getTeachingAssignments)
  .post(adminController.createTeachingAssignment);

router.route('/assignments/:id')
  .get(adminController.getTeachingAssignmentById)
  .delete(adminController.deleteTeachingAssignment);

// Users
router.get('/users', adminController.getUsers);
router.patch('/users/:id/toggle-status', adminController.toggleUserStatus);

export default router;
