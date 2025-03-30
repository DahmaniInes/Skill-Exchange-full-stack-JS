const User = require("../Models/User"); // Adjust the path as needed

const getAllUsers = async (req, res) => {
  try {
    // Fetch all users from the database
    const users = await User.find({}).select('-password -authKeyTOTP'); // Exclude sensitive fields
    
    // Return the users
    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
    
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching users",
      error: error.message
    });
  }
};
module.exports = { getAllUsers }