/**
 * TEST COMPONENTS PAGE - Side-by-side comparison of V1 vs V2 components
 * 
 * This page allows us to test and compare the original components with
 * the new configuration-driven versions to ensure they look and behave identically.
 */

"use client";

import React, { useState } from 'react';
import { UniversalRecordTemplate } from '@/frontend/components/pipeline/UniversalRecordTemplate';
import { RecordTemplateV2 } from '@/frontend/components/pipeline/UniversalRecordTemplateV2';
import { UpdateModal } from '@/frontend/components/pipeline/UpdateModal';
import { UpdateModalV2 } from '@/frontend/components/pipeline/UpdateModalV2';
import { PipelineFilters } from '@/frontend/components/pipeline/PipelineFilters';
import { PipelineFiltersV2 } from '@/frontend/components/pipeline/PipelineFiltersV2';
import { ActionPlatformMiddlePanel } from '@/platform/ui/components/ActionPlatformMiddlePanel';
import { ActionPlatformMiddlePanelV2 } from '@/platform/ui/components/ActionPlatformMiddlePanelV2';
import { AcquisitionOSProvider } from '@/platform/ui/context/AcquisitionOSProvider';

// Sample test data
const sampleRecord = {
  id: '1',
  name: 'John Doe',
  email: 'john.doe@example.com',
  phone: '+1-555-0123',
  company: 'Acme Corp',
  title: 'VP of Sales',
  status: 'active',
  priority: 'high',
  lastContacted: '2024-01-15',
  timezone: 'PST',
  notes: 'This is a test record for component comparison.',
  avatar: null
};

const sampleRecordTypes = [
  'leads',
  'prospects', 
  'opportunities',
  'companies',
  'people',
  'clients',
  'partners',
  'sellers',
  'speedrun'
] as const;

export default function TestComponentsPage() {
  const [selectedComponent, setSelectedComponent] = useState<'universal' | 'modal' | 'filters' | 'panel'>('universal');
  const [selectedRecordType, setSelectedRecordType] = useState<typeof sampleRecordTypes[number]>('leads');
  const [showV1, setShowV1] = useState(true);
  const [showV2, setShowV2] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalV2Open, setIsModalV2Open] = useState(false);

  const handleBack = () => {
    console.log('Back clicked');
  };

  const handleUpdate = async (updatedData: any) => {
    console.log('Update clicked:', updatedData);
  };

  const handleDelete = async (recordId: string) => {
    console.log('Delete clicked:', recordId);
  };

  const handleSearchChange = (query: string) => {
    console.log('Search changed:', query);
  };

  const handleFilterChange = (filter: string, value: string) => {
    console.log('Filter changed:', filter, value);
  };

  const handleAddRecord = () => {
    console.log('Add record clicked');
  };

  const handleColumnVisibilityChange = (columns: string[]) => {
    console.log('Column visibility changed:', columns);
  };

  return (
    <AcquisitionOSProvider>
      <div className="min-h-screen bg-gray-100">
        <div className="p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Component Comparison Test
          </h1>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Test Controls</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Component Type
              </label>
              <select
                value={selectedComponent}
                onChange={(e) => setSelectedComponent(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="universal">Universal Record Template</option>
                <option value="modal">Update Modal</option>
                <option value="filters">Pipeline Filters</option>
                <option value="panel">Action Platform Panel</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Record Type
              </label>
              <select
                value={selectedRecordType}
                onChange={(e) => setSelectedRecordType(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {sampleRecordTypes.map((type) => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Show Versions
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={showV1}
                    onChange={(e) => setShowV1(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">V1 (Original)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={showV2}
                    onChange={(e) => setShowV2(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">V2 (Config-driven)</span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Test V1 Modal
            </button>
            <button
              onClick={() => setIsModalV2Open(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Test V2 Modal
            </button>
          </div>
        </div>

        {/* Component Comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* V1 Component */}
          {showV1 && (
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  V1 (Original) - {selectedComponent}
                </h3>
              </div>
              <div className="h-96 overflow-auto">
                {selectedComponent === 'universal' && (
                  <UniversalRecordTemplate
                    record={sampleRecord}
                    recordType={selectedRecordType}
                    onBack={handleBack}
                    onRecordUpdate={handleUpdate}
                  />
                )}
                {selectedComponent === 'filters' && (
                  <PipelineFilters
                    section={selectedRecordType}
                    totalCount={42}
                    onSearchChange={handleSearchChange}
                    onVerticalChange={(value) => handleFilterChange('vertical', value)}
                    onStatusChange={(value) => handleFilterChange('status', value)}
                    onPriorityChange={(value) => handleFilterChange('priority', value)}
                    onRevenueChange={(value) => handleFilterChange('revenue', value)}
                    onLastContactedChange={(value) => handleFilterChange('lastContacted', value)}
                    onTimezoneChange={(value) => handleFilterChange('timezone', value)}
                    onSortChange={(field, direction) => console.log('Sort changed:', field, direction)}
                    onAddRecord={handleAddRecord}
                    onColumnVisibilityChange={handleColumnVisibilityChange}
                    visibleColumns={['name', 'email', 'company', 'status']}
                  />
                )}
                {selectedComponent === 'panel' && (
                  <ActionPlatformMiddlePanel />
                )}
              </div>
            </div>
          )}

          {/* V2 Component */}
          {showV2 && (
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  V2 (Config-driven) - {selectedComponent}
                </h3>
              </div>
              <div className="h-96 overflow-auto">
                {selectedComponent === 'universal' && (
                  <RecordTemplateV2
                    record={sampleRecord}
                    recordType={selectedRecordType}
                    onBack={handleBack}
                    onRecordUpdate={handleUpdate}
                  />
                )}
                {selectedComponent === 'filters' && (
                  <PipelineFiltersV2
                    section={selectedRecordType}
                    totalCount={42}
                    onSearchChange={handleSearchChange}
                    onVerticalChange={(value) => handleFilterChange('vertical', value)}
                    onStatusChange={(value) => handleFilterChange('status', value)}
                    onPriorityChange={(value) => handleFilterChange('priority', value)}
                    onRevenueChange={(value) => handleFilterChange('revenue', value)}
                    onLastContactedChange={(value) => handleFilterChange('lastContacted', value)}
                    onTimezoneChange={(value) => handleFilterChange('timezone', value)}
                    onSortChange={(field, direction) => console.log('Sort changed:', field, direction)}
                    onAddRecord={handleAddRecord}
                    onColumnVisibilityChange={handleColumnVisibilityChange}
                    visibleColumns={['name', 'email', 'company', 'status']}
                  />
                )}
                {selectedComponent === 'panel' && (
                  <ActionPlatformMiddlePanelV2 />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modals */}
        {isModalOpen && (
          <UpdateModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            record={sampleRecord}
            recordType={selectedRecordType}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
          />
        )}

        {isModalV2Open && (
          <UpdateModalV2
            isOpen={isModalV2Open}
            onClose={() => setIsModalV2Open(false)}
            record={sampleRecord}
            recordType={selectedRecordType}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
          />
        )}
        </div>
      </div>
    </AcquisitionOSProvider>
  );
}
