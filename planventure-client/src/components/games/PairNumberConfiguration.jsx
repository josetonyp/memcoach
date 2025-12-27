import { useState, useEffect, useRef } from 'react';
import { Box, Typography, Paper, TextField, FormControlLabel, Switch, IconButton, Collapse, Button } from '@mui/material';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useSelector, useDispatch } from 'react-redux';
import { setPairsCount, setMemorizeTime, setTimerEnabled, reset } from '../../store/gameSlice';

const PairNumberConfiguration = () => {
  const [open, setOpen] = useState(false);
  const dispatch = useDispatch();
  
  // Get saved configuration from Redux
  const savedPairsCount = useSelector((s) => s.game.pairsCount);
  const savedMemorizeTime = useSelector((s) => s.game.memorizeTime);
  const savedTimerEnabled = useSelector((s) => s.game.timerEnabled);
  const phase = useSelector((s) => s.game.phase);

  // Local state for editing (not saved until Save button is pressed)
  const [localPairsCount, setLocalPairsCount] = useState(savedPairsCount);
  const [localMemorizeTime, setLocalMemorizeTime] = useState(savedMemorizeTime);
  const [localTimerEnabled, setLocalTimerEnabled] = useState(savedTimerEnabled);

  // Sync local state when saved values change (e.g., on page reload)
  useEffect(() => {
    setLocalPairsCount(savedPairsCount);
    setLocalMemorizeTime(savedMemorizeTime);
    setLocalTimerEnabled(savedTimerEnabled);
  }, [savedPairsCount, savedMemorizeTime, savedTimerEnabled]);

  
  // track previous config values to detect changes
  const prevConfig = useRef({ pairsCount: savedPairsCount, memorizeTime: savedMemorizeTime, timerEnabled: savedTimerEnabled });

  // reset game when config changes during active gameplay
  useEffect(() => {
    const prev = prevConfig.current;
    const configChanged =
      prev.pairsCount !== savedPairsCount ||
      prev.memorizeTime !== savedMemorizeTime ||
      prev.timerEnabled !== savedTimerEnabled;

    if (configChanged && (phase === 'showing' || phase === 'input')) {
      dispatch(reset());
    }

    // update ref for next comparison
    prevConfig.current = { pairsCount: savedPairsCount, memorizeTime: savedMemorizeTime, timerEnabled: savedTimerEnabled };
  }, [savedPairsCount, savedMemorizeTime, savedTimerEnabled, phase, dispatch]);

  const handleSave = () => {
    if (localPairsCount != '') {
      dispatch(setPairsCount(Number(localPairsCount) || 5));
    }
    if (localMemorizeTime <= 0 && localTimerEnabled) {
      dispatch(setMemorizeTime(Number(localMemorizeTime) || 5));
    }
    dispatch(setTimerEnabled(localTimerEnabled));
    // Close the configuration panel and reset the game
    setOpen(false);
    dispatch(reset());
  };

  return (
    <Paper id="remember-config" elevation={2} sx={{ position: 'relative', p: 3, mt: 2, width: { xs: 300 }, flex: '0 0 300px' }}>
      <Typography variant="h6" gutterBottom>Configuration</Typography>

      <IconButton
        size="small"
        onClick={() => setOpen((s) => !s)}
        aria-label={open ? 'Collapse configuration' : 'Expand configuration'}
        sx={{ position: 'absolute', top: 8, right: 8 }}
      >
        {open ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
      </IconButton>

      <Collapse in={open}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Number of pairs
          </Typography>
          <TextField
            type="number"
            value={localPairsCount}
            onChange={(e) => setLocalPairsCount(e.target.value === '' ? '' : Number(e.target.value))}
            fullWidth
          />
        </Box>

        <Box sx={{ mb: 2 }}>
          <FormControlLabel
            control={<Switch checked={localTimerEnabled} onChange={(_, v) => setLocalTimerEnabled(v)} />}
            label={localTimerEnabled ? 'Timer enabled' : 'Timer disabled'}
          />

          {localTimerEnabled ? (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Memorize time: <strong>{localMemorizeTime}s</strong>
              </Typography>
              <Box sx={{ width: '100%', mt: 1 }}>
                <TextField
                  type="number"
                  value={localMemorizeTime}
                  onChange={(e) => setLocalMemorizeTime(e.target.value === '' ? '' : Number(e.target.value))}
                  fullWidth
                />
              </Box>
            </Box>
          ) : (
            <Box sx={{  mt: 1 }}>
              
            </Box>
          )}
        </Box>

        <Button variant="contained" fullWidth onClick={handleSave}>
          Save
        </Button>
      </Collapse>

    </Paper>
  );
};

export default PairNumberConfiguration;
