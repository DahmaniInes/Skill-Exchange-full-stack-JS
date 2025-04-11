const Instructor = require('../Models/Instructor');

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
