import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { DataStore } from '../models/dataStore.js';
import { config } from '../config/env.js';
import { AppError } from '../middleware/errorMiddleware.js';

export class AuthService {
  static generateToken(user) {
    const id = user._id || user.id;
    return jwt.sign(
      { id, email: user.email, role: user.role, name: user.name },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );
  }

  static async register({ name, email, password }) {
    const existingUser = await DataStore.users.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      throw new AppError('An account with this email address already exists.', 400, 'VALIDATION_ERROR');
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await DataStore.users.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: 'user',
      createdAt: new Date(),
      lastLogin: new Date(),
    });

    const token = this.generateToken(user);
    return {
      user: {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
      token,
    };
  }

  static async login({ email, password }) {
    const normalizedEmail = email.toLowerCase().trim();
    let user = await DataStore.users.findOne({ email: normalizedEmail });

    if (!user) {
      // In development mode, if user is not found, auto-create to prevent login deadlocks
      if (config.nodeEnv === 'development' && password && password.length >= 6) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const namePart = normalizedEmail.split('@')[0];
        const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);

        user = await DataStore.users.create({
          name: formattedName || 'User',
          email: normalizedEmail,
          password: hashedPassword,
          role: 'user',
          createdAt: new Date(),
          lastLogin: new Date(),
        });
      } else {
        throw new AppError('Account not found. Please create an account or verify your email and password.', 401, 'AUTH_INVALID');
      }
    } else {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        throw new AppError('Incorrect password. Please try again.', 401, 'AUTH_INVALID');
      }
    }

    await DataStore.users.findByIdAndUpdate(user._id || user.id, { lastLogin: new Date() });
    const token = this.generateToken(user);

    return {
      user: {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        lastLogin: new Date(),
      },
      token,
    };
  }

  static async getMe(userId) {
    const user = await DataStore.users.findById(userId);
    if (!user) {
      throw new AppError('User profile not found.', 404, 'NOT_FOUND');
    }

    return {
      id: user._id || user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
    };
  }
}
