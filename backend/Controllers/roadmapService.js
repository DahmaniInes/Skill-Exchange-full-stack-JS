const Roadmap = require('../Models/Roadmap');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const { Parser } = require('json2csv');

class RoadmapService {
  // Fetch a roadmap by ID
  static async getRoadmapById(roadmapId) {
    const roadmap = await Roadmap.findById(roadmapId)
      .populate('skill', 'name level categories');
    if (!roadmap) {
      throw new Error('Roadmap not found');
    }
    return roadmap;
  }

  // Update a specific step
  static async updateStep(roadmapId, stepId, updates) {
    const roadmap = await Roadmap.findById(roadmapId);
    if (!roadmap) {
      throw new Error('Roadmap not found');
    }
    const step = roadmap.steps.id(stepId);
    if (!step) {
      throw new Error('Step not found');
    }
    Object.assign(step, updates);
    roadmap.lastUpdated = Date.now();
    await roadmap.save();
    return roadmap;
  }

  // Reorder steps
  static async reorderSteps(roadmapId, newOrder) {
    const roadmap = await Roadmap.findById(roadmapId);
    if (!roadmap) {
      throw new Error('Roadmap not found');
    }
    const reorderedSteps = newOrder.map(stepId =>
      roadmap.steps.find(step => step._id.toString() === stepId)
    );
    roadmap.steps = reorderedSteps;
    roadmap.lastUpdated = Date.now();
    await roadmap.save();
    return roadmap;
  }

  // Download roadmap as PDF
  static async downloadAsPDF(roadmapId) {
    const roadmap = await Roadmap.findById(roadmapId)
      .populate('skill', 'name level categories');
    if (!roadmap) {
      throw new Error('Roadmap not found');
    }

    const doc = new PDFDocument();
    const filePath = `roadmap-${roadmapId}.pdf`;
    doc.pipe(fs.createWriteStream(filePath));

    doc.fontSize(20).text(roadmap.title, { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(roadmap.description, { align: 'center' });
    doc.moveDown();

    roadmap.steps.forEach((step, index) => {
      doc.fontSize(14).text(`Step ${index + 1}: ${step.title}`);
      doc.fontSize(10).text(`Description: ${step.description}`);
      doc.text(`Duration: ${step.duration}`);
      doc.text(`Resources: ${step.resources.join(', ')}`);
      doc.text(`Notes: ${step.notes || 'No notes'}`);
      doc.moveDown();
    });

    doc.end();
    return filePath;
  }

  // Download roadmap as CSV
  static async downloadAsCSV(roadmapId) {
    const roadmap = await Roadmap.findById(roadmapId)
      .populate('skill', 'name level categories');
    if (!roadmap) {
      throw new Error('Roadmap not found');
    }

    const fields = ['title', 'description', 'duration', 'resources', 'notes'];
    const opts = { fields };
    const parser = new Parser(opts);
    const csv = parser.parse(roadmap.steps);
    const filePath = `roadmap-${roadmapId}.csv`;
    fs.writeFileSync(filePath, csv);
    return filePath;
  }
}

module.exports = RoadmapService;