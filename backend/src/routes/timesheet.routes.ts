import express from 'express';
import { auth } from '../middleware/auth.middleware';
import { authorize } from '../middleware/auth.middleware';
import * as timesheetController from '../controllers/timesheet.controller';
import {
  validateTimesheetId,
  validateCreateTimesheet,
  validateTimesheetQuery,
  validateApproveTimesheet,
  validateRejectTimesheet,
  validateTimeEntryIds,
  validateTimeEntriesQuery,
} from '../middleware/timesheet-validation.middleware';

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth);

// Create a new timesheet
// POST /api/timesheets
router.post('/', validateCreateTimesheet, timesheetController.createTimesheet);

// Get a specific timesheet
// GET /api/timesheets/:id
router.get('/:id', validateTimesheetId, timesheetController.getTimesheet);

// Get timesheets for the current user
// GET /api/timesheets
router.get('/', validateTimesheetQuery, timesheetController.getUserTimesheets);

// Submit a timesheet for approval
// POST /api/timesheets/:id/submit
router.post('/:id/submit', validateTimesheetId, timesheetController.submitTimesheet);

// Approve a timesheet (admin only)
// POST /api/timesheets/:id/approve
router.post(
  '/:id/approve',
  [authorize('admin'), ...validateTimesheetId, ...validateApproveTimesheet],
  timesheetController.approveTimesheet
);

// Reject a timesheet (admin only)
// POST /api/timesheets/:id/reject
router.post(
  '/:id/reject',
  [authorize('admin'), ...validateTimesheetId, ...validateRejectTimesheet],
  timesheetController.rejectTimesheet
);

// Get time entries for approval (admin only)
// GET /api/timesheets/entries
router.get(
  '/entries',
  [authorize('admin'), ...validateTimeEntriesQuery],
  timesheetController.getTimesheetEntries
);

// Add time entries to a timesheet
// POST /api/timesheets/:id/entries
router.post(
  '/:id/entries',
  [validateTimesheetId, ...validateTimeEntryIds],
  timesheetController.addTimeEntriesToTimesheet
);

// Remove time entries from a timesheet
// DELETE /api/timesheets/:id/entries
router.delete(
  '/:id/entries',
  [validateTimesheetId, ...validateTimeEntryIds],
  timesheetController.removeTimeEntriesFromTimesheet
);

export default router;
