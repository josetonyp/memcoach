import { useMemo, useState } from 'react';
import { Box, Typography, TextField, Button, Stack, Paper, Chip, Tooltip, IconButton, ToggleButtonGroup, ToggleButton } from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { clearHistory, clearWordsHistory } from '../store/gameSlice';

// Format milliseconds as seconds with decimal places (e.g., 5234 -> "5.234s")
const formatTime = (ms) => {
  if (ms == null) return '0.000s';
  const seconds = (ms / 1000).toFixed(3);
  return `${seconds}s`;
};

// simple CSV exporter (flatten games -> attempts)
const exportCsv = (games, filename = 'memory-history.csv') => {
  const header = ['gameType', 'gameId', 'gameStart', 'attemptDate', 'items', 'provided', 'correct', 'total', 'percent', 'itemsCount', 'memorizeTime', 'memorizeElapsed', 'guessElapsed'];
  const csv = [header.join(',')];
  games.forEach((g) => {
    const gameType = g.gameType || 'numbers';
    const items = gameType === 'words' ? (g.words || []) : (g.pairs || []);
    (g.attempts || []).forEach((a) => {
      const line = [
        gameType,
        g.id,
        `"${g.startDate}"`,
        `"${a.date}"`,
        `"${items.join(' ')}"`,
        `"${(a.provided || []).join(' ')}"`,
        a.correct,
        a.total,
        a.percent,
        gameType === 'words' ? g.wordsCount : g.pairsCount,
        g.memorizeTime,
        a.memorizeElapsed || 0,
        a.guessElapsed || 0,
      ];
      csv.push(line.join(','));
    });
  });

  const blob = new Blob([csv.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

const matchesQuery = (g, q) => {
  if (!q) return true;
  const s = q.toLowerCase();
  const gameType = g.gameType || 'numbers';
  const items = gameType === 'words' ? (g.words || []) : (g.pairs || []);
  if (items.join(' ').toLowerCase().includes(s)) return true;
  if ((g.attempts || []).some(a => (a.provided || []).join(' ').toLowerCase().includes(s))) return true;
  if ((g.startDate || '').toLowerCase().includes(s)) return true;
  return false;
};

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const HistoryPage = () => {
  const dispatch = useDispatch();
  const numbersHistoryRaw = useSelector((s) => s.game.history || []);
  const wordsHistoryRaw = useSelector((s) => s.game.wordsHistory || []);
  
  // normalize older flat-history entries into game objects
  const numbersHistory = numbersHistoryRaw.map((h) => {
    if (h && Array.isArray(h.attempts)) return { ...h, gameType: 'numbers' };
    // legacy flat entry
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
      gameType: 'numbers',
    };
  });
  
  const wordsHistory = wordsHistoryRaw.map((h) => ({ ...h, gameType: 'words' }));
  
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all'); // all | success | fail
  const [gameTypeFilter, setGameTypeFilter] = useState('all'); // all | numbers | words
  const [expanded, setExpanded] = useState(null);

  const allHistory = useMemo(() => {
    const combined = [...numbersHistory, ...wordsHistory];
    return combined.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
  }, [numbersHistory, wordsHistory]);

  const filtered = useMemo(() => {
    return allHistory.filter((g) => {
      if (gameTypeFilter !== 'all' && g.gameType !== gameTypeFilter) return false;
      const hasSuccess = (g.attempts || []).some(a => a.correct === a.total);
      if (filter === 'success' && !hasSuccess) return false;
      if (filter === 'fail' && hasSuccess) return false;
      return matchesQuery(g, query);
    });
  }, [allHistory, query, filter, gameTypeFilter]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4">Memory History</Typography>

      <Box sx={{ mt: 2, mb: 2 }}>
        <ToggleButtonGroup
          value={gameTypeFilter}
          exclusive
          onChange={(e, val) => val && setGameTypeFilter(val)}
          size="small"
          sx={{ mb: 2 }}
        >
          <ToggleButton value="all">All Games</ToggleButton>
          <ToggleButton value="numbers">Numbers</ToggleButton>
          <ToggleButton value="words">Words</ToggleButton>
        </ToggleButtonGroup>
        
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField label="Search items / provided / date" value={query} onChange={(e) => setQuery(e.target.value)} fullWidth />
          <TextField select value={filter} onChange={(e) => setFilter(e.target.value)} SelectProps={{ native: true }} sx={{ width: 160 }}>
            <option value="all">All</option>
            <option value="success">Success</option>
            <option value="fail">Fail</option>
          </TextField>
          <Button variant="outlined" onClick={() => exportCsv(filtered)}>Export CSV</Button>
          <Button 
            variant="outlined" 
            color="error" 
            onClick={() => {
              if (gameTypeFilter === 'words' || gameTypeFilter === 'all') dispatch(clearWordsHistory());
              if (gameTypeFilter === 'numbers' || gameTypeFilter === 'all') dispatch(clearHistory());
            }}
          >
            Clear
          </Button>
        </Stack>
      </Box>

      <Stack spacing={1}>
        {filtered.length === 0 ? (
          <Typography variant="body1">No matching history.</Typography>
        ) : (
          filtered.map((g) => {
            const gameType = g.gameType || 'numbers';
            const items = gameType === 'words' ? (g.words || []) : (g.pairs || []);
            const attempts = g.attempts || [];
            const last = attempts[0] || null;
            const bestPercent = attempts.reduce((m, a) => Math.max(m, a.percent || 0), 0);
            const attemptsCount = attempts.length;
            const perItemSolved = items.map((p, i) => (attempts.some(a => {
              const provided = (a.provided || [])[i];
              return gameType === 'words' 
                ? provided?.toLowerCase() === p.toLowerCase()
                : provided === p;
            })));
            return (
              <Paper key={g.id} sx={{ p: 0.5, mb: 0.5 }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ fontSize: '0.85rem' }}>
                  <Chip 
                    size="small" 
                    label={gameType === 'words' ? 'W' : 'N'} 
                    color={gameType === 'words' ? 'secondary' : 'primary'}
                    sx={{ minWidth: 32 }}
                  />
                  <Tooltip title={new Date(g.startDate).toLocaleString()}>
                    <Typography sx={{ width: 160, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{new Date(g.startDate).toLocaleString()}</Typography>
                  </Tooltip>

                  <Typography sx={{ fontWeight: 700, color: bestPercent === 100 ? 'success.main' : 'text.primary' }}>{bestPercent}%</Typography>

                  <Tooltip title={items.join(' ')}>
                    <Typography sx={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{items.join(' ')}</Typography>
                  </Tooltip>

                  <Typography sx={{ ml: 1, color: 'text.secondary', minWidth: 54 }}>{attemptsCount} attempt{attemptsCount !== 1 ? 's' : ''}</Typography>

                <IconButton size="small" onClick={() => setExpanded(expanded === g.id ? null : g.id)} sx={{ ml: 1 }}>
                  <ExpandMoreIcon sx={{ transform: expanded === g.id ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 200ms' }} />
                </IconButton>
                  {/* compact per-item aggregated indicators */}
                  <Stack direction="row" spacing={0.4} sx={{ ml: 1 }}>
                    {perItemSolved.map((ok, i) => (
                      <Tooltip key={i} title={`${gameType === 'words' ? 'Word' : 'Pair'} ${i + 1}: ${ok ? 'Solved in an attempt' : 'Never solved'}`}>
                        <Box sx={{ width: 12, height: 12, bgcolor: ok ? 'success.main' : 'error.main', borderRadius: 0.5 }} />
                      </Tooltip>
                    ))}
                  </Stack>

                  <Chip size="small" label={bestPercent === 100 ? '✔' : '✖'} color={bestPercent === 100 ? 'success' : 'error'} sx={{ ml: 1 }} />
                </Stack>

                {/* expandable attempts list (visible when expanded) */}
                {expanded === g.id && attempts.length > 0 && (
                  <Stack spacing={0.5} sx={{ mt: 1 }}>
                    {attempts.map((a) => {
                      const gameType = g.gameType || 'numbers';
                      const items = gameType === 'words' ? (g.words || []) : (g.pairs || []);
                      return (
                        <Paper key={a.id} sx={{ p: 0.5, backgroundColor: 'background.paper' }}>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Typography sx={{ width: 160, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{new Date(a.date).toLocaleString()}</Typography>
                            <Typography sx={{ fontWeight: 600 }}>{a.correct}/{a.total} ({a.percent}%)</Typography>
                            <Tooltip title={(a.provided || []).join(' ')}>
                              <Typography sx={{ ml: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{(a.provided || []).join(' ') || '—'}</Typography>
                            </Tooltip>
                            <Stack direction="row" spacing={0.4} sx={{ ml: 1 }}>
                              {items.map((p, i) => {
                                const provided = (a.provided || [])[i];
                                const ok = gameType === 'words'
                                  ? provided?.toLowerCase() === p.toLowerCase()
                                  : provided === p;
                                return <Box key={i} sx={{ width: 10, height: 10, bgcolor: ok ? 'success.main' : 'error.main', borderRadius: 0.5 }} />;
                              })}
                            </Stack>
                            {(a.memorizeElapsed != null || a.guessElapsed != null) && (
                              <Typography variant="caption" color="text.secondary" sx={{ ml: 1, whiteSpace: 'nowrap' }}>
                                M: {formatTime(a.memorizeElapsed)} | G: {formatTime(a.guessElapsed)}
                              </Typography>
                            )}
                          </Stack>
                        </Paper>
                      );
                    })}
                  </Stack>
                )}
              </Paper>
            );
          })
        )}
      </Stack>
    </Box>
  );
};

export default HistoryPage;
