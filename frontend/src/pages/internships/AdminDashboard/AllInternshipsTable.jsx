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
} from "@mui/material";
import { toast } from "react-toastify";

const AllInternshipsTable = () => {
  const [internships, setInternships] = useState([]);

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
      } catch (err) {
        toast.error("Failed to load internships");
      }
    };
    fetchData();
  }, []);

  return (
    <Box>
      <Typography variant="h6" mb={2}>
        All Internship Offers
      </Typography>

      {internships.length > 0 ? (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Company</TableCell>
              <TableCell>Created By</TableCell>
              <TableCell>Assigned To</TableCell>
              <TableCell>Start Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {internships.map((i) => (
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
                  {new Date(i.startDate).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <Typography align="center" sx={{ mt: 4, color: "#777" }}>
          No internships have been created yet.
        </Typography>
      )}
    </Box>
  );
};

export default AllInternshipsTable;
