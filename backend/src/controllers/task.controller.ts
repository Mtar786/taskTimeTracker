import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { TaskModel, TaskInput } from '../models/task.model';
import { TimeEntryModel } from '../models/time-entry.model';

export const createTask = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { projectId, name, description, status, dueDate } = req.body;
    const userId = req.user.id;

    // In a real app, verify user has access to the project
    // This is a simplified example
    const taskData: TaskInput = {
      projectId,
      name,
      description,
      status,
      dueDate
    };

    const task = await TaskModel.create(taskData);
    res.status(201).json(task);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ message: 'Server error while creating task' });
  }
};

export const getTask = async (req: Request, res: Response) => {
  try {
    const taskId = parseInt(req.params.id, 10);
    if (isNaN(taskId)) {
      return res.status(400).json({ message: 'Invalid task ID' });
    }

    const task = await TaskModel.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user has access to this task
    const hasAccess = await TaskModel.userHasAccess(taskId, req.user.id);
    if (!hasAccess) {
      return res.status(403).json({ message: 'Not authorized to access this task' });
    }

    // Get time entries for this task
    const timeEntries = await TimeEntryModel.findByTask(taskId);
    
    res.json({
      ...task,
      timeEntries
    });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ message: 'Server error while fetching task' });
  }
};

export const updateTask = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const taskId = parseInt(req.params.id, 10);
    if (isNaN(taskId)) {
      return res.status(400).json({ message: 'Invalid task ID' });
    }

    // Check if user has access to this task
    const hasAccess = await TaskModel.userHasAccess(taskId, req.user.id);
    if (!hasAccess) {
      return res.status(403).json({ message: 'Not authorized to update this task' });
    }

    const { name, description, status, dueDate } = req.body;
    const updates: Partial<TaskInput> = {
      name,
      description,
      status,
      dueDate
    };

    const updatedTask = await TaskModel.update(taskId, updates);
    if (!updatedTask) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json(updatedTask);
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ message: 'Server error while updating task' });
  }
};

export const deleteTask = async (req: Request, res: Response) => {
  try {
    const taskId = parseInt(req.params.id, 10);
    if (isNaN(taskId)) {
      return res.status(400).json({ message: 'Invalid task ID' });
    }

    // Check if user has access to this task
    const hasAccess = await TaskModel.userHasAccess(taskId, req.user.id);
    if (!hasAccess) {
      return res.status(403).json({ message: 'Not authorized to delete this task' });
    }

    const deleted = await TaskModel.delete(taskId);
    if (!deleted) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ message: 'Server error while deleting task' });
  }
};

export const getProjectTasks = async (req: Request, res: Response) => {
  try {
    const projectId = parseInt(req.params.projectId, 10);
    if (isNaN(projectId)) {
      return res.status(400).json({ message: 'Invalid project ID' });
    }

    // In a real app, verify user has access to the project
    // This is a simplified example
    const tasks = await TaskModel.findByProject(projectId);
    res.json(tasks);
  } catch (error) {
    console.error('Get project tasks error:', error);
    res.status(500).json({ message: 'Server error while fetching project tasks' });
  }
};
