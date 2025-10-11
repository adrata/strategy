"use client";

import React from 'react';

interface SimpleSellerTemplateProps {
  record: any;
  onBack: () => void;
}

export function SimpleSellerTemplate({ record, onBack }: SimpleSellerTemplateProps) {
  if (!record) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[var(--foreground)] mb-4">No Seller Data</h1>
          <p className="text-[var(--muted)]">Seller information is not available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="mb-4 text-orange-600 hover:text-orange-700 flex items-center gap-2"
        >
          ← Back
        </button>
        <h1 className="text-3xl font-bold text-[var(--foreground)]">{record.name}</h1>
        <p className="text-[var(--muted)] mt-2">{record.title} at {record.company}</p>
      </div>

      {/* Seller Information */}
      <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-[var(--foreground)] mb-4">Seller Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--muted)] mb-1">Name</label>
            <p className="text-[var(--foreground)]">{record.name}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--muted)] mb-1">Title</label>
            <p className="text-[var(--foreground)]">{record.title}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--muted)] mb-1">Company</label>
            <p className="text-[var(--foreground)]">{record.company}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--muted)] mb-1">Email</label>
            <p className="text-[var(--foreground)]">{record.email}</p>
          </div>
        </div>
      </div>

    </div>
  );
}
