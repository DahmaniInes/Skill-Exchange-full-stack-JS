const Instructor = require('../Models/Instructor');
const CourseDetail = require('../Models/CourseDetail');
const Course = require('../Models/Course');

exports.createInstructor = async (req, res) => {
  try {
    const instructor = new Instructor(req.body);
    await instructor.save();
    res.status(201).json(instructor);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.updateInstructor = async (req, res) => {
  try {
    const instructor = await Instructor.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!instructor) return res.status(404).json({ error: 'Instructor not found' });
    res.json(instructor);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteInstructor = async (req, res) => {
  try {
    const instructor = await Instructor.findByIdAndDelete(req.params.id);
    if (!instructor) return res.status(404).json({ error: 'Instructor not found' });
    res.json({ message: 'Instructor deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};


exports.getInstructors = async (req, res) => {
  try {
    const instructors = await Instructor.find();

    const result = await Promise.all(instructors.map(async (inst) => {
      const courseDetails = await CourseDetail.find({ instructors: inst._id });
      const courseIds = courseDetails.map(cd => cd.course);
      const courses = await Course.find({ _id: { $in: courseIds } });

      const averageRating = courses.length > 0
        ? courses.reduce((sum, c) => sum + (c.rating || 0), 0) / courses.length
        : 0;

      const studentCount = courses.reduce((sum, c) => sum + (c.users?.length || 0), 0);

      return {
        _id: inst._id,
        name: inst.name,
        bio: inst.bio,
        photo: inst.photo,
        courseCount: courseDetails.length,
        averageRating: averageRating.toFixed(2),
        studentCount
      };
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



// Get instructor by ID
exports.getInstructorById = async (req, res) => {
  try {
    const inst = await Instructor.findById(req.params.id);
    if (!inst) return res.status(404).json({ error: 'Instructor not found' });

    const courseDetails = await CourseDetail.find({ instructors: inst._id });
    const courseIds = courseDetails.map(cd => cd.course);
    const courses = await Course.find({ _id: { $in: courseIds } });

    const averageRating = courses.length > 0
      ? courses.reduce((sum, c) => sum + (c.rating || 0), 0) / courses.length
      : 0;

    const studentCount = courses.reduce((sum, c) => sum + (c.users?.length || 0), 0);

    res.json({
      _id: inst._id,
      name: inst.name,
      bio: inst.bio,
      photo: inst.photo,
      courseCount: courseDetails.length,
      averageRating: averageRating.toFixed(2),
      studentCount
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
