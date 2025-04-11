import { Box, Stack } from '@mui/material';
import MainNavbar from './appbar/Appbar';
import Footer from './footer/Footer';
import MobileSidebar from './sidebar/MobileSidebar';
import Sidebar from './sidebar/Sidebar';
import { PropsWithChildren, useState } from 'react';

const drawerWidth = { lg: 250, md: 240, sm: 230 };

const BackOfficeLayout = ({ children }: PropsWithChildren) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const handleDrawerClose = () => {
    setIsClosing(true);
    setMobileOpen(false);
  };

  const handleDrawerTransitionEnd = () => {
    setIsClosing(false);
  };

  const handleDrawerToggle = () => {
    if (!isClosing) {
      setMobileOpen(!mobileOpen);
    }
  };
  return (
    <>
      <Box sx={{ display: 'flex' }}>
        <Sidebar drawerWidth={drawerWidth} />
        <MobileSidebar
          onDrawerClose={handleDrawerClose}
          onDrawerTransitionEnd={handleDrawerTransitionEnd}
          mobileOpen={mobileOpen}
          drawerWidth={drawerWidth.lg}
        />

        <Stack
          sx={{
            display: 'flex',
            flexGrow: 1,
            width: 1,
            maxWidth: {
              xs: 1,
              md: `calc(100% - ${drawerWidth.md}px)`,
              lg: `calc(100% - ${drawerWidth.lg}px)`,
            },
            justifyContent: 'space-between',
          }}
        >
          <MainNavbar onDrawerToggle={handleDrawerToggle} />
          <Stack
            sx={{
              backgroundColor: { xs: 'common.white', md: 'background.paper' },
              px: { xs: 3.15, md: 5, xl: 7 },
              flex: 1,
              gap: 1,
            }}
          >
            {children}
            <Footer />
          </Stack>
        </Stack>
      </Box>
    </>
  );
};

export default BackOfficeLayout;
