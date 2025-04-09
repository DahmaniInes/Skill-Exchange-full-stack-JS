import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Table, TableBody, TableCell, TableHead, TableRow,
  Typography, Box, IconButton
} from "@mui/material";
import { Download } from "lucide-react";
import { toast } from "react-toastify";

const getStatusTag = (status) => {
  let color = "#f0ad4e"; // default: orange for "pending"
  if (status === "accepted") color = "#5cb85c"; // green
  if (status === "rejected") color = "#d9534f"; // red

  return (
    <Box
      component="span"
      sx={{
        display: "inline-block",
        padding: "0.3rem 0.75rem",
        borderRadius: "20px",
        backgroundColor: color,
        color: "white",
        fontWeight: "bold",
        fontSize: "0.85rem",
        textTransform: "capitalize",
        textAlign: "center",
        minWidth: "80px",
      }}
    >
      {status}
    </Box>
  );
};

const StudentApplicationsTable = () => {
  const [applications, setApplications] = useState([]);

  useEffect(() => {
    const fetchStudentApps = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:5000/api/internships/applications/student", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setApplications(res.data);
      } catch (err) {
        toast.error("Unable to load your applications");
      }
    };
    fetchStudentApps();
  }, []);

  return (
    <Box maxWidth="1000px" mx="auto" className="personal-info-section">
      <h3 className="section-title">My Internship Applications</h3>

      {applications.length === 0 ? (
        <Typography align="center" sx={{ padding: "2rem", color: "#777" }}>
          You haven’t applied to any internships yet.
        </Typography>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Internship</TableCell>
              <TableCell>Company</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>CV</TableCell>
              <TableCell>Applied At</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {applications.map((app) => (
              <TableRow key={app._id}>
                <TableCell>{app.internshipOffer?.title}</TableCell>
                <TableCell>{app.internshipOffer?.entrepriseName}</TableCell>
                <TableCell>{getStatusTag(app.status)}</TableCell>
                <TableCell>
                  <IconButton
                    href={app.cvUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Download size={18} />
                  </IconButton>
                </TableCell>
                <TableCell>
                  {new Date(app.appliedAt).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Box>
  );
};

export default StudentApplicationsTable;
