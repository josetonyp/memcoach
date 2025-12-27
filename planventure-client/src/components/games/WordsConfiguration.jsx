import { useState, useEffect, useRef } from 'react';
import { Box, Typography, Paper, TextField, Select, MenuItem, FormControl, InputLabel, IconButton, Collapse, Button } from '@mui/material';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useSelector, useDispatch } from 'react-redux';
import { setWordsCount, setWordsColumns, setWordsDictionary, resetWords } from '../../store/gameSlice';

const WordsConfiguration = () => {
  const [open, setOpen] = useState(false);
  const dispatch = useDispatch();
  
  // Get saved configuration from Redux
  const savedWordsCount = useSelector((s) => s.game.wordsCount);
  const savedWordsColumns = useSelector((s) => s.game.wordsColumns);
  const savedWordsDictionary = useSelector((s) => s.game.wordsDictionary);
  const availableDictionaries = useSelector((s) => s.game.availableDictionaries);
  const phase = useSelector((s) => s.game.phase);

  // Local state for editing
  const [localWordsCount, setLocalWordsCount] = useState(savedWordsCount);
  const [localWordsColumns, setLocalWordsColumns] = useState(savedWordsColumns);
  const [localWordsDictionary, setLocalWordsDictionary] = useState(savedWordsDictionary);

  // Sync local state when saved values change
  useEffect(() => {
    setLocalWordsCount(savedWordsCount);
    setLocalWordsColumns(savedWordsColumns);
    setLocalWordsDictionary(savedWordsDictionary);
  }, [savedWordsCount, savedWordsColumns, savedWordsDictionary]);

  // Track previous config values to detect changes
  const prevConfig = useRef({ 
    wordsCount: savedWordsCount, 
    wordsColumns: savedWordsColumns, 
    wordsDictionary: savedWordsDictionary 
  });

  // Reset game when config changes during active gameplay
  useEffect(() => {
    const prev = prevConfig.current;
    const configChanged =
      prev.wordsCount !== savedWordsCount ||
      prev.wordsColumns !== savedWordsColumns ||
      prev.wordsDictionary !== savedWordsDictionary;

    if (configChanged && (phase === 'showing' || phase === 'input')) {
      dispatch(resetWords());
    }

    // Update ref for next comparison
    prevConfig.current = { 
      wordsCount: savedWordsCount, 
      wordsColumns: savedWordsColumns, 
      wordsDictionary: savedWordsDictionary 
    };
  }, [savedWordsCount, savedWordsColumns, savedWordsDictionary, phase, dispatch]);

  const handleSave = () => {
    if (localWordsCount !== '') {
      dispatch(setWordsCount(Number(localWordsCount) || 10));
    }
    if (localWordsColumns !== '') {
      dispatch(setWordsColumns(Number(localWordsColumns) || 1));
    }
    if (localWordsDictionary) {
      dispatch(setWordsDictionary(localWordsDictionary));
    }
    // Close the configuration panel and reset the game
    setOpen(false);
    dispatch(resetWords());
  };

  return (
    <Paper id="words-config" elevation={2} sx={{ position: 'relative', p: 3, mt: 2, width: { xs: 300 }, flex: '0 0 300px' }}>
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
            Number of words
          </Typography>
          <TextField
            type="number"
            value={localWordsCount}
            onChange={(e) => setLocalWordsCount(e.target.value === '' ? '' : Number(e.target.value))}
            fullWidth
            inputProps={{ min: 1, max: 100 }}
          />
        </Box>

        <Box sx={{ mb: 2 }}>
          <FormControl fullWidth>
            <InputLabel id="dictionary-select-label">Dictionary</InputLabel>
            <Select
              labelId="dictionary-select-label"
              value={localWordsDictionary}
              onChange={(e) => setLocalWordsDictionary(e.target.value)}
              label="Dictionary"
            >
              {availableDictionaries.map((dict) => (
                <MenuItem key={dict} value={dict}>
                  {dict.replace('/','').replace('.txt', '')}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Number of columns
          </Typography>
          <TextField
            type="number"
            value={localWordsColumns}
            onChange={(e) => setLocalWordsColumns(e.target.value === '' ? '' : Number(e.target.value))}
            fullWidth
            inputProps={{ min: 1, max: 10 }}
          />
        </Box>

        <Button 
          variant="contained" 
          onClick={handleSave} 
          fullWidth
          sx={{ mt: 2 }}
        >
          Save Configuration
        </Button>
      </Collapse>
    </Paper>
  );
};

export default WordsConfiguration;
