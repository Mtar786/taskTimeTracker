import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { TimesheetModel, Timesheet, TimesheetFilter } from '../models/timesheet.model';

export const createTimesheet = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { startDate, endDate, notes, timeEntryIds = [] } = req.body;
    const userId = req.user.id;

    const timesheetData = {
      userId,
      startDate,
      endDate,
      notes,
      status: 'draft' as const,
      timeEntryIds
    };

    const timesheet = await TimesheetModel.create(timesheetData);
    res.status(201).json(timesheet);
  } catch (error) {
    console.error('Create timesheet error:', error);
    res.status(500).json({ message: 'Server error while creating timesheet' });
  }
};

export const getTimesheet = async (req: Request, res: Response) => {
  try {
    const timesheetId = parseInt(req.params.id, 10);
    if (isNaN(timesheetId)) {
      return res.status(400).json({ message: 'Invalid timesheet ID' });
    }

    const timesheet = await TimesheetModel.findById(timesheetId);
    if (!timesheet) {
      return res.status(404).json({ message: 'Timesheet not found' });
    }

    // Check if user is the owner or an admin
    if (timesheet.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view this timesheet' });
    }

    res.json(timesheet);
  } catch (error) {
    console.error('Get timesheet error:', error);
    res.status(500).json({ message: 'Server error while fetching timesheet' });
  }
};

export const getUserTimesheets = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const { status, startDate, endDate, page = '1', limit = '20' } = req.query;

    const filter: TimesheetFilter = {
      userId: req.user.role === 'admin' ? undefined : userId,
      status: status as string | undefined,
      startDate: startDate as string | undefined,
      endDate: endDate as string | undefined,
      page: parseInt(page as string, 10) || 1,
      limit: parseInt(limit as string, 10) || 20
    };

    const { timesheets, total } = await TimesheetModel.findAll(filter);
    
    res.json({
      data: timesheets,
      pagination: {
        total,
        page: filter.page,
        limit: filter.limit,
        totalPages: Math.ceil(total / (filter.limit || 20))
      }
    });
  } catch (error) {
    console.error('Get user timesheets error:', error);
    res.status(500).json({ message: 'Server error while fetching timesheets' });
  }
};

export const updateTimesheet = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const timesheetId = parseInt(req.params.id, 10);
    if (isNaN(timesheetId)) {
      return res.status(400).json({ message: 'Invalid timesheet ID' });
    }

    // Get the timesheet to check permissions
    const existingTimesheet = await TimesheetModel.findById(timesheetId);
    if (!existingTimesheet) {
      return res.status(404).json({ message: 'Timesheet not found' });
    }

    // Only the owner can update their own timesheet
    if (existingTimesheet.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this timesheet' });
    }

    // Only allow updates to draft timesheets
    if (existingTimesheet.status !== 'draft') {
      return res.status(400).json({ message: 'Only draft timesheets can be updated' });
    }

    const { startDate, endDate, notes, timeEntryIds } = req.body;
    
    // In a real app, you would update the timesheet details here
    // For simplicity, we'll just return the existing timesheet
    // In a real implementation, you would call TimesheetModel.update()
    
    res.json(existingTimesheet);
  } catch (error) {
    console.error('Update timesheet error:', error);
    res.status(500).json({ message: 'Server error while updating timesheet' });
  }
};

export const submitTimesheet = async (req: Request, res: Response) => {
  try {
    const timesheetId = parseInt(req.params.id, 10);
    if (isNaN(timesheetId)) {
      return res.status(400).json({ message: 'Invalid timesheet ID' });
    }

    // Get the timesheet to check permissions
    const timesheet = await TimesheetModel.findById(timesheetId);
    if (!timesheet) {
      return res.status(404).json({ message: 'Timesheet not found' });
    }

    // Only the owner can submit their own timesheet
    if (timesheet.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to submit this timesheet' });
    }

    // Only allow submission of draft timesheets
    if (timesheet.status !== 'draft') {
      return res.status(400).json({ message: 'Only draft timesheets can be submitted' });
    }

    // Submit the timesheet
    const updatedTimesheet = await TimesheetModel.updateStatus(
      timesheetId,
      'submitted',
      req.user.id,
      req.body.notes
    );

    if (!updatedTimesheet) {
      return res.status(404).json({ message: 'Timesheet not found' });
    }

    res.json(updatedTimesheet);
  } catch (error) {
    console.error('Submit timesheet error:', error);
    res.status(500).json({ message: 'Server error while submitting timesheet' });
  }
};

export const approveTimesheet = async (req: Request, res: Response) => {
  try {
    const timesheetId = parseInt(req.params.id, 10);
    if (isNaN(timesheetId)) {
      return res.status(400).json({ message: 'Invalid timesheet ID' });
    }

    // Only admins can approve timesheets
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only administrators can approve timesheets' });
    }

    // Approve the timesheet
    const updatedTimesheet = await TimesheetModel.updateStatus(
      timesheetId,
      'approved',
      req.user.id,
      req.body.notes
    );

    if (!updatedTimesheet) {
      return res.status(404).json({ message: 'Timesheet not found' });
    }

    res.json(updatedTimesheet);
  } catch (error) {
    console.error('Approve timesheet error:', error);
    res.status(500).json({ message: 'Server error while approving timesheet' });
  }
};

export const rejectTimesheet = async (req: Request, res: Response) => {
  try {
    const timesheetId = parseInt(req.params.id, 10);
    if (isNaN(timesheetId)) {
      return res.status(400).json({ message: 'Invalid timesheet ID' });
    }

    // Only admins can reject timesheets
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only administrators can reject timesheets' });
    }

    const { notes } = req.body;
    if (!notes) {
      return res.status(400).json({ message: 'Rejection reason is required' });
    }

    // Reject the timesheet
    const updatedTimesheet = await TimesheetModel.updateStatus(
      timesheetId,
      'rejected',
      req.user.id,
      notes
    );

    if (!updatedTimesheet) {
      return res.status(404).json({ message: 'Timesheet not found' });
    }

    res.json(updatedTimesheet);
  } catch (error) {
    console.error('Reject timesheet error:', error);
    res.status(500).json({ message: 'Server error while rejecting timesheet' });
  }
};

export const getTimesheetEntries = async (req: Request, res: Response) => {
  try {
    // Only admins can view all entries
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only administrators can view all timesheet entries' });
    }

    const { userId, projectId, clientId, startDate, endDate, status } = req.query;
    
    const entries = await TimesheetModel.getTimeEntriesForApproval({
      userId: userId ? parseInt(userId as string, 10) : undefined,
      projectId: projectId ? parseInt(projectId as string, 10) : undefined,
      clientId: clientId ? parseInt(clientId as string, 10) : undefined,
      startDate: startDate as string | undefined,
      endDate: endDate as string | undefined,
      status: status as string | undefined
    });

    res.json(entries);
  } catch (error) {
    console.error('Get timesheet entries error:', error);
    res.status(500).json({ message: 'Server error while fetching timesheet entries' });
  }
};

export const addTimeEntriesToTimesheet = async (req: Request, res: Response) => {
  try {
    const timesheetId = parseInt(req.params.id, 10);
    if (isNaN(timesheetId)) {
      return res.status(400).json({ message: 'Invalid timesheet ID' });
    }

    const { timeEntryIds } = req.body;
    if (!Array.isArray(timeEntryIds) || timeEntryIds.length === 0) {
      return res.status(400).json({ message: 'Time entry IDs are required' });
    }

    // Get the timesheet to check permissions
    const timesheet = await TimesheetModel.findById(timesheetId);
    if (!timesheet) {
      return res.status(404).json({ message: 'Timesheet not found' });
    }

    // Only the owner can add entries to their own timesheet
    if (timesheet.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to modify this timesheet' });
    }

    // Only allow updates to draft timesheets
    if (timesheet.status !== 'draft') {
      return res.status(400).json({ message: 'Only draft timesheets can be modified' });
    }

    // Add the time entries to the timesheet
    const success = await TimesheetModel.addTimeEntries(timesheetId, timeEntryIds);
    if (!success) {
      return res.status(400).json({ message: 'Failed to add time entries to timesheet' });
    }

    // Return the updated timesheet
    const updatedTimesheet = await TimesheetModel.findById(timesheetId);
    res.json(updatedTimesheet);
  } catch (error) {
    console.error('Add time entries to timesheet error:', error);
    res.status(500).json({ message: 'Server error while adding time entries to timesheet' });
  }
};

export const removeTimeEntriesFromTimesheet = async (req: Request, res: Response) => {
  try {
    const timesheetId = parseInt(req.params.id, 10);
    if (isNaN(timesheetId)) {
      return res.status(400).json({ message: 'Invalid timesheet ID' });
    }

    const { timeEntryIds } = req.body;
    if (!Array.isArray(timeEntryIds) || timeEntryIds.length === 0) {
      return res.status(400).json({ message: 'Time entry IDs are required' });
    }

    // Get the timesheet to check permissions
    const timesheet = await TimesheetModel.findById(timesheetId);
    if (!timesheet) {
      return res.status(404).json({ message: 'Timesheet not found' });
    }

    // Only the owner can remove entries from their own timesheet
    if (timesheet.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to modify this timesheet' });
    }

    // Only allow updates to draft timesheets
    if (timesheet.status !== 'draft') {
      return res.status(400).json({ message: 'Only draft timesheets can be modified' });
    }

    // Remove the time entries from the timesheet
    const success = await TimesheetModel.removeTimeEntries(timesheetId, timeEntryIds);
    if (!success) {
      return res.status(400).json({ message: 'Failed to remove time entries from timesheet' });
    }

    // Return the updated timesheet
    const updatedTimesheet = await TimesheetModel.findById(timesheetId);
    res.json(updatedTimesheet);
  } catch (error) {
    console.error('Remove time entries from timesheet error:', error);
    res.status(500).json({ message: 'Server error while removing time entries from timesheet' });
  }
};
