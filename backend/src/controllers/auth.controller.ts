import { Request, Response } from 'express';
import { UserModel, UserInput, LoginCredentials } from '../models/user.model';
import { validationResult } from 'express-validator';

export const register = async (req: Request, res: Response) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, firstName, lastName, role } = req.body;
    
    // Check if user already exists
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    const userData: UserInput = {
      email,
      password,
      firstName,
      lastName,
      role: role || 'user' // Default role is 'user' if not specified
    };

    const user = await UserModel.create(userData);
    const token = UserModel.generateToken(user);

    // Don't send password hash in response
    const { password_hash, ...userWithoutPassword } = user;
    
    res.status(201).json({
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password }: LoginCredentials = req.body;
    
    // Check if user exists
    const user = await UserModel.findByEmail(email);
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Validate password
    const isMatch = await UserModel.validatePassword(user, password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = UserModel.generateToken(user);
    
    // Don't send password hash in response
    const { password_hash, ...userWithoutPassword } = user;
    
    res.json({
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    // User is already attached to req by auth middleware
    const user = await UserModel.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Don't send password hash in response
    const { password_hash, ...userWithoutPassword } = user;
    
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
