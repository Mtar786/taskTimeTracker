import React from 'react';
import { Container, Typography, Box } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import TimeEntryList from './TimeEntryList';
import ProtectedRoute from '../../components/ProtectedRoute';

const TimeEntriesPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <ProtectedRoute>
      <Container maxWidth={false} sx={{ py: 4 }}>
        <Box mb={4}>
          <Typography variant="h4" component="h1" gutterBottom>
            Time Entries
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Track and manage your time entries. Start the timer to track time in real-time or add entries manually.
          </Typography>
        </Box>
        
        <TimeEntryList />
      </Container>
    </ProtectedRoute>
  );
};

export default TimeEntriesPage;
