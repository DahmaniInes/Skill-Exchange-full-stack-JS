import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Typography,
    Button,
    useMediaQuery,
    useTheme,
  } from "@mui/material";
  
  const CoverLetterModal = ({ open, onClose, content }) => {
    const theme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  
    return (
      <Dialog
        open={open}
        onClose={onClose}
        fullScreen={fullScreen}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          style: {
            borderRadius: "16px",
            padding: "1rem",
          },
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: "bold",
            color: "#00BFCB", // accent color
            fontSize: "1.3rem",
            textAlign: "center",
          }}
        >
          Cover Letter
        </DialogTitle>
  
        <DialogContent dividers sx={{ padding: "1.5rem" }}>
          <Typography variant="body1" sx={{ whiteSpace: "pre-line" }}>
            {content || "No cover letter provided."}
          </Typography>
        </DialogContent>
  
        <DialogActions sx={{ justifyContent: "center", padding: "1rem" }}>
          <Button
            onClick={onClose}
            variant="outlined"
            sx={{
              color: "#00BFCB",
              borderColor: "#00BFCB",
              borderRadius: "30px",
              fontWeight: "bold",
              paddingX: "2rem",
              "&:hover": {
                backgroundColor: "#00BFCB",
                color: "#fff",
              },
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    );
  };
  
  export default CoverLetterModal;
  