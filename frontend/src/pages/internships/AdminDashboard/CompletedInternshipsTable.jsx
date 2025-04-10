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
  Button,
  TextField
} from "@mui/material";
import { toast } from "react-toastify";

const CompletedInternshipsTable = () => {
  const [completed, setCompleted] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          "http://localhost:5000/api/internships/admin/internships/completed",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setCompleted(res.data);
        setFiltered(res.data);
      } catch (err) {
        toast.error("Failed to load completed internships");
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(completed);
    } else {
      const term = search.toLowerCase();
      const filteredList = completed.filter((i) =>
        i.title.toLowerCase().includes(term) ||
        i.entrepriseName.toLowerCase().includes(term) ||
        i.assignedTo?.firstName.toLowerCase().includes(term) ||
        i.assignedTo?.lastName.toLowerCase().includes(term)
      );
      setFiltered(filteredList);
    }
  }, [search, completed]);

  return (
    <Box>
      <Typography variant="h6" mb={2}>
        Completed Internships
      </Typography>

      <Box mb={3}>
        <TextField
          label="Search by title, company or student"
          variant="outlined"
          size="small"
          fullWidth
          sx={{ maxWidth: 400 }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Box>

      {filtered.length > 0 ? (
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
            {filtered.map((i) => (
              <TableRow key={i._id}>
                <TableCell>{i.title}</TableCell>
                <TableCell>
                  {i.assignedTo?.firstName} {i.assignedTo?.lastName}
                </TableCell>
                <TableCell>{i.entrepriseName}</TableCell>
                <TableCell>
                  {new Date(i.completionDate).toLocaleDateString()}
                </TableCell>
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
