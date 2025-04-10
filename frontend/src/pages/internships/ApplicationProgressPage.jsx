import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Button,
  CircularProgress,
} from "@mui/material";
import { toast } from "react-toastify";

const statusColors = {
  not_started: "default",
  in_progress: "warning",
  completed: "success",
};

const ApplicationProgressPage = () => {
  const { applicationId } = useParams();
  const [tasks, setTasks] = useState([]);
  const [studentName, setStudentName] = useState("");
  const [internshipTitle, setInternshipTitle] = useState("");
  const [internshipId, setInternshipId] = useState("");
  const [certificateUrl, setCertificateUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchProgress = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `http://localhost:5000/api/internships/applications/${applicationId}/progress`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setTasks(res.data.tasks);
      setStudentName(res.data.studentName);
      setInternshipTitle(res.data.internshipTitle);
      setInternshipId(res.data.internshipId);
      setCertificateUrl(res.data.certificateUrl || null); 
    } catch (err) {
      toast.error("Failed to load progress");
    }
  };

  const handleEndInternship = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `http://localhost:5000/api/internships/offers/${internshipId}/complete`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Internship completed and certificate generated!");
      if (res.data.certificateUrl) {
        setCertificateUrl(res.data.certificateUrl); 
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to complete internship"
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProgress();
  }, [applicationId]);

  const completedCount = tasks.filter((t) => t.progress === "completed").length;
  const progressPercent =
    tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  const allCompleted = completedCount === tasks.length && tasks.length > 0;

  return (
    <Box maxWidth="1000px" mx="auto" my={5}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        {studentName}'s Progress — {internshipTitle}
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={2}>
        Below is the current progress made by the student on this internship.
      </Typography>

      <Typography variant="subtitle1" gutterBottom>
        Progress: {completedCount} of {tasks.length} completed ({progressPercent}%)
      </Typography>
      <LinearProgress
        variant="determinate"
        value={progressPercent}
        sx={{ mb: 4 }}
      />

      {certificateUrl && (
        <Box mb={2}>
          <Button
            variant="outlined"
            color="primary"
            onClick={() => window.open(certificateUrl, "_blank")}
          >
            Download Certificate
          </Button>
        </Box>
      )}

      {allCompleted && !certificateUrl && (
        <Box mb={4}>
          <Button
            variant="contained"
            color="success"
            onClick={handleEndInternship}
            disabled={isLoading}
          >
            {isLoading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              "End Internship & Generate Certificate"
            )}
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
              }}
            >
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  {task.title}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  gutterBottom
                >
                  {task.description}
                </Typography>
                <Chip
                  label={task.progress.replace("_", " ")}
                  color={statusColors[task.progress]}
                  variant="filled"
                  sx={{ textTransform: "capitalize", mt: 2 }}
                />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default ApplicationProgressPage;
