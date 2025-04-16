import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@mui/material";
import { toast } from "react-toastify";

const TaskProgressViewer = () => {
  const [internships, setInternships] = useState([]);
  const [selected, setSelected] = useState({ offerId: "", studentId: "" });
  const [students, setStudents] = useState([]);
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    const fetchInternships = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          "http://localhost:5000/api/internships/admin/applications",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const uniqueOffers = [
          ...new Set(res.data.map((a) => a.internshipOffer?._id)),
        ].map(
          (id) =>
            res.data.find((a) => a.internshipOffer?._id === id)?.internshipOffer
        );
        setInternships(uniqueOffers);
      } catch {
        toast.error("Error fetching internships");
      }
    };
    fetchInternships();
  }, []);

  useEffect(() => {
    const fetchStudents = async () => {
      if (!selected.offerId) return;
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          "http://localhost:5000/api/internships/admin/applications",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const filtered = res.data.filter(
          (a) => a.internshipOffer?._id === selected.offerId
        );
        setStudents(filtered.map((a) => a.student));
      } catch {
        toast.error("Error fetching students");
      }
    };
    fetchStudents();
  }, [selected.offerId]);

  useEffect(() => {
    const fetchProgress = async () => {
      if (!selected.offerId || !selected.studentId) return;
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          `http://localhost:5000/api/internships/admin/internships/${selected.offerId}/student/${selected.studentId}/progress`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setTasks(res.data.tasks);
      } catch {
        toast.error("Error loading task progress");
      }
    };
    fetchProgress();
  }, [selected.offerId, selected.studentId]);

  return (
    <Box>
      <Typography variant="h6" mb={2}>
        Task Progress by Student
      </Typography>
      <Box display="flex" gap={2} mb={3}>
        <FormControl>
          <InputLabel>Internship</InputLabel>
          <Select
            value={selected.offerId}
            label="Internship"
            onChange={(e) =>
              setSelected((prev) => ({
                ...prev,
                offerId: e.target.value,
                studentId: "",
              }))
            }
            sx={{ minWidth: 250 }}
          >
            {internships.map((i) => (
              <MenuItem key={i._id} value={i._id}>
                {i.title}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl>
          <InputLabel>Student</InputLabel>
          <Select
            value={selected.studentId}
            label="Student"
            onChange={(e) =>
              setSelected((prev) => ({ ...prev, studentId: e.target.value }))
            }
            sx={{ minWidth: 250 }}
          >
            {students.map((s) => (
              <MenuItem key={s._id} value={s._id}>
                {s.firstName} {s.lastName}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {selected.offerId && selected.studentId ? (
        tasks.length > 0 ? (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Task</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tasks.map((t) => (
                <TableRow key={t._id}>
                  <TableCell>{t.title}</TableCell>
                  <TableCell>{t.description}</TableCell>
                  <TableCell>{t.progress.replace("_", " ")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <Typography sx={{ mt: 4, color: "#777" }} align="center">
            This student has no tasks for the selected internship.
          </Typography>
        )
      ) : (
        <Typography sx={{ mt: 4, color: "#777" }} align="center">
          Please select both an internship offer and a student to view task
          progress.
        </Typography>
      )}
    </Box>
  );
};

export default TaskProgressViewer;
