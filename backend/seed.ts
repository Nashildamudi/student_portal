import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import { Department } from './src/models/department.model';
import { Course } from './src/models/course.model';
import { Subject } from './src/models/subject.model';
import { User } from './src/models/user.model';
import { TeachingAssignment } from './src/models/teachingAssignment.model';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/student_portal';

const seedData = async () => {
  try {
    const conn = await mongoose.connect(MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Clear existing data
    await Department.deleteMany({});
    await Course.deleteMany({});
    await Subject.deleteMany({});
    await User.deleteMany({});
    await TeachingAssignment.deleteMany({});

    console.log('Creating departments...');
    const [bcaDept, bbaDept, cseDept] = await Department.insertMany([
      { name: 'Bachelor of Computer Applications', code: 'BCA' },
      { name: 'Bachelor of Business Administration', code: 'BBA' },
      { name: 'Computer Science & Engineering', code: 'CSE' },
    ]);

    console.log('Creating courses...');
    const [bcaCourse, bbaCourse, cseCourse] = await Course.insertMany([
      { name: 'BCA', code: 'BCA', department_id: bcaDept._id },
      { name: 'BBA', code: 'BBA', department_id: bbaDept._id },
      { name: 'B.Tech CSE', code: 'BTCSE', department_id: cseDept._id },
    ]);

    console.log('Creating subjects...');
    const subjects = await Subject.insertMany([
      { name: 'Programming in C', code: 'BCA101', course_id: bcaCourse._id, semester: 1 },
      { name: 'Mathematics', code: 'BCA102', course_id: bcaCourse._id, semester: 1 },
      { name: 'Data Structures', code: 'BCA201', course_id: bcaCourse._id, semester: 2 },
      { name: 'Marketing Management', code: 'BBA101', course_id: bbaCourse._id, semester: 1 },
      { name: 'Financial Accounting', code: 'BBA102', course_id: bbaCourse._id, semester: 1 },
      { name: 'Data Structures', code: 'CS201', course_id: cseCourse._id, semester: 2 },
    ]);

    const bcrypt = require('bcryptjs');

    console.log('Creating admin user...');
    await User.create({
      name: 'Admin User',
      email: 'admin@portal.com',
      password: await bcrypt.hash('Admin@123', 10),
      role: 'admin',
      is_active: true
    });

    console.log('Creating faculty user...');
    const faculty = await User.create({
      name: 'Dr. Priya Sharma',
      email: 'faculty@portal.com',
      password: await bcrypt.hash('Faculty@123', 10),
      role: 'faculty',
      department_id: bcaDept._id,
      is_active: true
    });

    console.log('Creating student users...');
    const studentHash = await bcrypt.hash('Student@123', 10);
    const student1 = await User.create({
      name: 'Nashil Singh',
      email: 'student@portal.com',
      password: studentHash,
      role: 'student',
      course_id: bcaCourse._id,
      department_id: bcaDept._id,
      semester: 2,
      section: 'A',
      academic_year: '2024-25',
      register_number: 'BCA2024001',
      is_active: true
    });

    console.log('Creating teaching assignments...');
    await TeachingAssignment.create({
      faculty_id: faculty._id,
      subject_id: subjects[2]._id, // Data Structures (BCA)
      section: 'A',
      semester: 2,
      academic_year: '2024-25'
    });

    console.log('\n✅ Database seeded successfully!\n');
    console.log('=== Login Credentials ===');
    console.log('Admin:    admin@portal.com   / Admin@123');
    console.log('Faculty:  faculty@portal.com / Faculty@123');
    console.log('Student:  student@portal.com / Student@123');
    console.log('\nDepartments created: BCA, BBA, CSE');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedData();
