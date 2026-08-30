import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { DataStore } from '../models/dataStore.js';
import { AppError } from './errorMiddleware.js';

export async function protect(req, res, next) {
  try {
    let token = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return next(new AppError('Authentication required. Please log in.', 401, 'AUTH_REQUIRED'));
    }

    let decoded;
    try {
      decoded = jwt.verify(token, config.jwtSecret);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return next(new AppError('Your session has expired. Please log in again.', 401, 'AUTH_EXPIRED'));
      }
      return next(new AppError('Invalid authentication token.', 401, 'AUTH_INVALID'));
    }

    const user = await DataStore.users.findById(decoded.id);
    if (!user) {
      return next(new AppError('The user belonging to this token no longer exists.', 401, 'AUTH_INVALID'));
    }

    req.user = {
      _id: user._id || user.id,
      id: user._id || user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
    next();
  } catch (err) {
    next(err);
  }
}
