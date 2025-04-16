import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  Button,
  ButtonGroup,
  Paper,
} from "@mui/material";
import AllInternshipsTable from "./AllInternshipsTable";
import AllApplicationsTable from "./AllApplicationsTable";
import TaskProgressViewer from "./TaskProgressViewer";
import CompletedInternshipsTable from "./CompletedInternshipsTable";
import StatCard from "./StatCard";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const AdminDashboardPage = () => {
  const [view, setView] = useState("internships");
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          "http://localhost:5000/api/internships/admin/dashboard-stats",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setStats(res.data);
      } catch (err) {
        toast.error("Failed to load dashboard stats");
      }
    };

    fetchStats();
  }, []);

  return (
    <Box maxWidth="1200px" mx="auto" my={5} px={2}>
      <Typography
        variant="h4"
        fontWeight="bold"
        sx={{ color: "#00BFCB", textAlign: "center", mb: 4 }}
      >
        Internship Admin Dashboard
      </Typography>

      {stats && (
        <Box
          display="flex"
          gap={2}
          flexWrap="wrap"
          justifyContent="center"
          mb={4}
        >
          <StatCard label="Total Internships" value={stats.totalInternships} />
          <StatCard label="Assigned" value={stats.assignedCount} />
          <StatCard label="Unassigned" value={stats.unassignedCount} />
          <StatCard label="Completed" value={stats.completedCount} />
          <StatCard label="Applications" value={stats.totalApplications} />
        </Box>
      )}

      <Paper
        elevation={2}
        sx={{ borderRadius: 4, p: 2, mb: 4, background: "#f9f9f9" }}
      >
        <ButtonGroup variant="contained" fullWidth>
          <Button
            onClick={() => setView("internships")}
            sx={{
              bgcolor: view === "internships" ? "#00BFCB" : "",
              color: view === "internships" ? "#fff" : "",
            }}
          >
            All Internships
          </Button>
          <Button
            onClick={() => setView("applications")}
            sx={{
              bgcolor: view === "applications" ? "#00BFCB" : "",
              color: view === "applications" ? "#fff" : "",
            }}
          >
            Applications
          </Button>
          <Button
            onClick={() => setView("progress")}
            sx={{
              bgcolor: view === "progress" ? "#00BFCB" : "",
              color: view === "progress" ? "#fff" : "",
            }}
          >
            Task Progress
          </Button>
          <Button
            onClick={() => setView("completed")}
            sx={{
              bgcolor: view === "completed" ? "#00BFCB" : "",
              color: view === "completed" ? "#fff" : "",
            }}
          >
            Completed
          </Button>
        </ButtonGroup>
      </Paper>

      {view === "internships" && <AllInternshipsTable />}
      {view === "applications" && <AllApplicationsTable />}
      {view === "progress" && <TaskProgressViewer />}
      {view === "completed" && <CompletedInternshipsTable />}
    </Box>
  );
};

export default AdminDashboardPage;