import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ImageIcon from '@mui/icons-material/Image';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import { numberGallery } from '../data/numberGallery';

const NumberGalleryPage = () => {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(null);
  const [showImage, setShowImage] = useState(true);

  const handleOpen = (item) => {
    setCurrent(item);
    setShowImage(true);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setCurrent(null);
  };

  const handleNext = () => {
    if (!current) return;
    const currentIndex = numberGallery.findIndex(n => n.id === current.id);
    const nextIndex = (currentIndex + 1) % numberGallery.length;
    setCurrent(numberGallery[nextIndex]);
  };

  const handlePrevious = () => {
    if (!current) return;
    const currentIndex = numberGallery.findIndex(n => n.id === current.id);
    const previousIndex = (currentIndex - 1 + numberGallery.length) % numberGallery.length;
    setCurrent(numberGallery[previousIndex]);
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!open) return;
      
      if (event.key === 'ArrowRight') {
        handleNext();
      } else if (event.key === 'ArrowLeft') {
        handlePrevious();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, current]);

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', p: 2 }}>
      <Typography variant="h4" gutterBottom>Number Gallery</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Click a number to view an image or a reminder text.
      </Typography>

      <Grid container spacing={1}>
        {numberGallery.map((n) => (
          <Grid item xs={3} sm={2} md={1.2} key={n.id}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => handleOpen(n)}
              aria-label={`Open ${n.id}`}
            >
              {n.id}
            </Button>
          </Grid>
        ))}
      </Grid>
      
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>{current ? current.words.map(o => o.word).join(', ') : ''}</span>
          <Box>
            <IconButton onClick={handleClose} size="small" aria-label="Close dialog">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent dividers>
          {current && (
            <Box sx={{ textAlign: 'center' }}>
              <img
                  src={current.image}
                  alt={current.words[0].memory || current.words[0].word}
                  style={{ height: '300px', width: 'auto', borderRadius: 4 }}
                />
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default NumberGalleryPage;
