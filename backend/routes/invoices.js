const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const { Case, Facility, Payer, Procedure, User, CaseProcedure } = require('../models');
const { authenticateToken } = require('./auth');
const fs = require('fs');
const path = require('path');

router.use(authenticateToken);

/**
 * Generate PDF invoice
 */
router.get('/:caseId/pdf', async (req, res) => {
  try {
    const caseId = req.params.caseId;
    console.log(`📄 Generating invoice for case: ${caseId}, userId: ${req.userId}`);
    
    const caseItem = await Case.findByPk(caseId, {
      include: [
        { model: Facility, as: 'facility', required: false },
        { model: Payer, as: 'payer', required: false },
        { 
          model: Procedure, 
          as: 'procedures',
          through: {
            attributes: []
          },
          required: false
        },
        { model: User, as: 'user', required: false }
      ]
    });

    if (!caseItem) {
      console.log(`❌ Case not found: ${caseId}`);
      return res.status(404).json({ error: 'Case not found' });
    }
    
    // Get singular procedure for backward compatibility if procedures array is empty
    try {
      if (!caseItem.procedures || caseItem.procedures.length === 0) {
        console.log(`📝 No procedures found in association, checking procedureId: ${caseItem.procedureId}`);
        if (caseItem.procedureId) {
          const singleProcedure = await Procedure.findByPk(caseItem.procedureId);
          if (singleProcedure) {
            console.log(`✅ Found singular procedure: ${singleProcedure.name || singleProcedure.id}`);
            caseItem.procedures = [singleProcedure];
          } else {
            console.log(`⚠️ Procedure with ID ${caseItem.procedureId} not found`);
          }
        }
      } else {
        console.log(`✅ Found ${caseItem.procedures.length} procedure(s) in association`);
      }
    } catch (procError) {
      console.error('❌ Error fetching singular procedure:', procError);
      // Continue without procedures - invoice can still be generated
    }

    console.log(`✅ Case found: ${caseId}, status: ${caseItem.status}, userId: ${caseItem.userId}, req.userId: ${req.userId}`);

    if (caseItem.userId !== req.userId) {
      console.log(`❌ Unauthorized: Case userId (${caseItem.userId}) !== req.userId (${req.userId})`);
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (caseItem.status !== 'Completed') {
      console.log(`❌ Case not completed: status is ${caseItem.status}`);
      return res.status(400).json({ error: 'Can only generate invoice for completed cases' });
    }
    
    console.log(`📝 Starting PDF generation for case: ${caseId}`);

    // Create PDF with better margins
    const doc = new PDFDocument({ 
      margin: 50,
      size: 'A4'
    });
    const filename = `invoice-${caseId}-${Date.now()}.pdf`;
    const filepath = path.join(__dirname, '../temp', filename);

    // Ensure temp directory exists
    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Register custom fonts (with fallback if fonts don't exist)
    const fontsDir = path.join(__dirname, '../fonts');
    let headingFont = 'Helvetica-Bold';
    let bodyFont = 'Helvetica';
    
    console.log('🔤 Font directory:', fontsDir);
    
    try {
      const robotoRegular = path.join(fontsDir, 'Roboto-Regular.ttf');
      const robotoBold = path.join(fontsDir, 'Roboto-Bold.ttf');
      const latoRegular = path.join(fontsDir, 'Lato-Regular.ttf');
      const latoBold = path.join(fontsDir, 'Lato-Bold.ttf');
      
      console.log('🔤 Checking fonts in:', fontsDir);
      console.log('🔤 Font files exist:', {
        robotoRegular: fs.existsSync(robotoRegular),
        robotoBold: fs.existsSync(robotoBold),
        latoRegular: fs.existsSync(latoRegular),
        latoBold: fs.existsSync(latoBold)
      });
      
      // Check if Roboto files are valid font files (TTF files start with specific bytes)
      let isRobotoValid = false;
      if (fs.existsSync(robotoRegular) && fs.existsSync(robotoBold)) {
        try {
          const robotoRegBuffer = fs.readFileSync(robotoRegular, { start: 0, end: 4 });
          const robotoBoldBuffer = fs.readFileSync(robotoBold, { start: 0, end: 4 });
          // TTF files start with 0x00 0x01 0x00 0x00 or have 'OTTO' or 'ttcf' signature
          const isValidTTF = (robotoRegBuffer[0] === 0x00 && robotoRegBuffer[1] === 0x01) ||
                             robotoRegBuffer.toString('ascii', 0, 4) === 'OTTO' ||
                             robotoRegBuffer.toString('ascii', 0, 4) === 'ttcf';
          const isValidBold = (robotoBoldBuffer[0] === 0x00 && robotoBoldBuffer[1] === 0x01) ||
                             robotoBoldBuffer.toString('ascii', 0, 4) === 'OTTO' ||
                             robotoBoldBuffer.toString('ascii', 0, 4) === 'ttcf';
          isRobotoValid = isValidTTF && isValidBold;
        } catch (e) {
          isRobotoValid = false;
        }
      }
      
      if (isRobotoValid) {
        try {
          doc.registerFont('Roboto', robotoRegular);
          doc.registerFont('Roboto-Bold', robotoBold);
          // Test that the font actually works by trying to use it
          headingFont = 'Roboto-Bold';
          console.log('✅ Roboto fonts registered successfully');
        } catch (regError) {
          console.error('❌ Error registering Roboto fonts:', regError.message);
          headingFont = 'Helvetica-Bold'; // Explicit fallback
        }
      } else {
        console.warn('⚠️ Roboto fonts not found or invalid (may be HTML files), using Helvetica');
        headingFont = 'Helvetica-Bold'; // Explicit fallback
      }
      
      // Check if Lato files are valid font files (TTF files start with specific bytes)
      let isLatoValid = false;
      if (fs.existsSync(latoRegular) && fs.existsSync(latoBold)) {
        try {
          const latoRegBuffer = fs.readFileSync(latoRegular, { start: 0, end: 4 });
          const latoBoldBuffer = fs.readFileSync(latoBold, { start: 0, end: 4 });
          // TTF files start with 0x00 0x01 0x00 0x00 or have 'OTTO' or 'ttcf' signature
          const isValidTTF = (latoRegBuffer[0] === 0x00 && latoRegBuffer[1] === 0x01) ||
                             latoRegBuffer.toString('ascii', 0, 4) === 'OTTO' ||
                             latoRegBuffer.toString('ascii', 0, 4) === 'ttcf';
          const isValidBold = (latoBoldBuffer[0] === 0x00 && latoBoldBuffer[1] === 0x01) ||
                             latoBoldBuffer.toString('ascii', 0, 4) === 'OTTO' ||
                             latoBoldBuffer.toString('ascii', 0, 4) === 'ttcf';
          isLatoValid = isValidTTF && isValidBold;
        } catch (e) {
          isLatoValid = false;
        }
      }
      
      if (isLatoValid) {
        try {
          doc.registerFont('Lato', latoRegular);
          doc.registerFont('Lato-Bold', latoBold);
          bodyFont = 'Lato';
          console.log('✅ Lato fonts registered successfully');
        } catch (regError) {
          console.error('❌ Error registering Lato fonts:', regError.message);
          bodyFont = 'Helvetica'; // Explicit fallback
        }
      } else {
        console.warn('⚠️ Lato fonts not found or invalid (may be HTML files), using Helvetica');
        bodyFont = 'Helvetica'; // Explicit fallback
      }
    } catch (fontError) {
      console.error('❌ Error in font registration block:', fontError.message);
      console.error('Font error stack:', fontError.stack);
      // Ensure we always have valid fonts
      headingFont = 'Helvetica-Bold';
      bodyFont = 'Helvetica';
    }
    
    // Final validation - ensure fonts are always valid
    if (!headingFont || headingFont === '') {
      headingFont = 'Helvetica-Bold';
    }
    if (!bodyFont || bodyFont === '') {
      bodyFont = 'Helvetica';
    }
    
    console.log(`📝 Using fonts - Heading: ${headingFont}, Body: ${bodyFont}`);

    // Create write stream for PDF file
    const writeStream = fs.createWriteStream(filepath);
    
    // Set up error handlers BEFORE piping
    const pdfPromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        console.error('❌ PDF generation timeout after 30 seconds');
        writeStream.destroy();
        if (fs.existsSync(filepath)) {
          try {
            fs.unlinkSync(filepath);
          } catch (e) {
            // Ignore cleanup errors
          }
        }
        reject(new Error('PDF generation timeout'));
      }, 30000); // 30 second timeout
      
      // Listen for write stream finish
      writeStream.on('finish', () => {
        clearTimeout(timeout);
        console.log('✅ PDF file written successfully');
        resolve();
      });
      
      // Listen for write stream errors
      writeStream.on('error', (error) => {
        clearTimeout(timeout);
        console.error('❌ Write stream error:', error);
        console.error('Write stream error details:', {
          message: error.message,
          stack: error.stack,
          code: error.code
        });
        reject(error);
      });
      
      // Listen for doc errors
      doc.on('error', (error) => {
        clearTimeout(timeout);
        console.error('❌ PDF document error:', error);
        console.error('PDF document error details:', {
          message: error.message,
          stack: error.stack
        });
        writeStream.destroy();
        if (fs.existsSync(filepath)) {
          try {
            fs.unlinkSync(filepath);
          } catch (e) {
            // Ignore cleanup errors
          }
        }
        reject(error);
      });
    });

    // Pipe PDF to file first (don't set headers until PDF is generated)
    doc.pipe(writeStream);

    // Color definitions - matching template exactly
    const lightBlue = '#ADD8E6'; // Light blue for headers (matching template)
    const borderColor = '#000000'; // Black borders
    const textColor = '#000000'; // Black text

    // Helper function to draw a box with border
    const drawBox = (x, y, width, height, fillColor = null, strokeColor = borderColor) => {
      if (fillColor) {
        doc.rect(x, y, width, height).fillColor(fillColor).fill();
      }
      doc.rect(x, y, width, height).strokeColor(strokeColor).lineWidth(0.5).stroke();
    };

    // Helper function to format currency
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('en-KE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(parseFloat(amount || 0));
    };

    // Helper function to format date as DD/MM/YYYY (matching template format)
    const formatDate = (date) => {
      if (!date) return 'N/A';
      const d = new Date(date);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    };

    // INVOICE Title - Large, bold, light blue at top left (matching template)
    doc.fillColor(lightBlue)
       .fontSize(42)
       .font(headingFont)
       .text('INVOICE', 50, 50);

    // Date and Invoice Number Box - Top Right (matching template)
    const dateBoxX = 350;
    const dateBoxY = 50;
    const dateBoxWidth = 145;
    const dateBoxHeight = 50;
    drawBox(dateBoxX, dateBoxY, dateBoxWidth, dateBoxHeight, null, borderColor);
    
    doc.fillColor(textColor)
       .fontSize(10)
       .font(bodyFont)
       .text(`Date : ${formatDate(new Date())}`, dateBoxX + 5, dateBoxY + 8);
    
    doc.text(`Invoice No : ${caseItem.invoiceNumber || 'N/A'}`, dateBoxX + 5, dateBoxY + 25);

    // FROM Section - Left side (matching template layout)
    const fromY = 120;
    const sectionWidth = 240;
    const sectionHeaderHeight = 20;
    
    // FROM header with light blue background spanning full width
    drawBox(50, fromY, sectionWidth, sectionHeaderHeight, lightBlue, borderColor);
    doc.fillColor(textColor)
       .fontSize(11)
       .font(headingFont)
       .text('FROM', 60, fromY + 5);
    
    // FROM content below header
    const fromContentY = fromY + sectionHeaderHeight + 5;
    doc.fillColor(textColor)
       .fontSize(10)
       .font(bodyFont);
    
    // Get provider/doctor name (bold)
    let providerName = 'Doc Time Medical Services';
    if (caseItem.user) {
      if (caseItem.user.preferredName) {
        providerName = `${caseItem.user.prefix || ''} ${caseItem.user.preferredName}`.trim();
      } else {
        providerName = caseItem.user.phoneNumber || providerName;
      }
    }
    
    doc.font(headingFont)
       .text(providerName, 60, fromContentY);
    
    doc.font(bodyFont)
       .text(caseItem.user?.phoneNumber || 'N/A', 60, fromContentY + 15);
    
    // Facility/address information
    if (caseItem.facility?.name) {
      doc.text(caseItem.facility.name, 60, fromContentY + 30);
    }

    // BILL TO Section - Right side (matching template layout)
    const billToX = 310;
    const billToY = fromY;
    
    // BILL TO header with light blue background spanning full width
    drawBox(billToX, billToY, sectionWidth, sectionHeaderHeight, lightBlue, borderColor);
    doc.fillColor(textColor)
       .fontSize(11)
       .font(headingFont)
       .text('BILL TO', billToX + 10, billToY + 5);
    
    // BILL TO content below header
    const billToContentY = billToY + sectionHeaderHeight + 5;
    doc.fillColor(textColor)
       .fontSize(10)
       .font(bodyFont);
    
    // Patient name (bold)
    doc.font(headingFont)
       .text(caseItem.patientName || 'N/A', billToX + 10, billToContentY);
    
    doc.font(bodyFont);
    if (caseItem.inpatientNumber) {
      doc.text(caseItem.inpatientNumber, billToX + 10, billToContentY + 15);
    }
    if (caseItem.patientAge) {
      doc.text(`Age: ${caseItem.patientAge}`, billToX + 10, billToContentY + 30);
    }

    // Invoice Items Table (matching template exactly)
    const tableY = fromContentY + 70;
    const tableWidth = 495;
    const slWidth = 60; // Serial Number column
    const descWidth = 320; // Description column
    const amountWidth = 115; // Amount column
    const cellPadding = 5; // Padding inside cells
    const headerHeight = 25;
    const rowHeight = 30;
    
    // Table Headers with light blue background (each cell separately)
    drawBox(50, tableY, slWidth, headerHeight, lightBlue, borderColor);
    doc.fillColor(textColor)
       .fontSize(10)
       .font(headingFont)
       .text('SL', 50, tableY + 8, { width: slWidth, align: 'center' });
    
    drawBox(50 + slWidth, tableY, descWidth, headerHeight, lightBlue, borderColor);
    doc.text('Description', 50 + slWidth + cellPadding, tableY + 8, { 
      width: descWidth - (cellPadding * 2)
    });
    
    drawBox(50 + slWidth + descWidth, tableY, amountWidth, headerHeight, lightBlue, borderColor);
    doc.text('Amount', 50 + slWidth + descWidth + cellPadding, tableY + 8, { 
      width: amountWidth - (cellPadding * 2), 
      align: 'right' 
    });
    
    // Get all procedures
    const procedures = caseItem.procedures && caseItem.procedures.length > 0 
      ? caseItem.procedures 
      : (caseItem.procedure ? [caseItem.procedure] : []);
    
    let currentY = tableY + headerHeight;
    
    // Table rows with borders
    if (procedures.length > 0) {
      procedures.forEach((procedure, index) => {
        if (!procedure) return;
        
        const rowY = currentY + (index * rowHeight);
        
        // Draw row borders for each cell
        drawBox(50, rowY, slWidth, rowHeight, null, borderColor);
        drawBox(50 + slWidth, rowY, descWidth, rowHeight, null, borderColor);
        drawBox(50 + slWidth + descWidth, rowY, amountWidth, rowHeight, null, borderColor);
        
        // SL column - centered
        doc.fillColor(textColor)
           .fontSize(10)
           .font(bodyFont)
           .text(String(index + 1), 50, rowY + 8, { 
             width: slWidth, 
             align: 'center' 
           });
        
        // Description column - left aligned with padding, wrap if needed
        const procedureName = procedure.name || 'Medical Service';
        doc.text(procedureName, 50 + slWidth + cellPadding, rowY + 8, { 
          width: descWidth - (cellPadding * 2),
          lineGap: 2
        });
        
        // Amount column - show only on last row if multiple procedures, or if single procedure
        if (index === procedures.length - 1 || procedures.length === 1) {
          doc.text(`KES ${formatCurrency(caseItem.amount || 0)}`, 50 + slWidth + descWidth + cellPadding, rowY + 8, { 
            width: amountWidth - (cellPadding * 2), 
            align: 'right'
          });
        }
      });
      currentY = tableY + headerHeight + (procedures.length * rowHeight);
    } else {
      // No procedures, show placeholder row
      drawBox(50, currentY, slWidth, rowHeight, null, borderColor);
      drawBox(50 + slWidth, currentY, descWidth, rowHeight, null, borderColor);
      drawBox(50 + slWidth + descWidth, currentY, amountWidth, rowHeight, null, borderColor);
      
      doc.fillColor(textColor)
         .fontSize(10)
         .font(bodyFont)
         .text('1', 50, currentY + 8, { 
           width: slWidth, 
           align: 'center' 
         });
      
      doc.text('Medical Service', 50 + slWidth + cellPadding, currentY + 8, { 
        width: descWidth - (cellPadding * 2)
      });
      
      doc.text(`KES ${formatCurrency(caseItem.amount || 0)}`, 50 + slWidth + descWidth + cellPadding, currentY + 8, { 
        width: amountWidth - (cellPadding * 2), 
        align: 'right'
      });
      currentY += rowHeight;
    }
    
    // Total Row (matching template - "Total" in SL column with light blue, Description and Amount empty)
    const totalY = currentY;
    drawBox(50, totalY, slWidth, rowHeight, lightBlue, borderColor);
    doc.fillColor(textColor)
       .fontSize(10)
       .font(headingFont)
       .text('Total', 50, totalY + 8, { 
         width: slWidth, 
         align: 'center' 
       });
    
    // Description and Amount cells are empty in Total row (just borders)
    drawBox(50 + slWidth, totalY, descWidth, rowHeight, null, borderColor);
    drawBox(50 + slWidth + descWidth, totalY, amountWidth, rowHeight, null, borderColor);
    
    // Amount goes in the Amount column (right-aligned)
    doc.fillColor(textColor)
       .fontSize(10)
       .font(bodyFont)
       .text(`KES ${formatCurrency(caseItem.amount || 0)}`, 50 + slWidth + descWidth + cellPadding, totalY + 8, { 
         width: amountWidth - (cellPadding * 2), 
         align: 'right'
       });

    // Note Section - Bottom (matching template)
    const noteY = totalY + rowHeight + 20;
    const noteBoxWidth = 495;
    const noteHeaderHeight = 20;
    const notePadding = 10; // Padding inside note box
    
    // Calculate note content height based on text length
    const noteContent = caseItem.additionalNotes 
      ? caseItem.additionalNotes 
      : 'Please send payment within 30 days of receiving this invoice. There will be 10% interest charge per month on late invoice.';
    
    // Estimate text height (rough calculation: ~12 points per line for font size 9)
    const textWidth = noteBoxWidth - (notePadding * 2);
    const estimatedLines = Math.ceil((noteContent.length * 5) / textWidth); // Rough estimate
    const noteContentHeight = Math.max(40, estimatedLines * 12); // Minimum 40, or based on lines
    const noteBoxHeight = noteHeaderHeight + noteContentHeight + (notePadding * 2);
    
    drawBox(50, noteY, noteBoxWidth, noteBoxHeight, null, borderColor);
    
    // Note header with light blue background (centered)
    drawBox(50, noteY, noteBoxWidth, noteHeaderHeight, lightBlue, borderColor);
    doc.fillColor(textColor)
       .fontSize(11)
       .font(headingFont)
       .text('Note', 50, noteY + 5, { 
         width: noteBoxWidth, 
         align: 'center' 
       });
    
    // Note content - properly contained within the box with proper padding
    doc.fillColor(textColor)
       .fontSize(9)
       .font(bodyFont)
       .text(noteContent, 50 + notePadding, noteY + noteHeaderHeight + notePadding, {
         width: noteBoxWidth - (notePadding * 2),
         align: 'left',
         lineGap: 3
       });

    // End the document (this triggers the pipe to write to file)
    console.log('📝 Ending PDF document...');
    doc.end();

    // Wait for PDF to be generated (wait for write stream to finish)
    console.log('⏳ Waiting for PDF file to be written...');
    await pdfPromise;
    console.log('✅ PDF generation complete, file ready');

    // Check if file exists before sending
    if (!fs.existsSync(filepath)) {
      throw new Error('PDF file was not created');
    }

    // Now set headers and send the file
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    const fileStream = fs.createReadStream(filepath);
    fileStream.on('error', (error) => {
      console.error('Error reading PDF file:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to read PDF file' });
      }
    });
    
    fileStream.pipe(res);

    // Clean up file after sending
    res.on('finish', () => {
      setTimeout(() => {
        try {
          if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
          }
        } catch (cleanupError) {
          console.error('Error cleaning up PDF file:', cleanupError);
        }
      }, 5000);
    });
  } catch (error) {
    console.error('❌ Error generating invoice:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      caseId: req.params.caseId,
      userId: req.userId,
      ...(error.original && { original: error.original.message }),
      ...(error.parent && { parent: error.parent.message })
    });
    
    // Handle Sequelize errors specifically
    if (error.name === 'SequelizeDatabaseError' || error.name === 'SequelizeValidationError') {
      console.error('❌ Sequelize error:', error.original || error);
    }
    
    // Return detailed error in development, generic in production
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? (error.message || error.original?.message || 'Failed to generate invoice')
      : 'Failed to generate invoice';
    
    // Make sure we haven't already sent a response
    if (!res.headersSent) {
      res.status(500).json({ 
        error: errorMessage,
        ...(process.env.NODE_ENV === 'development' && { 
          stack: error.stack,
          name: error.name,
          ...(error.original && { originalError: error.original.message })
        })
      });
    } else {
      console.error('⚠️ Response already sent, cannot send error response');
    }
  }
});

module.exports = router;

