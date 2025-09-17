/**
 * Custom hook for pipeline action management.
 * Handles CRUD operations, modal state, and form submissions.
 */

import { useState, useCallback } from 'react';

// -------- Types --------
interface PipelineRecord {
  id: string;
  name: string;
  status?: string;
  priority?: string;
  stage?: string;
  lastActionTime?: string;
  lastContactTime?: string;
  lastActionDescription?: string;
  nextAction?: string;
  [key: string]: any;
}

interface ActionLogData {
  type: string;
  description: string;
  date: string;
  outcome?: string;
  nextAction?: string;
}

interface UsePipelineActionsProps {
  onRecordUpdate?: (record: PipelineRecord) => void;
  onRecordDelete?: (recordId: string) => void;
  onActionAdd?: (recordId: string, action: ActionLogData) => void;
}

interface UsePipelineActionsReturn {
  // Modal state
  editModalOpen: boolean;
  addActionModalOpen: boolean;
  detailModalOpen: boolean;
  selectedRecord: PipelineRecord | null;
  isSubmitting: boolean;
  
  // Modal actions
  openEditModal: (record: PipelineRecord) => void;
  closeEditModal: () => void;
  openAddActionModal: (record: PipelineRecord) => void;
  closeAddActionModal: () => void;
  openDetailModal: (record: PipelineRecord) => void;
  closeDetailModal: () => void;
  
  // Record actions
  handleEdit: (record: PipelineRecord) => void;
  handleAddAction: (record: PipelineRecord) => void;
  handleMarkComplete: (record: PipelineRecord) => void;
  handleDelete: (record: PipelineRecord) => void;
  handleCall: (record: PipelineRecord) => void;
  handleEmail: (record: PipelineRecord) => void;
  
  // Form actions
  handleEditSubmit: (formData: Partial<PipelineRecord>) => Promise<void>;
  handleActionSubmit: (actionData: ActionLogData) => Promise<void>;
}

// -------- Main Hook --------
export function usePipelineActions({
  onRecordUpdate,
  onRecordDelete,
  onActionAdd,
}: UsePipelineActionsProps = {}): UsePipelineActionsReturn {
  // Modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [addActionModalOpen, setAddActionModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<PipelineRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Modal actions
  const openEditModal = useCallback((record: PipelineRecord) => {
    setSelectedRecord(record);
    setEditModalOpen(true);
  }, []);
  
  const closeEditModal = useCallback(() => {
    setEditModalOpen(false);
    setSelectedRecord(null);
  }, []);
  
  const openAddActionModal = useCallback((record: PipelineRecord) => {
    setSelectedRecord(record);
    setAddActionModalOpen(true);
  }, []);
  
  const closeAddActionModal = useCallback(() => {
    setAddActionModalOpen(false);
    setSelectedRecord(null);
  }, []);
  
  const openDetailModal = useCallback((record: PipelineRecord) => {
    setSelectedRecord(record);
    setDetailModalOpen(true);
  }, []);
  
  const closeDetailModal = useCallback(() => {
    setDetailModalOpen(false);
    setSelectedRecord(null);
  }, []);
  
  // Record actions
  const handleEdit = useCallback((record: PipelineRecord) => {
    openEditModal(record);
  }, [openEditModal]);
  
  const handleAddAction = useCallback((record: PipelineRecord) => {
    openAddActionModal(record);
  }, [openAddActionModal]);
  
  const handleMarkComplete = useCallback((record: PipelineRecord) => {
    // Mark record as complete - could update status or move to completed section
    console.log('Mark as complete:', record);
    // TODO: Implement mark complete functionality
  }, []);
  
  const handleDelete = useCallback((record: PipelineRecord) => {
    if (confirm(`Are you sure you want to delete ${record.fullName || record.name}?`)) {
      console.log('Delete:', record);
      if (onRecordDelete) {
        onRecordDelete(record.id);
      }
    }
  }, [onRecordDelete]);
  
  const handleCall = useCallback((record: PipelineRecord) => {
    // Handle call action
    console.log('Call:', record);
    // TODO: Implement call functionality
  }, []);
  
  const handleEmail = useCallback((record: PipelineRecord) => {
    // Handle email action
    console.log('Email:', record);
    // TODO: Implement email functionality
  }, []);
  
  // Form actions
  const handleEditSubmit = useCallback(async (formData: Partial<PipelineRecord>) => {
    if (!selectedRecord) return;
    
    setIsSubmitting(true);
    try {
      const updatedRecord = { ...selectedRecord, ...formData };
      
      // TODO: Implement API call to update record
      console.log('Updating record:', updatedRecord);
      
      if (onRecordUpdate) {
        onRecordUpdate(updatedRecord);
      }
      
      closeEditModal();
    } catch (error) {
      console.error('Error updating record:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedRecord, onRecordUpdate, closeEditModal]);
  
  const handleActionSubmit = useCallback(async (actionData: ActionLogData) => {
    if (!selectedRecord) return;
    
    setIsSubmitting(true);
    try {
      // TODO: Implement API call to add action
      console.log('Adding action:', actionData, 'to record:', selectedRecord.id);
      
      if (onActionAdd) {
        onActionAdd(selectedRecord.id, actionData);
      }
      
      closeAddActionModal();
    } catch (error) {
      console.error('Error adding action:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedRecord, onActionAdd, closeAddActionModal]);
  
  return {
    // Modal state
    editModalOpen,
    addActionModalOpen,
    detailModalOpen,
    selectedRecord,
    isSubmitting,
    
    // Modal actions
    openEditModal,
    closeEditModal,
    openAddActionModal,
    closeAddActionModal,
    openDetailModal,
    closeDetailModal,
    
    // Record actions
    handleEdit,
    handleAddAction,
    handleMarkComplete,
    handleDelete,
    handleCall,
    handleEmail,
    
    // Form actions
    handleEditSubmit,
    handleActionSubmit,
  };
}
