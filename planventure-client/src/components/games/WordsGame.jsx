import { useEffect, useRef, useState } from 'react';
import { Box, Typography, Button, Stack, TextField, Paper, Chip, IconButton } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import EditIcon from '@mui/icons-material/Edit';
import { useSelector, useDispatch } from 'react-redux';
import { 
  tick, 
  hideNow, 
  verifyWordsInput, 
  resetWords, 
  setWordsInputValue, 
  startWordsRound, 
  tickWordsMemorizeElapsed, 
  tickWordsGuessElapsed,
  setWords 
} from '../../store/gameSlice';
import { generateWords, loadDictionary } from '../../libs/games/words/wordsGenerator';

const WordsGame = () => {
  const dispatch = useDispatch();
  const words = useSelector((s) => s.game.words);
  const wordsCount = useSelector((s) => s.game.wordsCount);
  const wordsColumns = useSelector((s) => s.game.wordsColumns);
  const wordsDictionary = useSelector((s) => s.game.wordsDictionary);
  const chunkedWords = useSelector((s) => s.game.chunkedWords);
  const memorizeTime = useSelector((s) => s.game.memorizeTime);
  const timerRemaining = useSelector((s) => s.game.timerRemaining);
  const timerEnabled = useSelector((s) => s.game.timerEnabled);
  const phase = useSelector((s) => s.game.phase);
  const wordsInputValue = useSelector((s) => s.game.wordsInputValue);
  const wordsResult = useSelector((s) => s.game.wordsResult);
  const wordsMemorizeElapsed = useSelector((s) => s.game.wordsMemorizeElapsed);
  const wordsGuessElapsed = useSelector((s) => s.game.wordsGuessElapsed);

  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);
  const memorizeIntervalRef = useRef(null);
  const guessIntervalRef = useRef(null);
  const inputRef = useRef(null);
  const [dictionary, setDictionary] = useState([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [enteredWords, setEnteredWords] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingValue, setEditingValue] = useState('');
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  // Load dictionary when component mounts or dictionary changes
  useEffect(() => {
    const loadDict = async () => {
      const dict = await loadDictionary(wordsDictionary);
      setDictionary(dict);
    };
    loadDict();
  }, [wordsDictionary]);

  // Manage timers when showing phase starts
  useEffect(() => {
    clearInterval(intervalRef.current);
    clearTimeout(timeoutRef.current);

    if (phase === 'showing' && timerRemaining > 0) {
      intervalRef.current = setInterval(() => {
        dispatch(tick());
      }, 1000);

      timeoutRef.current = setTimeout(() => {
        clearInterval(intervalRef.current);
        dispatch(hideNow());
      }, timerRemaining * 1000);
    }

    return () => {
      clearInterval(intervalRef.current);
      clearTimeout(timeoutRef.current);
    };
  }, [phase, timerRemaining, dispatch]);

  // Track memorize elapsed time during showing phase
  useEffect(() => {
    clearInterval(memorizeIntervalRef.current);
    if (phase === 'showing') {
      memorizeIntervalRef.current = setInterval(() => {
        dispatch(tickWordsMemorizeElapsed());
      }, 100);
    }
    return () => clearInterval(memorizeIntervalRef.current);
  }, [phase, dispatch]);

  // Track guess elapsed time during input phase
  useEffect(() => {
    clearInterval(guessIntervalRef.current);
    if (phase === 'input') {
      guessIntervalRef.current = setInterval(() => {
        dispatch(tickWordsGuessElapsed());
      }, 100);
    }
    return () => clearInterval(guessIntervalRef.current);
  }, [phase, dispatch]);

  // Reset entered words when entering input phase and start with first word in edit mode
  useEffect(() => {
    if (phase === 'input') {
      setCurrentWordIndex(0);
      setEnteredWords(['']); // Start with one empty word
      setEditingIndex(0); // Set first word to edit mode
      setEditingValue('');
    }
  }, [phase]);

  const handleStart = () => {
    if (dictionary.length === 0) return;
    const { words: generatedWords, chunkedWords: chunked } = generateWords(dictionary, wordsCount, wordsColumns);
    dispatch(startWordsRound({ words: generatedWords, chunkedWords: chunked }));
  };

  const handleHideNow = () => {
    clearInterval(intervalRef.current);
    clearTimeout(timeoutRef.current);
    dispatch(hideNow());
  };

  const handleReset = () => {
    dispatch(resetWords());
    setCurrentWordIndex(0);
    setEnteredWords([]);
  };

  const handleEditWord = (index) => {
    setEditingIndex(index);
    setEditingValue(enteredWords[index]);
  };

  const handleSaveEdit = () => {
    if (editingIndex !== null) {
      const newWords = [...enteredWords];
      newWords[editingIndex] = editingValue.trim();
      setEnteredWords(newWords);
      
      // If we haven't reached the word limit and current word is not empty, create next word
      if (newWords.length < words.length && editingValue.trim()) {
        const nextWords = [...newWords, ''];
        setEnteredWords(nextWords);
        setEditingIndex(newWords.length); // Edit the newly created word
        setEditingValue('');
        setCurrentWordIndex(newWords.length);
      } else {
        setEditingIndex(null);
        setEditingValue('');
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditingValue('');
  };

  const handleDragStart = (index) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newWords = [...enteredWords];
    const [draggedWord] = newWords.splice(draggedIndex, 1);
    newWords.splice(dropIndex, 0, draggedWord);
    setEnteredWords(newWords);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleEditKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelEdit();
    }
  };

  const handleVerify = () => {
    dispatch(verifyWordsInput({ cleaned: enteredWords }));
  };

  const renderWords = () => {
    return (
      <Box sx={{ display: 'flex', gap: 4, justifyContent: 'center', flexWrap: 'wrap' }}>
        {chunkedWords.map((column, colIdx) => (
          <Box key={colIdx} sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {column.map((word, wordIdx) => (
              <Typography 
                key={`${colIdx}-${wordIdx}`} 
                variant="h5" 
                sx={{ 
                  fontWeight: 'bold',
                  textAlign: 'left',
                  minWidth: '150px'
                }}
              >
                {word}
              </Typography>
            ))}
          </Box>
        ))}
      </Box>
    );
  };

  const renderResult = () => {
    if (!wordsResult) return null;
    const { correct, total, expected, provided, percent } = wordsResult;

    return (
      <Box sx={{ mt: 3 }}>
        <Typography variant="h5" gutterBottom>
          Score: {correct}/{total} ({percent}%)
        </Typography>
        
        <Box sx={{ mt: 2 }}>
          {expected.map((word, idx) => {
            const isCorrect = provided[idx]?.toLowerCase() === word.toLowerCase();
            return (
              <Box 
                key={idx} 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 2, 
                  mb: 1,
                  p: 1,
                  bgcolor: isCorrect ? 'success.light' : 'error.light',
                  borderRadius: 1,
                  opacity: 0.8
                }}
              >
                {isCorrect ? (
                  <CheckCircleOutlineIcon color="success" />
                ) : (
                  <CancelOutlinedIcon color="error" />
                )}
                <Typography sx={{ fontWeight: 'bold' }}>
                  {idx + 1}.
                </Typography>
                <Typography>
                  Expected: <strong>{word}</strong>
                </Typography>
                {!isCorrect && (
                  <Typography>
                    Got: <strong>{provided[idx] || '(empty)'}</strong>
                  </Typography>
                )}
              </Box>
            );
          })}
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Memorize time: {(wordsMemorizeElapsed / 1000).toFixed(1)}s | 
          Guess time: {(wordsGuessElapsed / 1000).toFixed(1)}s
        </Typography>
      </Box>
    );
  };

  return (
    <Paper elevation={3} sx={{ p: 4, mt: 2, flexGrow: 1, minHeight: 400 }}>
      <Typography variant="h4" gutterBottom>
        Words Memory Game
      </Typography>

      {phase === 'ready' && (
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="body1" sx={{ mb: 3 }}>
            Memorize the list of words in order, then recall them one by one.
          </Typography>
          <Button 
            variant="contained" 
            size="large" 
            onClick={handleStart}
            disabled={dictionary.length === 0}
          >
            Start Game
          </Button>
        </Box>
      )}

      {phase === 'showing' && (
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          {timerEnabled && timerRemaining > 0 && (
            <Typography variant="h6" color="primary" sx={{ mb: 2 }}>
              Time remaining: {timerRemaining}s
            </Typography>
          )}
          {renderWords()}
          <Button 
            variant="outlined" 
            sx={{ mt: 4 }} 
            onClick={handleHideNow}
          >
            {timerEnabled ? 'Hide Now' : 'Start Recall'}
          </Button>
        </Box>
      )}

      {phase === 'input' && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Enter the words in order ({enteredWords.length}/{words.length})
          </Typography>
          
          <Box sx={{ mb: 3, maxHeight: 300, overflowY: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 2 }}>
            {enteredWords.length === 0 ? (
              <Typography color="text.secondary" sx={{ fontStyle: 'italic' }}>
                No words entered yet...
              </Typography>
            ) : (
              enteredWords.map((word, idx) => (
                <Box 
                  key={idx}
                  draggable={editingIndex !== idx}
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, idx)}
                  onDragEnd={handleDragEnd}
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1, 
                    mb: 1,
                    p: 1,
                    bgcolor: dragOverIndex === idx && draggedIndex !== idx ? 'action.selected' : 'background.paper',
                    border: '2px solid',
                    borderColor: editingIndex === idx ? 'primary.main' : 
                                draggedIndex === idx ? 'primary.light' : 'divider',
                    borderRadius: 1,
                    opacity: draggedIndex === idx ? 0.5 : 1,
                    cursor: editingIndex === idx ? 'default' : 'grab',
                    '&:active': { cursor: editingIndex === idx ? 'default' : 'grabbing' },
                    '&:hover': { bgcolor: dragOverIndex === idx && draggedIndex !== idx ? 'action.selected' : 'action.hover' },
                    transition: 'background-color 0.2s, opacity 0.2s'
                  }}
                >
                  <IconButton 
                    size="small"
                    sx={{ 
                      cursor: 'grab',
                      '&:active': { cursor: 'grabbing' },
                      touchAction: 'none'
                    }}
                    title="Drag to reorder"
                  >
                    <DragIndicatorIcon fontSize="small" />
                  </IconButton>
                  
                  <Typography sx={{ fontWeight: 'bold', minWidth: 30 }}>
                    {idx + 1}.
                  </Typography>
                  
                  {editingIndex === idx ? (
                    <TextField
                      autoFocus
                      size="small"
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      onKeyDown={handleEditKeyDown}
                      onBlur={handleSaveEdit}
                      placeholder={`Word ${idx + 1}`}
                      sx={{ flexGrow: 1 }}
                    />
                  ) : (
                    <Typography sx={{ flexGrow: 1 }}>
                      {word}
                    </Typography>
                  )}

                  <IconButton 
                    size="small" 
                    onClick={() => handleEditWord(idx)}
                    title="Edit word"
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))
            )}
          </Box>

          <Stack direction="row" spacing={2}>
            <Button 
              variant="contained" 
              onClick={handleVerify}
              disabled={enteredWords.length === 0}
            >
              Verify ({enteredWords.length} words)
            </Button>
            <Button 
              variant="outlined" 
              onClick={handleReset}
            >
              Cancel
            </Button>
          </Stack>
        </Box>
      )}

      {phase === 'result' && (
        <Box>
          {renderResult()}
          <Button 
            variant="contained" 
            sx={{ mt: 3 }} 
            onClick={handleReset}
          >
            Play Again
          </Button>
        </Box>
      )}
    </Paper>
  );
};

export default WordsGame;
