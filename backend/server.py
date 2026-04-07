"""
Student Portal Backend - FastAPI
Production-ready implementation with clean architecture
"""
import os
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Literal
from contextlib import asynccontextmanager
from enum import Enum

from fastapi import FastAPI, HTTPException, Depends, status, UploadFile, File, Form, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr, Field, field_validator
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from bson import ObjectId
from bson.errors import InvalidId
import bcrypt
import jwt

# ============ Configuration ============
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "student_portal")
JWT_SECRET = os.environ.get("JWT_SECRET", "student_portal_jwt_secret_2026")
JWT_EXPIRES_DAYS = 30

# ============ Database ============
client: Optional[AsyncIOMotorClient] = None
db: Optional[AsyncIOMotorDatabase] = None

security = HTTPBearer()

def get_db() -> AsyncIOMotorDatabase:
    if db is None:
        raise HTTPException(500, "Database not initialized")
    return db

# ============ Lifespan ============
@asynccontextmanager
async def lifespan(app: FastAPI):
    global client, db
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    print(f"Connected to MongoDB: {DB_NAME}")
    
    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.departments.create_index("code", unique=True)
    await db.courses.create_index("code", unique=True)
    await db.subjects.create_index([("code", 1), ("courseId", 1)], unique=True)
    await db.students.create_index("userId", unique=True)
    await db.students.create_index("rollNumber", unique=True)
    await db.faculty.create_index("userId", unique=True)
    await db.faculty.create_index("employeeId", unique=True)
    await db.teaching_assignments.create_index([("subjectId", 1), ("semester", 1), ("section", 1), ("academicYear", 1)], unique=True)
    await db.attendance.create_index([("assignmentId", 1), ("studentId", 1), ("date", 1), ("session", 1)], unique=True)
    await db.marks.create_index([("componentId", 1), ("studentId", 1)], unique=True)
    
    yield
    client.close()

app = FastAPI(title="Student Portal API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# ============ Enums ============
class UserRole(str, Enum):
    ADMIN = "admin"
    FACULTY = "faculty"
    STUDENT = "student"

class AttendanceStatus(str, Enum):
    PRESENT = "present"
    ABSENT = "absent"
    OD = "od"
    MEDICAL = "medical_leave"

class MarkComponentType(str, Enum):
    INTERNAL = "internal"
    ASSIGNMENT = "assignment"
    QUIZ = "quiz"
    PROJECT = "project"
    LAB = "lab"
    OTHER = "other"

# ============ Helpers ============
def validate_object_id(id_str: str) -> ObjectId:
    try:
        return ObjectId(id_str)
    except InvalidId:
        raise HTTPException(400, f"Invalid ID format: {id_str}")

def serialize(doc) -> dict:
    if doc is None:
        return None
    if isinstance(doc, list):
        return [serialize(d) for d in doc]
    if isinstance(doc, dict):
        result = {}
        for k, v in doc.items():
            if k == "_id":
                result["_id"] = str(v)
            elif isinstance(v, ObjectId):
                result[k] = str(v)
            elif isinstance(v, datetime):
                result[k] = v.isoformat()
            elif isinstance(v, dict):
                result[k] = serialize(v)
            elif isinstance(v, list):
                result[k] = [serialize(i) if isinstance(i, dict) else str(i) if isinstance(i, ObjectId) else i for i in v]
            else:
                result[k] = v
        return result
    return doc

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt(12)).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_token(user_id: str, role: str) -> str:
    return jwt.encode(
        {"id": user_id, "role": role, "exp": datetime.now(timezone.utc) + timedelta(days=JWT_EXPIRES_DAYS)},
        JWT_SECRET,
        algorithm="HS256"
    )

def api_response(data=None, message: str = "Success", status_code: int = 200):
    return {"statusCode": status_code, "success": status_code < 400, "data": data, "message": message}

# ============ Auth Dependency ============
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=["HS256"])
        user = await db.users.find_one({"_id": ObjectId(payload["id"])}, {"password": 0})
        if not user:
            raise HTTPException(401, "User not found")
        if not user.get("isActive", True):
            raise HTTPException(401, "Account deactivated")
        return serialize(user)
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Invalid token")

def require_role(*roles: UserRole):
    async def checker(user = Depends(get_current_user)):
        if user["role"] not in [r.value for r in roles]:
            raise HTTPException(403, f"Role '{user['role']}' not authorized")
        return user
    return checker

# ============ Pydantic Models ============
class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)

class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6)
    role: UserRole = UserRole.STUDENT
    phone: Optional[str] = None

class DepartmentCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=200)
    code: str = Field(..., min_length=2, max_length=20)

class CourseCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=200)
    code: str = Field(..., min_length=2, max_length=20)
    departmentId: str
    totalSemesters: int = Field(default=8, ge=1, le=12)

class SubjectCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=200)
    code: str = Field(..., min_length=2, max_length=20)
    courseId: str
    semester: int = Field(..., ge=1, le=12)
    credits: int = Field(default=3, ge=1, le=6)

class StudentCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(default="Student@123", min_length=6)
    phone: Optional[str] = None
    departmentId: str
    courseId: str
    rollNumber: str = Field(..., min_length=2)
    semester: int = Field(..., ge=1, le=12)
    section: str = Field(..., min_length=1, max_length=5)
    academicYear: str = Field(..., pattern=r"^\d{4}-\d{2}$")

class FacultyCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(default="Faculty@123", min_length=6)
    phone: Optional[str] = None
    departmentId: str
    employeeId: str = Field(..., min_length=2)
    designation: str = Field(..., min_length=2, max_length=100)
    specialization: Optional[str] = None

class TeachingAssignmentCreate(BaseModel):
    facultyId: str
    subjectId: str
    departmentId: str
    courseId: str
    semester: int = Field(..., ge=1, le=12)
    section: str = Field(..., min_length=1, max_length=5)
    academicYear: str = Field(..., pattern=r"^\d{4}-\d{2}$")

class AttendanceRecord(BaseModel):
    studentId: str
    status: AttendanceStatus

class AttendanceCreate(BaseModel):
    assignmentId: str
    date: str
    session: str
    records: List[AttendanceRecord]

class MarkComponentCreate(BaseModel):
    assignmentId: str
    name: str = Field(..., min_length=2, max_length=100)
    maxMarks: int = Field(..., ge=1, le=200)
    type: MarkComponentType = MarkComponentType.INTERNAL

class MarkEntry(BaseModel):
    componentId: str
    studentId: str
    marksObtained: float = Field(..., ge=0)
    remarks: Optional[str] = None

class MarksCreate(BaseModel):
    entries: List[MarkEntry]

# ============ AUTH ROUTES ============
@app.post("/api/auth/register")
async def register(req: RegisterRequest):
    if req.role == UserRole.ADMIN:
        raise HTTPException(403, "Cannot register as admin")
    
    existing = await db.users.find_one({"email": req.email.lower()})
    if existing:
        raise HTTPException(409, "Email already registered")
    
    user_doc = {
        "name": req.name,
        "email": req.email.lower(),
        "password": hash_password(req.password),
        "role": req.role.value,
        "phone": req.phone,
        "isActive": True,
        "createdAt": datetime.now(timezone.utc),
        "updatedAt": datetime.now(timezone.utc),
    }
    result = await db.users.insert_one(user_doc)
    user_doc["_id"] = result.inserted_id
    del user_doc["password"]
    
    token = create_token(str(result.inserted_id), req.role.value)
    return api_response({"user": serialize(user_doc), "token": token}, "Registration successful", 201)

@app.post("/api/auth/login")
async def login(req: LoginRequest):
    user = await db.users.find_one({"email": req.email.lower()})
    if not user or not verify_password(req.password, user["password"]):
        raise HTTPException(401, "Invalid email or password")
    if not user.get("isActive", True):
        raise HTTPException(401, "Account deactivated")
    
    token = create_token(str(user["_id"]), user["role"])
    user_copy = {k: v for k, v in user.items() if k != "password"}
    return api_response({"user": serialize(user_copy), "token": token}, "Login successful")

@app.get("/api/auth/profile")
async def get_profile(user = Depends(get_current_user)):
    return api_response(user, "Profile fetched")

# ============ COMMON ROUTES ============
@app.get("/api/common/departments")
async def public_departments():
    departments = await db.departments.find().sort("name", 1).to_list(100)
    return api_response(serialize(departments), "Departments fetched")

@app.get("/api/common/courses")
async def public_courses(departmentId: Optional[str] = None):
    query = {"departmentId": validate_object_id(departmentId)} if departmentId else {}
    courses = await db.courses.find(query).sort("name", 1).to_list(200)
    # Populate department
    for course in courses:
        if course.get("departmentId"):
            dept = await db.departments.find_one({"_id": course["departmentId"]})
            course["department"] = serialize(dept) if dept else None
    return api_response(serialize(courses), "Courses fetched")

@app.get("/api/common/subjects")
async def public_subjects(courseId: Optional[str] = None, semester: Optional[int] = None):
    query = {}
    if courseId:
        query["courseId"] = validate_object_id(courseId)
    if semester:
        query["semester"] = semester
    subjects = await db.subjects.find(query).sort([("semester", 1), ("name", 1)]).to_list(500)
    for subj in subjects:
        if subj.get("courseId"):
            course = await db.courses.find_one({"_id": subj["courseId"]})
            subj["course"] = serialize(course) if course else None
    return api_response(serialize(subjects), "Subjects fetched")

# ============ ADMIN ROUTES ============
@app.get("/api/admin/stats")
async def admin_stats(user = Depends(require_role(UserRole.ADMIN))):
    stats = {
        "students": await db.students.count_documents({}),
        "faculty": await db.faculty.count_documents({}),
        "departments": await db.departments.count_documents({}),
        "courses": await db.courses.count_documents({}),
        "subjects": await db.subjects.count_documents({}),
        "assignments": await db.teaching_assignments.count_documents({}),
    }
    return api_response(stats, "Stats fetched")

# Departments
@app.post("/api/admin/departments")
async def create_department(req: DepartmentCreate, user = Depends(require_role(UserRole.ADMIN))):
    existing = await db.departments.find_one({"code": req.code.upper()})
    if existing:
        raise HTTPException(409, "Department code already exists")
    doc = {"name": req.name, "code": req.code.upper(), "createdAt": datetime.now(timezone.utc)}
    result = await db.departments.insert_one(doc)
    doc["_id"] = result.inserted_id
    return api_response(serialize(doc), "Department created", 201)

@app.get("/api/admin/departments")
async def get_departments(user = Depends(require_role(UserRole.ADMIN))):
    departments = await db.departments.find().sort("name", 1).to_list(100)
    return api_response(serialize(departments), "Departments fetched")

@app.delete("/api/admin/departments/{id}")
async def delete_department(id: str, user = Depends(require_role(UserRole.ADMIN))):
    oid = validate_object_id(id)
    courses = await db.courses.count_documents({"departmentId": oid})
    if courses > 0:
        raise HTTPException(400, "Cannot delete department with existing courses")
    result = await db.departments.delete_one({"_id": oid})
    if result.deleted_count == 0:
        raise HTTPException(404, "Department not found")
    return api_response(None, "Department deleted")

# Courses
@app.post("/api/admin/courses")
async def create_course(req: CourseCreate, user = Depends(require_role(UserRole.ADMIN))):
    existing = await db.courses.find_one({"code": req.code.upper()})
    if existing:
        raise HTTPException(409, "Course code already exists")
    dept = await db.departments.find_one({"_id": validate_object_id(req.departmentId)})
    if not dept:
        raise HTTPException(404, "Department not found")
    doc = {
        "name": req.name, "code": req.code.upper(), 
        "departmentId": ObjectId(req.departmentId), "totalSemesters": req.totalSemesters,
        "createdAt": datetime.now(timezone.utc)
    }
    result = await db.courses.insert_one(doc)
    doc["_id"] = result.inserted_id
    return api_response(serialize(doc), "Course created", 201)

@app.get("/api/admin/courses")
async def get_courses(departmentId: Optional[str] = None, user = Depends(require_role(UserRole.ADMIN))):
    query = {"departmentId": validate_object_id(departmentId)} if departmentId else {}
    courses = await db.courses.find(query).sort("name", 1).to_list(200)
    for course in courses:
        if course.get("departmentId"):
            dept = await db.departments.find_one({"_id": course["departmentId"]})
            course["department"] = serialize(dept) if dept else None
    return api_response(serialize(courses), "Courses fetched")

@app.delete("/api/admin/courses/{id}")
async def delete_course(id: str, user = Depends(require_role(UserRole.ADMIN))):
    oid = validate_object_id(id)
    subjects = await db.subjects.count_documents({"courseId": oid})
    if subjects > 0:
        raise HTTPException(400, "Cannot delete course with existing subjects")
    result = await db.courses.delete_one({"_id": oid})
    if result.deleted_count == 0:
        raise HTTPException(404, "Course not found")
    return api_response(None, "Course deleted")

# Subjects
@app.post("/api/admin/subjects")
async def create_subject(req: SubjectCreate, user = Depends(require_role(UserRole.ADMIN))):
    course = await db.courses.find_one({"_id": validate_object_id(req.courseId)})
    if not course:
        raise HTTPException(404, "Course not found")
    if req.semester > course.get("totalSemesters", 8):
        raise HTTPException(400, f"Semester cannot exceed {course.get('totalSemesters', 8)}")
    
    existing = await db.subjects.find_one({"code": req.code.upper(), "courseId": ObjectId(req.courseId)})
    if existing:
        raise HTTPException(409, "Subject code already exists for this course")
    
    doc = {
        "name": req.name, "code": req.code.upper(), "courseId": ObjectId(req.courseId),
        "semester": req.semester, "credits": req.credits, "createdAt": datetime.now(timezone.utc)
    }
    result = await db.subjects.insert_one(doc)
    doc["_id"] = result.inserted_id
    return api_response(serialize(doc), "Subject created", 201)

@app.get("/api/admin/subjects")
async def get_subjects(courseId: Optional[str] = None, semester: Optional[int] = None, user = Depends(require_role(UserRole.ADMIN))):
    query = {}
    if courseId:
        query["courseId"] = validate_object_id(courseId)
    if semester:
        query["semester"] = semester
    subjects = await db.subjects.find(query).sort([("semester", 1), ("name", 1)]).to_list(500)
    for subj in subjects:
        if subj.get("courseId"):
            course = await db.courses.find_one({"_id": subj["courseId"]})
            subj["course"] = serialize(course) if course else None
    return api_response(serialize(subjects), "Subjects fetched")

@app.delete("/api/admin/subjects/{id}")
async def delete_subject(id: str, user = Depends(require_role(UserRole.ADMIN))):
    oid = validate_object_id(id)
    assignments = await db.teaching_assignments.count_documents({"subjectId": oid})
    if assignments > 0:
        raise HTTPException(400, "Cannot delete subject with existing teaching assignments")
    result = await db.subjects.delete_one({"_id": oid})
    if result.deleted_count == 0:
        raise HTTPException(404, "Subject not found")
    return api_response(None, "Subject deleted")

# Students
@app.post("/api/admin/students")
async def register_student(req: StudentCreate, user = Depends(require_role(UserRole.ADMIN))):
    existing_email = await db.users.find_one({"email": req.email.lower()})
    if existing_email:
        raise HTTPException(409, "Email already registered")
    
    existing_roll = await db.students.find_one({"rollNumber": req.rollNumber.upper()})
    if existing_roll:
        raise HTTPException(409, "Roll number already exists")
    
    # Create user
    user_doc = {
        "name": req.name, "email": req.email.lower(), "password": hash_password(req.password),
        "role": "student", "phone": req.phone, "isActive": True,
        "createdAt": datetime.now(timezone.utc), "updatedAt": datetime.now(timezone.utc)
    }
    user_result = await db.users.insert_one(user_doc)
    
    # Create student
    student_doc = {
        "userId": user_result.inserted_id, "departmentId": ObjectId(req.departmentId),
        "courseId": ObjectId(req.courseId), "rollNumber": req.rollNumber.upper(),
        "semester": req.semester, "section": req.section.upper(), "academicYear": req.academicYear,
        "admissionDate": datetime.now(timezone.utc), "createdAt": datetime.now(timezone.utc)
    }
    student_result = await db.students.insert_one(student_doc)
    student_doc["_id"] = student_result.inserted_id
    
    return api_response(serialize(student_doc), "Student registered", 201)

@app.get("/api/admin/students")
async def get_students(
    courseId: Optional[str] = None, 
    semester: Optional[int] = None, 
    section: Optional[str] = None,
    user = Depends(require_role(UserRole.ADMIN))
):
    query = {}
    if courseId:
        query["courseId"] = validate_object_id(courseId)
    if semester:
        query["semester"] = semester
    if section:
        query["section"] = section.upper()
    
    students = await db.students.find(query).sort("rollNumber", 1).to_list(1000)
    for s in students:
        if s.get("userId"):
            u = await db.users.find_one({"_id": s["userId"]}, {"password": 0})
            s["user"] = serialize(u) if u else None
        if s.get("departmentId"):
            d = await db.departments.find_one({"_id": s["departmentId"]})
            s["department"] = serialize(d) if d else None
        if s.get("courseId"):
            c = await db.courses.find_one({"_id": s["courseId"]})
            s["course"] = serialize(c) if c else None
    return api_response(serialize(students), "Students fetched")

@app.delete("/api/admin/students/{id}")
async def delete_student(id: str, user = Depends(require_role(UserRole.ADMIN))):
    oid = validate_object_id(id)
    student = await db.students.find_one({"_id": oid})
    if not student:
        raise HTTPException(404, "Student not found")
    await db.students.delete_one({"_id": oid})
    await db.users.delete_one({"_id": student["userId"]})
    return api_response(None, "Student deleted")

# Faculty
@app.post("/api/admin/faculty")
async def register_faculty(req: FacultyCreate, user = Depends(require_role(UserRole.ADMIN))):
    existing_email = await db.users.find_one({"email": req.email.lower()})
    if existing_email:
        raise HTTPException(409, "Email already registered")
    
    existing_emp = await db.faculty.find_one({"employeeId": req.employeeId.upper()})
    if existing_emp:
        raise HTTPException(409, "Employee ID already exists")
    
    # Create user
    user_doc = {
        "name": req.name, "email": req.email.lower(), "password": hash_password(req.password),
        "role": "faculty", "phone": req.phone, "isActive": True,
        "createdAt": datetime.now(timezone.utc), "updatedAt": datetime.now(timezone.utc)
    }
    user_result = await db.users.insert_one(user_doc)
    
    # Create faculty
    faculty_doc = {
        "userId": user_result.inserted_id, "departmentId": ObjectId(req.departmentId),
        "employeeId": req.employeeId.upper(), "designation": req.designation,
        "specialization": req.specialization, "joiningDate": datetime.now(timezone.utc),
        "createdAt": datetime.now(timezone.utc)
    }
    faculty_result = await db.faculty.insert_one(faculty_doc)
    faculty_doc["_id"] = faculty_result.inserted_id
    
    return api_response(serialize(faculty_doc), "Faculty registered", 201)

@app.get("/api/admin/faculty")
async def get_faculty_list(departmentId: Optional[str] = None, user = Depends(require_role(UserRole.ADMIN))):
    query = {"departmentId": validate_object_id(departmentId)} if departmentId else {}
    faculty = await db.faculty.find(query).sort("employeeId", 1).to_list(500)
    for f in faculty:
        if f.get("userId"):
            u = await db.users.find_one({"_id": f["userId"]}, {"password": 0})
            f["user"] = serialize(u) if u else None
        if f.get("departmentId"):
            d = await db.departments.find_one({"_id": f["departmentId"]})
            f["department"] = serialize(d) if d else None
    return api_response(serialize(faculty), "Faculty fetched")

@app.delete("/api/admin/faculty/{id}")
async def delete_faculty(id: str, user = Depends(require_role(UserRole.ADMIN))):
    oid = validate_object_id(id)
    faculty = await db.faculty.find_one({"_id": oid})
    if not faculty:
        raise HTTPException(404, "Faculty not found")
    
    assignments = await db.teaching_assignments.count_documents({"facultyId": faculty["userId"]})
    if assignments > 0:
        raise HTTPException(400, "Cannot delete faculty with teaching assignments")
    
    await db.faculty.delete_one({"_id": oid})
    await db.users.delete_one({"_id": faculty["userId"]})
    return api_response(None, "Faculty deleted")

# Teaching Assignments
@app.post("/api/admin/assignments")
async def create_assignment(req: TeachingAssignmentCreate, user = Depends(require_role(UserRole.ADMIN))):
    faculty_user = await db.users.find_one({"_id": validate_object_id(req.facultyId), "role": "faculty"})
    if not faculty_user:
        raise HTTPException(404, "Faculty not found")
    
    subject = await db.subjects.find_one({"_id": validate_object_id(req.subjectId)})
    if not subject:
        raise HTTPException(404, "Subject not found")
    
    doc = {
        "facultyId": ObjectId(req.facultyId), "subjectId": ObjectId(req.subjectId),
        "departmentId": ObjectId(req.departmentId), "courseId": ObjectId(req.courseId),
        "semester": req.semester, "section": req.section.upper(), "academicYear": req.academicYear,
        "createdAt": datetime.now(timezone.utc)
    }
    
    try:
        result = await db.teaching_assignments.insert_one(doc)
        doc["_id"] = result.inserted_id
    except Exception:
        raise HTTPException(409, "Assignment already exists for this subject/section/year")
    
    return api_response(serialize(doc), "Assignment created", 201)

@app.get("/api/admin/assignments")
async def get_assignments(
    facultyId: Optional[str] = None,
    courseId: Optional[str] = None,
    academicYear: Optional[str] = None,
    user = Depends(require_role(UserRole.ADMIN))
):
    query = {}
    if facultyId:
        query["facultyId"] = validate_object_id(facultyId)
    if courseId:
        query["courseId"] = validate_object_id(courseId)
    if academicYear:
        query["academicYear"] = academicYear
    
    assignments = await db.teaching_assignments.find(query).sort([("academicYear", -1), ("semester", 1)]).to_list(500)
    for a in assignments:
        if a.get("facultyId"):
            f = await db.users.find_one({"_id": a["facultyId"]}, {"password": 0})
            a["faculty"] = serialize(f) if f else None
        if a.get("subjectId"):
            s = await db.subjects.find_one({"_id": a["subjectId"]})
            a["subject"] = serialize(s) if s else None
        if a.get("departmentId"):
            d = await db.departments.find_one({"_id": a["departmentId"]})
            a["department"] = serialize(d) if d else None
        if a.get("courseId"):
            c = await db.courses.find_one({"_id": a["courseId"]})
            a["course"] = serialize(c) if c else None
    return api_response(serialize(assignments), "Assignments fetched")

@app.delete("/api/admin/assignments/{id}")
async def delete_assignment(id: str, user = Depends(require_role(UserRole.ADMIN))):
    result = await db.teaching_assignments.delete_one({"_id": validate_object_id(id)})
    if result.deleted_count == 0:
        raise HTTPException(404, "Assignment not found")
    return api_response(None, "Assignment deleted")

# Users
@app.get("/api/admin/users")
async def get_users(role: Optional[str] = None, user = Depends(require_role(UserRole.ADMIN))):
    query = {"role": role} if role else {}
    users = await db.users.find(query, {"password": 0}).sort("createdAt", -1).to_list(1000)
    return api_response(serialize(users), "Users fetched")

@app.patch("/api/admin/users/{id}/toggle-status")
async def toggle_user_status(id: str, user = Depends(require_role(UserRole.ADMIN))):
    oid = validate_object_id(id)
    u = await db.users.find_one({"_id": oid})
    if not u:
        raise HTTPException(404, "User not found")
    await db.users.update_one({"_id": oid}, {"$set": {"isActive": not u.get("isActive", True)}})
    updated = await db.users.find_one({"_id": oid}, {"password": 0})
    return api_response(serialize(updated), "User status updated")

# ============ FACULTY ROUTES ============
@app.get("/api/faculty/assignments")
async def faculty_assignments(user = Depends(require_role(UserRole.FACULTY))):
    assignments = await db.teaching_assignments.find({"facultyId": ObjectId(user["_id"])}).to_list(100)
    for a in assignments:
        if a.get("subjectId"):
            s = await db.subjects.find_one({"_id": a["subjectId"]})
            a["subject"] = serialize(s) if s else None
        if a.get("departmentId"):
            d = await db.departments.find_one({"_id": a["departmentId"]})
            a["department"] = serialize(d) if d else None
        if a.get("courseId"):
            c = await db.courses.find_one({"_id": a["courseId"]})
            a["course"] = serialize(c) if c else None
    return api_response(serialize(assignments), "Assignments fetched")

@app.get("/api/faculty/assignments/{assignmentId}/students")
async def faculty_assignment_students(assignmentId: str, user = Depends(require_role(UserRole.FACULTY))):
    assignment = await db.teaching_assignments.find_one({
        "_id": validate_object_id(assignmentId),
        "facultyId": ObjectId(user["_id"])
    })
    if not assignment:
        raise HTTPException(404, "Assignment not found")
    
    students = await db.students.find({
        "courseId": assignment["courseId"],
        "semester": assignment["semester"],
        "section": assignment["section"]
    }).sort("rollNumber", 1).to_list(200)
    
    result = []
    for s in students:
        u = await db.users.find_one({"_id": s["userId"]}, {"password": 0})
        result.append({
            "_id": str(s["_id"]),
            "rollNumber": s["rollNumber"],
            "name": u["name"] if u else "Unknown",
            "email": u.get("email", "") if u else ""
        })
    return api_response(result, "Students fetched")

@app.get("/api/faculty/subjects")
async def faculty_subjects(user = Depends(require_role(UserRole.FACULTY))):
    subject_ids = await db.teaching_assignments.distinct("subjectId", {"facultyId": ObjectId(user["_id"])})
    subjects = await db.subjects.find({"_id": {"$in": subject_ids}}).to_list(100)
    for s in subjects:
        if s.get("courseId"):
            c = await db.courses.find_one({"_id": s["courseId"]})
            s["course"] = serialize(c) if c else None
    return api_response(serialize(subjects), "Subjects fetched")

# Attendance
@app.post("/api/faculty/attendance")
async def mark_attendance(req: AttendanceCreate, user = Depends(require_role(UserRole.FACULTY))):
    assignment = await db.teaching_assignments.find_one({
        "_id": validate_object_id(req.assignmentId),
        "facultyId": ObjectId(user["_id"])
    })
    if not assignment:
        raise HTTPException(404, "Assignment not found")
    
    date = datetime.fromisoformat(req.date.replace("Z", "+00:00")) if "T" in req.date else datetime.strptime(req.date, "%Y-%m-%d")
    
    # Check if already marked
    existing = await db.attendance.find_one({
        "assignmentId": ObjectId(req.assignmentId),
        "date": {"$gte": date.replace(hour=0, minute=0), "$lt": date.replace(hour=23, minute=59)},
        "session": req.session
    })
    if existing:
        raise HTTPException(409, "Attendance already marked for this date and session")
    
    docs = [{
        "assignmentId": ObjectId(req.assignmentId),
        "studentId": ObjectId(r.studentId),
        "date": date,
        "session": req.session,
        "status": r.status.value,
        "recordedBy": ObjectId(user["_id"]),
        "createdAt": datetime.now(timezone.utc)
    } for r in req.records]
    
    await db.attendance.insert_many(docs)
    return api_response({"count": len(docs)}, "Attendance marked", 201)

@app.get("/api/faculty/attendance/{assignmentId}")
async def get_attendance_for_date(
    assignmentId: str,
    date: str = Query(...),
    session: str = Query(...),
    user = Depends(require_role(UserRole.FACULTY))
):
    assignment = await db.teaching_assignments.find_one({
        "_id": validate_object_id(assignmentId),
        "facultyId": ObjectId(user["_id"])
    })
    if not assignment:
        raise HTTPException(404, "Assignment not found")
    
    dt = datetime.strptime(date, "%Y-%m-%d")
    records = await db.attendance.find({
        "assignmentId": ObjectId(assignmentId),
        "date": {"$gte": dt, "$lt": dt + timedelta(days=1)},
        "session": session
    }).to_list(500)
    
    return api_response(serialize(records), "Attendance fetched")

@app.get("/api/faculty/attendance/{assignmentId}/summary")
async def attendance_summary(assignmentId: str, user = Depends(require_role(UserRole.FACULTY))):
    assignment = await db.teaching_assignments.find_one({
        "_id": validate_object_id(assignmentId),
        "facultyId": ObjectId(user["_id"])
    })
    if not assignment:
        raise HTTPException(404, "Assignment not found")
    
    students = await db.students.find({
        "courseId": assignment["courseId"],
        "semester": assignment["semester"],
        "section": assignment["section"]
    }).to_list(200)
    
    summary = []
    for s in students:
        u = await db.users.find_one({"_id": s["userId"]}, {"password": 0})
        records = await db.attendance.find({
            "assignmentId": ObjectId(assignmentId),
            "studentId": s["_id"]
        }).to_list(1000)
        
        total = len(records)
        present = sum(1 for r in records if r["status"] in ["present", "od"])
        percentage = round((present / total) * 100) if total > 0 else 0
        
        summary.append({
            "student": {"_id": str(s["_id"]), "rollNumber": s["rollNumber"], "name": u["name"] if u else "Unknown"},
            "total": total,
            "present": present,
            "absent": total - present,
            "percentage": percentage
        })
    
    return api_response({"assignment": serialize(assignment), "summary": summary}, "Summary fetched")

# Mark Components
@app.post("/api/faculty/marks/components")
async def create_mark_component(req: MarkComponentCreate, user = Depends(require_role(UserRole.FACULTY))):
    assignment = await db.teaching_assignments.find_one({
        "_id": validate_object_id(req.assignmentId),
        "facultyId": ObjectId(user["_id"])
    })
    if not assignment:
        raise HTTPException(404, "Assignment not found")
    
    doc = {
        "assignmentId": ObjectId(req.assignmentId),
        "name": req.name,
        "maxMarks": req.maxMarks,
        "type": req.type.value,
        "createdAt": datetime.now(timezone.utc)
    }
    result = await db.mark_components.insert_one(doc)
    doc["_id"] = result.inserted_id
    return api_response(serialize(doc), "Component created", 201)

@app.get("/api/faculty/marks/components/{assignmentId}")
async def get_mark_components(assignmentId: str, user = Depends(require_role(UserRole.FACULTY))):
    assignment = await db.teaching_assignments.find_one({
        "_id": validate_object_id(assignmentId),
        "facultyId": ObjectId(user["_id"])
    })
    if not assignment:
        raise HTTPException(404, "Assignment not found")
    
    components = await db.mark_components.find({"assignmentId": ObjectId(assignmentId)}).to_list(100)
    return api_response(serialize(components), "Components fetched")

@app.delete("/api/faculty/marks/components/{componentId}")
async def delete_mark_component(componentId: str, user = Depends(require_role(UserRole.FACULTY))):
    component = await db.mark_components.find_one({"_id": validate_object_id(componentId)})
    if not component:
        raise HTTPException(404, "Component not found")
    
    assignment = await db.teaching_assignments.find_one({
        "_id": component["assignmentId"],
        "facultyId": ObjectId(user["_id"])
    })
    if not assignment:
        raise HTTPException(403, "Not authorized")
    
    await db.marks.delete_many({"componentId": ObjectId(componentId)})
    await db.mark_components.delete_one({"_id": ObjectId(componentId)})
    return api_response(None, "Component deleted")

# Marks
@app.post("/api/faculty/marks")
async def enter_marks(req: MarksCreate, user = Depends(require_role(UserRole.FACULTY))):
    for entry in req.entries:
        component = await db.mark_components.find_one({"_id": validate_object_id(entry.componentId)})
        if not component:
            raise HTTPException(404, f"Component {entry.componentId} not found")
        
        assignment = await db.teaching_assignments.find_one({
            "_id": component["assignmentId"],
            "facultyId": ObjectId(user["_id"])
        })
        if not assignment:
            raise HTTPException(403, "Not authorized")
        
        if entry.marksObtained > component["maxMarks"]:
            raise HTTPException(400, f"Marks cannot exceed {component['maxMarks']}")
        
        await db.marks.update_one(
            {"componentId": ObjectId(entry.componentId), "studentId": ObjectId(entry.studentId)},
            {"$set": {
                "marksObtained": entry.marksObtained,
                "remarks": entry.remarks or "",
                "recordedBy": ObjectId(user["_id"]),
                "updatedAt": datetime.now(timezone.utc)
            }},
            upsert=True
        )
    
    return api_response({"count": len(req.entries)}, "Marks saved", 201)

@app.get("/api/faculty/marks/{assignmentId}")
async def get_marks(assignmentId: str, user = Depends(require_role(UserRole.FACULTY))):
    assignment = await db.teaching_assignments.find_one({
        "_id": validate_object_id(assignmentId),
        "facultyId": ObjectId(user["_id"])
    })
    if not assignment:
        raise HTTPException(404, "Assignment not found")
    
    components = await db.mark_components.find({"assignmentId": ObjectId(assignmentId)}).to_list(100)
    component_ids = [c["_id"] for c in components]
    
    marks = await db.marks.find({"componentId": {"$in": component_ids}}).to_list(5000)
    for m in marks:
        if m.get("studentId"):
            s = await db.students.find_one({"_id": m["studentId"]})
            if s:
                u = await db.users.find_one({"_id": s["userId"]}, {"password": 0})
                m["student"] = {"_id": str(s["_id"]), "rollNumber": s["rollNumber"], "name": u["name"] if u else ""}
    
    return api_response({"components": serialize(components), "marks": serialize(marks)}, "Marks fetched")

# Materials
@app.post("/api/faculty/materials")
async def upload_material(
    title: str = Form(...),
    subjectId: str = Form(...),
    file: UploadFile = File(...),
    user = Depends(require_role(UserRole.FACULTY))
):
    assignment = await db.teaching_assignments.find_one({
        "facultyId": ObjectId(user["_id"]),
        "subjectId": validate_object_id(subjectId)
    })
    if not assignment:
        raise HTTPException(403, "You can only upload materials for subjects you teach")
    
    filename = f"{datetime.now().timestamp()}_{file.filename}"
    filepath = f"uploads/{filename}"
    content = await file.read()
    with open(filepath, "wb") as f:
        f.write(content)
    
    doc = {
        "title": title,
        "filename": file.filename,
        "filepath": f"/{filepath}",
        "subjectId": ObjectId(subjectId),
        "uploadedBy": ObjectId(user["_id"]),
        "createdAt": datetime.now(timezone.utc)
    }
    result = await db.materials.insert_one(doc)
    doc["_id"] = result.inserted_id
    return api_response(serialize(doc), "Material uploaded", 201)

@app.get("/api/faculty/materials/{subjectId}")
async def get_materials(subjectId: str, user = Depends(require_role(UserRole.FACULTY))):
    materials = await db.materials.find({"subjectId": validate_object_id(subjectId)}).sort("createdAt", -1).to_list(200)
    for m in materials:
        if m.get("uploadedBy"):
            u = await db.users.find_one({"_id": m["uploadedBy"]}, {"password": 0})
            m["uploader"] = {"name": u["name"]} if u else None
    return api_response(serialize(materials), "Materials fetched")

@app.delete("/api/faculty/materials/{materialId}")
async def delete_material(materialId: str, user = Depends(require_role(UserRole.FACULTY))):
    material = await db.materials.find_one({"_id": validate_object_id(materialId)})
    if not material:
        raise HTTPException(404, "Material not found")
    if str(material["uploadedBy"]) != user["_id"]:
        raise HTTPException(403, "Not authorized")
    await db.materials.delete_one({"_id": ObjectId(materialId)})
    return api_response(None, "Material deleted")

# ============ STUDENT ROUTES ============
@app.get("/api/student/profile")
async def student_profile(user = Depends(require_role(UserRole.STUDENT))):
    student = await db.students.find_one({"userId": ObjectId(user["_id"])})
    if not student:
        raise HTTPException(404, "Student profile not found")
    
    if student.get("departmentId"):
        d = await db.departments.find_one({"_id": student["departmentId"]})
        student["department"] = serialize(d) if d else None
    if student.get("courseId"):
        c = await db.courses.find_one({"_id": student["courseId"]})
        student["course"] = serialize(c) if c else None
    
    student["user"] = user
    return api_response(serialize(student), "Profile fetched")

@app.get("/api/student/attendance")
async def student_attendance(user = Depends(require_role(UserRole.STUDENT))):
    student = await db.students.find_one({"userId": ObjectId(user["_id"])})
    if not student:
        raise HTTPException(404, "Student profile not found")
    
    assignments = await db.teaching_assignments.find({
        "courseId": student["courseId"],
        "semester": student["semester"],
        "section": student["section"]
    }).to_list(100)
    
    result = []
    for a in assignments:
        subject = await db.subjects.find_one({"_id": a["subjectId"]})
        records = await db.attendance.find({
            "assignmentId": a["_id"],
            "studentId": student["_id"]
        }).sort("date", -1).to_list(1000)
        
        total = len(records)
        present = sum(1 for r in records if r["status"] in ["present", "od"])
        percentage = round((present / total) * 100) if total > 0 else 0
        
        result.append({
            "subject": serialize(subject),
            "total": total,
            "present": present,
            "absent": total - present,
            "percentage": percentage,
            "records": serialize(records[:10])
        })
    
    return api_response(result, "Attendance fetched")

@app.get("/api/student/marks")
async def student_marks(user = Depends(require_role(UserRole.STUDENT))):
    student = await db.students.find_one({"userId": ObjectId(user["_id"])})
    if not student:
        raise HTTPException(404, "Student profile not found")
    
    assignments = await db.teaching_assignments.find({
        "courseId": student["courseId"],
        "semester": student["semester"],
        "section": student["section"]
    }).to_list(100)
    
    result = []
    for a in assignments:
        subject = await db.subjects.find_one({"_id": a["subjectId"]})
        components = await db.mark_components.find({"assignmentId": a["_id"]}).to_list(100)
        
        component_data = []
        total_max = 0
        total_obtained = 0
        
        for c in components:
            mark = await db.marks.find_one({"componentId": c["_id"], "studentId": student["_id"]})
            total_max += c["maxMarks"]
            if mark:
                total_obtained += mark["marksObtained"]
            
            component_data.append({
                "_id": str(c["_id"]),
                "name": c["name"],
                "maxMarks": c["maxMarks"],
                "type": c["type"],
                "marksObtained": mark["marksObtained"] if mark else None,
                "remarks": mark.get("remarks", "") if mark else ""
            })
        
        percentage = round((total_obtained / total_max) * 100) if total_max > 0 else 0
        
        result.append({
            "subject": serialize(subject),
            "components": component_data,
            "totalMax": total_max,
            "totalObtained": total_obtained,
            "percentage": percentage
        })
    
    return api_response(result, "Marks fetched")

@app.get("/api/student/materials")
async def student_materials(user = Depends(require_role(UserRole.STUDENT))):
    student = await db.students.find_one({"userId": ObjectId(user["_id"])})
    if not student:
        raise HTTPException(404, "Student profile not found")
    
    assignments = await db.teaching_assignments.find({
        "courseId": student["courseId"],
        "semester": student["semester"],
        "section": student["section"]
    }).to_list(100)
    
    subject_ids = [a["subjectId"] for a in assignments]
    materials = await db.materials.find({"subjectId": {"$in": subject_ids}}).sort("createdAt", -1).to_list(500)
    
    for m in materials:
        if m.get("subjectId"):
            s = await db.subjects.find_one({"_id": m["subjectId"]})
            m["subject"] = serialize(s) if s else None
        if m.get("uploadedBy"):
            u = await db.users.find_one({"_id": m["uploadedBy"]}, {"password": 0})
            m["uploader"] = {"name": u["name"]} if u else None
    
    return api_response(serialize(materials), "Materials fetched")

# ============ SEED ENDPOINT ============
@app.post("/api/seed")
async def seed_database():
    # Clear all collections
    collections = ["users", "departments", "courses", "subjects", "students", "faculty", 
                   "teaching_assignments", "attendance", "mark_components", "marks", "materials"]
    for coll in collections:
        await db[coll].delete_many({})
    
    # Departments
    cse = await db.departments.insert_one({"name": "Computer Science & Engineering", "code": "CSE", "createdAt": datetime.now(timezone.utc)})
    ece = await db.departments.insert_one({"name": "Electronics & Communication", "code": "ECE", "createdAt": datetime.now(timezone.utc)})
    
    # Courses
    btcs = await db.courses.insert_one({"name": "B.Tech Computer Science", "code": "BTCS", "departmentId": cse.inserted_id, "totalSemesters": 8, "createdAt": datetime.now(timezone.utc)})
    btec = await db.courses.insert_one({"name": "B.Tech Electronics", "code": "BTEC", "departmentId": ece.inserted_id, "totalSemesters": 8, "createdAt": datetime.now(timezone.utc)})
    
    # Subjects
    subjects = await db.subjects.insert_many([
        {"name": "Data Structures", "code": "CS201", "courseId": btcs.inserted_id, "semester": 3, "credits": 4, "createdAt": datetime.now(timezone.utc)},
        {"name": "Algorithms", "code": "CS301", "courseId": btcs.inserted_id, "semester": 4, "credits": 4, "createdAt": datetime.now(timezone.utc)},
        {"name": "Operating Systems", "code": "CS401", "courseId": btcs.inserted_id, "semester": 5, "credits": 4, "createdAt": datetime.now(timezone.utc)},
        {"name": "Computer Networks", "code": "CS402", "courseId": btcs.inserted_id, "semester": 5, "credits": 3, "createdAt": datetime.now(timezone.utc)},
        {"name": "Digital Electronics", "code": "EC201", "courseId": btec.inserted_id, "semester": 3, "credits": 4, "createdAt": datetime.now(timezone.utc)},
    ])
    
    # Admin
    await db.users.insert_one({
        "name": "Admin User", "email": "admin@portal.com", "password": hash_password("Admin@123"),
        "role": "admin", "isActive": True, "createdAt": datetime.now(timezone.utc), "updatedAt": datetime.now(timezone.utc)
    })
    
    # Faculty
    fac1 = await db.users.insert_one({
        "name": "Dr. Rajesh Kumar", "email": "rajesh.kumar@portal.com", "password": hash_password("Faculty@123"),
        "role": "faculty", "phone": "9876543210", "isActive": True, "createdAt": datetime.now(timezone.utc), "updatedAt": datetime.now(timezone.utc)
    })
    await db.faculty.insert_one({
        "userId": fac1.inserted_id, "departmentId": cse.inserted_id, "employeeId": "FAC001",
        "designation": "Associate Professor", "specialization": "Data Science", "joiningDate": datetime.now(timezone.utc), "createdAt": datetime.now(timezone.utc)
    })
    
    fac2 = await db.users.insert_one({
        "name": "Dr. Priya Sharma", "email": "priya.sharma@portal.com", "password": hash_password("Faculty@123"),
        "role": "faculty", "phone": "9876543211", "isActive": True, "createdAt": datetime.now(timezone.utc), "updatedAt": datetime.now(timezone.utc)
    })
    await db.faculty.insert_one({
        "userId": fac2.inserted_id, "departmentId": cse.inserted_id, "employeeId": "FAC002",
        "designation": "Assistant Professor", "specialization": "Machine Learning", "joiningDate": datetime.now(timezone.utc), "createdAt": datetime.now(timezone.utc)
    })
    
    # Students
    for i, (name, email) in enumerate([("Amit Singh", "amit.singh@portal.com"), ("Sneha Patel", "sneha.patel@portal.com"), ("Rahul Verma", "rahul.verma@portal.com")]):
        stu = await db.users.insert_one({
            "name": name, "email": email, "password": hash_password("Student@123"),
            "role": "student", "phone": f"987654322{i}", "isActive": True, "createdAt": datetime.now(timezone.utc), "updatedAt": datetime.now(timezone.utc)
        })
        await db.students.insert_one({
            "userId": stu.inserted_id, "departmentId": cse.inserted_id, "courseId": btcs.inserted_id,
            "rollNumber": f"CSE202400{i+1}", "semester": 5, "section": "A", "academicYear": "2024-25",
            "admissionDate": datetime.now(timezone.utc), "createdAt": datetime.now(timezone.utc)
        })
    
    # Teaching Assignments
    await db.teaching_assignments.insert_many([
        {"facultyId": fac1.inserted_id, "subjectId": subjects.inserted_ids[2], "departmentId": cse.inserted_id, "courseId": btcs.inserted_id, "semester": 5, "section": "A", "academicYear": "2024-25", "createdAt": datetime.now(timezone.utc)},
        {"facultyId": fac1.inserted_id, "subjectId": subjects.inserted_ids[3], "departmentId": cse.inserted_id, "courseId": btcs.inserted_id, "semester": 5, "section": "A", "academicYear": "2024-25", "createdAt": datetime.now(timezone.utc)},
        {"facultyId": fac2.inserted_id, "subjectId": subjects.inserted_ids[0], "departmentId": cse.inserted_id, "courseId": btcs.inserted_id, "semester": 3, "section": "A", "academicYear": "2024-25", "createdAt": datetime.now(timezone.utc)},
    ])
    
    return api_response({
        "message": "Database seeded!",
        "credentials": {
            "admin": {"email": "admin@portal.com", "password": "Admin@123"},
            "faculty": [
                {"email": "rajesh.kumar@portal.com", "password": "Faculty@123"},
                {"email": "priya.sharma@portal.com", "password": "Faculty@123"}
            ],
            "students": [
                {"email": "amit.singh@portal.com", "password": "Student@123"},
                {"email": "sneha.patel@portal.com", "password": "Student@123"},
                {"email": "rahul.verma@portal.com", "password": "Student@123"}
            ]
        }
    }, "Seed completed", 201)

@app.get("/api/health")
async def health():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
