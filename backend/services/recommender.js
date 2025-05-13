const InternshipApplication = require('../Models/InternshipApplication');
const InternshipOffer = require('../Models/InternshipOffer');
const Skill = require('../Models/Skill');
const { DecisionTreeClassifier } = require('machinelearn/tree');

async function recommendForStudent(studentId) {
  const applications = await InternshipApplication.find({ student: studentId }).populate('internshipOffer');
  const appliedOfferIds = applications.map(app => app.internshipOffer._id.toString());

  if (appliedOfferIds.length === 0) {
    throw new Error('Student has no previous applications.');
  }

  const offers = await InternshipOffer.find().populate('skills');
  if (offers.length === 0) {
    throw new Error('No internship offers available.');
  }

  const allSkills = await Skill.find();
  if (allSkills.length === 0) {
    throw new Error('No skills available.');
  }

  const skillIndex = {};
  allSkills.forEach((skill, idx) => {
    skillIndex[skill._id.toString()] = idx;
  });

  const numSkills = allSkills.length;
  if (numSkills === 0) {
    throw new Error('No skills indexed.');
  }

  const X = [];
  const y = [];

  offers.forEach(offer => {
    const vector = Array(numSkills).fill(0);
    offer.skills.forEach(skill => {
      const index = skillIndex[skill._id.toString()];
      if (index !== undefined) {
        vector[index] = 1;
      }
    });

    X.push(vector);
    y.push(appliedOfferIds.includes(offer._id.toString()) ? 1 : 0);
  });

  console.log('Training examples:', X.length);
  console.log('Labels:', y.length);

  // 🔥 Safety check
  if (X.length === 0 || y.length === 0 || X[0].length === 0) {
    throw new Error('Not enough data to train the model.');
  }

  const clf = new DecisionTreeClassifier();
  clf.fit(X, y);

  const newOffers = offers.filter(offer => !appliedOfferIds.includes(offer._id.toString()));
  if (newOffers.length === 0) {
    return [];
  }

  const newOfferVectors = newOffers.map(offer => {
    const vector = Array(numSkills).fill(0);
    offer.skills.forEach(skill => {
      const index = skillIndex[skill._id.toString()];
      if (index !== undefined) {
        vector[index] = 1;
      }
    });
    return vector;
  });

  if (newOfferVectors.length === 0 || newOfferVectors[0].length === 0) {
    return [];
  }

  const predictions = clf.predict(newOfferVectors);

  const scoredOffers = newOffers.map((offer, idx) => ({
    offer,
    score: predictions[idx]
  }));
  
  let predictedOffers = scoredOffers
    .filter(o => o.score === 1) // only those ML thinks are good
    .sort((a, b) => b.score - a.score) // highest score first (in future for probabilities)
    .map(o => o.offer);
  
  // fallback if no predictions
  if (predictedOffers.length === 0) {
    console.log('No strong matches found by ML. Falling back to available offers.');
    predictedOffers = newOffers;
  }
  
  // Always safely slice
  return predictedOffers.length > 3 ? predictedOffers.slice(0, 3) : predictedOffers;
  
}

module.exports = { recommendForStudent };
