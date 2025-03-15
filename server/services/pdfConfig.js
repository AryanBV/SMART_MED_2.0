// Path: server/services/pdfConfig.js

const pdfjsLib = require('pdfjs-dist/legacy/build/pdf');

// Set workerSrc directly using the node compatibility version
pdfjsLib.GlobalWorkerOptions.workerSrc = require.resolve(
  'pdfjs-dist/legacy/build/pdf.worker'
);

// For node environment
if (typeof window === 'undefined') {
  const nodeFS = require('fs');
  const nodePath = require('path');
  
  const pdfjsWorker = require('pdfjs-dist/legacy/build/pdf.worker.js');
  
  pdfjsLib.createNodeCanvas = () => ({});
  pdfjsLib.createNodeCanvasFactory = () => ({});
  
  // Set up the fake worker
  pdfjsLib.WorkerMessageHandler = pdfjsWorker.WorkerMessageHandler;
}

module.exports = pdfjsLib;