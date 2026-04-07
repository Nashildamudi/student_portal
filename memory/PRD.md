# Student Portal - PRD

## Original Problem Statement
Build a full production-level Student Portal web application with roles: Admin, Faculty, Student. Features include attendance tracking, marks management, structured academic data, multi-step forms, cascading dropdowns, and strict authorization.

## Architecture
- **Frontend**: React 19 + TypeScript + Vite 8 + Tailwind CSS + shadcn/ui
- **Backend**: Python FastAPI (server.py) running via uvicorn on port 8001
- **Database**: MongoDB with Motor async driver
- **Authentication**: JWT-based with bcrypt password hashing

## User Personas
1. **Admin**: Manages all institutional data - departments, courses, subjects, students, faculty, teaching assignments
2. **Faculty**: Views teaching assignments, marks attendance, enters marks, uploads study materials
3. **Student**: Views profile, attendance percentage, marks/grades, downloads study materials

## Core Requirements
1. Multi-role authentication (Admin, Faculty, Student) with JWT
2. Department, Course & Subject management (Admin)
3. Student & Faculty registration with academic data (Admin)
4. Teaching Assignment creation (Admin)
5. Attendance tracking with date/session picker (Faculty)
6. Marks management with components (Faculty)
7. Study materials upload/download (Faculty/Student)
8. Profile & academic data viewing (Student)
9. Role-based route protection (401/403)

## What's Been Implemented (Apr 2026)

### Backend (Python FastAPI - server.py)
- Auth routes: `/api/auth/login`, `/api/auth/register`, `/api/auth/profile`
- Common routes: `/api/common/departments`, `/api/common/courses`, `/api/common/subjects`
- Admin routes: stats, departments CRUD, courses CRUD, subjects CRUD, students CRUD, faculty CRUD, teaching assignments CRUD, users management
- Faculty routes: assignments, students-for-assignment, subjects, attendance (mark/get/summary), mark components CRUD, marks (enter/get), materials (upload/get/delete)
- Student routes: profile, attendance, marks, materials
- Database seeding endpoint: `/api/seed`
- Health check: `/api/health`

### Frontend (React + Vite + TypeScript)
- Login page with React Hook Form + Zod validation, demo credentials display
- Registration page with role selection
- **Admin Dashboard**: Stats overview, quick actions, system status
- **Admin Pages**: Departments, Courses, Subjects, Students, Faculty, Assignments, Users - all with list/create/delete/filter
- **Faculty Dashboard**: Teaching assignments overview, quick links
- **Faculty Pages**: Attendance (cascading class/date/session picker, per-student status), Marks (component management, marks entry grid), Materials (upload/list/delete)
- **Student Dashboard**: Profile details, quick access links
- **Student Pages**: Attendance (subject-wise summary with progress bars), Marks (component-wise with grades), Materials (grouped by subject)
- **Layout**: Responsive sidebar navigation, role-based menu items, user menu with logout
- **Auth Context**: JWT token management, auto-redirect by role
- **Toast System**: Custom toast notifications

### Database Models
- Users, Students, Faculty, Departments, Courses, Subjects
- Teaching Assignments, Attendance, Mark Components, Marks, Materials

## What's Working
- [x] Login/Logout for all roles (Admin, Faculty, Student)
- [x] Role-based route protection and redirects
- [x] Admin Dashboard with real-time stats
- [x] Department/Course/Subject CRUD
- [x] Student/Faculty registration and management
- [x] Teaching Assignment creation and management
- [x] User status toggle (activate/deactivate)
- [x] Faculty attendance marking with date/session
- [x] Faculty marks entry with component management
- [x] Faculty materials upload
- [x] Student profile/attendance/marks/materials viewing
- [x] Database seeding with comprehensive test data

## Test Results (Apr 7, 2026)
- Backend: 100% (31/31 tests passed)
- Frontend: 100% (all flows working)
- Test file: /app/backend/tests/test_student_portal.py

## Backlog / Future Work
- P1: Fix HTTP status codes (return 201 for POST endpoints, currently returns 200)
- P2: Add password reset functionality
- P2: Add email notifications
- P2: Add edit functionality for departments/courses/subjects/students/faculty
- P3: Add bulk student/faculty import
- P3: Add attendance reports/analytics with charts
- P3: Add export to PDF/Excel for marks/attendance

## Test Credentials
See `/app/memory/test_credentials.md`
