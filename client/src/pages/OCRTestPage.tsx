// client/src/pages/OCRTestPage.tsx
import React from 'react';
import OCRTestPanel from '@/components/medical/OCRTestPanel';

const OCRTestPage = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">OCR Testing</h1>
      <OCRTestPanel />
    </div>
  );
};

export default OCRTestPage;