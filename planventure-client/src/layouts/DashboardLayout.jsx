import { useState } from 'react';
import { useSelector } from 'react-redux';
import { 
  Box, 
  Drawer, 
  List, 
  ListItem,
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  IconButton,
  useTheme,
  useMediaQuery,
  Divider,
  Typography
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Map as MapIcon,
  ListAlt as ListAltIcon,
  Settings as SettingsIcon,
  ChevronLeft as ChevronLeftIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/navigation/Navbar';

const DRAWER_WIDTH = 240;

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  { text: 'My Trips', icon: <MapIcon />, path: '/trips' },
  { text: 'Trip Planner', icon: <ListAltIcon />, path: '/planner' },
  { text: 'History', icon: <HistoryIcon />, path: '/history' },
  { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
];

const DashboardLayout = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const location = useLocation();
  // read recent history for sidebar
  const historyRaw = useSelector((s) => s.game.history || []);
  const history = historyRaw.map((h) => {
    if (h && Array.isArray(h.attempts)) return h;
    const attempt = {
      id: h.id || Date.now(),
      date: h.date || new Date().toISOString(),
      provided: h.provided || [],
      correct: h.correct || 0,
      total: h.total || (Array.isArray(h.provided) ? h.provided.length : 0),
      percent: h.percent || 0,
    };
    return {
      id: h.id || Date.now(),
      startDate: h.date || new Date().toISOString(),
      pairs: h.pairs || [],
      attempts: [attempt],
      pairsCount: h.pairsCount,
      memorizeTime: h.memorizeTime,
      completed: (h.percent === 100),
    };
  });

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawer = (
    <Box>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        p: 2
      }}>
        <Typography variant="h6" component="div">
          Memory Coach
        </Typography>
        {isMobile && (
          <IconButton onClick={handleDrawerToggle}>
            <ChevronLeftIcon />
          </IconButton>
        )}
      </Box>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItemButton
            key={item.text}
            onClick={() => {
              navigate(item.path);
              if (isMobile) handleDrawerToggle();
            }}
            selected={location.pathname === item.path}
            sx={{
              '&.Mui-selected': {
                backgroundColor: 'primary.light',
                '&:hover': {
                  backgroundColor: 'primary.light',
                },
              },
            }}
          >
            <ListItemIcon sx={{ 
              color: location.pathname === item.path ? 'primary.main' : 'inherit' 
            }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItemButton>
        ))}
      </List>

      <Divider sx={{ mt: 1 }} />

      {/* Recent small history preview */}
      <Box sx={{ p: 1 }}>
        <Typography variant="subtitle2" sx={{ px: 1, pt: 1 }}>Recent games</Typography>
        <List>
          {history.slice(0, 6).map((h) => {
            const last = (h.attempts || [])[0] || null;
            return (
            <ListItemButton
              key={h.id}
              onClick={() => {
                navigate('/history');
                if (isMobile) handleDrawerToggle();
              }}
              sx={{ py: 0.5 }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <Box sx={{ width: 12, height: 12, bgcolor: last && last.correct === last.total ? 'success.main' : 'error.main', borderRadius: 0.5 }} />
              </ListItemIcon>
              <ListItemText primary={`${last ? `${last.correct}/${last.total}` : '-'} — ${h.pairs.join(' ')}`} primaryTypographyProps={{ noWrap: true }} />
            </ListItemButton>
          )})}
        </List>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <Navbar>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={handleDrawerToggle}
          sx={{ mr: 2, display: { sm: 'none' } }}
        >
          <MenuIcon />
        </IconButton>
      </Navbar>
      
      <Box
        component="nav"
        sx={{ width: { sm: DRAWER_WIDTH }, flexShrink: { sm: 0 } }}
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: DRAWER_WIDTH,
              height: 'calc(100vh - 56px)', // Subtract footer height
              marginTop: '64px' // Account for navbar
            },
          }}
        >
          {drawer}
        </Drawer>
        
        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: DRAWER_WIDTH,
              borderRight: '1px solid rgba(0, 0, 0, 0.12)',
              marginTop: '64px', // Navbar height
              height: 'calc(100vh - 78px - 58px)', // Subtract navbar (64px) and footer (56px) heights
              overflowY: 'auto' // Add scrolling for overflow content
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
          marginTop: '64px'
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default DashboardLayout;
