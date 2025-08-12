import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Card, 
  CardContent, 
  Checkbox, 
  Chip, 
  Divider, 
  FormControl, 
  Grid, 
  IconButton, 
  InputLabel, 
  MenuItem, 
  Paper, 
  Select, 
  SelectChangeEvent, 
  Stack, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TablePagination, 
  TableRow, 
  TextField, 
  Toolbar, 
  Tooltip, 
  Typography,
  useTheme,
} from '@mui/material';
import { 
  Add as AddIcon, 
  Delete as DeleteIcon, 
  Edit as EditIcon, 
  FilterList as FilterListIcon, 
  Search as SearchIcon,
  Sort as SortIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import * as api from '../../services/api';
import { Task, TaskStatus, TaskPriority } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

const statusOptions = [
  { value: 'todo', label: 'To Do' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
];

const priorityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

const TaskList: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // State for pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // State for filters and sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('dueDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // State for new task form
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    dueDate: format(new Date(), 'yyyy-MM-dd'),
  });

  // Fetch tasks
  const { data: tasks = [], isLoading, isError } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => {
      // In a real app, this would be an API call with filters
      return new Promise<Partial<Task>[]>(resolve => {
        setTimeout(() => {
          resolve([
            {
              id: '1',
              title: 'Implement task list UI',
              description: 'Create a responsive task list with filtering and sorting',
              status: 'done',
              priority: 'high',
              dueDate: '2023-05-15',
              createdAt: '2023-05-10T10:00:00Z',
              updatedAt: '2023-05-15T15:30:00Z',
            },
            {
              id: '2',
              title: 'Add task creation form',
              description: 'Implement a form to add new tasks',
              status: 'in-progress',
              priority: 'high',
              dueDate: '2023-05-20',
              createdAt: '2023-05-12T14:20:00Z',
              updatedAt: '2023-05-16T09:15:00Z',
            },
            {
              id: '3',
              title: 'Set up task filtering',
              description: 'Add filters for status, priority, and search',
              status: 'todo',
              priority: 'medium',
              dueDate: '2023-05-18',
              createdAt: '2023-05-14T11:45:00Z',
              updatedAt: '2023-05-14T11:45:00Z',
            },
          ]);
        }, 500);
      });
    },
  });

  // Filter and sort tasks
  const filteredTasks = React.useMemo(() => {
    return tasks.filter(task => {
      // Apply search filter
      const matchesSearch = 
        task.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Apply status filter
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
      
      // Apply priority filter
      const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
      
      return matchesSearch && matchesStatus && matchesPriority;
    }).sort((a, b) => {
      // Apply sorting
      if (!sortBy) return 0;
      
      let comparison = 0;
      
      if (sortBy === 'dueDate') {
        const dateA = a.dueDate ? new Date(a.dueDate).getTime() : 0;
        const dateB = b.dueDate ? new Date(b.dueDate).getTime() : 0;
        comparison = dateA - dateB;
      } else if (sortBy === 'priority') {
        const priorityOrder = { low: 1, medium: 2, high: 3 };
        const priorityA = a.priority ? priorityOrder[a.priority as keyof typeof priorityOrder] || 0 : 0;
        const priorityB = b.priority ? priorityOrder[b.priority as keyof typeof priorityOrder] || 0 : 0;
        comparison = priorityA - priorityB;
      } else {
        // Default string comparison for other fields
        const valueA = String(a[sortBy as keyof typeof a] || '').toLowerCase();
        const valueB = String(b[sortBy as keyof typeof b] || '').toLowerCase();
        comparison = valueA.localeCompare(valueB);
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [tasks, searchTerm, statusFilter, priorityFilter, sortBy, sortOrder]);

  // Pagination
  const paginatedTasks = React.useMemo(() => {
    return filteredTasks.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [filteredTasks, page, rowsPerPage]);

  // Handle pagination
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle sorting
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  // Handle task status toggle
  const toggleTaskStatus = async (taskId: string, currentStatus: TaskStatus) => {
    try {
      // In a real app, this would be an API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update the status in the local cache
      queryClient.setQueryData(['tasks'], (oldTasks: any) => {
        return oldTasks.map((task: any) => 
          task.id === taskId 
            ? { 
                ...task, 
                status: currentStatus === 'done' ? 'todo' : 'done',
                updatedAt: new Date().toISOString() 
              } 
            : task
        );
      });
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  // Handle new task form
  const handleNewTaskChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewTask(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddTask = async () => {
    if (!newTask.title) return;
    
    try {
      // In a real app, this would be an API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const taskToAdd = {
        ...newTask,
        id: `task-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      // Add the new task to the local cache
      queryClient.setQueryData(['tasks'], (oldTasks: any) => [taskToAdd, ...oldTasks]);
      
      // Reset the form
      setNewTask({
        title: '',
        description: '',
        status: 'todo',
        priority: 'medium',
        dueDate: format(new Date(), 'yyyy-MM-dd'),
      });
      setIsAddingTask(false);
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  // Handle task deletion
  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    
    try {
      // In a real app, this would be an API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Remove the task from the local cache
      queryClient.setQueryData(['tasks'], (oldTasks: any) => 
        oldTasks.filter((task: any) => task.id !== taskId)
      );
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  // Get priority color
  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  // Get status color
  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'done':
        return 'success';
      case 'in-progress':
        return 'info';
      case 'todo':
      default:
        return 'default';
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box p={3}>
        <Alert severity="error">
          Failed to load tasks. Please try again later.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Toolbar 
        sx={{ 
          pl: { sm: 2 },
          pr: { xs: 1, sm: 1 },
          display: 'flex',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Typography variant="h6" component="h2">
          Tasks
        </Typography>
        
        <Box display="flex" gap={2} flexWrap="wrap">
          <TextField
            size="small"
            placeholder="Search tasks..."
            variant="outlined"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
            }}
          />
          
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="status-filter-label">Status</InputLabel>
            <Select
              labelId="status-filter-label"
              id="status-filter"
              value={statusFilter}
              label="Status"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="all">All Statuses</MenuItem>
              {statusOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="priority-filter-label">Priority</InputLabel>
            <Select
              labelId="priority-filter-label"
              id="priority-filter"
              value={priorityFilter}
              label="Priority"
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <MenuItem value="all">All Priorities</MenuItem>
              {priorityOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => setIsAddingTask(true)}
          >
            Add Task
          </Button>
        </Box>
      </Toolbar>
      
      <Divider sx={{ mb: 3 }} />
      
      {/* Add Task Form */}
      {isAddingTask && (
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Add New Task
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Title"
                name="title"
                value={newTask.title}
                onChange={handleNewTaskChange}
                required
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Due Date"
                name="dueDate"
                type="date"
                value={newTask.dueDate}
                onChange={handleNewTaskChange}
                InputLabelProps={{
                  shrink: true,
                }}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={newTask.description}
                onChange={handleNewTaskChange}
                multiline
                rows={3}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel id="status-label">Status</InputLabel>
                <Select
                  labelId="status-label"
                  name="status"
                  value={newTask.status}
                  onChange={(e) => setNewTask(prev => ({
                    ...prev,
                    status: e.target.value as TaskStatus
                  }))}
                  label="Status"
                >
                  {statusOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel id="priority-label">Priority</InputLabel>
                <Select
                  labelId="priority-label"
                  name="priority"
                  value={newTask.priority}
                  onChange={(e) => setNewTask(prev => ({
                    ...prev,
                    priority: e.target.value as TaskPriority
                  }))}
                  label="Priority"
                >
                  {priorityOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button 
                variant="outlined" 
                onClick={() => {
                  setIsAddingTask(false);
                  setNewTask({
                    title: '',
                    description: '',
                    status: 'todo',
                    priority: 'medium',
                    dueDate: format(new Date(), 'yyyy-MM-dd'),
                  });
                }}
              >
                Cancel
              </Button>
              <Button 
                variant="contained" 
                color="primary"
                onClick={handleAddTask}
                disabled={!newTask.title}
              >
                Add Task
              </Button>
            </Grid>
          </Grid>
        </Paper>
      )}
      
      {/* Tasks Table */}
      <TableContainer component={Paper} elevation={2}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  color="primary"
                  indeterminate={false}
                  checked={false}
                  onChange={() => {}}
                />
              </TableCell>
              <TableCell>
                <Box display="flex" alignItems="center" sx={{ cursor: 'pointer' }} onClick={() => handleSort('title')}>
                  Title
                  <SortIcon 
                    color={sortBy === 'title' ? 'primary' : 'inherit'} 
                    sx={{ 
                      opacity: sortBy === 'title' ? 1 : 0.3,
                      transform: sortBy === 'title' && sortOrder === 'desc' ? 'rotate(180deg)' : 'none',
                      ml: 1,
                    }} 
                  />
                </Box>
              </TableCell>
              <TableCell>Description</TableCell>
              <TableCell>
                <Box display="flex" alignItems="center" sx={{ cursor: 'pointer' }} onClick={() => handleSort('status')}>
                  Status
                  <SortIcon 
                    color={sortBy === 'status' ? 'primary' : 'inherit'} 
                    sx={{ 
                      opacity: sortBy === 'status' ? 1 : 0.3,
                      transform: sortBy === 'status' && sortOrder === 'desc' ? 'rotate(180deg)' : 'none',
                      ml: 1,
                    }} 
                  />
                </Box>
              </TableCell>
              <TableCell>
                <Box display="flex" alignItems="center" sx={{ cursor: 'pointer' }} onClick={() => handleSort('priority')}>
                  Priority
                  <SortIcon 
                    color={sortBy === 'priority' ? 'primary' : 'inherit'} 
                    sx={{ 
                      opacity: sortBy === 'priority' ? 1 : 0.3,
                      transform: sortBy === 'priority' && sortOrder === 'desc' ? 'rotate(180deg)' : 'none',
                      ml: 1,
                    }} 
                  />
                </Box>
              </TableCell>
              <TableCell>
                <Box display="flex" alignItems="center" sx={{ cursor: 'pointer' }} onClick={() => handleSort('dueDate')}>
                  Due Date
                  <SortIcon 
                    color={sortBy === 'dueDate' ? 'primary' : 'inherit'} 
                    sx={{ 
                      opacity: sortBy === 'dueDate' ? 1 : 0.3,
                      transform: sortBy === 'dueDate' && sortOrder === 'desc' ? 'rotate(180deg)' : 'none',
                      ml: 1,
                    }} 
                  />
                </Box>
              </TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedTasks.length > 0 ? (
              paginatedTasks.map((task) => (
                <TableRow key={task.id} hover>
                  <TableCell padding="checkbox">
                    <Checkbox
                      color="primary"
                      checked={task.status === 'done'}
                      onChange={() => task.id && toggleTaskStatus(task.id, task.status || 'todo')}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        textDecoration: task.status === 'done' ? 'line-through' : 'none',
                        color: task.status === 'done' ? 'text.secondary' : 'text.primary',
                      }}
                    >
                      {task.title}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      sx={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {task.description}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={statusOptions.find(s => s.value === task.status)?.label || task.status}
                      color={getStatusColor(task.status || 'todo')}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={priorityOptions.find(p => p.value === task.priority)?.label || task.priority}
                      color={getPriorityColor(task.priority || 'medium')}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {task.dueDate ? format(new Date(task.dueDate), 'MMM d, yyyy') : 'No due date'}
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <Tooltip title="Edit">
                        <IconButton size="small" color="primary">
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => task.id && handleDeleteTask(task.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    No tasks found. {searchTerm ? 'Try adjusting your search.' : 'Create a new task to get started.'}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        
        {filteredTasks.length > 0 && (
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredTasks.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        )}
      </TableContainer>
      
      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mt: 1 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Tasks
              </Typography>
              <Typography variant="h4">{tasks.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                In Progress
              </Typography>
              <Typography variant="h4">
                {tasks.filter(t => t.status === 'in-progress').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Completed
              </Typography>
              <Typography variant="h4">
                {tasks.filter(t => t.status === 'done').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TaskList;
