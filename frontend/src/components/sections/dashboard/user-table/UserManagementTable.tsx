import {
    Box, Button,
    Card,
    Dialog, DialogActions, DialogContent,
    DialogTitle,
    IconButton,
    Stack,
    Tab,
    Tabs,
    TextField,
    Tooltip,
    Typography
} from '@mui/material';
import {
    DataGrid,
    GridColDef,
    GridPaginationModel,
} from '@mui/x-data-grid';
import CustomPagination from 'components/sections/dashboard/user-table/CustomPagination.tsx';
import NoData from 'components/sections/dashboard/user-table/NoData.tsx';
import { dateFormatFromUTC } from 'helpers/utils';
import { useBreakpoints } from 'providers/useBreakpoints';
import { useCallback, useEffect, useState } from 'react';
import axios from "axios";
import IconifyIcon from 'components/base/IconifyIcon.tsx';
import UserSearchInput from "components/sections/dashboard/user-table/UserSearchInput.tsx";
import ExportButton from "components/sections/dashboard/user-table/ExportButton.tsx";

interface UserData {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    role: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

const UserManagementTable: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [allItems, setAllItems] = useState<UserData[]>([]);
    const [total, setTotal] = useState(0);
    const [tabValue, setTabValue] = useState(0);
    const [search, setSearch] = useState('');
    const { down } = useBreakpoints();
    const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
    const [editOpen, setEditOpen] = useState(false);
    const [formData, setFormData] = useState<Partial<UserData>>({});

    const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
        page: 0,
        pageSize: 5,
    });

    const columns: GridColDef[] = [
        { field: 'firstName', headerName: 'First Name', flex: 1, minWidth: 150 },
        { field: 'lastName', headerName: 'Last Name', flex: 1, minWidth: 150 },
        { field: 'email', headerName: 'Email', flex: 1, minWidth: 250 },
        { field: 'phone', headerName: 'Phone', flex: 1, minWidth: 150 },
        {
            field: 'createdAt',
            headerName: 'Created At',
            flex: 1,
            minWidth: 180,
            renderCell: (params) => dateFormatFromUTC(params.value)
        },
        {
            field: 'actions',
            headerName: 'Actions',
            flex: 1,
            minWidth: 150,
            sortable: false,
            filterable: false,
            disableColumnMenu: true,
            renderCell: (params) => (
                <Stack direction="row" spacing={1}>
                    <Tooltip title="Edit user">
                        <IconButton
                            color="primary"
                            onClick={() => handleEditClick(params.row)}
                            aria-label="Edit user"
                        >
                            <IconifyIcon icon="material-symbols:edit-outline" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete user">
                        <IconButton
                            color="error"
                            onClick={() => handleDeleteUser(params.row._id)}
                            aria-label="Delete user"
                        >
                            <IconifyIcon icon="material-symbols:delete-outline" />
                        </IconButton>
                    </Tooltip>
                </Stack>
            ),
        },
    ];

    const rowHeight = down('sm') ? 55 : 64;

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params: any = {
                search,
                page: paginationModel.page + 1,
                pageSize: paginationModel.pageSize,
                sortField: 'createdAt',
                sortOrder: 'desc'
            };

            // Add filtering based on tab selection
            if (tabValue === 1) {
                // Active Users tab
                params.isActive = true;
            } else if (tabValue === 2) {
                // Inactive Users tab
                params.isActive = false;
            }

            console.log('Fetching users with params:', params); // Debugging

            const response = await axios.get(`${API_BASE}/api/admin/users`, { params });
            console.log('API response:', response.data); // Debugging

            setAllItems(response.data.data);
            setTotal(response.data.total || response.data.pagination?.total || 0);
        } catch (error: any) {
            console.error('Error fetching users:', error.response?.data || error.message);
        } finally {
            setLoading(false);
        }
    }, [tabValue, search, paginationModel.page, paginationModel.pageSize]);

    useEffect(() => {
        const debounceTimer = setTimeout(fetchData, 300);
        return () => clearTimeout(debounceTimer);
    }, [fetchData]);

    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
        // Reset pagination when changing tabs
        setPaginationModel({
            page: 0,
            pageSize: paginationModel.pageSize
        });
    };

    const handleEditClick = (user: UserData) => {
        setSelectedUser(user);
        setFormData({ ...user });
        setEditOpen(true);
    };

    const handleDeleteUser = async (userId: string) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            try {
                await axios.delete(`${API_BASE}/api/admin/users/${userId}`);
                await fetchData();
            } catch (error: any) {
                console.error('Delete failed:', error.response?.data || error.message);
            }
        }
    };

    const handleUpdateUser = async () => {
        if (!selectedUser) return;

        try {
            await axios.put(
                `${API_BASE}/api/admin/users/${selectedUser._id}`,
                formData
            );
            setEditOpen(false);
            fetchData();
        } catch (error: any) {
            console.error('Update failed:', error.response?.data || error.message);
        }
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    return (
        <Stack sx={{ overflow: 'auto', height: '100%' }}>
            <Box sx={{ mb: 1.5, mt: 3 }}>
                <Typography variant="h4" fontWeight={600}>
                    User Management
                </Typography>
            </Box>

            {/* Search Input */}
            <Box sx={{ mb: 2, maxWidth: 400 }}>
                <UserSearchInput fullWidth size="medium" value={search} onChange={(e) => setSearch(e.target.value)} />
            </Box>

            {/* Tabs for Filtering */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                <Tabs value={tabValue} onChange={handleTabChange}>
                    <Tab label="All Users" />
                    <Tab label="Active Users" />
                    <Tab label="Inactive Users" />
                </Tabs>
            </Box>

            {/* DataGrid for Displaying Users */}
            <Card sx={{ flex: 1, minHeight: 400 }}>
                <DataGrid
                    getRowId={(row) => row._id}
                    rowHeight={rowHeight}
                    rows={allItems}
                    columns={columns}
                    rowCount={total}
                    loading={loading}
                    paginationMode="server"
                    paginationModel={paginationModel}
                    onPaginationModelChange={setPaginationModel}
                    slots={{
                        noRowsOverlay: NoData,
                        pagination: () => null,
                    }}
                    sx={{
                        border: 'none',
                        '& .MuiDataGrid-columnHeaders': {
                            backgroundColor: 'background.paper',
                        },
                    }}
                />
            </Card>

            {/* Export and Pagination Controls */}
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {/* Export Button with Dropdown (Left) */}
                <ExportButton
                    apiBase={API_BASE}
                    onExportStart={() => console.log('Export started...')}
                    onExportSuccess={() => console.log('Export succeeded!')}
                    onExportError={(error) => console.error('Export failed:', error)}
                />

                {/* Custom Pagination (Right) */}
                <CustomPagination
                    page={paginationModel.page + 1}
                    pageCount={Math.ceil(total / paginationModel.pageSize)}
                    onPageChange={(_event: React.ChangeEvent<unknown>, newPage: number) => {
                        setPaginationModel((prev) => ({
                            ...prev,
                            page: newPage - 1
                        }));
                    }}
                />
            </Box>
        </Stack>
    );
};

export default UserManagementTable;