import React, { useEffect, useState } from "react";
import axios from "axios";
import { Box, Typography, Table, TableHead, TableRow, TableCell, TableBody, Button } from "@mui/material";
import { toast } from "react-toastify";

const CompletedInternshipsTable = () => {
  const [completed, setCompleted] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:5000/api/internships/admin/internships/completed", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCompleted(res.data);
      } catch (err) {
        toast.error("Failed to load completed internships");
      }
    };
    fetchData();
  }, []);

  return (
    <Box>
  <Typography variant="h6" mb={2}>Completed Internships</Typography>

  {completed.length > 0 ? (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Title</TableCell>
          <TableCell>Student</TableCell>
          <TableCell>Company</TableCell>
          <TableCell>Completed At</TableCell>
          <TableCell>Certificate</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {completed.map((i) => (
          <TableRow key={i._id}>
            <TableCell>{i.title}</TableCell>
            <TableCell>{i.assignedTo?.firstName} {i.assignedTo?.lastName}</TableCell>
            <TableCell>{i.entrepriseName}</TableCell>
            <TableCell>{new Date(i.completionDate).toLocaleDateString()}</TableCell>
            <TableCell>
              <Button
                variant="outlined"
                onClick={() => window.open(i.certificateUrl, "_blank")}
              >
                View
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ) : (
    <Typography align="center" sx={{ mt: 4, color: "#777" }}>
      No internships have been completed yet.
    </Typography>
  )}
</Box>

  );
};

export default CompletedInternshipsTable;
