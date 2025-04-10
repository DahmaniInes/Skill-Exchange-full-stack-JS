import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
} from "@mui/material";
import { Download } from "lucide-react";
import { toast } from "react-toastify";

const AllApplicationsTable = () => {
  const [applications, setApplications] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          "http://localhost:5000/api/internships/admin/applications",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setApplications(res.data);
      } catch (err) {
        toast.error("Failed to load applications");
      }
    };
    fetchData();
  }, []);

  return (
    <Box>
      <Typography variant="h6" mb={2}>
        All Internship Applications
      </Typography>

      {applications.length > 0 ? (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Student</TableCell>
              <TableCell>Offer</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>CV</TableCell>
              <TableCell>Applied At</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {applications.map((app) => (
              <TableRow key={app._id}>
                <TableCell>
                  {app.student?.firstName} {app.student?.lastName}
                </TableCell>
                <TableCell>{app.internshipOffer?.title}</TableCell>
                <TableCell>{app.status}</TableCell>
                <TableCell>
                  <IconButton href={app.cvUrl} target="_blank">
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
      ) : (
        <Typography align="center" sx={{ mt: 4, color: "#777" }}>
          No internship applications have been submitted yet.
        </Typography>
      )}
    </Box>
  );
};

export default AllApplicationsTable;
