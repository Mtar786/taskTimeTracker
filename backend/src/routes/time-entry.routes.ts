import express from 'express';
import { auth } from '../middleware/auth.middleware';
import { authorize } from '../middleware/auth.middleware';
import * as timeEntryController from '../controllers/time-entry.controller';
import {
  validateCreateTimeEntry,
  validateUpdateTimeEntry,
  validateTimeEntryId,
  validateTimeEntryQuery,
} from '../middleware/task-validation.middleware';

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth);

// Create a new time entry
// POST /api/time-entries
router.post('/', validateCreateTimeEntry, timeEntryController.createTimeEntry);

// Get a specific time entry
// GET /api/time-entries/:id
router.get('/:id', validateTimeEntryId, timeEntryController.getTimeEntry);

// Update a time entry
// PUT /api/time-entries/:id
router.put(
  '/:id',
  [...validateTimeEntryId, ...validateUpdateTimeEntry],
  timeEntryController.updateTimeEntry
);

// Delete a time entry
// DELETE /api/time-entries/:id
router.delete('/:id', validateTimeEntryId, timeEntryController.deleteTimeEntry);

// Get current user's time entries
// GET /api/time-entries
router.get('/', validateTimeEntryQuery, timeEntryController.getUserTimeEntries);

// Get billable hours summary
// GET /api/time-entries/billable/summary
get('/billable/summary', timeEntryController.getBillableHours);

export default router;
