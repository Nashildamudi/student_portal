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

## Credential Flow
- **No self-registration**: Only Admin can create student/faculty accounts
- Admin creates accounts and receives credentials to share with users
- Students/Faculty login with credentials provided by Admin

## What's Been Implemented (Apr 7, 2026)

### Backend (Python FastAPI - server.py)
- Auth routes: `/api/auth/login`, `/api/auth/register`, `/api/auth/profile`
- Common routes: `/api/common/departments`, `/api/common/courses`, `/api/common/subjects`
- Admin routes: stats, departments CRUD, courses CRUD, subjects CRUD, students CRUD, faculty CRUD, teaching assignments CRUD, users management
- Faculty routes: assignments, students-for-assignment, subjects, attendance (mark/get/summary), mark components CRUD, marks (enter/get), materials (upload/get/delete)
- Student routes: profile, attendance, marks, materials
- Database seeding endpoint: `/api/seed`

### Frontend (React + Vite + TypeScript)
- Login page with demo credentials display (no self-registration)
- **Admin Dashboard**: Stats overview, quick actions, system status
- **Admin Pages**: Departments, Courses, Subjects, Students (with credential banner), Faculty (with credential banner), Assignments, Users
- **Faculty Dashboard**: Teaching assignments overview
- **Faculty Pages**: Attendance, Marks, Materials
- **Student Dashboard**: Profile details
- **Student Pages**: Attendance, Marks, Materials
- **Layout**: Responsive sidebar navigation, role-based menus, user menu with logout
- **Auth Context**: JWT token management, auto-redirect by role

## What's Working
- [x] Login/Logout for all roles
- [x] Role-based route protection and redirects
- [x] Admin creates student → credentials shown → student can login
- [x] Admin creates faculty → credentials shown → faculty can login
- [x] All CRUD operations (departments, courses, subjects, students, faculty, assignments)
- [x] Faculty attendance, marks, materials
- [x] Student profile, attendance, marks, materials viewing
- [x] Database seeding with test data

## Test Results (Apr 7, 2026)
- Backend: 100% (31/31 tests passed)
- Frontend: 100% (all flows working)

## Backlog / Future Work
- P1: Add edit functionality for departments/courses/subjects/students/faculty
- P1: Fix HTTP status codes (return 201 for POST endpoints)
- P2: Add password reset functionality
- P2: Add email notifications
- P3: Bulk student/faculty import via CSV
- P3: Attendance reports with charts/analytics
- P3: Export marks/attendance to PDF/Excel

## Test Credentials
See `/app/memory/test_credentials.md`
