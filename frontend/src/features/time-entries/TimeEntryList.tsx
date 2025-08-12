import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import { Add, Delete, Edit, PlayArrow, Stop, Timer } from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../../services/api';
import { TimeEntry, Task } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

// Mock data for development
const mockTasks: Task[] = [
  { id: '1', title: 'Project Setup', status: 'in-progress', priority: 'high', createdAt: '2023-05-10T10:00:00Z', updatedAt: '2023-05-10T10:00:00Z', userId: '1' },
  { id: '2', title: 'API Development', status: 'in-progress', priority: 'high', createdAt: '2023-05-11T10:00:00Z', updatedAt: '2023-05-11T10:00:00Z', userId: '1' },
];

const mockTimeEntries: TimeEntry[] = [
  {
    id: '1',
    taskId: '1',
    userId: '1',
    startTime: '2023-05-15T09:00:00Z',
    endTime: '2023-05-15T10:30:00Z',
    duration: 90,
    description: 'Initial project setup',
    billable: true,
    status: 'submitted',
    createdAt: '2023-05-15T10:30:00Z',
    updatedAt: '2023-05-15T10:30:00Z',
  },
  {
    id: '2',
    taskId: '2',
    userId: '1',
    startTime: '2023-05-15T11:00:00Z',
    endTime: '2023-05-15T12:30:00Z',
    duration: 90,
    description: 'Implemented user authentication',
    billable: true,
    status: 'submitted',
    createdAt: '2023-05-15T12:30:00Z',
    updatedAt: '2023-05-15T12:30:00Z',
  },
];

const TimeEntryList: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isTracking, setIsTracking] = useState(false);
  const [currentEntry, setCurrentEntry] = useState<Partial<TimeEntry>>({
    taskId: '',
    description: '',
    billable: true,
  });

  // Fetch time entries
  const { data: timeEntries = [] } = useQuery<TimeEntry[]>({
    queryKey: ['timeEntries'],
    queryFn: () => new Promise(resolve => {
      setTimeout(() => resolve(mockTimeEntries), 500);
    }),
  });

  // Fetch tasks
  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: () => new Promise(resolve => {
      setTimeout(() => resolve(mockTasks), 500);
    }),
  });

  const handleStartTracking = () => {
    if (!currentEntry.taskId) return;
    setIsTracking(true);
    // In a real app, you would start a timer here
  };

  const handleStopTracking = () => {
    if (!isTracking) return;
    // In a real app, you would stop the timer and save the entry
    setIsTracking(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentEntry(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setCurrentEntry(prev => ({
      ...prev,
      [name]: checked,
    }));
  };

  const getTaskName = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    return task ? task.title : 'Unknown Task';
  };

  const formatDateTime = (dateString: string) => {
    return format(parseISO(dateString), 'MMM d, yyyy h:mm a');
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <Box>
      {/* Timer Card */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Track Time
          </Typography>
          
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <FormControl fullWidth margin="normal">
                <InputLabel id="task-select-label">Task</InputLabel>
                <Select
                  labelId="task-select-label"
                  id="taskId"
                  name="taskId"
                  value={currentEntry.taskId}
                  onChange={(e) => setCurrentEntry(prev => ({
                    ...prev,
                    taskId: e.target.value,
                  }))}
                  label="Task"
                  disabled={isTracking}
                >
                  <MenuItem value="">
                    <em>Select a task</em>
                  </MenuItem>
                  {tasks.map((task) => (
                    <MenuItem key={task.id} value={task.id}>
                      {task.title}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={currentEntry.description || ''}
                onChange={handleInputChange}
                margin="normal"
                disabled={isTracking}
                placeholder="What are you working on?"
              />
            </Grid>
            
            <Grid item xs={12} md={2}>
              <FormControlLabel
                control={
                  <Switch
                    name="billable"
                    checked={currentEntry.billable !== false}
                    onChange={handleCheckboxChange}
                    disabled={isTracking}
                  />
                }
                label="Billable"
                labelPlacement="start"
              />
            </Grid>
            
            <Grid item xs={12} md={2} sx={{ textAlign: 'right' }}>
              {isTracking ? (
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<Stop />}
                  onClick={handleStopTracking}
                  fullWidth
                >
                  Stop
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<PlayArrow />}
                  onClick={handleStartTracking}
                  disabled={!currentEntry.taskId}
                  fullWidth
                >
                  Start
                </Button>
              )}
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      
      {/* Time Entries Table */}
      <Paper elevation={2}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flex: 1 }}>
            Time Entries
          </Typography>
          <Button
            variant="outlined"
            startIcon={<Add />}
            onClick={() => {}}
          >
            Add Entry
          </Button>
        </Toolbar>
        
        <Divider />
        
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Task</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Billable</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {timeEntries.map((entry) => (
                <TableRow key={entry.id} hover>
                  <TableCell>{getTaskName(entry.taskId)}</TableCell>
                  <TableCell>{entry.description}</TableCell>
                  <TableCell>{formatDateTime(entry.startTime)}</TableCell>
                  <TableCell>{formatDuration(entry.duration || 0)}</TableCell>
                  <TableCell>
                    <Chip 
                      label={entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                      color={
                        entry.status === 'submitted' ? 'primary' : 
                        entry.status === 'approved' ? 'success' : 
                        entry.status === 'rejected' ? 'error' : 'default'
                      }
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {entry.billable ? (
                      <Chip 
                        label="Billable" 
                        color="success" 
                        size="small" 
                        variant="outlined" 
                      />
                    ) : (
                      <Chip 
                        label="Non-billable" 
                        size="small" 
                        variant="outlined" 
                      />
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edit">
                      <IconButton size="small">
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" color="error">
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default TimeEntryList;
