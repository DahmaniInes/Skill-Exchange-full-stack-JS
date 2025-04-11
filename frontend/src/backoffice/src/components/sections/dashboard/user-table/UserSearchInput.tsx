import { IconButton, InputAdornment, Stack, TextField } from '@mui/material';
import IconifyIcon from 'components/base/IconifyIcon';
import { useState } from 'react';

interface SearchInputProps {
    fullWidth: boolean;
    size: 'small' | 'medium';
    value: string; // Add value prop
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; // Add onChange prop
}

const UserSearchInput = ({ fullWidth, size, value, onChange }: SearchInputProps) => {
    return (
        <Stack
            direction="row"
            sx={{
                position: 'relative',
                alignItems: 'center',
                justifyContent: 'center',
                width: 1,
            }}
        >
            <TextField
                fullWidth={fullWidth}
                value={value}
                onChange={onChange}
                placeholder="Search for something"
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <IconButton type="submit">
                                <IconifyIcon icon="mingcute:search-line" color="text.secondary" />
                            </IconButton>
                        </InputAdornment>
                    ),
                }}
                variant="filled"
                size={size}
                sx={{
                    '& .MuiFilledInput-root': {
                        borderRadius: 40,
                    },
                    '&::placeholder': {
                        color: 'text.secondary',
                    },
                }}
            />
        </Stack>
    );
};

export default UserSearchInput;