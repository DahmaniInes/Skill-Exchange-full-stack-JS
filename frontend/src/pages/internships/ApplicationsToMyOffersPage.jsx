import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Select,
  MenuItem,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  useTheme,
  useMediaQuery,
  TextField,
  InputLabel,
  FormControl
} from "@mui/material";
import { Eye, Download } from "lucide-react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { LinearProgress, Box } from "@mui/material";



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
          color: "#00BFCB",
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

const ApplicationManagementTable = () => {
  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const handleDownloadExcel = () => {
    if (filteredApplications.length === 0) {
      toast.warn("No applications to export!");
      return;
    }
  
    const worksheetData = filteredApplications.map((app) => ({
      "Student Name": `${app.student.firstName} ${app.student.lastName}`,
      "Student Email": app.student.email,
      "Offer Title": app.internshipOffer.title,
      "Entreprise Name": app.internshipOffer.entrepriseName,
      "CV URL": app.cvUrl,
      "Cover Letter": app.coverLetter?.slice(0, 300) || "No Cover Letter", // limit very long texts
      "Status": app.status,
      "Applied At": new Date(app.appliedAt).toLocaleString(), // Date and time nicely formatted
    }));
  
    const worksheet = XLSX.utils.json_to_sheet(worksheetData, { cellStyles: true });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Applications");
  
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });
  
    saveAs(data, "applications.xlsx");
  };

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:5000/api/internships/applications/by-entrepreneur", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setApplications(res.data);
        setFilteredApplications(res.data);
      } catch (err) {
        toast.error("Failed to fetch applications");
      }
    };
    fetchApplications();
  }, []);

  useEffect(() => {
    let filtered = [...applications];
    if (statusFilter) {
      filtered = filtered.filter(app => app.status === statusFilter);
    }
    if (searchTerm.trim()) {
      filtered = filtered.filter(app =>
        app.internshipOffer.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredApplications(filtered);
  }, [statusFilter, searchTerm, applications]);

  const handleStatusChange = async (applicationId, status) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `http://localhost:5000/api/internships/applications/${applicationId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setApplications((prev) =>
        prev.map((app) => (app._id === applicationId ? { ...app, status } : app))
      );
      toast.success("Status updated");
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  return (
    <div className="personal-info-section">
      <h3 className="section-title">Applications to My Offers</h3>

      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <FormControl>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            label="Status"
            size="small"
            style={{ minWidth: "150px" }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="accepted">Accepted</MenuItem>
            <MenuItem value="rejected">Rejected</MenuItem>
          </Select>
        </FormControl>

        <TextField
          label="Search by Title"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="small"
          variant="outlined"
        />

        <Button
          variant="contained"
          color="primary"
          onClick={handleDownloadExcel}
          style={{ height: "40px" }}
        >
          Download Excel
        </Button>
      </div>


      {filteredApplications.length === 0 ? (
        <Typography align="center" sx={{ padding: "2rem", color: "#777" }}>
          No applications found.
        </Typography>
      ) : (
        <Box sx={{ overflowX: "auto" }}>
  <Table sx={{ minWidth: 1100 }}>
    <TableHead>
      <TableRow>
        <TableCell>Student</TableCell>
        <TableCell>Offer</TableCell>
        <TableCell>CV</TableCell>
        <TableCell>Status</TableCell>
        <TableCell>Cover Letter</TableCell>
        <TableCell>Applied At</TableCell>
        <TableCell>Match Score</TableCell>
        <TableCell>Student Progress</TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {filteredApplications.map((app) => (
        <TableRow key={app._id}>
          <TableCell>{app.student.firstName} {app.student.lastName}</TableCell>
          <TableCell>{app.internshipOffer.title}</TableCell>
          <TableCell>
            <IconButton href={app.cvUrl} target="_blank" rel="noopener noreferrer">
              <Download size={18} />
            </IconButton>
          </TableCell>
          <TableCell>
            <Select
              value={app.status}
              size="small"
              onChange={(e) => handleStatusChange(app._id, e.target.value)}
            >
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="accepted">Accepted</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
            </Select>
          </TableCell>
          <TableCell>
            <IconButton onClick={() => { setSelectedLetter(app.coverLetter); setModalOpen(true); }}>
              <Eye size={18} />
            </IconButton>
          </TableCell>
          <TableCell>{new Date(app.appliedAt).toLocaleDateString()}</TableCell>
          <TableCell>
            <Box sx={{ minWidth: 100 }}>
              <Typography variant="body2" color="textSecondary">
                {(app.matchScore * 1).toFixed(0)}%
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={app.matchScore * 1} 
                sx={{ height: 8, borderRadius: 5 }} 
                color={app.matchScore > 75 ? "success" : app.matchScore > 50 ? "warning" : "error"}
              />
            </Box>
          </TableCell>
          <TableCell>
            {app.status === "accepted" && (
              <Button
                variant="outlined"
                color="primary"
                size="small"
                onClick={() => window.location.href = `/applications/${app._id}/progress`}
              >
                View Progress
              </Button>
            )}
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
</Box>

      )}

      <CoverLetterModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        content={selectedLetter}
      />
    </div>
  );
};

export default ApplicationManagementTable;
