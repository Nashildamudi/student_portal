"""
Student Portal - FastAPI Backend
Ported from Node.js/Express TypeScript codebase
"""
import os
from datetime import datetime, timezone, timedelta
from typing import Optional, List
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Depends, status, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr, Field
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import bcrypt
import jwt

# Environment
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "student_portal")
JWT_SECRET = os.environ.get("JWT_SECRET", "emergent_secret_key_student_portal_2026")

# MongoDB client
client: AsyncIOMotorClient = None
db = None

security = HTTPBearer()

# Lifespan management
@asynccontextmanager
async def lifespan(app: FastAPI):
    global client, db
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    print(f"Connected to MongoDB: {DB_NAME}")
    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.students.create_index("user_id", unique=True)
    await db.students.create_index("roll_number", unique=True)
    await db.faculty.create_index("user_id", unique=True)
    await db.faculty.create_index("employee_id", unique=True)
    await db.departments.create_index("code", unique=True)
    await db.courses.create_index("code", unique=True)
    yield
    client.close()

app = FastAPI(title="Student Portal API", lifespan=lifespan)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create uploads directory
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# ---------- HELPERS ----------
def serialize_doc(doc):
    """Convert MongoDB document to JSON-serializable dict"""
    if doc is None:
        return None
    if isinstance(doc, list):
        return [serialize_doc(d) for d in doc]
    if isinstance(doc, dict):
        result = {}
        for key, value in doc.items():
            if key == "_id":
                result["id"] = str(value)
            elif isinstance(value, ObjectId):
                result[key] = str(value)
            elif isinstance(value, datetime):
                result[key] = value.isoformat()
            elif isinstance(value, dict):
                result[key] = serialize_doc(value)
            elif isinstance(value, list):
                result[key] = [serialize_doc(v) if isinstance(v, dict) else str(v) if isinstance(v, ObjectId) else v for v in value]
            else:
                result[key] = value
        return result
    return doc

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_token(user_id: str, role: str) -> str:
    payload = {
        "id": user_id,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(days=30)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        user = await db.users.find_one({"_id": ObjectId(payload["id"])}, {"password": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return serialize_doc(user)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def require_role(*allowed_roles):
    async def role_checker(user = Depends(get_current_user)):
        if user["role"] not in allowed_roles:
            raise HTTPException(status_code=403, detail=f"Role {user['role']} not allowed")
        return user
    return role_checker

# ---------- PYDANTIC MODELS ----------
class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = "student"
    department_id: Optional[str] = None
    course_id: Optional[str] = None
    semester: Optional[int] = None
    section: Optional[str] = None
    academic_year: Optional[str] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class DepartmentCreate(BaseModel):
    name: str
    code: str

class CourseCreate(BaseModel):
    name: str
    code: str
    department_id: str

class SubjectCreate(BaseModel):
    name: str
    code: str
    course_id: str
    semester: int

class StudentCreate(BaseModel):
    name: str
    email: EmailStr
    password: Optional[str] = "Student@123"
    phone: Optional[str] = None
    department_id: str
    course_id: str
    semester: int
    section: str
    roll_number: str
    academic_year: str

class FacultyCreate(BaseModel):
    name: str
    email: EmailStr
    password: Optional[str] = "Faculty@123"
    phone: Optional[str] = None
    department_id: str
    designation: str
    employee_id: str
    specialization: Optional[str] = None

class TeachingAssignmentCreate(BaseModel):
    faculty_id: str
    subject_id: str
    department_id: str
    course_id: str
    section: str
    semester: int
    academic_year: str

class AttendanceRecord(BaseModel):
    student_id: str
    status: str  # present, absent, od, medical_leave

class AttendanceCreate(BaseModel):
    assignment_id: str
    date: str
    session: str
    records: List[AttendanceRecord]

class MarkComponentCreate(BaseModel):
    assignment_id: str
    name: str
    max_marks: int
    type: Optional[str] = "Internal"

class MarkEntry(BaseModel):
    student_id: str
    component_id: str
    marks_obtained: float
    assignment_id: str

# ---------- API RESPONSE ----------
def api_response(data=None, message="Success", status_code=200):
    return {
        "statusCode": status_code,
        "success": status_code < 400,
        "data": data,
        "message": message
    }

# ---------- AUTH ROUTES ----------
@app.post("/api/auth/register")
async def register(req: RegisterRequest):
    if req.role not in ["student", "faculty"]:
        raise HTTPException(400, "Can only register as student or faculty")
    
    existing = await db.users.find_one({"email": req.email.lower()})
    if existing:
        raise HTTPException(409, "User with this email already exists")
    
    user_doc = {
        "name": req.name,
        "email": req.email.lower(),
        "password": hash_password(req.password),
        "role": req.role,
        "department_id": ObjectId(req.department_id) if req.department_id else None,
        "course_id": ObjectId(req.course_id) if req.course_id else None,
        "semester": req.semester,
        "section": req.section,
        "academic_year": req.academic_year,
        "is_active": True,
        "createdAt": datetime.now(timezone.utc),
        "updatedAt": datetime.now(timezone.utc)
    }
    
    result = await db.users.insert_one(user_doc)
    user_doc["_id"] = result.inserted_id
    del user_doc["password"]
    
    token = create_token(str(result.inserted_id), req.role)
    return api_response({"user": serialize_doc(user_doc), "token": token}, "User registered successfully", 201)

@app.post("/api/auth/login")
async def login(req: LoginRequest):
    user = await db.users.find_one({"email": req.email.lower()})
    if not user:
        raise HTTPException(401, "Invalid email or password")
    
    if not verify_password(req.password, user["password"]):
        raise HTTPException(401, "Invalid email or password")
    
    token = create_token(str(user["_id"]), user["role"])
    user_copy = {k: v for k, v in user.items() if k != "password"}
    return api_response({"user": serialize_doc(user_copy), "token": token}, "Login successful")

# ---------- COMMON ROUTES ----------
@app.get("/api/common/public/dropdowns")
async def public_dropdowns():
    departments = await db.departments.find().to_list(100)
    courses = await db.courses.find().to_list(100)
    # Populate department info for courses
    for course in courses:
        if course.get("department_id"):
            dept = await db.departments.find_one({"_id": course["department_id"]})
            course["department"] = serialize_doc(dept) if dept else None
    return api_response({"departments": serialize_doc(departments), "courses": serialize_doc(courses)})

@app.get("/api/common/profile")
async def get_profile(user = Depends(get_current_user)):
    return api_response(user)

@app.get("/api/common/dropdowns")
async def get_dropdowns(user = Depends(get_current_user)):
    departments = await db.departments.find().to_list(100)
    courses = await db.courses.find().to_list(100)
    subjects = await db.subjects.find().to_list(500)
    return api_response({
        "departments": serialize_doc(departments),
        "courses": serialize_doc(courses),
        "subjects": serialize_doc(subjects)
    })

# ---------- ADMIN ROUTES ----------
@app.get("/api/admin/stats")
async def get_dashboard_stats(user = Depends(require_role("admin"))):
    stats = {
        "students": await db.students.count_documents({}),
        "faculty": await db.faculty.count_documents({}),
        "departments": await db.departments.count_documents({}),
        "courses": await db.courses.count_documents({}),
        "subjects": await db.subjects.count_documents({}),
        "assignments": await db.teaching_assignments.count_documents({})
    }
    return api_response(stats, "Stats fetched successfully")

@app.get("/api/admin/students")
async def get_students(user = Depends(require_role("admin"))):
    students = await db.students.find().to_list(1000)
    for student in students:
        if student.get("user_id"):
            u = await db.users.find_one({"_id": student["user_id"]}, {"password": 0})
            student["user"] = serialize_doc(u)
        if student.get("department_id"):
            d = await db.departments.find_one({"_id": student["department_id"]})
            student["department"] = serialize_doc(d)
        if student.get("course_id"):
            c = await db.courses.find_one({"_id": student["course_id"]})
            student["course"] = serialize_doc(c)
    return api_response(serialize_doc(students), "Students fetched successfully")

@app.post("/api/admin/students")
async def create_student(req: StudentCreate, user = Depends(require_role("admin"))):
    # Check email doesn't exist
    existing = await db.users.find_one({"email": req.email.lower()})
    if existing:
        raise HTTPException(409, "User with this email already exists")
    
    # Create user
    user_doc = {
        "name": req.name,
        "email": req.email.lower(),
        "password": hash_password(req.password),
        "phone": req.phone,
        "role": "student",
        "is_active": True,
        "createdAt": datetime.now(timezone.utc),
        "updatedAt": datetime.now(timezone.utc)
    }
    user_result = await db.users.insert_one(user_doc)
    
    # Create student
    student_doc = {
        "user_id": user_result.inserted_id,
        "department_id": ObjectId(req.department_id),
        "course_id": ObjectId(req.course_id),
        "semester": req.semester,
        "section": req.section,
        "roll_number": req.roll_number,
        "academic_year": req.academic_year,
        "createdAt": datetime.now(timezone.utc),
        "updatedAt": datetime.now(timezone.utc)
    }
    student_result = await db.students.insert_one(student_doc)
    student_doc["_id"] = student_result.inserted_id
    
    return api_response(serialize_doc(student_doc), "Student registered successfully", 201)

@app.get("/api/admin/faculty-list")
async def get_faculty_list(user = Depends(require_role("admin"))):
    faculty = await db.faculty.find().to_list(500)
    for f in faculty:
        if f.get("user_id"):
            u = await db.users.find_one({"_id": f["user_id"]}, {"password": 0})
            f["user"] = serialize_doc(u)
        if f.get("department_id"):
            d = await db.departments.find_one({"_id": f["department_id"]})
            f["department"] = serialize_doc(d)
    return api_response(serialize_doc(faculty), "Faculty fetched successfully")

@app.post("/api/admin/faculty")
async def create_faculty(req: FacultyCreate, user = Depends(require_role("admin"))):
    existing = await db.users.find_one({"email": req.email.lower()})
    if existing:
        raise HTTPException(409, "User with this email already exists")
    
    # Create user
    user_doc = {
        "name": req.name,
        "email": req.email.lower(),
        "password": hash_password(req.password),
        "phone": req.phone,
        "role": "faculty",
        "is_active": True,
        "createdAt": datetime.now(timezone.utc),
        "updatedAt": datetime.now(timezone.utc)
    }
    user_result = await db.users.insert_one(user_doc)
    
    # Create faculty
    faculty_doc = {
        "user_id": user_result.inserted_id,
        "department_id": ObjectId(req.department_id),
        "designation": req.designation,
        "employee_id": req.employee_id,
        "specialization": req.specialization,
        "createdAt": datetime.now(timezone.utc),
        "updatedAt": datetime.now(timezone.utc)
    }
    faculty_result = await db.faculty.insert_one(faculty_doc)
    faculty_doc["_id"] = faculty_result.inserted_id
    
    return api_response(serialize_doc(faculty_doc), "Faculty registered successfully", 201)

@app.get("/api/admin/users")
async def get_users(user = Depends(require_role("admin"))):
    users = await db.users.find({}, {"password": 0}).to_list(1000)
    return api_response(serialize_doc(users), "Users fetched successfully")

@app.get("/api/admin/users/{user_id}")
async def get_user_by_id(user_id: str, user = Depends(require_role("admin"))):
    u = await db.users.find_one({"_id": ObjectId(user_id)}, {"password": 0})
    if not u:
        raise HTTPException(404, "User not found")
    return api_response(serialize_doc(u), "User fetched successfully")

@app.patch("/api/admin/users/{user_id}")
async def update_user(user_id: str, updates: dict, user = Depends(require_role("admin"))):
    updates["updatedAt"] = datetime.now(timezone.utc)
    await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": updates})
    u = await db.users.find_one({"_id": ObjectId(user_id)}, {"password": 0})
    return api_response(serialize_doc(u), "User updated successfully")

@app.delete("/api/admin/users/{user_id}")
async def delete_user(user_id: str, user = Depends(require_role("admin"))):
    await db.users.delete_one({"_id": ObjectId(user_id)})
    return api_response(None, "User deleted successfully")

# Departments
@app.get("/api/admin/departments")
async def get_departments(user = Depends(require_role("admin"))):
    departments = await db.departments.find().to_list(100)
    return api_response(serialize_doc(departments), "Departments fetched successfully")

@app.post("/api/admin/departments")
async def create_department(req: DepartmentCreate, user = Depends(require_role("admin"))):
    doc = {
        "name": req.name,
        "code": req.code,
        "createdAt": datetime.now(timezone.utc),
        "updatedAt": datetime.now(timezone.utc)
    }
    result = await db.departments.insert_one(doc)
    doc["_id"] = result.inserted_id
    return api_response(serialize_doc(doc), "Department created successfully", 201)

@app.delete("/api/admin/departments/{dept_id}")
async def delete_department(dept_id: str, user = Depends(require_role("admin"))):
    await db.departments.delete_one({"_id": ObjectId(dept_id)})
    return api_response(None, "Department deleted successfully")

# Courses
@app.get("/api/admin/courses")
async def get_courses(departmentId: Optional[str] = None, user = Depends(require_role("admin"))):
    query = {"department_id": ObjectId(departmentId)} if departmentId else {}
    courses = await db.courses.find(query).to_list(200)
    for course in courses:
        if course.get("department_id"):
            dept = await db.departments.find_one({"_id": course["department_id"]})
            course["department"] = serialize_doc(dept)
    return api_response(serialize_doc(courses), "Courses fetched successfully")

@app.post("/api/admin/courses")
async def create_course(req: CourseCreate, user = Depends(require_role("admin"))):
    doc = {
        "name": req.name,
        "code": req.code,
        "department_id": ObjectId(req.department_id),
        "createdAt": datetime.now(timezone.utc),
        "updatedAt": datetime.now(timezone.utc)
    }
    result = await db.courses.insert_one(doc)
    doc["_id"] = result.inserted_id
    return api_response(serialize_doc(doc), "Course created successfully", 201)

# Subjects
@app.get("/api/admin/subjects")
async def get_subjects(courseId: Optional[str] = None, user = Depends(require_role("admin"))):
    query = {"course_id": ObjectId(courseId)} if courseId else {}
    subjects = await db.subjects.find(query).to_list(500)
    for subj in subjects:
        if subj.get("course_id"):
            course = await db.courses.find_one({"_id": subj["course_id"]})
            subj["course"] = serialize_doc(course)
    return api_response(serialize_doc(subjects), "Subjects fetched successfully")

@app.post("/api/admin/subjects")
async def create_subject(req: SubjectCreate, user = Depends(require_role("admin"))):
    doc = {
        "name": req.name,
        "code": req.code,
        "course_id": ObjectId(req.course_id),
        "semester": req.semester,
        "createdAt": datetime.now(timezone.utc),
        "updatedAt": datetime.now(timezone.utc)
    }
    result = await db.subjects.insert_one(doc)
    doc["_id"] = result.inserted_id
    return api_response(serialize_doc(doc), "Subject created successfully", 201)

# Teaching Assignments
@app.get("/api/admin/assignments")
async def get_teaching_assignments(user = Depends(require_role("admin"))):
    assignments = await db.teaching_assignments.find().to_list(500)
    for a in assignments:
        if a.get("faculty_id"):
            f = await db.users.find_one({"_id": a["faculty_id"]}, {"password": 0})
            a["faculty"] = serialize_doc(f)
        if a.get("subject_id"):
            s = await db.subjects.find_one({"_id": a["subject_id"]})
            a["subject"] = serialize_doc(s)
        if a.get("department_id"):
            d = await db.departments.find_one({"_id": a["department_id"]})
            a["department"] = serialize_doc(d)
        if a.get("course_id"):
            c = await db.courses.find_one({"_id": a["course_id"]})
            a["course"] = serialize_doc(c)
    return api_response(serialize_doc(assignments), "Teaching assignments fetched successfully")

@app.post("/api/admin/assignments")
async def create_teaching_assignment(req: TeachingAssignmentCreate, user = Depends(require_role("admin"))):
    doc = {
        "faculty_id": ObjectId(req.faculty_id),
        "subject_id": ObjectId(req.subject_id),
        "department_id": ObjectId(req.department_id),
        "course_id": ObjectId(req.course_id),
        "section": req.section,
        "semester": req.semester,
        "academic_year": req.academic_year,
        "createdAt": datetime.now(timezone.utc),
        "updatedAt": datetime.now(timezone.utc)
    }
    result = await db.teaching_assignments.insert_one(doc)
    doc["_id"] = result.inserted_id
    return api_response(serialize_doc(doc), "Teaching assignment created successfully", 201)

@app.delete("/api/admin/assignments/{assignment_id}")
async def delete_teaching_assignment(assignment_id: str, user = Depends(require_role("admin"))):
    await db.teaching_assignments.delete_one({"_id": ObjectId(assignment_id)})
    return api_response(None, "Teaching assignment deleted successfully")

# ---------- FACULTY ROUTES ----------
@app.get("/api/faculty/assignments")
async def faculty_get_assignments(user = Depends(require_role("faculty"))):
    assignments = await db.teaching_assignments.find({"faculty_id": ObjectId(user["id"])}).to_list(100)
    for a in assignments:
        if a.get("subject_id"):
            s = await db.subjects.find_one({"_id": a["subject_id"]})
            a["subject"] = serialize_doc(s)
        if a.get("department_id"):
            d = await db.departments.find_one({"_id": a["department_id"]})
            a["department"] = serialize_doc(d)
        if a.get("course_id"):
            c = await db.courses.find_one({"_id": a["course_id"]})
            a["course"] = serialize_doc(c)
    return api_response(serialize_doc(assignments), "Assignments fetched successfully")

@app.get("/api/faculty/students/{assignment_id}")
async def faculty_get_students(assignment_id: str, user = Depends(require_role("faculty"))):
    assignment = await db.teaching_assignments.find_one({"_id": ObjectId(assignment_id)})
    if not assignment:
        return api_response([], "No students found")
    
    students = await db.students.find({
        "course_id": assignment["course_id"],
        "semester": assignment["semester"],
        "section": assignment["section"]
    }).to_list(200)
    
    result = []
    for s in students:
        u = await db.users.find_one({"_id": s["user_id"]}, {"password": 0})
        result.append({
            "id": str(s["_id"]),
            "user_id": str(s["user_id"]),
            "name": u["name"] if u else "Unknown",
            "email": u.get("email", "") if u else "",
            "roll_number": s.get("roll_number", ""),
            "semester": s.get("semester"),
            "section": s.get("section")
        })
    return api_response(result, "Students fetched successfully")

@app.post("/api/faculty/attendance")
async def faculty_mark_attendance(req: AttendanceCreate, user = Depends(require_role("faculty"))):
    docs = []
    for record in req.records:
        docs.append({
            "assignment_id": ObjectId(req.assignment_id),
            "student_id": ObjectId(record.student_id),
            "date": datetime.fromisoformat(req.date.replace("Z", "+00:00")) if "T" in req.date else datetime.strptime(req.date, "%Y-%m-%d"),
            "session": req.session,
            "status": record.status,
            "recorded_by": ObjectId(user["id"]),
            "createdAt": datetime.now(timezone.utc),
            "updatedAt": datetime.now(timezone.utc)
        })
    
    if docs:
        await db.attendance.insert_many(docs)
    return api_response(len(docs), "Attendance marked successfully", 201)

@app.get("/api/faculty/attendance/{assignment_id}")
async def faculty_get_attendance(assignment_id: str, user = Depends(require_role("faculty"))):
    records = await db.attendance.find({"assignment_id": ObjectId(assignment_id)}).to_list(5000)
    for r in records:
        if r.get("student_id"):
            s = await db.students.find_one({"_id": r["student_id"]})
            if s:
                u = await db.users.find_one({"_id": s["user_id"]}, {"password": 0})
                r["student"] = {"name": u.get("name") if u else "", "email": u.get("email") if u else "", "roll_number": s.get("roll_number")}
    return api_response(serialize_doc(records), "Attendance fetched successfully")

@app.get("/api/faculty/attendance/{assignment_id}/date")
async def faculty_get_attendance_for_date(assignment_id: str, date: str, session: str, user = Depends(require_role("faculty"))):
    start = datetime.strptime(date, "%Y-%m-%d")
    end = start + timedelta(days=1)
    records = await db.attendance.find({
        "assignment_id": ObjectId(assignment_id),
        "session": session,
        "date": {"$gte": start, "$lt": end}
    }).to_list(500)
    return api_response(serialize_doc(records), "Attendance for date fetched")

# Mark Components
@app.post("/api/faculty/marks/components")
async def faculty_create_mark_component(req: MarkComponentCreate, user = Depends(require_role("faculty"))):
    doc = {
        "assignment_id": ObjectId(req.assignment_id),
        "name": req.name,
        "max_marks": req.max_marks,
        "type": req.type,
        "createdAt": datetime.now(timezone.utc),
        "updatedAt": datetime.now(timezone.utc)
    }
    result = await db.mark_components.insert_one(doc)
    doc["_id"] = result.inserted_id
    return api_response(serialize_doc(doc), "Mark component created successfully", 201)

@app.get("/api/faculty/marks/components/{assignment_id}")
async def faculty_get_mark_components(assignment_id: str, user = Depends(require_role("faculty"))):
    components = await db.mark_components.find({"assignment_id": ObjectId(assignment_id)}).to_list(100)
    return api_response(serialize_doc(components), "Mark components fetched successfully")

@app.delete("/api/faculty/marks/components/{component_id}")
async def faculty_delete_mark_component(component_id: str, user = Depends(require_role("faculty"))):
    await db.mark_components.delete_one({"_id": ObjectId(component_id)})
    return api_response(None, "Mark component deleted successfully")

# Marks
@app.post("/api/faculty/marks")
async def faculty_enter_marks(entries: List[MarkEntry], user = Depends(require_role("faculty"))):
    for entry in entries:
        await db.marks.update_one(
            {"student_id": ObjectId(entry.student_id), "component_id": ObjectId(entry.component_id)},
            {"$set": {
                "marks_obtained": entry.marks_obtained,
                "assignment_id": ObjectId(entry.assignment_id),
                "updatedAt": datetime.now(timezone.utc)
            }},
            upsert=True
        )
    return api_response(len(entries), "Marks entered successfully", 201)

@app.get("/api/faculty/marks/{assignment_id}")
async def faculty_get_marks(assignment_id: str, user = Depends(require_role("faculty"))):
    components = await db.mark_components.find({"assignment_id": ObjectId(assignment_id)}).to_list(100)
    component_ids = [c["_id"] for c in components]
    marks = await db.marks.find({"component_id": {"$in": component_ids}}).to_list(5000)
    
    for m in marks:
        if m.get("student_id"):
            s = await db.students.find_one({"_id": m["student_id"]})
            if s:
                u = await db.users.find_one({"_id": s["user_id"]}, {"password": 0})
                m["student"] = {"name": u.get("name") if u else "", "email": u.get("email") if u else ""}
        if m.get("component_id"):
            c = await db.mark_components.find_one({"_id": m["component_id"]})
            m["component"] = serialize_doc(c)
    return api_response(serialize_doc(marks), "Marks fetched successfully")

# Materials
@app.post("/api/faculty/materials")
async def faculty_upload_material(
    title: str = Form(...),
    subject_id: str = Form(...),
    department_id: Optional[str] = Form(None),
    file: UploadFile = File(...),
    user = Depends(require_role("faculty"))
):
    # Save file
    filename = f"{datetime.now().timestamp()}_{file.filename}"
    filepath = f"uploads/{filename}"
    content = await file.read()
    with open(filepath, "wb") as f:
        f.write(content)
    
    doc = {
        "title": title,
        "filename": file.filename,
        "filepath": f"/{filepath}",
        "subject_id": ObjectId(subject_id),
        "uploaded_by": ObjectId(user["id"]),
        "department_id": ObjectId(department_id) if department_id else None,
        "createdAt": datetime.now(timezone.utc)
    }
    result = await db.materials.insert_one(doc)
    doc["_id"] = result.inserted_id
    return api_response(serialize_doc(doc), "Material uploaded successfully", 201)

@app.get("/api/faculty/materials/{subject_id}")
async def faculty_get_materials(subject_id: str, user = Depends(require_role("faculty"))):
    materials = await db.materials.find({"subject_id": ObjectId(subject_id)}).to_list(200)
    for m in materials:
        if m.get("uploaded_by"):
            u = await db.users.find_one({"_id": m["uploaded_by"]}, {"password": 0})
            m["uploader"] = {"name": u.get("name")} if u else None
    return api_response(serialize_doc(materials), "Materials fetched successfully")

@app.get("/api/faculty/subjects")
async def faculty_get_subjects(user = Depends(require_role("faculty"))):
    subjects = await db.subjects.find().to_list(500)
    for s in subjects:
        if s.get("course_id"):
            c = await db.courses.find_one({"_id": s["course_id"]})
            s["course"] = serialize_doc(c)
    return api_response(serialize_doc(subjects), "Subjects fetched successfully")

# ---------- STUDENT ROUTES ----------
@app.get("/api/student/profile")
async def student_get_profile(user = Depends(require_role("student"))):
    student = await db.students.find_one({"user_id": ObjectId(user["id"])})
    if not student:
        return api_response(user, "Profile fetched successfully")
    
    if student.get("department_id"):
        d = await db.departments.find_one({"_id": student["department_id"]})
        student["department"] = serialize_doc(d)
    if student.get("course_id"):
        c = await db.courses.find_one({"_id": student["course_id"]})
        student["course"] = serialize_doc(c)
    student["user"] = user
    return api_response(serialize_doc(student), "Profile fetched successfully")

@app.get("/api/student/attendance")
async def student_get_attendance(user = Depends(require_role("student"))):
    student = await db.students.find_one({"user_id": ObjectId(user["id"])})
    if not student:
        return api_response({"records": [], "summary": []}, "No student record found")
    
    records = await db.attendance.find({"student_id": student["_id"]}).sort("date", -1).to_list(1000)
    
    # Build summary by subject
    subject_map = {}
    for r in records:
        if r.get("assignment_id"):
            assignment = await db.teaching_assignments.find_one({"_id": r["assignment_id"]})
            if assignment and assignment.get("subject_id"):
                subj = await db.subjects.find_one({"_id": assignment["subject_id"]})
                if subj:
                    key = str(subj["_id"])
                    if key not in subject_map:
                        subject_map[key] = {"subject": serialize_doc(subj), "total": 0, "present": 0}
                    subject_map[key]["total"] += 1
                    if r["status"] in ["present", "od"]:
                        subject_map[key]["present"] += 1
    
    summary = []
    for k, v in subject_map.items():
        v["percentage"] = round((v["present"] / v["total"]) * 100) if v["total"] > 0 else 0
        summary.append(v)
    
    return api_response({"records": serialize_doc(records), "summary": summary}, "Attendance fetched successfully")

@app.get("/api/student/marks")
async def student_get_marks(user = Depends(require_role("student"))):
    student = await db.students.find_one({"user_id": ObjectId(user["id"])})
    if not student:
        return api_response([], "No student record found")
    
    marks = await db.marks.find({"student_id": student["_id"]}).to_list(500)
    for m in marks:
        if m.get("component_id"):
            comp = await db.mark_components.find_one({"_id": m["component_id"]})
            if comp:
                m["component"] = serialize_doc(comp)
                if comp.get("assignment_id"):
                    assignment = await db.teaching_assignments.find_one({"_id": comp["assignment_id"]})
                    if assignment and assignment.get("subject_id"):
                        subj = await db.subjects.find_one({"_id": assignment["subject_id"]})
                        m["subject"] = serialize_doc(subj)
    return api_response(serialize_doc(marks), "Marks fetched successfully")

@app.get("/api/student/materials")
async def student_get_materials(user = Depends(require_role("student"))):
    student = await db.students.find_one({"user_id": ObjectId(user["id"])})
    if not student:
        return api_response([], "No student record found")
    
    # Find assignments for this student's course/semester/section
    assignments = await db.teaching_assignments.find({
        "course_id": student["course_id"],
        "semester": student["semester"],
        "section": student["section"]
    }).to_list(100)
    
    subject_ids = [a["subject_id"] for a in assignments if a.get("subject_id")]
    materials = await db.materials.find({"subject_id": {"$in": subject_ids}}).sort("createdAt", -1).to_list(500)
    
    for m in materials:
        if m.get("subject_id"):
            s = await db.subjects.find_one({"_id": m["subject_id"]})
            m["subject"] = serialize_doc(s)
        if m.get("uploaded_by"):
            u = await db.users.find_one({"_id": m["uploaded_by"]}, {"password": 0})
            m["uploader"] = {"name": u.get("name")} if u else None
    return api_response(serialize_doc(materials), "Materials fetched successfully")

# ---------- SEED ENDPOINT ----------
@app.post("/api/seed")
async def seed_database():
    """Seed the database with initial data"""
    # Clear existing data
    await db.departments.delete_many({})
    await db.courses.delete_many({})
    await db.subjects.delete_many({})
    await db.users.delete_many({})
    await db.students.delete_many({})
    await db.faculty.delete_many({})
    await db.teaching_assignments.delete_many({})
    
    # Create departments
    bca_dept = await db.departments.insert_one({"name": "Bachelor of Computer Applications", "code": "BCA", "createdAt": datetime.now(timezone.utc)})
    bba_dept = await db.departments.insert_one({"name": "Bachelor of Business Administration", "code": "BBA", "createdAt": datetime.now(timezone.utc)})
    cse_dept = await db.departments.insert_one({"name": "Computer Science & Engineering", "code": "CSE", "createdAt": datetime.now(timezone.utc)})
    
    # Create courses
    bca_course = await db.courses.insert_one({"name": "BCA", "code": "BCA", "department_id": bca_dept.inserted_id, "createdAt": datetime.now(timezone.utc)})
    bba_course = await db.courses.insert_one({"name": "BBA", "code": "BBA", "department_id": bba_dept.inserted_id, "createdAt": datetime.now(timezone.utc)})
    cse_course = await db.courses.insert_one({"name": "B.Tech CSE", "code": "BTCSE", "department_id": cse_dept.inserted_id, "createdAt": datetime.now(timezone.utc)})
    
    # Create subjects
    subjects = await db.subjects.insert_many([
        {"name": "Programming in C", "code": "BCA101", "course_id": bca_course.inserted_id, "semester": 1, "createdAt": datetime.now(timezone.utc)},
        {"name": "Mathematics", "code": "BCA102", "course_id": bca_course.inserted_id, "semester": 1, "createdAt": datetime.now(timezone.utc)},
        {"name": "Data Structures", "code": "BCA201", "course_id": bca_course.inserted_id, "semester": 2, "createdAt": datetime.now(timezone.utc)},
        {"name": "Marketing Management", "code": "BBA101", "course_id": bba_course.inserted_id, "semester": 1, "createdAt": datetime.now(timezone.utc)},
        {"name": "Financial Accounting", "code": "BBA102", "course_id": bba_course.inserted_id, "semester": 1, "createdAt": datetime.now(timezone.utc)},
        {"name": "Data Structures", "code": "CS201", "course_id": cse_course.inserted_id, "semester": 2, "createdAt": datetime.now(timezone.utc)},
    ])
    
    # Create admin user
    admin = await db.users.insert_one({
        "name": "Admin User",
        "email": "admin@portal.com",
        "password": hash_password("Admin@123"),
        "role": "admin",
        "is_active": True,
        "createdAt": datetime.now(timezone.utc),
        "updatedAt": datetime.now(timezone.utc)
    })
    
    # Create faculty user
    faculty_user = await db.users.insert_one({
        "name": "Dr. Priya Sharma",
        "email": "faculty@portal.com",
        "password": hash_password("Faculty@123"),
        "role": "faculty",
        "department_id": bca_dept.inserted_id,
        "is_active": True,
        "createdAt": datetime.now(timezone.utc),
        "updatedAt": datetime.now(timezone.utc)
    })
    
    await db.faculty.insert_one({
        "user_id": faculty_user.inserted_id,
        "department_id": bca_dept.inserted_id,
        "designation": "Assistant Professor",
        "employee_id": "FAC001",
        "createdAt": datetime.now(timezone.utc)
    })
    
    # Create student user
    student_user = await db.users.insert_one({
        "name": "Nashil Singh",
        "email": "student@portal.com",
        "password": hash_password("Student@123"),
        "role": "student",
        "course_id": bca_course.inserted_id,
        "department_id": bca_dept.inserted_id,
        "semester": 2,
        "section": "A",
        "academic_year": "2024-25",
        "register_number": "BCA2024001",
        "is_active": True,
        "createdAt": datetime.now(timezone.utc),
        "updatedAt": datetime.now(timezone.utc)
    })
    
    await db.students.insert_one({
        "user_id": student_user.inserted_id,
        "department_id": bca_dept.inserted_id,
        "course_id": bca_course.inserted_id,
        "semester": 2,
        "section": "A",
        "roll_number": "BCA2024001",
        "academic_year": "2024-25",
        "createdAt": datetime.now(timezone.utc)
    })
    
    # Create teaching assignment
    await db.teaching_assignments.insert_one({
        "faculty_id": faculty_user.inserted_id,
        "subject_id": subjects.inserted_ids[2],  # Data Structures (BCA)
        "department_id": bca_dept.inserted_id,
        "course_id": bca_course.inserted_id,
        "section": "A",
        "semester": 2,
        "academic_year": "2024-25",
        "createdAt": datetime.now(timezone.utc)
    })
    
    return api_response({
        "message": "Database seeded successfully!",
        "credentials": {
            "admin": {"email": "admin@portal.com", "password": "Admin@123"},
            "faculty": {"email": "faculty@portal.com", "password": "Faculty@123"},
            "student": {"email": "student@portal.com", "password": "Student@123"}
        }
    }, "Seed completed", 201)

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
