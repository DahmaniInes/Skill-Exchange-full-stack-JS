import React, { useState } from 'react';
import {
  Tabs,
  Tab,
  Box,
  Typography,
  TextField,
  Button,
  Container,
  Avatar,
  IconButton,
  Chip,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Card,
  CardContent,
  CardHeader,
} from '@mui/material';
import { PhotoCamera, Save, AddCircleOutline, Delete } from '@mui/icons-material';

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const MyProfile = () => {
  const [value, setValue] = useState(0);
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    location: '',
    bio: '',
    avatar: null,
    skills: [],
    newSkill: { name: '', level: 'Beginner' },
    preferences: { availability: [], format: 'Online' },
  });

  const handleChangeTab = (event, newValue) => setValue(newValue);

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileData((prev) => ({
          ...prev,
          avatar: { file, preview: reader.result },
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSkillAdd = () => {
    if (profileData.newSkill.name) {
      setProfileData((prev) => ({
        ...prev,
        skills: [...prev.skills, prev.newSkill],
        newSkill: { name: '', level: 'Beginner' },
      }));
    }
  };

  const handleSkillRemove = (index) => {
    setProfileData((prev) => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index),
    }));
  };

  return (
    <Container maxWidth="md">
      <Card sx={{ mt: 4, p: 3, boxShadow: 3, borderRadius: 3 }}>
        <CardHeader title="My Profile" sx={{ textAlign: 'center' }} />
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <input accept="image/*" id="avatar-upload" type="file" hidden onChange={handleImageUpload} />
            <label htmlFor="avatar-upload">
              <IconButton component="span">
                <Avatar src={profileData.avatar?.preview} sx={{ width: 100, height: 100 }} />
              </IconButton>
              <PhotoCamera sx={{ position: 'absolute', bottom: 0, right: 0, bgcolor: 'background.paper', borderRadius: '50%', p: 0.5 }} />
            </label>
          </Box>
          <Tabs value={value} onChange={handleChangeTab} variant="fullWidth">
            <Tab label="Personal Info" />
            <Tab label="Skills" />
            <Tab label="Preferences" />
          </Tabs>
          <TabPanel value={value} index={0}>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField fullWidth label="First Name" name="firstName" value={profileData.firstName} onChange={handleInputChange} />
              <TextField fullWidth label="Last Name" name="lastName" value={profileData.lastName} onChange={handleInputChange} />
            </Box>
            <TextField fullWidth label="Email" name="email" type="email" value={profileData.email} onChange={handleInputChange} sx={{ mb: 2 }} />
            <TextField fullWidth label="Location" name="location" value={profileData.location} onChange={handleInputChange} sx={{ mb: 2 }} />
            <TextField fullWidth label="Bio" name="bio" multiline rows={4} value={profileData.bio} onChange={handleInputChange} />
            <Button variant="contained" startIcon={<Save />} sx={{ mt: 2 }}>Save</Button>
          </TabPanel>
          <TabPanel value={value} index={1}>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField fullWidth label="Skill" value={profileData.newSkill.name} onChange={(e) => setProfileData(prev => ({ ...prev, newSkill: { ...prev.newSkill, name: e.target.value } }))} />
              <FormControl fullWidth>
                <InputLabel>Level</InputLabel>
                <Select value={profileData.newSkill.level} onChange={(e) => setProfileData(prev => ({ ...prev, newSkill: { ...prev.newSkill, level: e.target.value } }))}>
                  {['Beginner', 'Intermediate', 'Expert'].map(level => (<MenuItem key={level} value={level}>{level}</MenuItem>))}
                </Select>
              </FormControl>
            </Box>
            <Button variant="outlined" startIcon={<AddCircleOutline />} onClick={handleSkillAdd} sx={{ mb: 2 }}>Add Skill</Button>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {profileData.skills.map((skill, index) => (
                <Chip key={index} label={`${skill.name} (${skill.level})`} onDelete={() => handleSkillRemove(index)} color="primary" variant="outlined" deleteIcon={<Delete />} />
              ))}
            </Box>
          </TabPanel>
          <TabPanel value={value} index={2}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Preferred Format</InputLabel>
              <Select value={profileData.preferences.format} onChange={(e) => setProfileData(prev => ({ ...prev, preferences: { ...prev.preferences, format: e.target.value } }))}>
                <MenuItem value="Online">Online</MenuItem>
                <MenuItem value="In-person">In-person</MenuItem>
              </Select>
            </FormControl>
            <TextField fullWidth label="Availability" placeholder="Ex: Monday 6-8PM, Wednesday afternoon" multiline rows={3} value={profileData.preferences.availability.join(', ')} onChange={(e) => setProfileData(prev => ({ ...prev, preferences: { ...prev.preferences, availability: e.target.value.split(', ') } }))} />
          </TabPanel>
        </CardContent>
      </Card>
    </Container>
  );
};

export default MyProfile;
