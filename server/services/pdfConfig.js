// server/services/pdfConfig.js
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf');
const path = require('path');

// Configure the PDF.js worker
const pdfjsWorkerPath = path.join(__dirname, '../../node_modules/pdfjs-dist/legacy/build/pdf.worker.js');
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerPath;

module.exports = pdfjsLib;