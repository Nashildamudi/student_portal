#!/usr/bin/env python3
"""
Backend API Testing for Student Portal
Tests all API endpoints with proper authentication flows
"""
import requests
import sys
import json
from datetime import datetime

class StudentPortalAPITester:
    def __init__(self, base_url="https://1dc4904f-6306-422c-aa30-d24aa579662a.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.admin_token = None
        self.faculty_token = None
        self.student_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def log_test(self, name, success, details=""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
            self.failed_tests.append({"test": name, "error": details})

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        if headers:
            test_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=test_headers, timeout=10)
            else:
                self.log_test(name, False, f"Unsupported method: {method}")
                return False, {}

            success = response.status_code == expected_status
            response_data = {}
            try:
                response_data = response.json()
            except:
                response_data = {"text": response.text}

            if success:
                self.log_test(name, True)
            else:
                self.log_test(name, False, f"Expected {expected_status}, got {response.status_code}. Response: {response_data}")

            return success, response_data

        except requests.exceptions.RequestException as e:
            self.log_test(name, False, f"Request failed: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test health endpoint"""
        success, _ = self.run_test("Health Check", "GET", "health", 200)
        return success

    def test_seed_database(self):
        """Test database seeding"""
        success, response = self.run_test("Database Seed", "POST", "seed", 201)
        if success and response.get("data", {}).get("credentials"):
            print("📋 Seed credentials available in response")
        return success

    def test_public_dropdowns(self):
        """Test public dropdowns endpoint"""
        success, response = self.run_test("Public Dropdowns", "GET", "common/public/dropdowns", 200)
        if success:
            data = response.get("data", {})
            departments = data.get("departments", [])
            courses = data.get("courses", [])
            print(f"   📊 Found {len(departments)} departments, {len(courses)} courses")
        return success

    def test_login(self, email, password, role):
        """Test login and store token"""
        success, response = self.run_test(f"{role.title()} Login", "POST", "auth/login", 200, {
            "email": email,
            "password": password
        })
        
        if success:
            data = response.get("data", {})
            token = data.get("token")
            user = data.get("user", {})
            
            if token and user.get("role") == role:
                if role == "admin":
                    self.admin_token = token
                elif role == "faculty":
                    self.faculty_token = token
                elif role == "student":
                    self.student_token = token
                print(f"   🔑 {role.title()} token acquired")
                return True
            else:
                self.log_test(f"{role.title()} Login Token", False, "No token or wrong role in response")
        
        return success

    def test_admin_stats(self):
        """Test admin dashboard stats"""
        if not self.admin_token:
            self.log_test("Admin Stats", False, "No admin token available")
            return False
            
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        success, response = self.run_test("Admin Stats", "GET", "admin/stats", 200, headers=headers)
        
        if success:
            stats = response.get("data", {})
            print(f"   📈 Stats: {stats.get('students', 0)} students, {stats.get('faculty', 0)} faculty, {stats.get('departments', 0)} departments")
        
        return success

    def test_admin_users(self):
        """Test admin users endpoint"""
        if not self.admin_token:
            self.log_test("Admin Users", False, "No admin token available")
            return False
            
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        success, response = self.run_test("Admin Users", "GET", "admin/users", 200, headers=headers)
        
        if success:
            users = response.get("data", [])
            print(f"   👥 Found {len(users)} users")
        
        return success

    def test_faculty_assignments(self):
        """Test faculty assignments"""
        if not self.faculty_token:
            self.log_test("Faculty Assignments", False, "No faculty token available")
            return False
            
        headers = {"Authorization": f"Bearer {self.faculty_token}"}
        success, response = self.run_test("Faculty Assignments", "GET", "faculty/assignments", 200, headers=headers)
        
        if success:
            assignments = response.get("data", [])
            print(f"   📚 Found {len(assignments)} assignments")
        
        return success

    def test_student_profile(self):
        """Test student profile"""
        if not self.student_token:
            self.log_test("Student Profile", False, "No student token available")
            return False
            
        headers = {"Authorization": f"Bearer {self.student_token}"}
        success, response = self.run_test("Student Profile", "GET", "student/profile", 200, headers=headers)
        
        if success:
            profile = response.get("data", {})
            print(f"   👤 Profile: {profile.get('user', {}).get('name', 'Unknown')}")
        
        return success

    def test_unauthorized_access(self):
        """Test that protected endpoints require authentication"""
        success, _ = self.run_test("Unauthorized Admin Stats", "GET", "admin/stats", 401)
        return success

    def test_invalid_login(self):
        """Test login with invalid credentials"""
        success, _ = self.run_test("Invalid Login", "POST", "auth/login", 401, {
            "email": "invalid@test.com",
            "password": "wrongpassword"
        })
        return success

    def run_all_tests(self):
        """Run comprehensive test suite"""
        print("🚀 Starting Student Portal API Tests")
        print(f"📡 Testing against: {self.base_url}")
        print("=" * 60)

        # Basic connectivity tests
        print("\n📋 Basic API Tests")
        self.test_health_check()
        self.test_public_dropdowns()
        self.test_unauthorized_access()
        self.test_invalid_login()

        # Seed database (creates test users)
        print("\n🌱 Database Setup")
        self.test_seed_database()

        # Authentication tests
        print("\n🔐 Authentication Tests")
        admin_login = self.test_login("admin@portal.com", "Admin@123", "admin")
        faculty_login = self.test_login("faculty@portal.com", "Faculty@123", "faculty")
        student_login = self.test_login("student@portal.com", "Student@123", "student")

        # Role-specific endpoint tests
        if admin_login:
            print("\n👑 Admin Endpoint Tests")
            self.test_admin_stats()
            self.test_admin_users()

        if faculty_login:
            print("\n🎓 Faculty Endpoint Tests")
            self.test_faculty_assignments()

        if student_login:
            print("\n📚 Student Endpoint Tests")
            self.test_student_profile()

        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.failed_tests:
            print("\n❌ Failed Tests:")
            for failure in self.failed_tests:
                print(f"   • {failure['test']}: {failure['error']}")
        
        return self.tests_passed == self.tests_run

def main():
    """Main test execution"""
    tester = StudentPortalAPITester()
    success = tester.run_all_tests()
    
    # Return appropriate exit code
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())