import { useMemo, useState } from 'react';
import { Box, Typography, TextField, Button, Stack, Paper, Chip, Tooltip, IconButton } from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { clearHistory } from '../store/gameSlice';

// simple CSV exporter (flatten games -> attempts)
const exportCsv = (games, filename = 'memory-history.csv') => {
  const header = ['gameId', 'gameStart', 'attemptDate', 'pairs', 'provided', 'correct', 'total', 'percent', 'pairsCount', 'memorizeTime', 'memorizeElapsed', 'guessElapsed'];
  const csv = [header.join(',')];
  games.forEach((g) => {
    (g.attempts || []).forEach((a) => {
      const line = [
        g.id,
        `"${g.startDate}"`,
        `"${a.date}"`,
        `"${(g.pairs || []).join(' ')}"`,
        `"${(a.provided || []).join(' ')}"`,
        a.correct,
        a.total,
        a.percent,
        g.pairsCount,
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
  if ((g.pairs || []).join(' ').toLowerCase().includes(s)) return true;
  if ((g.attempts || []).some(a => (a.provided || []).join(' ').toLowerCase().includes(s))) return true;
  if ((g.startDate || '').toLowerCase().includes(s)) return true;
  return false;
};

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const HistoryPage = () => {
  const dispatch = useDispatch();
  const historyRaw = useSelector((s) => s.game.history || []);
  // normalize older flat-history entries into game objects
  const history = historyRaw.map((h) => {
    if (h && Array.isArray(h.attempts)) return h;
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
    };
  });
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all'); // all | success | fail
  const [expanded, setExpanded] = useState(null);

  const filtered = useMemo(() => {
    return history.filter((g) => {
      const hasSuccess = (g.attempts || []).some(a => a.correct === a.total);
      if (filter === 'success' && !hasSuccess) return false;
      if (filter === 'fail' && hasSuccess) return false;
      return matchesQuery(g, query);
    });
  }, [history, query, filter]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4">Memory History</Typography>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 2, mb: 2 }}>
        <TextField label="Search pairs / provided / date" value={query} onChange={(e) => setQuery(e.target.value)} fullWidth />
        <TextField select value={filter} onChange={(e) => setFilter(e.target.value)} SelectProps={{ native: true }} sx={{ width: 160 }}>
          <option value="all">All</option>
          <option value="success">Success</option>
          <option value="fail">Fail</option>
        </TextField>
        <Button variant="outlined" onClick={() => exportCsv(filtered)}>Export CSV</Button>
        <Button variant="outlined" color="error" onClick={() => dispatch(clearHistory())}>Clear</Button>
      </Stack>

      <Stack spacing={1}>
        {filtered.length === 0 ? (
          <Typography variant="body1">No matching history.</Typography>
        ) : (
          filtered.map((g) => {
            const attempts = g.attempts || [];
            const last = attempts[0] || null;
            const bestPercent = attempts.reduce((m, a) => Math.max(m, a.percent || 0), 0);
            const attemptsCount = attempts.length;
            const perPairSolved = (g.pairs || []).map((p, i) => (attempts.some(a => (a.provided || [])[i] === p)));
            return (
              <Paper key={g.id} sx={{ p: 0.5, mb: 0.5 }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ fontSize: '0.85rem' }}>
                  <Tooltip title={new Date(g.startDate).toLocaleString()}>
                    <Typography sx={{ width: 160, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{new Date(g.startDate).toLocaleString()}</Typography>
                  </Tooltip>

                  <Typography sx={{ fontWeight: 700, color: bestPercent === 100 ? 'success.main' : 'text.primary' }}>{bestPercent}%</Typography>

                  <Tooltip title={g.pairs.join(' ')}>
                    <Typography sx={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{g.pairs.join(' ')}</Typography>
                  </Tooltip>

                  <Typography sx={{ ml: 1, color: 'text.secondary', minWidth: 54 }}>{attemptsCount} attempt{attemptsCount !== 1 ? 's' : ''}</Typography>

                <IconButton size="small" onClick={() => setExpanded(expanded === g.id ? null : g.id)} sx={{ ml: 1 }}>
                  <ExpandMoreIcon sx={{ transform: expanded === g.id ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 200ms' }} />
                </IconButton>
                  {/* compact per-pair aggregated indicators */}
                  <Stack direction="row" spacing={0.4} sx={{ ml: 1 }}>
                    {perPairSolved.map((ok, i) => (
                      <Tooltip key={i} title={`Pair ${i + 1}: ${ok ? 'Solved in an attempt' : 'Never solved'}`}>
                        <Box sx={{ width: 12, height: 12, bgcolor: ok ? 'success.main' : 'error.main', borderRadius: 0.5 }} />
                      </Tooltip>
                    ))}
                  </Stack>

                  <Chip size="small" label={bestPercent === 100 ? '✔' : '✖'} color={bestPercent === 100 ? 'success' : 'error'} sx={{ ml: 1 }} />
                </Stack>

                {/* expandable attempts list (visible when expanded) */}
                {expanded === g.id && attempts.length > 0 && (
                  <Stack spacing={0.5} sx={{ mt: 1 }}>
                    {attempts.map((a) => (
                      <Paper key={a.id} sx={{ p: 0.5, backgroundColor: 'background.paper' }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Typography sx={{ width: 160, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{new Date(a.date).toLocaleString()}</Typography>
                          <Typography sx={{ fontWeight: 600 }}>{a.correct}/{a.total} ({a.percent}%)</Typography>
                          <Tooltip title={(a.provided || []).join(' ')}>
                            <Typography sx={{ ml: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{(a.provided || []).join(' ') || '—'}</Typography>
                          </Tooltip>
                          <Stack direction="row" spacing={0.4} sx={{ ml: 1 }}>
                            {(g.pairs || []).map((p, i) => {
                              const ok = (a.provided || [])[i] === p;
                              return <Box key={i} sx={{ width: 10, height: 10, bgcolor: ok ? 'success.main' : 'error.main', borderRadius: 0.5 }} />;
                            })}
                          </Stack>
                          {(a.memorizeElapsed != null || a.guessElapsed != null) && (
                            <Typography variant="caption" color="text.secondary" sx={{ ml: 1, whiteSpace: 'nowrap' }}>
                              M: {a.memorizeElapsed || 0}s | G: {a.guessElapsed || 0}s
                            </Typography>
                          )}
                        </Stack>
                      </Paper>
                    ))}
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
