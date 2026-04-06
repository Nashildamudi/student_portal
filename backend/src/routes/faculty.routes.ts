import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { authenticate } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/role.middleware';
import {
  getAssignments,
  markAttendance, getAttendanceByAssignment, getAttendanceForDate, getStudentsByAssignment,
  createMarkComponent, getMarkComponents, deleteMarkComponent, enterMarks, getMarksByAssignment,
  uploadMaterial, getMaterialsBySubject, getAllSubjects,
} from '../controllers/faculty.controller';

const router = Router();

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => { cb(null, 'uploads/'); },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files are allowed'));
  },
  limits: { fileSize: 20 * 1024 * 1024 },
});

router.use(authenticate);
router.use(authorizeRoles('faculty'));

// Teaching assignments
router.get('/assignments', getAssignments);

// Attendance
router.post('/attendance', markAttendance);
router.get('/attendance/:assignmentId', getAttendanceByAssignment);
router.get('/attendance/:assignmentId/date', getAttendanceForDate);
router.get('/students/:assignmentId', getStudentsByAssignment);

// Mark components
router.post('/marks/components', createMarkComponent);
router.get('/marks/components/:assignmentId', getMarkComponents);
router.delete('/marks/components/:id', deleteMarkComponent);

// Marks
router.post('/marks', enterMarks);
router.get('/marks/:assignmentId', getMarksByAssignment);

// Materials / PDF Upload
router.post('/materials', upload.single('file'), uploadMaterial);
router.get('/materials/:subjectId', getMaterialsBySubject);
router.get('/subjects', getAllSubjects);

export default router;
