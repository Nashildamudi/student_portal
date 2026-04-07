import mongoose from 'mongoose';
import { connectDB } from './config';
import { User, Department, Course, Subject, Student, Faculty, TeachingAssignment } from './models';

const seedData = async () => {
  try {
    await connectDB();
    
    console.log('Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      Department.deleteMany({}),
      Course.deleteMany({}),
      Subject.deleteMany({}),
      Student.deleteMany({}),
      Faculty.deleteMany({}),
      TeachingAssignment.deleteMany({}),
    ]);

    console.log('Creating departments...');
    const [cseDept, eceDept, mechDept] = await Department.create([
      { name: 'Computer Science & Engineering', code: 'CSE' },
      { name: 'Electronics & Communication Engineering', code: 'ECE' },
      { name: 'Mechanical Engineering', code: 'MECH' },
    ]);

    console.log('Creating courses...');
    const [btechCSE, btechECE, mtechCSE] = await Course.create([
      { name: 'B.Tech Computer Science', code: 'BTCS', departmentId: cseDept._id, totalSemesters: 8 },
      { name: 'B.Tech Electronics', code: 'BTEC', departmentId: eceDept._id, totalSemesters: 8 },
      { name: 'M.Tech Computer Science', code: 'MTCS', departmentId: cseDept._id, totalSemesters: 4 },
    ]);

    console.log('Creating subjects...');
    const subjects = await Subject.create([
      { name: 'Data Structures', code: 'CS201', courseId: btechCSE._id, semester: 3, credits: 4 },
      { name: 'Algorithms', code: 'CS301', courseId: btechCSE._id, semester: 4, credits: 4 },
      { name: 'Database Systems', code: 'CS302', courseId: btechCSE._id, semester: 4, credits: 3 },
      { name: 'Operating Systems', code: 'CS401', courseId: btechCSE._id, semester: 5, credits: 4 },
      { name: 'Computer Networks', code: 'CS402', courseId: btechCSE._id, semester: 5, credits: 3 },
      { name: 'Digital Electronics', code: 'EC201', courseId: btechECE._id, semester: 3, credits: 4 },
      { name: 'Signal Processing', code: 'EC301', courseId: btechECE._id, semester: 4, credits: 4 },
    ]);

    console.log('Creating admin user...');
    await User.create({
      name: 'Admin User',
      email: 'admin@portal.com',
      password: 'Admin@123',
      role: 'admin',
    });

    console.log('Creating faculty users...');
    const facultyUser1 = await User.create({
      name: 'Dr. Rajesh Kumar',
      email: 'rajesh.kumar@portal.com',
      password: 'Faculty@123',
      phone: '9876543210',
      role: 'faculty',
    });

    const facultyUser2 = await User.create({
      name: 'Dr. Priya Sharma',
      email: 'priya.sharma@portal.com',
      password: 'Faculty@123',
      phone: '9876543211',
      role: 'faculty',
    });

    const faculty1 = await Faculty.create({
      userId: facultyUser1._id,
      departmentId: cseDept._id,
      employeeId: 'FAC001',
      designation: 'Associate Professor',
      specialization: 'Data Science',
    });

    const faculty2 = await Faculty.create({
      userId: facultyUser2._id,
      departmentId: cseDept._id,
      employeeId: 'FAC002',
      designation: 'Assistant Professor',
      specialization: 'Machine Learning',
    });

    console.log('Creating student users...');
    const studentUser1 = await User.create({
      name: 'Amit Singh',
      email: 'amit.singh@portal.com',
      password: 'Student@123',
      phone: '9876543220',
      role: 'student',
    });

    const studentUser2 = await User.create({
      name: 'Sneha Patel',
      email: 'sneha.patel@portal.com',
      password: 'Student@123',
      phone: '9876543221',
      role: 'student',
    });

    const studentUser3 = await User.create({
      name: 'Rahul Verma',
      email: 'rahul.verma@portal.com',
      password: 'Student@123',
      phone: '9876543222',
      role: 'student',
    });

    await Student.create([
      {
        userId: studentUser1._id,
        departmentId: cseDept._id,
        courseId: btechCSE._id,
        rollNumber: 'CSE2024001',
        semester: 5,
        section: 'A',
        academicYear: '2024-25',
      },
      {
        userId: studentUser2._id,
        departmentId: cseDept._id,
        courseId: btechCSE._id,
        rollNumber: 'CSE2024002',
        semester: 5,
        section: 'A',
        academicYear: '2024-25',
      },
      {
        userId: studentUser3._id,
        departmentId: cseDept._id,
        courseId: btechCSE._id,
        rollNumber: 'CSE2024003',
        semester: 5,
        section: 'A',
        academicYear: '2024-25',
      },
    ]);

    console.log('Creating teaching assignments...');
    await TeachingAssignment.create([
      {
        facultyId: facultyUser1._id,
        subjectId: subjects[3]._id, // Operating Systems
        departmentId: cseDept._id,
        courseId: btechCSE._id,
        semester: 5,
        section: 'A',
        academicYear: '2024-25',
      },
      {
        facultyId: facultyUser1._id,
        subjectId: subjects[4]._id, // Computer Networks
        departmentId: cseDept._id,
        courseId: btechCSE._id,
        semester: 5,
        section: 'A',
        academicYear: '2024-25',
      },
      {
        facultyId: facultyUser2._id,
        subjectId: subjects[0]._id, // Data Structures
        departmentId: cseDept._id,
        courseId: btechCSE._id,
        semester: 3,
        section: 'A',
        academicYear: '2024-25',
      },
    ]);

    console.log('\n========================================');
    console.log('Database seeded successfully!');
    console.log('========================================\n');
    console.log('Test Credentials:');
    console.log('----------------------------------------');
    console.log('Admin:   admin@portal.com / Admin@123');
    console.log('Faculty: rajesh.kumar@portal.com / Faculty@123');
    console.log('Faculty: priya.sharma@portal.com / Faculty@123');
    console.log('Student: amit.singh@portal.com / Student@123');
    console.log('Student: sneha.patel@portal.com / Student@123');
    console.log('Student: rahul.verma@portal.com / Student@123');
    console.log('----------------------------------------\n');

    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
};

seedData();
