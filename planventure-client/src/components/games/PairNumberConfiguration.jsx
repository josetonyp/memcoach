import { useState } from 'react';
import { Box, Typography, Paper, TextField, FormControlLabel, Switch, IconButton, Collapse } from '@mui/material';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useSelector, useDispatch } from 'react-redux';
import { setPairsCount, setMemorizeTime, setTimerEnabled } from '../../store/gameSlice';

const PairNumberConfiguration = () => {
  const [open, setOpen] = useState(false);
  const dispatch = useDispatch();
  const pairsCount = useSelector((s) => s.game.pairsCount);
  const memorizeTime = useSelector((s) => s.game.memorizeTime);
  const timerEnabled = useSelector((s) => s.game.timerEnabled);
  const phase = useSelector((s) => s.game.phase);

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
            inputProps={{ min: 1, max: 50 }}
            value={pairsCount}
            onChange={(e) => {
              const v = Number(e.target.value);
              const clamped = Number.isNaN(v) ? 1 : Math.max(1, Math.min(50, Math.floor(v)));
              dispatch(setPairsCount(clamped));
            }}
            fullWidth
          />
        </Box>

        <Box sx={{ mb: 2 }}>
          <FormControlLabel
            control={<Switch checked={timerEnabled} onChange={(_, v) => dispatch(setTimerEnabled(v))} />}
            label={timerEnabled ? 'Timer enabled' : 'Timer disabled'}
          />

          {timerEnabled ? (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Memorize time: <strong>{memorizeTime}s</strong>
              </Typography>
              <Box sx={{ width: '100%', mt: 1 }}>
                <TextField
                  type="number"
                  inputProps={{ min: 5, max: 120 }}
                  value={memorizeTime}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    const clamped = Number.isNaN(v) ? 5 : Math.max(5, Math.min(120, Math.floor(v)));
                    dispatch(setMemorizeTime(clamped));
                  }}
                  fullWidth
                />
              </Box>
            </Box>
          ) : (
            <Box sx={{  mt: 1 }}>
              
            </Box>
          )}
        </Box>
      </Collapse>

    </Paper>
  );
};

export default PairNumberConfiguration;
