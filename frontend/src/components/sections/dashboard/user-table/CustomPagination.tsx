import { Pagination, PaginationItem, Stack, Typography, SxProps, Theme } from '@mui/material';
import IconifyIcon from 'components/base/IconifyIcon';
import React, { ChangeEvent } from 'react';

interface CustomPaginationProps {
    page: number;
    pageCount: number;
    onPageChange: (event: React.ChangeEvent<unknown>, page: number) => void;
    sx?: SxProps<Theme>;
}

const NavigationButton = ({
                              direction,
                              icon,
                              label
                          }: {
    direction: 'previous' | 'next';
    icon: string;
    label: string;
}) => (
    <Stack direction="row" spacing={0.15} alignItems="center">
        {direction === 'previous' && <IconifyIcon icon={icon} />}
        <Typography
            component="span"
            fontWeight="medium"
            sx={{
                fontSize: { xs: 'caption.fontSize', md: 'body1.fontSize' },
                order: direction === 'next' ? -1 : 0
            }}
        >
            {label}
        </Typography>
        {direction === 'next' && <IconifyIcon icon={icon} />}
    </Stack>
);

const CustomPagination: React.FC<CustomPaginationProps> = ({
                                                               page,
                                                               pageCount,
                                                               onPageChange,
                                                               sx
                                                           }) => {

    return (
        <Stack
            spacing={2}
            sx={{
                justifyContent: 'space-between',
                alignItems: 'end',
                py: 1.5,
                mt: 1.25,
                ...sx,
            }}
        >
            <Pagination
                shape="circular"
                page={page}
                count={pageCount}
                onChange={onPageChange}
                color="primary"
                sx={{ flex: 1, px: 0 }}
                renderItem={(item) => (
                    <PaginationItem
                        {...item}
                        slots={{
                            previous: () => (
                                <NavigationButton
                                    direction="previous"
                                    icon="lets-icons:expand-left"
                                    label="Previous"
                                />
                            ),
                            next: () => (
                                <NavigationButton
                                    direction="next"
                                    icon="lets-icons:expand-right"
                                    label="Next"
                                />
                            ),
                        }}
                    />
                )}
            />
        </Stack>
    );
};

export default CustomPagination;