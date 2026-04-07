"""
Student Portal Backend API Tests
Tests all authentication, admin, faculty, and student endpoints
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('VITE_API_URL', 'https://1dc4904f-6306-422c-aa30-d24aa579662a.preview.emergentagent.com/api')

# Test credentials from seed data
ADMIN_CREDS = {"email": "admin@portal.com", "password": "Admin@123"}
FACULTY_CREDS = {"email": "rajesh.kumar@portal.com", "password": "Faculty@123"}
STUDENT_CREDS = {"email": "amit.singh@portal.com", "password": "Student@123"}


class TestHealthAndCommon:
    """Health check and common endpoints"""
    
    def test_health_endpoint(self):
        """Test health check endpoint"""
        response = requests.get(f"{BASE_URL}/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print("✓ Health endpoint working")
    
    def test_common_departments(self):
        """Test public departments endpoint"""
        response = requests.get(f"{BASE_URL}/common/departments")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert isinstance(data["data"], list)
        assert len(data["data"]) >= 2  # CSE and ECE from seed
        print(f"✓ Common departments: {len(data['data'])} departments found")
    
    def test_common_courses(self):
        """Test public courses endpoint"""
        response = requests.get(f"{BASE_URL}/common/courses")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert isinstance(data["data"], list)
        print(f"✓ Common courses: {len(data['data'])} courses found")
    
    def test_common_subjects(self):
        """Test public subjects endpoint"""
        response = requests.get(f"{BASE_URL}/common/subjects")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert isinstance(data["data"], list)
        print(f"✓ Common subjects: {len(data['data'])} subjects found")


class TestAuthentication:
    """Authentication flow tests"""
    
    def test_admin_login_success(self):
        """Test admin login with valid credentials"""
        response = requests.post(f"{BASE_URL}/auth/login", json=ADMIN_CREDS)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "token" in data["data"]
        assert data["data"]["user"]["role"] == "admin"
        assert data["data"]["user"]["email"] == "admin@portal.com"
        print("✓ Admin login successful")
    
    def test_faculty_login_success(self):
        """Test faculty login with valid credentials"""
        response = requests.post(f"{BASE_URL}/auth/login", json=FACULTY_CREDS)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "token" in data["data"]
        assert data["data"]["user"]["role"] == "faculty"
        print("✓ Faculty login successful")
    
    def test_student_login_success(self):
        """Test student login with valid credentials"""
        response = requests.post(f"{BASE_URL}/auth/login", json=STUDENT_CREDS)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "token" in data["data"]
        assert data["data"]["user"]["role"] == "student"
        print("✓ Student login successful")
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = requests.post(f"{BASE_URL}/auth/login", json={
            "email": "wrong@portal.com",
            "password": "wrongpass"
        })
        assert response.status_code == 401
        print("✓ Invalid credentials correctly rejected")
    
    def test_login_invalid_password(self):
        """Test login with wrong password"""
        response = requests.post(f"{BASE_URL}/auth/login", json={
            "email": "admin@portal.com",
            "password": "WrongPassword123"
        })
        assert response.status_code == 401
        print("✓ Wrong password correctly rejected")


class TestAdminEndpoints:
    """Admin API endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get admin token before each test"""
        response = requests.post(f"{BASE_URL}/auth/login", json=ADMIN_CREDS)
        self.token = response.json()["data"]["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_admin_stats(self):
        """Test admin stats endpoint"""
        response = requests.get(f"{BASE_URL}/admin/stats", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        stats = data["data"]
        assert "students" in stats
        assert "faculty" in stats
        assert "departments" in stats
        assert "courses" in stats
        assert "subjects" in stats
        assert "assignments" in stats
        print(f"✓ Admin stats: {stats['students']} students, {stats['faculty']} faculty, {stats['departments']} depts")
    
    def test_admin_stats_unauthorized(self):
        """Test admin stats without auth"""
        response = requests.get(f"{BASE_URL}/admin/stats")
        assert response.status_code == 403  # HTTPBearer returns 403 when no token
        print("✓ Admin stats correctly requires authentication")
    
    def test_admin_departments_list(self):
        """Test admin departments list"""
        response = requests.get(f"{BASE_URL}/admin/departments", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert isinstance(data["data"], list)
        # Verify department structure
        if len(data["data"]) > 0:
            dept = data["data"][0]
            assert "_id" in dept
            assert "name" in dept
            assert "code" in dept
        print(f"✓ Admin departments: {len(data['data'])} departments")
    
    def test_admin_courses_list(self):
        """Test admin courses list"""
        response = requests.get(f"{BASE_URL}/admin/courses", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert isinstance(data["data"], list)
        # Verify course structure
        if len(data["data"]) > 0:
            course = data["data"][0]
            assert "_id" in course
            assert "name" in course
            assert "code" in course
            assert "department" in course  # Populated
        print(f"✓ Admin courses: {len(data['data'])} courses")
    
    def test_admin_subjects_list(self):
        """Test admin subjects list"""
        response = requests.get(f"{BASE_URL}/admin/subjects", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert isinstance(data["data"], list)
        # Verify subject structure
        if len(data["data"]) > 0:
            subj = data["data"][0]
            assert "_id" in subj
            assert "name" in subj
            assert "code" in subj
            assert "semester" in subj
        print(f"✓ Admin subjects: {len(data['data'])} subjects")
    
    def test_admin_students_list(self):
        """Test admin students list"""
        response = requests.get(f"{BASE_URL}/admin/students", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert isinstance(data["data"], list)
        # Verify student structure
        if len(data["data"]) > 0:
            student = data["data"][0]
            assert "_id" in student
            assert "rollNumber" in student
            assert "user" in student  # Populated user
        print(f"✓ Admin students: {len(data['data'])} students")
    
    def test_admin_faculty_list(self):
        """Test admin faculty list"""
        response = requests.get(f"{BASE_URL}/admin/faculty", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert isinstance(data["data"], list)
        # Verify faculty structure
        if len(data["data"]) > 0:
            fac = data["data"][0]
            assert "_id" in fac
            assert "employeeId" in fac
            assert "user" in fac  # Populated user
        print(f"✓ Admin faculty: {len(data['data'])} faculty members")
    
    def test_admin_assignments_list(self):
        """Test admin teaching assignments list"""
        response = requests.get(f"{BASE_URL}/admin/assignments", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert isinstance(data["data"], list)
        # Verify assignment structure
        if len(data["data"]) > 0:
            assign = data["data"][0]
            assert "_id" in assign
            assert "semester" in assign
            assert "section" in assign
            assert "faculty" in assign  # Populated
            assert "subject" in assign  # Populated
        print(f"✓ Admin assignments: {len(data['data'])} assignments")
    
    def test_admin_users_list(self):
        """Test admin users list"""
        response = requests.get(f"{BASE_URL}/admin/users", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert isinstance(data["data"], list)
        # Verify user structure
        if len(data["data"]) > 0:
            user = data["data"][0]
            assert "_id" in user
            assert "email" in user
            assert "role" in user
            assert "password" not in user  # Password should be excluded
        print(f"✓ Admin users: {len(data['data'])} users")
    
    def test_admin_users_filter_by_role(self):
        """Test admin users list with role filter"""
        response = requests.get(f"{BASE_URL}/admin/users?role=student", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        for user in data["data"]:
            assert user["role"] == "student"
        print(f"✓ Admin users filter: {len(data['data'])} students")


class TestFacultyEndpoints:
    """Faculty API endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get faculty token before each test"""
        response = requests.post(f"{BASE_URL}/auth/login", json=FACULTY_CREDS)
        self.token = response.json()["data"]["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_faculty_assignments(self):
        """Test faculty assignments endpoint"""
        response = requests.get(f"{BASE_URL}/faculty/assignments", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert isinstance(data["data"], list)
        print(f"✓ Faculty assignments: {len(data['data'])} assignments")
    
    def test_faculty_subjects(self):
        """Test faculty subjects endpoint"""
        response = requests.get(f"{BASE_URL}/faculty/subjects", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert isinstance(data["data"], list)
        print(f"✓ Faculty subjects: {len(data['data'])} subjects")
    
    def test_faculty_assignment_students(self):
        """Test getting students for an assignment"""
        # First get assignments
        assignments_resp = requests.get(f"{BASE_URL}/faculty/assignments", headers=self.headers)
        assignments = assignments_resp.json()["data"]
        
        if len(assignments) > 0:
            assignment_id = assignments[0]["_id"]
            response = requests.get(f"{BASE_URL}/faculty/assignments/{assignment_id}/students", headers=self.headers)
            assert response.status_code == 200
            data = response.json()
            assert data["success"] == True
            assert isinstance(data["data"], list)
            print(f"✓ Faculty assignment students: {len(data['data'])} students")
        else:
            print("⚠ No assignments found for faculty")
    
    def test_faculty_unauthorized_access(self):
        """Test faculty cannot access admin endpoints"""
        response = requests.get(f"{BASE_URL}/admin/stats", headers=self.headers)
        assert response.status_code == 403
        print("✓ Faculty correctly blocked from admin endpoints")


class TestStudentEndpoints:
    """Student API endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get student token before each test"""
        response = requests.post(f"{BASE_URL}/auth/login", json=STUDENT_CREDS)
        self.token = response.json()["data"]["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_student_profile(self):
        """Test student profile endpoint"""
        response = requests.get(f"{BASE_URL}/student/profile", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        profile = data["data"]
        assert "rollNumber" in profile
        assert "semester" in profile
        assert "section" in profile
        assert "department" in profile
        assert "course" in profile
        assert "user" in profile
        print(f"✓ Student profile: {profile['rollNumber']}, Semester {profile['semester']}")
    
    def test_student_attendance(self):
        """Test student attendance endpoint"""
        response = requests.get(f"{BASE_URL}/student/attendance", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert isinstance(data["data"], list)
        print(f"✓ Student attendance: {len(data['data'])} subjects")
    
    def test_student_marks(self):
        """Test student marks endpoint"""
        response = requests.get(f"{BASE_URL}/student/marks", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert isinstance(data["data"], list)
        print(f"✓ Student marks: {len(data['data'])} subjects")
    
    def test_student_materials(self):
        """Test student materials endpoint"""
        response = requests.get(f"{BASE_URL}/student/materials", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert isinstance(data["data"], list)
        print(f"✓ Student materials: {len(data['data'])} materials")
    
    def test_student_unauthorized_access(self):
        """Test student cannot access admin endpoints"""
        response = requests.get(f"{BASE_URL}/admin/stats", headers=self.headers)
        assert response.status_code == 403
        print("✓ Student correctly blocked from admin endpoints")
    
    def test_student_cannot_access_faculty(self):
        """Test student cannot access faculty endpoints"""
        response = requests.get(f"{BASE_URL}/faculty/assignments", headers=self.headers)
        assert response.status_code == 403
        print("✓ Student correctly blocked from faculty endpoints")


class TestCRUDOperations:
    """Test CRUD operations for admin"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get admin token before each test"""
        response = requests.post(f"{BASE_URL}/auth/login", json=ADMIN_CREDS)
        self.token = response.json()["data"]["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_create_department(self):
        """Test creating a new department"""
        import time
        unique_code = f"TEST{int(time.time()) % 10000}"
        dept_data = {"name": f"TEST Department {unique_code}", "code": unique_code}
        response = requests.post(f"{BASE_URL}/admin/departments", json=dept_data, headers=self.headers)
        data = response.json()
        
        if response.status_code == 409 or data.get("statusCode") == 409:
            # Already exists, that's fine
            print("⚠ Test department already exists")
            return
        
        # Backend returns HTTP 200 but statusCode 201 in body for creation
        assert response.status_code == 200
        assert data["statusCode"] == 201
        assert data["success"] == True
        assert data["data"]["name"] == dept_data["name"]
        assert data["data"]["code"] == unique_code
        
        # Verify by GET
        dept_id = data["data"]["_id"]
        get_resp = requests.get(f"{BASE_URL}/admin/departments", headers=self.headers)
        depts = get_resp.json()["data"]
        found = any(d["_id"] == dept_id for d in depts)
        assert found, "Created department not found in list"
        
        # Cleanup - delete the test department
        del_resp = requests.delete(f"{BASE_URL}/admin/departments/{dept_id}", headers=self.headers)
        assert del_resp.status_code == 200
        print("✓ Department CRUD: create, verify, delete successful")
    
    def test_toggle_user_status(self):
        """Test toggling user active status"""
        # Get users
        users_resp = requests.get(f"{BASE_URL}/admin/users?role=student", headers=self.headers)
        users = users_resp.json()["data"]
        
        if len(users) > 0:
            user_id = users[0]["_id"]
            original_status = users[0].get("isActive", True)
            
            # Toggle status
            toggle_resp = requests.patch(f"{BASE_URL}/admin/users/{user_id}/toggle-status", headers=self.headers)
            assert toggle_resp.status_code == 200
            new_status = toggle_resp.json()["data"]["isActive"]
            assert new_status != original_status
            
            # Toggle back
            toggle_resp2 = requests.patch(f"{BASE_URL}/admin/users/{user_id}/toggle-status", headers=self.headers)
            assert toggle_resp2.status_code == 200
            restored_status = toggle_resp2.json()["data"]["isActive"]
            assert restored_status == original_status
            
            print("✓ User status toggle: toggle and restore successful")
        else:
            print("⚠ No students found to test toggle")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
