import { body, param, query } from 'express-validator';

// Common validators
export const validateTimesheetId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Timesheet ID must be a positive integer')
    .toInt()
];

export const validateTimeEntryIds = [
  body('timeEntryIds')
    .isArray({ min: 1 })
    .withMessage('At least one time entry ID is required')
    .custom((value) => {
      if (!Array.isArray(value)) return false;
      return value.every(id => Number.isInteger(id) && id > 0);
    })
    .withMessage('Time entry IDs must be an array of positive integers')
];

// Timesheet creation and update validators
export const validateCreateTimesheet = [
  body('startDate')
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date')
    .custom((value, { req }) => {
      if (new Date(value) > new Date()) {
        throw new Error('Start date cannot be in the future');
      }
      return true;
    }),
    
  body('endDate')
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date')
    .custom((value, { req }) => {
      if (req.body.startDate && new Date(value) < new Date(req.body.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
    
  body('notes')
    .optional()
    .isString()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters'),
    
  body('timeEntryIds')
    .optional()
    .isArray()
    .withMessage('Time entry IDs must be an array')
    .custom((value) => {
      if (!Array.isArray(value)) return false;
      return value.every(id => Number.isInteger(id) && id > 0);
    })
    .withMessage('Time entry IDs must be an array of positive integers')
];

// Timesheet query validators
export const validateTimesheetQuery = [
  query('status')
    .optional()
    .isIn(['draft', 'submitted', 'approved', 'rejected'])
    .withMessage('Invalid status value'),
    
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

// Timesheet approval/rejection validators
export const validateApproveTimesheet = [
  body('notes')
    .optional()
    .isString()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters')
];

export const validateRejectTimesheet = [
  body('notes')
    .isString()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Rejection reason is required and cannot exceed 1000 characters')
];

// Time entries query validators
export const validateTimeEntriesQuery = [
  query('userId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('User ID must be a positive integer')
    .toInt(),
    
  query('projectId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Project ID must be a positive integer')
    .toInt(),
    
  query('clientId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Client ID must be a positive integer')
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
    .withMessage('Invalid status value')
];
