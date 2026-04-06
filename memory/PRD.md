# Student Portal - PRD

## Original Problem Statement
User requested to clone and set up their GitHub repository: https://github.com/Nashildamudi/student_portal

## Architecture
- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS
- **Backend**: Python FastAPI (ported from Node.js/Express)
- **Database**: MongoDB with Motor async driver
- **Authentication**: JWT-based with bcrypt password hashing

## What's Been Implemented (Jan 2026)

### Backend (Python FastAPI)
- Complete port from Node.js/Express to Python FastAPI
- Auth routes: `/api/auth/login`, `/api/auth/register`
- Admin routes: stats, users, students, faculty, departments, courses, subjects, teaching assignments
- Faculty routes: assignments, attendance, marks, materials upload
- Student routes: profile, attendance, marks, materials
- Database seeding endpoint: `/api/seed`

### Frontend (React + Vite)
- Login page with role-based redirects
- Registration page with department/course selection
- Admin Dashboard: Overview, Users, Add Student, Add Faculty, Assignments, Departments, Courses, Subjects
- Faculty Dashboard: Overview, Attendance marking, Marks entry, Materials upload
- Student Dashboard: Profile, Attendance view, Marks view, Materials download

### Database Models
- Users (admin, faculty, student roles)
- Students
- Faculty
- Departments
- Courses
- Subjects
- Teaching Assignments
- Attendance
- Marks & Mark Components
- Materials

## Core Requirements (Static)
1. Multi-role authentication (Admin, Faculty, Student)
2. Course & Subject management
3. Attendance tracking
4. Marks/Grades management with components
5. Study materials upload/download

## User Personas
1. **Admin**: Manages all institutional data, creates users
2. **Faculty**: Marks attendance, enters marks, uploads materials
3. **Student**: Views attendance, marks, downloads materials

## What's Working
- [x] Login/Logout for all roles
- [x] Admin Dashboard with stats
- [x] User management (CRUD)
- [x] Department/Course/Subject management
- [x] Teaching assignment creation
- [x] Faculty assignment viewing
- [x] Student profile viewing

## Backlog / Future Work
- P1: Complete Attendance marking UI testing
- P1: Complete Marks entry UI testing  
- P2: Add password reset functionality
- P2: Add email notifications
- P3: Add bulk student/faculty import
- P3: Add attendance reports/analytics

## Test Credentials
See `/app/memory/test_credentials.md`
