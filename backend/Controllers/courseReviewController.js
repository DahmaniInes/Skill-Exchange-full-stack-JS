const CourseReview = require('../Models/CourseReview');
const CourseDetail = require('../Models/CourseDetail');

exports.addReview = async (req, res) => {
  try {
    const { course, user, rating, comment } = req.body;
    const review = new CourseReview({ course, user, rating, comment });
    await review.save();
    res.status(201).json(review);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getReviewsByCourse = async (req, res) => {
  try {
    const reviews = await CourseReview.find({ course: req.params.courseId })
      .populate({
        path: 'user',
        select: 'firstName lastName profilePicture'
      });

    const formatted = reviews.map(r => ({
      _id: r._id,
      course: r.course,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
      user: {
        _id: r.user._id,
        fullName: `${r.user.firstName} ${r.user.lastName}`,
        profilePicture: r.user.profilePicture
      }
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getReviewsForInstructor = async (req, res) => {
  try {
    const instructorId = req.params.instructorId;

    const courseDetails = await CourseDetail.find({ instructors: instructorId });
    const courseIds = courseDetails.map(cd => cd.course);

    const reviews = await CourseReview.find({ course: { $in: courseIds } }).populate('user', 'name');
    res.json(reviews);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
