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
  TextField,
  TableSortLabel,
} from "@mui/material";
import { toast } from "react-toastify";

const AllInternshipsTable = () => {
  const [internships, setInternships] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState("desc");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          "http://localhost:5000/api/internships/admin/internships",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setInternships(res.data);
        setFiltered(res.data);
      } catch (err) {
        toast.error("Failed to load internships");
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    let result = [...internships];

    if (search.trim()) {
      const lower = search.toLowerCase();
      result = result.filter(
        (i) =>
          i.title.toLowerCase().includes(lower) ||
          i.entrepriseName.toLowerCase().includes(lower)
      );
    }

    result.sort((a, b) => {
      const dateA = new Date(a.startDate);
      const dateB = new Date(b.startDate);
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });

    setFiltered(result);
  }, [search, sortOrder, internships]);

  const handleSortToggle = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  return (
    <Box>
      <Typography variant="h6" mb={2}>
        All Internship Offers
      </Typography>

      <Box display="flex" gap={2} mb={3} flexWrap="wrap">
        <TextField
          label="Search by title or company"
          variant="outlined"
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: 300 }}
        />
      </Box>

      {filtered.length > 0 ? (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Company</TableCell>
              <TableCell>Created By</TableCell>
              <TableCell>Assigned To</TableCell>
              <TableCell sortDirection={false}>
                <TableSortLabel
                  active
                  direction={sortOrder}
                  onClick={handleSortToggle}
                >
                  Start Date
                </TableSortLabel>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((i) => (
              <TableRow key={i._id}>
                <TableCell>{i.title}</TableCell>
                <TableCell>{i.entrepriseName}</TableCell>
                <TableCell>
                  {i.createdBy?.firstName} {i.createdBy?.lastName}
                </TableCell>
                <TableCell>
                  {i.assignedTo
                    ? `${i.assignedTo.firstName} ${i.assignedTo.lastName}`
                    : "Unassigned"}
                </TableCell>
                <TableCell>
                  {i.startDate
                    ? new Date(i.startDate).toLocaleDateString()
                    : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <Typography align="center" sx={{ mt: 4, color: "#777" }}>
          No internships match your search.
        </Typography>
      )}
    </Box>
  );
};

export default AllInternshipsTable;
