const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

exports.generateCertificate = (req, res) => {
  const { courseName, userName, instructorName, courseDetails } = req.body;

  const doc = new PDFDocument({ size: 'A4', margin: 50 });

  // Pipe the document to a buffer
  const filename = `${userName}_certificate.pdf`;
  res.setHeader('Content-disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-type', 'application/pdf');
  doc.pipe(res);

  // Header
  doc
    .fontSize(26)
    .text('Certificate of Completion', { align: 'center' })
    .moveDown();

  // User & Course Info
  doc
    .fontSize(16)
    .text(`This is to certify that`, { align: 'center' })
    .moveDown(0.5)
    .fontSize(20)
    .fillColor('#007bff')
    .text(`${userName}`, { align: 'center', underline: true })
    .fillColor('black')
    .moveDown(0.5)
    .fontSize(16)
    .text(`has successfully completed the course`, { align: 'center' })
    .moveDown(0.5)
    .fontSize(20)
    .fillColor('#28a745')
    .text(`${courseName}`, { align: 'center', underline: true })
    .fillColor('black')
    .moveDown(1);

  // Instructor
  doc
    .fontSize(14)
    .text(`Instructor: ${instructorName}`, { align: 'center' })
    .moveDown();

  // Course Details
  doc
    .fontSize(12)
    .text('Course Details:', { underline: true, bold: true })
    .moveDown(0.5)
    .fontSize(11)
    .text(courseDetails)
    .moveDown(2);
    doc
    .fontSize(12)
    .text('Certified by CodeCrafters Organization', { align: 'center' });


  // Signature (logo image)
  const signaturePath = path.join(__dirname, '../assets/signature.png');
  if (fs.existsSync(signaturePath)) {
    doc.image(signaturePath, doc.page.width / 2 - 50, doc.y, { width: 200 });
    doc.moveDown(10);
  }

  
  // Finalize PDF
  doc.end();
};
