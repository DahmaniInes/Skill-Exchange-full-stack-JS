import { Button, MenuItem, Select, Stack } from '@mui/material';
import IconifyIcon from 'components/base/IconifyIcon.tsx';
import { useState } from 'react';
import axios from 'axios';

interface ExportButtonProps {
    apiBase: string; // API base URL
    onExportStart?: () => void; // Callback when export starts
    onExportSuccess?: () => void; // Callback when export succeeds
    onExportError?: (error: string) => void; // Callback when export fails
}

const ExportButton = ({ apiBase, onExportStart, onExportSuccess, onExportError }: ExportButtonProps) => {
    const [exportFormat, setExportFormat] = useState('csv'); // Default export format
    const [isLoading, setIsLoading] = useState(false); // Loading state

    const handleExport = async () => {
        setIsLoading(true);
        if (onExportStart) onExportStart();

        try {
            const response = await axios.get(`${apiBase}/api/admin/users/export`, {
                params: { format: exportFormat },
                responseType: 'blob' // Important for handling binary data
            });

            // Create a download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;

            // Set the file name based on the format
            const fileName = `users_export.${exportFormat}`;
            link.setAttribute('download', fileName);

            // Trigger the download
            document.body.appendChild(link);
            link.click();

            // Clean up
            link.remove();
            window.URL.revokeObjectURL(url);

            if (onExportSuccess) onExportSuccess();
        } catch (error: any) {
            console.error('Export failed:', error.response?.data || error.message);
            if (onExportError) onExportError(error.response?.data || error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Stack direction="row" spacing={2} alignItems="center">
            <Select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value)}
                sx={{ minWidth: 120 }}
                disabled={isLoading}
            >
                <MenuItem value="csv">CSV</MenuItem>
                <MenuItem value="pdf">PDF</MenuItem>
            </Select>
            <Button
                variant="outlined"
                onClick={handleExport}
                startIcon={<IconifyIcon icon="material-symbols:download" />}
                disabled={isLoading}
            >
                {isLoading ? 'Exporting...' : 'Export'}
            </Button>
        </Stack>
    );
};

export default ExportButton;