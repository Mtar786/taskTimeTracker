import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
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
  useTheme,
  CircularProgress,
  InputAdornment,
  Badge,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
} from '@mui/material';
import {
  Add as AddIcon,
  AttachMoney as MoneyIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Edit as EditIcon,
  Email as EmailIcon,
  FilterList as FilterListIcon,
  MoreVert as MoreIcon,
  Paid as PaidIcon,
  Print as PrintIcon,
  Receipt as ReceiptIcon,
  Search as SearchIcon,
  Send as SendIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import * as api from '../../services/api';
import { Invoice, InvoiceStatus, UserRole } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

// Mock data for development
const mockInvoices: Invoice[] = [
  {
    id: 'INV-2023-001',
    clientId: '1',
    clientName: 'Acme Corp',
    number: 'INV-2023-001',
    date: '2023-05-01',
    dueDate: '2023-05-15',
    status: 'paid',
    amount: 2500.00,
    tax: 250.00,
    discount: 0,
    total: 2750.00,
    currency: 'USD',
    notes: 'Project development - May 2023',
    items: [
      { description: 'Web Development', quantity: 50, rate: 50.00, amount: 2500.00 }
    ],
    paymentDate: '2023-05-10T14:30:00Z',
    paymentMethod: 'bank_transfer',
    createdAt: '2023-05-01T10:00:00Z',
    updatedAt: '2023-05-10T14:30:00Z',
  },
  {
    id: 'INV-2023-002',
    clientId: '2',
    clientName: 'Globex Inc',
    number: 'INV-2023-002',
    date: '2023-05-15',
    dueDate: '2023-05-30',
    status: 'sent',
    amount: 3750.00,
    tax: 375.00,
    discount: 0,
    total: 4125.00,
    currency: 'USD',
    notes: 'API Development - May 2023',
    items: [
      { description: 'API Development', quantity: 75, rate: 50.00, amount: 3750.00 }
    ],
    paymentDate: null,
    paymentMethod: null,
    createdAt: '2023-05-15T09:15:00Z',
    updatedAt: '2023-05-15T09:15:00Z',
  },
  {
    id: 'INV-2023-003',
    clientId: '3',
    clientName: 'Soylent Corp',
    number: 'INV-2023-003',
    date: '2023-06-01',
    dueDate: '2023-06-15',
    status: 'draft',
    amount: 2000.00,
    tax: 200.00,
    discount: 0,
    total: 2200.00,
    currency: 'USD',
    notes: 'UI/UX Design - June 2023',
    items: [
      { description: 'UI/UX Design', quantity: 40, rate: 50.00, amount: 2000.00 }
    ],
    paymentDate: null,
    paymentMethod: null,
    createdAt: '2023-06-01T11:20:00Z',
    updatedAt: '2023-06-01T11:20:00Z',
  },
];

const InvoiceList: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // State for filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);

  // Fetch invoices
  const { data: invoices = [], isLoading, isError } = useQuery<Invoice[]>({
    queryKey: ['invoices'],
    queryFn: () => new Promise(resolve => {
      setTimeout(() => resolve(mockInvoices), 500);
    }),
  });

  // Handle status filter change
  const handleStatusFilterChange = (event: SelectChangeEvent) => {
    setStatusFilter(event.target.value);
  };

  // Filter invoices based on filters
  const filteredInvoices = invoices.filter(invoice => {
    // Status filter
    if (statusFilter !== 'all' && invoice.status !== statusFilter) {
      return false;
    }
    
    // Search term filter (in client name, invoice number, or notes)
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const clientMatch = invoice.clientName.toLowerCase().includes(searchLower);
      const numberMatch = invoice.number.toLowerCase().includes(searchLower);
      const notesMatch = invoice.notes?.toLowerCase().includes(searchLower) || false;
      
      if (!clientMatch && !numberMatch && !notesMatch) {
        return false;
      }
    }
    
    return true;
  });

  // Handle invoice actions
  const handleSendInvoice = (id: string) => {
    // In a real app, this would be an API call
    console.log('Sending invoice:', id);
  };

  const handleMarkAsPaid = (id: string) => {
    // In a real app, this would be an API call
    console.log('Marking invoice as paid:', id);
  };

  const handleDownloadInvoice = (id: string) => {
    // In a real app, this would generate and download the invoice PDF
    console.log('Downloading invoice:', id);
  };

  const handlePrintInvoice = (id: string) => {
    // In a real app, this would open the print dialog for the invoice
    console.log('Printing invoice:', id);
  };

  const handleDeleteInvoice = (id: string) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      // In a real app, this would be an API call
      console.log('Deleting invoice:', id);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Get status chip color
  const getStatusColor = (status: InvoiceStatus) => {
    switch (status) {
      case 'draft':
        return 'default';
      case 'sent':
        return 'primary';
      case 'paid':
        return 'success';
      case 'overdue':
        return 'error';
      default:
        return 'default';
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" my={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box p={3}>
        <Alert severity="error">
          Failed to load invoices. Please try again later.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Filters and Actions */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={5}>
              <TextField
                fullWidth
                variant="outlined"
                size="small"
                placeholder="Search invoices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel id="status-filter-label">Status</InputLabel>
                <Select
                  labelId="status-filter-label"
                  id="status-filter"
                  value={statusFilter}
                  label="Status"
                  onChange={handleStatusFilterChange}
                >
                  <MenuItem value="all">All Statuses</MenuItem>
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="sent">Sent</MenuItem>
                  <MenuItem value="paid">Paid</MenuItem>
                  <MenuItem value="overdue">Overdue</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={4} sx={{ textAlign: 'right' }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => {
                  // In a real app, this would navigate to create invoice page
                  console.log('Create new invoice');
                }}
              >
                New Invoice
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      
      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Invoices
              </Typography>
              <Box display="flex" alignItems="center">
                <ReceiptIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h4">
                  {invoices.length}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Amount Pending
              </Typography>
              <Box display="flex" alignItems="center">
                <MoneyIcon color="warning" sx={{ mr: 1 }} />
                <Typography variant="h4">
                  {formatCurrency(4125.00)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Amount Paid
              </Typography>
              <Box display="flex" alignItems="center">
                <PaidIcon color="success" sx={{ mr: 1 }} />
                <Typography variant="h4">
                  {formatCurrency(2750.00)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Overdue
              </Typography>
              <Box display="flex" alignItems="center">
                <MoneyIcon color="error" sx={{ mr: 1 }} />
                <Typography variant="h4">
                  {formatCurrency(0.00)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Invoices List */}
      <Paper elevation={2}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Invoice #</TableCell>
                <TableCell>Client</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Due Date</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredInvoices.length > 0 ? (
                filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {invoice.number}
                      </Typography>
                      {invoice.notes && (
                        <Typography variant="caption" color="textSecondary" noWrap>
                          {invoice.notes}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{invoice.clientName}</TableCell>
                    <TableCell>{format(parseISO(invoice.date), 'MMM d, yyyy')}</TableCell>
                    <TableCell>{format(parseISO(invoice.dueDate), 'MMM d, yyyy')}</TableCell>
                    <TableCell align="right">{formatCurrency(invoice.total)}</TableCell>
                    <TableCell>
                      <Chip 
                        label={invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                        color={getStatusColor(invoice.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Box display="flex" gap={1} justifyContent="flex-end">
                        <Tooltip title="View">
                          <IconButton size="small" color="primary">
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        
                        {invoice.status === 'draft' && (
                          <Tooltip title="Edit">
                            <IconButton size="small">
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        
                        {invoice.status !== 'paid' && (
                          <Tooltip title="Send">
                            <IconButton 
                              size="small" 
                              color="primary"
                              onClick={() => handleSendInvoice(invoice.id)}
                            >
                              <SendIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        
                        <Tooltip title="Download">
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => handleDownloadInvoice(invoice.id)}
                          >
                            <DownloadIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Print">
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => handlePrintInvoice(invoice.id)}
                          >
                            <PrintIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        
                        {invoice.status !== 'paid' && (
                          <Tooltip title="Mark as Paid">
                            <IconButton 
                              size="small" 
                              color="success"
                              onClick={() => handleMarkAsPaid(invoice.id)}
                            >
                              <CheckIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        
                        <Tooltip title="Delete">
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => handleDeleteInvoice(invoice.id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      No invoices found matching your criteria.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default InvoiceList;
