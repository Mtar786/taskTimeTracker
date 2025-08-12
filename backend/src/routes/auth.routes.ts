import express from 'express';
import * as authController from '../controllers/auth.controller';
import { validateRegistration, validateLogin } from '../middleware/validation.middleware';
import { auth } from '../middleware/auth.middleware';

const router = express.Router();

// @route   POST api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', validateRegistration, authController.register);

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', validateLogin, authController.login);

// @route   GET api/auth/me
// @desc    Get current user's profile
// @access  Private
router.get('/me', auth, authController.getCurrentUser);

export default router;
