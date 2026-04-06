import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { User } from '../models/user.model';
import { env } from '../config/env';

// Registration Endpoint
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { 
    name, 
    email, 
    password, 
    role, 
    department_id, 
    course_id, 
    semester, 
    section, 
    academic_year 
  } = req.body;

  if (!name || !email || !password || !role) {
    throw new ApiError(400, "Name, email, password, and role are required.");
  }

  // Ensure role is valid
  if (!['student', 'faculty'].includes(role)) {
    throw new ApiError(400, "You can only register as student or faculty.");
  }

  // Check if user exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new ApiError(409, "User with this email already exists.");
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create user
  const newUser = await User.create({
    name,
    email: email.toLowerCase(),
    password: hashedPassword,
    role,
    department_id,
    course_id,
    semester,
    section,
    academic_year,
    is_active: true
  });

  // Generate JWT token
  const token = jwt.sign(
    { id: newUser._id, role: newUser.role },
    env.BETTER_AUTH_SECRET || 'fallback_secret',
    { expiresIn: '30d' }
  );

  // Prepare user object to return without password
  const userToReturn = newUser.toObject();
  delete userToReturn.password;

  res.status(201).json(new ApiResponse(201, { user: userToReturn, token }, "User registered successfully"));
});

// Login Endpoint
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required.");
  }

  // Find user and explicitly select password since it has select: false in schema
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user) {
    throw new ApiError(401, "Invalid email or password.");
  }

  // Check password
  const isMatch = await bcrypt.compare(password, user.password as string);
  if (!isMatch) {
    throw new ApiError(401, "Invalid email or password.");
  }

  // Generate JWT token
  const token = jwt.sign(
    { id: user._id, role: user.role },
    env.BETTER_AUTH_SECRET || 'fallback_secret',
    { expiresIn: '30d' }
  );

  // Prepare user object to return without password
  const userToReturn = user.toObject();
  delete userToReturn.password;

  res.status(200).json(new ApiResponse(200, { user: userToReturn, token }, "Login successful"));
});
