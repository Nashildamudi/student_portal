import jwt from 'jsonwebtoken';
import { User } from '../models';
import { ApiError } from '../utils';
import { env } from '../config';
import { IUser, UserRole } from '../types';

interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
}

interface LoginInput {
  email: string;
  password: string;
}

interface AuthResponse {
  user: Omit<IUser, 'password'>;
  token: string;
}

const generateToken = (userId: string, role: string): string => {
  return jwt.sign(
    { id: userId, role },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );
};

export const authService = {
  async register(input: RegisterInput): Promise<AuthResponse> {
    const existingUser = await User.findOne({ email: input.email.toLowerCase() });
    
    if (existingUser) {
      throw ApiError.conflict('Email already registered');
    }

    const user = await User.create({
      ...input,
      email: input.email.toLowerCase(),
    });

    const token = generateToken(user._id.toString(), user.role);

    return {
      user: user.toJSON() as Omit<IUser, 'password'>,
      token,
    };
  },

  async login(input: LoginInput): Promise<AuthResponse> {
    const user = await User.findOne({ email: input.email.toLowerCase() }).select('+password');
    
    if (!user) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const isPasswordValid = await user.comparePassword(input.password);
    
    if (!isPasswordValid) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    if (!user.isActive) {
      throw ApiError.unauthorized('Account has been deactivated');
    }

    const token = generateToken(user._id.toString(), user.role);

    return {
      user: user.toJSON() as Omit<IUser, 'password'>,
      token,
    };
  },

  async getProfile(userId: string): Promise<Omit<IUser, 'password'>> {
    const user = await User.findById(userId);
    
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    return user.toJSON() as Omit<IUser, 'password'>;
  },
};
