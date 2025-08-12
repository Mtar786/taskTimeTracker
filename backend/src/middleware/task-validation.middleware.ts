import { body, param, ValidationChain } from 'express-validator';

export const validateTaskId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Task ID must be a positive integer')
    .toInt()
];

export const validateProjectId = [
  param('projectId')
    .isInt({ min: 1 })
    .withMessage('Project ID must be a positive integer')
    .toInt()
];

export const validateCreateTask = [
  body('projectId')
    .isInt({ min: 1 })
    .withMessage('Project ID is required and must be a positive integer'),
    
  body('name')
    .trim()
    .isLength({ min: 3, max: 255 })
    .withMessage('Task name must be between 3 and 255 characters'),
    
  body('description')
    .optional()
    .isString()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
    
  body('status')
    .optional()
    .isIn(['pending', 'in_progress', 'completed', 'blocked'])
    .withMessage('Invalid task status'),
    
  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Due date must be a valid date')
    .custom((value) => {
      if (new Date(value) < new Date()) {
        throw new Error('Due date cannot be in the past');
      }
      return true;
    })
];

export const validateUpdateTask = [
  ...validateTaskId,
  body('name')
    .optional()
    .trim()
    .isLength({ min: 3, max: 255 })
    .withMessage('Task name must be between 3 and 255 characters'),
    
  body('description')
    .optional()
    .isString()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
    
  body('status')
    .optional()
    .isIn(['pending', 'in_progress', 'completed', 'blocked'])
    .withMessage('Invalid task status'),
    
  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Due date must be a valid date')
];

export const validateTimeEntryId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Time entry ID must be a positive integer')
    .toInt()
];

export const validateCreateTimeEntry = [
  body('taskId')
    .isInt({ min: 1 })
    .withMessage('Task ID is required and must be a positive integer'),
    
  body('startTime')
    .isISO8601()
    .withMessage('Start time must be a valid ISO 8601 date')
    .custom((value) => {
      if (new Date(value) > new Date()) {
        throw new Error('Start time cannot be in the future');
      }
      return true;
    }),
    
  body('endTime')
    .optional()
    .isISO8601()
    .withMessage('End time must be a valid ISO 8601 date')
    .custom((value, { req }) => {
      if (value && new Date(value) > new Date()) {
        throw new Error('End time cannot be in the future');
      }
      if (value && new Date(value) < new Date(req.body.startTime)) {
        throw new Error('End time must be after start time');
      }
      return true;
    }),
    
  body('durationMinutes')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Duration must be a positive number of minutes'),
    
  body('description')
    .optional()
    .isString()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
    
  body('isBillable')
    .optional()
    .isBoolean()
    .withMessage('isBillable must be a boolean')
];

export const validateUpdateTimeEntry = [
  ...validateTimeEntryId,
  body('startTime')
    .optional()
    .isISO8601()
    .withMessage('Start time must be a valid ISO 8601 date')
    .custom((value) => {
      if (new Date(value) > new Date()) {
        throw new Error('Start time cannot be in the future');
      }
      return true;
    }),
    
  body('endTime')
    .optional()
    .isISO8601()
    .withMessage('End time must be a valid ISO 8601 date')
    .custom((value, { req }) => {
      if (value && new Date(value) > new Date()) {
        throw new Error('End time cannot be in the future');
      }
      if (value && req.body.startTime && new Date(value) < new Date(req.body.startTime)) {
        throw new Error('End time must be after start time');
      }
      return true;
    }),
    
  body('durationMinutes')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Duration must be a positive number of minutes'),
    
  body('description')
    .optional()
    .isString()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
    
  body('isBillable')
    .optional()
    .isBoolean()
    .withMessage('isBillable must be a boolean'),
    
  body('status')
    .optional()
    .isIn(['draft', 'submitted', 'approved', 'rejected', 'billed'])
    .withMessage('Invalid time entry status')
];

export const validateTimeEntryQuery = [
  param('userId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('User ID must be a positive integer')
    .toInt(),
    
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
    
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date')
    .custom((value, { req }) => {
      if (req.query.startDate && new Date(value) < new Date(req.query.startDate as string)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
    
  query('status')
    .optional()
    .isIn(['draft', 'submitted', 'approved', 'rejected', 'billed'])
    .withMessage('Invalid status'),
    
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),
    
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt()
];
