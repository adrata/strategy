"use client";

import React from 'react';

interface TestSellerTemplateProps {
  record: any;
  onBack: () => void;
}

export function TestSellerTemplate({ record, onBack }: TestSellerTemplateProps) {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Test Seller Page</h1>
      <p className="text-gray-600 mb-4">This is a test to see if the component renders.</p>
      <p className="text-gray-600 mb-4">Record data: {JSON.stringify(record, null, 2)}</p>
      <button
        onClick={onBack}
        className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
      >
        Back
      </button>
    </div>
  );
}
