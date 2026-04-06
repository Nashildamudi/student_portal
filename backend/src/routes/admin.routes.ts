import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/role.middleware';
import {
  getUsers, getStudents, getFacultyList, getDashboardStats,
  createUser, getUserById, updateUser, deleteUser,
  getDepartments, createDepartment, deleteDepartment,
  getCourses, createCourse,
  getSubjects, createSubject,
  createStudent, createFaculty,
  getTeachingAssignments, createTeachingAssignment, deleteTeachingAssignment,
} from '../controllers/admin.controller';

const router = Router();

router.use(authenticate);
router.use(authorizeRoles('admin'));

// Dashboard stats
router.get('/stats', getDashboardStats);

// Student & Faculty management
router.get('/students', getStudents);
router.post('/students', createStudent);
router.get('/faculty-list', getFacultyList);
router.post('/faculty', createFaculty);

// Teaching assignments
router.route('/assignments')
  .get(getTeachingAssignments)
  .post(createTeachingAssignment);
router.route('/assignments/:id')
  .delete(deleteTeachingAssignment);

// Users (generic)
router.route('/users')
  .get(getUsers)
  .post(createUser);
router.route('/users/:id')
  .get(getUserById)
  .patch(updateUser)
  .delete(deleteUser);

// Departments
router.route('/departments')
  .get(getDepartments)
  .post(createDepartment);
router.route('/departments/:id')
  .delete(deleteDepartment);

// Courses — supports ?departmentId= for cascading
router.route('/courses')
  .get(getCourses)
  .post(createCourse);

// Subjects — supports ?courseId= for cascading
router.route('/subjects')
  .get(getSubjects)
  .post(createSubject);

export default router;
