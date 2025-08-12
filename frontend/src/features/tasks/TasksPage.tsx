import React from 'react';
import { Box, Container, Typography } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import TaskList from './TaskList';
import ProtectedRoute from '../../components/ProtectedRoute';

const TasksPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <ProtectedRoute>
      <Container maxWidth={false} sx={{ py: 4 }}>
        <Box mb={4}>
          <Typography variant="h4" component="h1" gutterBottom>
            Task Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your tasks, track progress, and stay organized.
          </Typography>
        </Box>
        
        <TaskList />
      </Container>
    </ProtectedRoute>
  );
};

export default TasksPage;
