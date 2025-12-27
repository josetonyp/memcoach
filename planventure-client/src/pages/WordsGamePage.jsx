import WordsGame from '../components/games/WordsGame';
import WordsConfiguration from '../components/games/WordsConfiguration';
import { Box } from '@mui/material';

const WordsGamePage = () => {
  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', p: 2, display: { xs: 'block', md: 'flex' }, gap: 2, alignItems: 'flex-start' }}>
      <WordsConfiguration />
      <WordsGame />
    </Box>
  );
};

export default WordsGamePage;
