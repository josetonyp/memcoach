import { useState } from 'react';
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
  Switch,
  FormControlLabel,
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
          <span>Number {current?.id}</span>
          <Box>
            <FormControlLabel
              control={(
                <Switch
                  checked={showImage}
                  onChange={(_, v) => setShowImage(v)}
                  inputProps={{ 'aria-label': 'toggle image/text view' }}
                />
              )}
              label={showImage ? <><ImageIcon fontSize="small" sx={{ mr: 0.5 }} /> Image</> : <><TextFieldsIcon fontSize="small" sx={{ mr: 0.5 }} /> Text</>}
              sx={{ mr: 1 }}
            />
            <IconButton onClick={handleClose} size="small" aria-label="Close dialog">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent dividers>
          {current && (
            <Box sx={{ textAlign: 'center' }}>
              {showImage ? (
                <img
                  src={current.image}
                  alt={current.text || `Image for ${current.id}`}
                  style={{ maxWidth: '100%', height: 'auto', borderRadius: 4 }}
                />
              ) : (
                <Box sx={{ p: 3 }}>
                  {current.text ? (
                    <Typography variant="h6">{current.text}</Typography>
                  ) : (
                    <Typography variant="body1" color="text.secondary">No text defined for this number.</Typography>
                  )}
                </Box>
              )}
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
