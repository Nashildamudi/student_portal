import { betterAuth } from 'better-auth';
import { env } from '../config/env';
import mongoose from 'mongoose';

/**
 * Initialize and configure better-auth instance.
 * Uses Mongoose adapter to store sessions in MongoDB.
 */
export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  database: mongoose.connection,
  emailAndPassword: {
    enabled: true
  }
});

/**
 * Service to handle any custom auth logic if needed outside of better-auth
 */
export const AuthService = {
    // Add additional auth business logic here
};
