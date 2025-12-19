import PairNumberGame from '../components/games/PairNumberGame';
import PairNumberConfiguration from '../components/games/PairNumberConfiguration';
import { Box, Typography } from '@mui/material';

const MemoryGamePage = () => {
  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', p: 2, display: { xs: 'block', md: 'flex' }, gap: 2, alignItems: 'flex-start' }}>
      <PairNumberConfiguration />
      <PairNumberGame />
    </Box>
  );
};

export default MemoryGamePage;
