import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import { UniversalRecordTemplate } from '../../../src/frontend/components/pipeline/UniversalRecordTemplate';

// Mock fetch for API calls
global.fetch = jest.fn();

// Mock data
const mockLeadRecord = {
  id: 'john-dano-lead_1757443731739_h6h3glvnk',
  fullName: 'John Dano',
  email: 'john.dano@example.com',
  phone: '+1-555-0123',
  jobTitle: 'VP of Sales',
  company: 'Retail Product Solutions',
  status: 'new',
  priority: 'medium',
  source: 'Website',
  createdAt: '2025-01-09T00:00:00Z',
  notes: []
};

describe('Lead Detail Integration Tests', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  describe('Inline Editing Functionality', () => {
    test('should allow inline editing of lead name', async () => {
      const mockOnSave = jest.fn().mockResolvedValue({ success: true });
      
      render(
        <UniversalRecordTemplate
          record={mockLeadRecord}
          recordType="leads"
          onSave={mockOnSave}
        />
      );

      // Click on the name field to edit
      const nameField = screen.getByDisplayValue('John Dano');
      fireEvent.click(nameField);
      
      // Change the value
      fireEvent.change(nameField, { target: { value: 'John Dano Updated' } });
      
      // Save the change
      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith('fullName', 'John Dano Updated');
      });
    });

    test('should allow inline editing of email', async () => {
      const mockOnSave = jest.fn().mockResolvedValue({ success: true });
      
      render(
        <UniversalRecordTemplate
          record={mockLeadRecord}
          recordType="leads"
          onSave={mockOnSave}
        />
      );

      const emailField = screen.getByDisplayValue('john.dano@example.com');
      fireEvent.click(emailField);
      fireEvent.change(emailField, { target: { value: 'john.updated@example.com' } });
      
      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith('email', 'john.updated@example.com');
      });
    });
  });

  describe('Delete Functionality', () => {
    test('should handle delete button click', async () => {
      const mockOnDelete = jest.fn().mockResolvedValue({ success: true });
      
      render(
        <UniversalRecordTemplate
          record={mockLeadRecord}
          recordType="leads"
          onDelete={mockOnDelete}
        />
      );

      // Find and click delete button
      const deleteButton = screen.getByText('Delete');
      fireEvent.click(deleteButton);

      // Should show confirmation dialog
      expect(screen.getByText('Are you sure you want to delete this record?')).toBeInTheDocument();
      
      // Confirm deletion
      const confirmButton = screen.getByText('Yes, Delete');
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockOnDelete).toHaveBeenCalledWith(mockLeadRecord.id);
      });
    });
  });

  describe('Advance to Prospect Functionality', () => {
    test('should advance lead to prospect and update URL', async () => {
      const mockOnAdvance = jest.fn().mockResolvedValue({ 
        success: true, 
        newRecordId: 'john-dano-prospect_1757443731739_h6h3glvnk' 
      });
      
      // Mock window.location
      delete (window as any).location;
      window.location = { href: 'https://action.adrata.com/adrata/pipeline/leads/john-dano-lead_1757443731739_h6h3glvnk' } as any;

      render(
        <UniversalRecordTemplate
          record={mockLeadRecord}
          recordType="leads"
          onAdvanceToProspect={mockOnAdvance}
        />
      );

      const advanceButton = screen.getByText('Advance to Prospect');
      fireEvent.click(advanceButton);

      await waitFor(() => {
        expect(mockOnAdvance).toHaveBeenCalledWith(mockLeadRecord.id);
        expect(window.location.href).toBe('https://action.adrata.com/adrata/pipeline/prospects/john-dano-prospect_1757443731739_h6h3glvnk');
      });
    });
  });

  describe('Edit Modal Functionality', () => {
    test('should open edit modal and allow editing', async () => {
      render(
        <UniversalRecordTemplate
          record={mockLeadRecord}
          recordType="leads"
        />
      );

      // Click edit button
      const editButton = screen.getByText('Edit');
      fireEvent.click(editButton);

      // Modal should open
      await waitFor(() => {
        expect(screen.getByText('Update Lead')).toBeInTheDocument();
      });

      // Should have all tabs
      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByText('Company')).toBeInTheDocument();
      expect(screen.getByText('Notes')).toBeInTheDocument();
      expect(screen.getByText('Timeline')).toBeInTheDocument();
    });

    test('should save changes from edit modal', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      render(
        <UniversalRecordTemplate
          record={mockLeadRecord}
          recordType="leads"
        />
      );

      // Open edit modal
      const editButton = screen.getByText('Edit');
      fireEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByText('Update Lead')).toBeInTheDocument();
      });

      // Make changes in the modal
      const nameField = screen.getByDisplayValue('John Dano');
      fireEvent.change(nameField, { target: { value: 'John Dano Modal Edit' } });

      // Save changes
      const updateButton = screen.getByText('Update Record');
      fireEvent.click(updateButton);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/data/unified', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'leads',
            action: 'update',
            id: mockLeadRecord.id,
            data: { fullName: 'John Dano Modal Edit' }
          })
        });
      });
    });
  });

  describe('Tab Navigation', () => {
    test('should switch between tabs correctly', async () => {
      render(
        <UniversalRecordTemplate
          record={mockLeadRecord}
          recordType="leads"
        />
      );

      // Should start on Overview tab
      expect(screen.getByText('Lead Information')).toBeInTheDocument();

      // Switch to Company tab
      const companyTab = screen.getByText('Company');
      fireEvent.click(companyTab);
      
      await waitFor(() => {
        expect(screen.getByText('Company Information')).toBeInTheDocument();
      });

      // Switch to Notes tab
      const notesTab = screen.getByText('Notes');
      fireEvent.click(notesTab);
      
      await waitFor(() => {
        expect(screen.getByText('Add New Note')).toBeInTheDocument();
      });
    });
  });
});
