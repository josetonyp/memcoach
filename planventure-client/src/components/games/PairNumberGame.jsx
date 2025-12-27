import { useEffect, useRef, useState } from 'react';
import { Box, Typography, Button, Stack, TextField, Paper, InputAdornment } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import { useSelector, useDispatch } from 'react-redux';
import { tick, hideNow, verifyInput, reset, setInputValue, startRound, recordAttempt, tickMemorizeElapsed, tickGuessElapsed } from '../../store/gameSlice';
import { generatePairs } from '../../libs/games/pairNumber/pairsGenerator';

const PairNumberGame = () => {
  const dispatch = useDispatch();
  const pairs = useSelector((s) => s.game.pairs);
  const pairsCount = useSelector((s) => s.game.pairsCount);
  const chunkPairs = useSelector((s) => s.game.chunkPairs);
  const memorizeTime = useSelector((s) => s.game.memorizeTime);
  const timerRemaining = useSelector((s) => s.game.timerRemaining);
  const phase = useSelector((s) => s.game.phase);
  const inputValue = useSelector((s) => s.game.inputValue);
  const result = useSelector((s) => s.game.result);
  const history = useSelector((s) => s.game.history || []);
  const memorizeElapsed = useSelector((s) => s.game.memorizeElapsed);
  const guessElapsed = useSelector((s) => s.game.guessElapsed);

  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);
  const memorizeIntervalRef = useRef(null);
  const guessIntervalRef = useRef(null);
  const inputRef = useRef(null);
  const [showFail, setShowFail] = useState(false);
  const [resultAnimate, setResultAnimate] = useState(false);

  // manage timers when showing phase starts or when reloading into showing
  useEffect(() => {
    // clear existing timers
    clearInterval(intervalRef.current);
    clearTimeout(timeoutRef.current);

    if (phase === 'showing' && timerRemaining > 0) {
      // start interval to tick every second
      intervalRef.current = setInterval(() => {
        dispatch(tick());
      }, 1000);

      // set timeout to hide after remaining seconds
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

  // track memorize elapsed time during showing phase
  useEffect(() => {
    clearInterval(memorizeIntervalRef.current);
    if (phase === 'showing') {
      memorizeIntervalRef.current = setInterval(() => {
        dispatch(tickMemorizeElapsed());
      }, 100);
    }
    return () => clearInterval(memorizeIntervalRef.current);
  }, [phase, dispatch]);

  // track guess elapsed time during input phase
  useEffect(() => {
    clearInterval(guessIntervalRef.current);
    if (phase === 'input') {
      guessIntervalRef.current = setInterval(() => {
        dispatch(tickGuessElapsed());
      }, 100);
    }
    return () => clearInterval(guessIntervalRef.current);
  }, [phase, dispatch]);

  // autofocus input when entering input phase
  useEffect(() => {
    if (phase === 'input' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [phase]);

  const handleHideNow = () => {
    clearInterval(intervalRef.current);
    clearTimeout(timeoutRef.current);
    dispatch(hideNow());
  };

  // automatically verify only when the full set of digits (complete two-digit pairs) is entered
  // but DO NOT advance to the result view when entries are incorrect — allow user to fix them
  useEffect(() => {
    if (phase === 'input') {
      const digitsOnly = (inputValue || '').replace(/\D/g, '');
      const expectedDigits = pairs.length > 0 ? pairs.length * 2 : pairsCount * 2;
      if (expectedDigits > 0 && digitsOnly.length === expectedDigits) {
        // split into exact two-digit groups
        const groups = digitsOnly.match(/.{2}/g) || [];
        // Check answers against expected pairs
        const allCorrect = groups.length === pairs.length && groups.every((g, i) => g === pairs[i]);
        if (allCorrect) {
          dispatch(verifyInput({ cleaned: groups }));
        } else {
          // record the failed attempt to history (non-blocking) and show transient failure indicator
          dispatch(recordAttempt({ cleaned: groups }));
          setShowFail(true);
          const t = setTimeout(() => setShowFail(false), 1500);
          return () => clearTimeout(t);
        }
      }
    }
  }, [inputValue, phase, pairs, pairsCount, dispatch]);

  // animate result icon when we enter the result phase
  useEffect(() => {
    if (phase === 'result') {
      setResultAnimate(false);
      const t = setTimeout(() => setResultAnimate(true), 10);
      return () => clearTimeout(t);
    } else {
      setResultAnimate(false);
    }
  }, [phase, result]);

  // Format input as two-digit pairs while typing
  const formatPairsInput = (raw) => {
    // keep digits only
    const digits = raw.replace(/\D/g, '');
    // limit to expected amount
    const maxDigits = Math.max(0, pairs.length) * 2 || pairsCount * 2;
    const sliced = digits.slice(0, maxDigits);
    // chunk into two-digit groups
    const groups = sliced.match(/.{1,2}/g) || [];
    return groups.join(' ');
  };

  const handleInputChange = (e) => {
    // clear transient failure indicator when user edits
    if (showFail) setShowFail(false);
    const formatted = formatPairsInput(e.target.value);
    dispatch(setInputValue(formatted));
  };  
  const handleStart = () => {
    var genedPairs = generatePairs(pairsCount)
    pairs = genedPairs.pairs
    chunkPairs = genedPairs.chunkPairs
    pairsCount = genedPairs.count
    dispatch(startRound({ pairs: pairs }));
  };
  const handleReset = () => {
    clearInterval(intervalRef.current);
    clearTimeout(timeoutRef.current);
    dispatch(reset());
  };

  // Animated dots that cycle based on elapsed time (but don't show the time)
  const getDots = (elapsed) => {
    const count = (elapsed % 4) + 1; // cycles 1,2,3,4,1,2,3,4...
    return '.'.repeat(count);
  };

  return (
    <Paper id="remember-game" elevation={2} sx={{ p: 3, mt: { xs: 2, md: 0 }, width: { xs: '100%', md: 520 }, flex: '0 0 520px' }}>
      <Stack spacing={2} sx={{ alignItems: 'stretch' }}>
        <Box />

        <Box>
          {phase === 'showing' ? (
            <>
              {/* Render pairs in lines of 5 for readability */}
              {chunkPairs.map((line, idx) => (
                <Typography
                  key={idx}
                  sx={{
                    letterSpacing: 3,
                    textAlign: 'center',
                    fontSize: pairs.length > 40 ? '1rem' : pairs.length > 25 ? '1.4rem' : '2rem'
                  }}
                >
                  {line.join('  ')}
                </Typography>
              ))}

              {timerRemaining > 0 && (
                <Typography variant="subtitle1" color="primary" sx={{ mt: 1 }} aria-live="polite">Time left: <strong>{timerRemaining}s</strong></Typography>
              )}
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, minHeight: '1.5em' }}>{getDots(memorizeElapsed)}</Typography>
            </>
          ) : null}
        </Box>

        {phase === 'input' && (
          <Box>
            <TextField
              label="Enter pairs"
              fullWidth
              value={inputValue}
              onChange={handleInputChange}
              inputRef={inputRef}
              inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', maxLength: pairs.length * 3 }}
              InputProps={{
                endAdornment: showFail ? (
                  <InputAdornment position="end">
                    <CancelOutlinedIcon color="error" sx={{ transform: showFail ? 'scale(1.15)' : 'scale(1)', transition: 'transform 180ms ease-in-out' }} />
                  </InputAdornment>
                ) : null
              }}
            />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, minHeight: '1.5em' }}>{getDots(guessElapsed)}</Typography>
          </Box>
        )} 

        <Stack direction="row" spacing={2}>
          {phase === 'ready' && (
            <Button variant="contained" onClick={handleStart}>Start</Button>
          )}

          {phase === 'showing' && (
            <Button variant="outlined" onClick={handleHideNow}>Verify</Button>
          )}

          {phase === 'input' && (
            <>
              <Button variant="outlined" onClick={handleReset}>Cancel</Button>
            </>
          )} 

          {phase === 'result' && (
            <>
              <Button variant="contained" onClick={() => dispatch(startRound({ pairs: generatePairs(pairsCount) }))}>Play Again</Button>
              <Button variant="outlined" onClick={handleReset}>Back</Button>
            </>
          )}
        </Stack>

        {phase === 'result' && result && (
          <Box sx={{ mt: 2, textAlign: 'center' }} aria-live="polite">
            {result.correct === result.total ? (
              <CheckCircleOutlineIcon sx={{ color: 'success.main', fontSize: 64, transform: resultAnimate ? 'scale(1)' : 'scale(0.75)', transition: 'transform 250ms cubic-bezier(.2,.8,.2,1)' }} aria-hidden />
            ) : (
              <CancelOutlinedIcon sx={{ color: 'error.main', fontSize: 64, transform: resultAnimate ? 'scale(1)' : 'scale(0.75)', transition: 'transform 250ms cubic-bezier(.2,.8,.2,1)' }} aria-hidden />
            )}
            <Typography variant="srOnly" component="div" sx={{ mt: 1 }}>{result.correct === result.total ? 'All pairs correct' : `${result.correct} of ${result.total} correct`}</Typography>
          </Box>
        )}
      </Stack>
    </Paper>
  );
};

export default PairNumberGame;
