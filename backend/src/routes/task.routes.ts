import express from 'express';
import { auth } from '../middleware/auth.middleware';
import { authorize } from '../middleware/auth.middleware';
import * as taskController from '../controllers/task.controller';
import {
  validateCreateTask,
  validateUpdateTask,
  validateTaskId,
  validateProjectId,
} from '../middleware/task-validation.middleware';

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth);

// Create a new task
// POST /api/tasks
router.post('/', validateCreateTask, taskController.createTask);

// Get a specific task
// GET /api/tasks/:id
router.get('/:id', validateTaskId, taskController.getTask);

// Update a task
// PUT /api/tasks/:id
router.put('/:id', [...validateTaskId, ...validateUpdateTask], taskController.updateTask);

// Delete a task
// DELETE /api/tasks/:id
router.delete('/:id', validateTaskId, taskController.deleteTask);

// Get all tasks for a project
// GET /api/tasks/project/:projectId
router.get('/project/:projectId', validateProjectId, taskController.getProjectTasks);

export default router;
