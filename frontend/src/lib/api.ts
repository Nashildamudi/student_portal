import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authApi = {
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
  register: (data: { name: string; email: string; password: string; role: string; phone?: string }) => 
    api.post('/auth/register', data),
  getProfile: () => api.get('/auth/profile'),
};

// Common
export const commonApi = {
  getDepartments: () => api.get('/common/departments'),
  getCourses: (departmentId?: string) => api.get('/common/courses', { params: { departmentId } }),
  getSubjects: (courseId?: string, semester?: number) => 
    api.get('/common/subjects', { params: { courseId, semester } }),
};

// Admin
export const adminApi = {
  getStats: () => api.get('/admin/stats'),
  
  // Departments
  getDepartments: () => api.get('/admin/departments'),
  createDepartment: (data: { name: string; code: string }) => api.post('/admin/departments', data),
  deleteDepartment: (id: string) => api.delete(`/admin/departments/${id}`),
  
  // Courses
  getCourses: (departmentId?: string) => api.get('/admin/courses', { params: { departmentId } }),
  createCourse: (data: { name: string; code: string; departmentId: string; totalSemesters?: number }) => 
    api.post('/admin/courses', data),
  deleteCourse: (id: string) => api.delete(`/admin/courses/${id}`),
  
  // Subjects
  getSubjects: (courseId?: string, semester?: number) => 
    api.get('/admin/subjects', { params: { courseId, semester } }),
  createSubject: (data: { name: string; code: string; courseId: string; semester: number; credits?: number }) => 
    api.post('/admin/subjects', data),
  deleteSubject: (id: string) => api.delete(`/admin/subjects/${id}`),
  
  // Students
  getStudents: (filters?: { courseId?: string; semester?: number; section?: string }) => 
    api.get('/admin/students', { params: filters }),
  createStudent: (data: {
    name: string;
    email: string;
    password?: string;
    phone?: string;
    departmentId: string;
    courseId: string;
    rollNumber: string;
    semester: number;
    section: string;
    academicYear: string;
  }) => api.post('/admin/students', data),
  deleteStudent: (id: string) => api.delete(`/admin/students/${id}`),
  
  // Faculty
  getFaculty: (departmentId?: string) => api.get('/admin/faculty', { params: { departmentId } }),
  createFaculty: (data: {
    name: string;
    email: string;
    password?: string;
    phone?: string;
    departmentId: string;
    employeeId: string;
    designation: string;
    specialization?: string;
  }) => api.post('/admin/faculty', data),
  deleteFaculty: (id: string) => api.delete(`/admin/faculty/${id}`),
  
  // Assignments
  getAssignments: (filters?: { facultyId?: string; courseId?: string; academicYear?: string }) => 
    api.get('/admin/assignments', { params: filters }),
  createAssignment: (data: {
    facultyId: string;
    subjectId: string;
    departmentId: string;
    courseId: string;
    semester: number;
    section: string;
    academicYear: string;
  }) => api.post('/admin/assignments', data),
  deleteAssignment: (id: string) => api.delete(`/admin/assignments/${id}`),
  
  // Users
  getUsers: (role?: string) => api.get('/admin/users', { params: { role } }),
  toggleUserStatus: (id: string) => api.patch(`/admin/users/${id}/toggle-status`),
};

// Faculty
export const facultyApi = {
  getAssignments: () => api.get('/faculty/assignments'),
  getStudentsForAssignment: (assignmentId: string) => api.get(`/faculty/assignments/${assignmentId}/students`),
  getSubjects: () => api.get('/faculty/subjects'),
  
  // Attendance
  markAttendance: (data: {
    assignmentId: string;
    date: string;
    session: string;
    records: Array<{ studentId: string; status: string }>;
  }) => api.post('/faculty/attendance', data),
  getAttendanceForDate: (assignmentId: string, date: string, session: string) => 
    api.get(`/faculty/attendance/${assignmentId}`, { params: { date, session } }),
  getAttendanceSummary: (assignmentId: string) => api.get(`/faculty/attendance/${assignmentId}/summary`),
  
  // Mark Components
  createMarkComponent: (data: { assignmentId: string; name: string; maxMarks: number; type: string }) => 
    api.post('/faculty/marks/components', data),
  getMarkComponents: (assignmentId: string) => api.get(`/faculty/marks/components/${assignmentId}`),
  deleteMarkComponent: (componentId: string) => api.delete(`/faculty/marks/components/${componentId}`),
  
  // Marks
  enterMarks: (entries: Array<{ componentId: string; studentId: string; marksObtained: number; remarks?: string }>) => 
    api.post('/faculty/marks', { entries }),
  getMarks: (assignmentId: string) => api.get(`/faculty/marks/${assignmentId}`),
  
  // Materials
  uploadMaterial: (data: FormData) => api.post('/faculty/materials', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getMaterials: (subjectId: string) => api.get(`/faculty/materials/${subjectId}`),
  deleteMaterial: (materialId: string) => api.delete(`/faculty/materials/${materialId}`),
};

// Student
export const studentApi = {
  getProfile: () => api.get('/student/profile'),
  getAttendance: () => api.get('/student/attendance'),
  getMarks: () => api.get('/student/marks'),
  getMaterials: () => api.get('/student/materials'),
};

export default api;
