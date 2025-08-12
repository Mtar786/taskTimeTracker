import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { TimeEntryModel, TimeEntryInput } from '../models/time-entry.model';

export const createTimeEntry = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { taskId, startTime, endTime, durationMinutes, description, isBillable } = req.body;
    const userId = req.user.id;

    // In a real app, verify user has access to the task
    const timeEntryData: TimeEntryInput = {
      taskId,
      startTime: new Date(startTime),
      endTime: endTime ? new Date(endTime) : null,
      durationMinutes: durationMinutes || null,
      description,
      isBillable: isBillable !== false, // Default to true if not specified
      status: 'draft'
    };

    const timeEntry = await TimeEntryModel.create(timeEntryData, userId);
    res.status(201).json(timeEntry);
  } catch (error) {
    console.error('Create time entry error:', error);
    res.status(500).json({ message: 'Server error while creating time entry' });
  }
};

export const getTimeEntry = async (req: Request, res: Response) => {
  try {
    const entryId = parseInt(req.params.id, 10);
    if (isNaN(entryId)) {
      return res.status(400).json({ message: 'Invalid time entry ID' });
    }

    const timeEntry = await TimeEntryModel.findById(entryId);
    if (!timeEntry) {
      return res.status(404).json({ message: 'Time entry not found' });
    }

    // Check if the user owns this time entry
    const isOwner = await TimeEntryModel.userOwnsEntry(entryId, req.user.id);
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view this time entry' });
    }

    res.json(timeEntry);
  } catch (error) {
    console.error('Get time entry error:', error);
    res.status(500).json({ message: 'Server error while fetching time entry' });
  }
};

export const updateTimeEntry = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const entryId = parseInt(req.params.id, 10);
    if (isNaN(entryId)) {
      return res.status(400).json({ message: 'Invalid time entry ID' });
    }

    // Check if the user owns this time entry or is an admin
    const isOwner = await TimeEntryModel.userOwnsEntry(entryId, req.user.id);
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this time entry' });
    }

    const { startTime, endTime, durationMinutes, description, isBillable, status } = req.body;
    
    // Only allow status changes for admin or the owner
    if (status && status !== 'draft' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can change time entry status' });
    }

    const updates: Partial<TimeEntryInput> = {
      startTime: startTime ? new Date(startTime) : undefined,
      endTime: endTime ? new Date(endTime) : undefined,
      durationMinutes,
      description,
      isBillable,
      status
    };

    const updatedEntry = await TimeEntryModel.update(entryId, updates);
    if (!updatedEntry) {
      return res.status(404).json({ message: 'Time entry not found' });
    }

    res.json(updatedEntry);
  } catch (error) {
    console.error('Update time entry error:', error);
    res.status(500).json({ message: 'Server error while updating time entry' });
  }
};

export const deleteTimeEntry = async (req: Request, res: Response) => {
  try {
    const entryId = parseInt(req.params.id, 10);
    if (isNaN(entryId)) {
      return res.status(400).json({ message: 'Invalid time entry ID' });
    }

    // Check if the user owns this time entry or is an admin
    const isOwner = await TimeEntryModel.userOwnsEntry(entryId, req.user.id);
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this time entry' });
    }

    const deleted = await TimeEntryModel.delete(entryId);
    if (!deleted) {
      return res.status(404).json({ message: 'Time entry not found' });
    }

    res.json({ message: 'Time entry deleted successfully' });
  } catch (error) {
    console.error('Delete time entry error:', error);
    res.status(500).json({ message: 'Server error while deleting time entry' });
  }
};

export const getUserTimeEntries = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate, status, page = '1', limit = '50' } = req.query;
    
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 50;
    const offset = (pageNum - 1) * limitNum;

    const { entries, total } = await TimeEntryModel.findByUser(userId, {
      startDate: startDate as string | undefined,
      endDate: endDate as string | undefined,
      status: status as string | undefined,
      limit: limitNum,
      offset
    });

    res.json({
      data: entries,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get user time entries error:', error);
    res.status(500).json({ message: 'Server error while fetching time entries' });
  }
};

export const getBillableHours = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;

    const result = await TimeEntryModel.calculateBillableHours(userId, {
      startDate: startDate as string | undefined,
      endDate: endDate as string | undefined
    });

    res.json(result);
  } catch (error) {
    console.error('Get billable hours error:', error);
    res.status(500).json({ message: 'Server error while calculating billable hours' });
  }
};
