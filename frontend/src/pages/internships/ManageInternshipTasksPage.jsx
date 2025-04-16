import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import {
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Select,
  MenuItem,
  Chip,
  LinearProgress,
  Button,
} from "@mui/material";
import { toast } from "react-toastify";

const statusColors = {
  not_started: "default",
  in_progress: "warning",
  completed: "success",
};

const ManageInternshipTasksPage = () => {
  const { id } = useParams();
  const [tasks, setTasks] = useState([]);
  const [internshipTitle, setInternshipTitle] = useState("");
  const [certificateUrl, setCertificateUrl] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);

  const navigate = useNavigate();

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(
        `http://localhost:5000/api/internships/offers/${id}/tasks/progress`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setTasks(res.data.tasks);
      setInternshipTitle(res.data.internshipTitle || "Internship");
      setCertificateUrl(res.data.certificateUrl);
      setIsCompleted(res.data.isCompleted);
    } catch (err) {
      toast.error("Unable to load internship data");
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `http://localhost:5000/api/internships/offers/${id}/tasks/${taskId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTasks((prev) =>
        prev.map((task) =>
          task._id === taskId ? { ...task, progress: newStatus } : task
        )
      );
    } catch (err) {
      toast.error("Failed to update task status");
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [id]);

  const completedCount = tasks.filter((t) => t.progress === "completed").length;
  const progressPercent = Math.round((completedCount / tasks.length) * 100);

  return (
    <>
    <div style={{ marginBottom: "1rem", marginTop: "1rem" }}>
        <button
          className="button button-secondary"
          onClick={() => navigate("/internships/student/applications")}
          style={{ padding: "8px 16px", borderRadius: "6px" }}
        >
          ← Back to my applications
        </button>
    </div>
    <Box maxWidth="1100px" mx="auto" my={5}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        {internshipTitle} — Task Manager
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={1}>
        Track and update your progress on each internship task.
      </Typography>
      <Typography variant="subtitle1" gutterBottom>
        Progress: {completedCount} of {tasks.length} completed ({progressPercent}%)
      </Typography>
      <LinearProgress
        variant="determinate"
        value={progressPercent}
        sx={{ mb: 4, height: 8, borderRadius: 5 }}
      />

      {certificateUrl && (
        <Box mb={4}>
          <Button
            variant="outlined"
            color="primary"
            onClick={() => window.open(certificateUrl, "_blank")}
          >
            Download Certificate
          </Button>
        </Box>
      )}

      <Grid container spacing={3}>
        {tasks.map((task) => (
          <Grid item xs={12} md={6} lg={4} key={task._id}>
            <Card
              variant="outlined"
              sx={{
                borderRadius: 3,
                boxShadow: 2,
                transition: "transform 0.2s",
                "&:hover": { transform: "scale(1.02)" },
              }}
            >
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  {task.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {task.description}
                </Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: "space-between", px: 2, pb: 2 }}>
                <Chip
                  label={task.progress.replace("_", " ")}
                  color={statusColors[task.progress]}
                  variant="filled"
                  sx={{ textTransform: "capitalize", fontWeight: 600 }}
                />
                <Select
                  size="small"
                  value={task.progress}
                  onChange={(e) => handleStatusChange(task._id, e.target.value)}
                  sx={{ minWidth: 140 }}
                  disabled={isCompleted}
                >
                  <MenuItem value="not_started">Not Started</MenuItem>
                  <MenuItem value="in_progress">In Progress</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                </Select>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
    </>
  );
};

export default ManageInternshipTasksPage;
