import React from "react";
import { Card, CardContent, Typography } from "@mui/material";

const StatCard = ({ label, value }) => {
  return (
    <Card sx={{ minWidth: 180, flex: 1, backgroundColor: "#f5f5f5", boxShadow: 2 }}>
      <CardContent>
        <Typography variant="subtitle2" color="textSecondary">
          {label}
        </Typography>
        <Typography variant="h5" fontWeight="bold" color="primary">
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default StatCard;
