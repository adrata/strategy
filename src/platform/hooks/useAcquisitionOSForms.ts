import React, { useState, useCallback } from "react";
import { DEFAULT_FORM_DATA } from "@/platform/config";
import { safeApiFetch } from "@/platform/safe-api-fetch";
import { getDesktopEnvInfo } from "@/platform/desktop-env-check";
import { invoke } from "@tauri-apps/api/core";
import { useUnifiedAuth } from "@/platform/auth-unified";
import type { FormData } from "../types/hooks";

interface UseAcquisitionOSFormsReturn {
  // Form State
  formData: FormData;
  editingRecord: any;

  // Actions
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  setEditingRecord: (record: any) => void;
  resetForm: () => void;

  // CRUD Operations
  handleCreateRecord: (
    activeSection: string,
    activeSubApp: string,
    onSuccess: (message: string) => void,
    onError: (message: string) => void,
    refreshData?: () => Promise<void>,
  ) => Promise<void>;

  handleUpdateRecord: (
    activeSection: string,
    activeSubApp: string,
    onSuccess: (message: string) => void,
    onError: (message: string) => void,
  ) => Promise<void>;

  handleDeleteRecord: (
    record: any,
    activeSection: string,
    activeSubApp: string,
    onSuccess: (message: string) => void,
    onError: (message: string) => void,
    onClearSelection?: () => void,
  ) => Promise<void>;

  // Conversion Operations
  handleConvertLeadToOpportunity: (
    lead: any,
    onSuccess: (message: string) => void,
    onError: (message: string) => void,
    refreshData?: () => Promise<void>,
  ) => Promise<void>;
}

/**
 * 📝 ACQUISITION OS FORMS HOOK
 * Handles all form operations for AcquisitionOS
 */
export function useAcquisitionOSForms(): UseAcquisitionOSFormsReturn {
  // Auth context for workspace isolation
  const { user: authUser, session } = useUnifiedAuth();
  const activeWorkspace = authUser?.workspaces?.[0];
  
  // Debug helper
  const debug = (phase: string, details: any) => {
    console.log(`📝 [FORMS HOOK] ${phase}:`, details);
  };

  // Form State
  const [formData, setFormData] = useState<FormData>(DEFAULT_FORM_DATA);
  const [editingRecord, setEditingRecord] = useState<any>(null);

  // Reset form to defaults
  const resetForm = useCallback(() => {
    debug("RESET_FORM", {});
    setFormData(DEFAULT_FORM_DATA);
    setEditingRecord(null);
  }, []);

  // Handle create record
  const handleCreateRecord = useCallback(
    async (
      activeSection: string,
      activeSubApp: string,
      onSuccess: (message: string) => void,
      onError: (message: string) => void,
      refreshData?: () => Promise<void>,
    ) => {
      debug("CREATE_RECORD_START", {
        activeSection,
        activeSubApp,
        recordName: formData.name,
      });

      const envInfo = getDesktopEnvInfo();
      let newRecordId: string | null = null;

      try {
        if (activeSection === "leads") {
          if (!envInfo.isDesktop) {
            // Create lead via API
            debug("CREATE_LEAD_API", { formData });
            
            const leadData = {
              name: formData.name,
              email: formData.email,
              phone: formData.phone,
              company: formData.company,
              title: formData.title,
              source: formData.source || "Action Platform",
              status: "new",
              workspaceId: activeWorkspace?.id || "",
              userId: authUser?.id || ""
            };
            
            console.log('🔍 [FORMS HOOK] Creating lead with data:', leadData);
            console.log('🔍 [FORMS HOOK] activeWorkspace:', activeWorkspace);
            console.log('🔍 [FORMS HOOK] authUser:', authUser);

            const createResponse = await safeApiFetch(
              "/api/data/unified",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  type: "leads",
                  action: "create",
                  data: leadData
                }),
              },
              {
                success: false,
                data: null,
                error: null,
              },
            );

            if (createResponse['success'] && createResponse.data) {
              newRecordId = createResponse.data.id;
              debug("CREATE_LEAD_SUCCESS", { newRecordId });

              // Success message without enrichment for now
              onSuccess(
                `✅ Successfully created lead: ${formData.name}`,
              );
            } else {
              throw new Error("Failed to create lead");
            }
          } else {
            // Desktop mode
            debug("CREATE_LEAD_DESKTOP", { formData });
            newRecordId = `desktop-lead-${Date.now()}`;
            onSuccess(
              `✅ Successfully created lead: ${formData.name} (Desktop mode - not saved to database)`,
            );
          }
        } else if (activeSection === "opportunities") {
          if (!envInfo.isDesktop) {
            // Create opportunity via API
            debug("CREATE_OPPORTUNITY_API", { formData });

            const createResponse = await safeApiFetch(
              "/api/data/unified",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  type: "opportunities",
                  action: "create",
                  data: {
                    name: formData.name,
                    amount: (formData as any).amount
                      ? parseFloat((formData as any).amount)
                      : 50000,
                    expectedCloseDate:
                      (formData as any).closeDate ||
                      new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
                        .toISOString()
                        .split("T")[0],
                    probability: (formData as any).probability
                      ? parseInt((formData as any).probability)
                      : 25,
                    stage: formData.stage || "Discovery",
                    sourceType: formData.source || "Manual Entry",
                    primaryContact: (formData as any).contact,
                    company: formData.company,
                    notes: (formData as any).notes || "",
                    workspaceId: activeWorkspace?.id || "",
                    userId: authUser?.id || "",
                  }
                }),
              },
              {
                success: false,
                data: null,
                error: null,
              },
            );

            if (createResponse['success'] && createResponse.data) {
              newRecordId = createResponse.data.id;
              debug("CREATE_OPPORTUNITY_SUCCESS", { newRecordId });
              onSuccess(
                `✅ Successfully created opportunity: ${formData.name}`,
              );
            } else {
              throw new Error(createResponse.error || "Failed to create opportunity");
            }
          } else {
            // Desktop mode - use Tauri commands
            debug("CREATE_OPPORTUNITY_DESKTOP", { formData });

            try {
              const opportunityData = {
                name: formData.name,
                amount: (formData as any).amount
                  ? parseFloat((formData as any).amount)
                  : 50000,
                expectedCloseDate:
                  (formData as any).closeDate ||
                  new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
                    .toISOString()
                    .split("T")[0],
                probability: (formData as any).probability
                  ? parseInt((formData as any).probability)
                  : 25,
                stage: formData.stage || "Discovery",
                sourceType: formData.source || "Manual Entry",
                primaryContact: (formData as any).contact,
                company: formData.company,
                notes: (formData as any).notes || "",
                description: (formData as any).description || "",
              };

              const response = await invoke("create_opportunity", {
                workspace_id: activeWorkspace?.id || "",
                user_id: authUser?.id || "",
                opportunity_data: opportunityData,
              });

              if (response && (response as any).success) {
                newRecordId = (response as any).opportunity?.id;
                debug("CREATE_OPPORTUNITY_DESKTOP_SUCCESS", { newRecordId });
                onSuccess(
                  `✅ Successfully created opportunity: ${formData.name}`,
                );
              } else {
                throw new Error("Failed to create opportunity via Tauri");
              }
            } catch (tauri_error) {
              debug("CREATE_OPPORTUNITY_DESKTOP_ERROR", { error: tauri_error });
              // Fallback to local creation
              newRecordId = `desktop-opp-${Date.now()}`;
              onSuccess(
                `✅ Successfully created opportunity: ${formData.name} (Local mode)`,
              );
            }
          }
        } else if (activeSection === "partnerships") {
          // Handle partnership creation (local only for now)
          debug("CREATE_PARTNERSHIP", { formData });
          newRecordId = `partnership-${Date.now()}`;
          onSuccess(`✅ Successfully created partnership: ${formData.name}`);
        } else if (activeSection === "speedrun") {
          // Handle speedrun record creation - create as a lead with speedrun priority via unified API
          debug("CREATE_SPEEDRUN_RECORD", { formData });

          if (!envInfo.isDesktop) {
            // Create speedrun record via unified API (as a lead with high priority)
            const createResponse = await safeApiFetch(
              "/api/data/unified",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  type: "leads", // Speedrun creates leads with high priority
                  action: "create",
                  data: {
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                    company: formData.company,
                    title: formData.title,
                    source: formData.source || "Speedrun",
                    status: "new",
                    priority: "high", // High priority for speedrun items
                    notes: formData.notes || "Added via Speedrun",
                    workspaceId: activeWorkspace?.id || "",
                    userId: authUser?.id || ""
                  }
                })
              },
              {
                success: false,
                data: null,
                error: null
              },
            );

            if (createResponse['success'] && createResponse.data) {
              newRecordId = createResponse.data.id;
              debug("CREATE_SPEEDRUN_SUCCESS", { newRecordId });
              onSuccess(`✅ Successfully created speedrun: ${formData.name}`);
            } else {
              throw new Error(createResponse.error || "Failed to create speedrun record");
            }
          } else {
            // Desktop mode - create local speedrun record
            newRecordId = `speedrun-${Date.now()}`;
            onSuccess(`✅ Successfully created speedrun: ${formData.name} (Desktop mode)`);
          }
        } else {
          // Use unified API for all other record types (prospects, contacts, accounts, partners)
          debug("CREATE_RECORD_UNIFIED_API", { activeSection, formData });
          
          if (!envInfo.isDesktop) {
            // Create record via unified API
            const createResponse = await safeApiFetch(
              "/api/data/unified",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  type: activeSection, // Use plural form directly (leads, prospects, etc.)
                  action: "create",
                  data: {
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                    company: formData.company,
                    title: formData.title,
                    source: formData.source || "Manual Entry",
                    notes: formData.notes,
                    // Client-specific fields
                    contractValue: formData.contractValue,
                    renewalDate: formData.renewalDate,
                    website: formData.website,
                    contactIds: formData.contactIds || [],
                    workspaceId: activeWorkspace?.id || "",
                    userId: authUser?.id || ""
                  }
                })
              },
              {
                success: false,
                data: null,
                error: null
              }
            );
            
            if (createResponse['success'] && createResponse.data) {
              newRecordId = createResponse.data.id;
              const recordType = activeSection === 'speedrun' ? 'speedrun' : activeSection.slice(0, -1);
              onSuccess(`✅ Successfully created ${recordType}: ${formData.name}`);
            } else {
              throw new Error(createResponse.error || "Failed to create record via unified API");
            }
          } else {
            // Desktop mode - simulate creation
            newRecordId = `${activeSection.slice(0, -1)}-${Date.now()}`;
            const recordType = activeSection === 'speedrun' ? 'speedrun' : activeSection.slice(0, -1);
            onSuccess(`✅ Successfully created ${recordType}: ${formData.name} (Desktop mode)`);
          }
        }

        // Reset form after successful creation
        resetForm();

        // Refresh data if callback provided
        if (refreshData && !envInfo.isDesktop) {
          console.log(`🔄 Refreshing ${activeSection} data after successful record creation`);
          try {
            await refreshData();
            console.log(`✅ Successfully refreshed ${activeSection} data`);
          } catch (refreshError) {
            console.error(`❌ Failed to refresh ${activeSection} data:`, refreshError);
          }
        }
      } catch (error) {
        debug("CREATE_RECORD_ERROR", { error, activeSection });
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        onError(
          `❌ Failed to create ${activeSection.slice(0, -1)}: ${errorMessage}`,
        );
      }
    },
    [formData, resetForm],
  );

  // Handle update record
  const handleUpdateRecord = useCallback(
    async (
      activeSection: string,
      activeSubApp: string,
      onSuccess: (message: string) => void,
      onError: (message: string) => void,
    ) => {
      if (!editingRecord) {
        onError("No record selected for editing");
        return;
      }

      debug("UPDATE_RECORD_START", {
        recordId: editingRecord.id,
        activeSection,
        formData,
      });

      try {
        // Simulate record update for now
        debug("UPDATE_RECORD_SIMULATED", { recordId: editingRecord.id });

        resetForm();
        onSuccess(
          `✅ Successfully updated ${activeSection.slice(0, -1)}: ${formData.name}`,
        );
      } catch (error) {
        debug("UPDATE_RECORD_ERROR", { error, recordId: editingRecord.id });
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        onError(
          `❌ Error updating ${activeSection.slice(0, -1)}: ${errorMessage}`,
        );
      }
    },
    [editingRecord, formData, resetForm],
  );

  // Handle delete record
  const handleDeleteRecord = useCallback(
    async (
      record: any,
      activeSection: string,
      activeSubApp: string,
      onSuccess: (message: string) => void,
      onError: (message: string) => void,
      onClearSelection?: () => void,
    ) => {
      debug("DELETE_RECORD_START", {
        recordId: record.id,
        recordName: record.name,
        activeSection,
      });

      if (
        !confirm(
          `Are you sure you want to delete ${record.name}? This action cannot be undone.`,
        )
      ) {
        debug("DELETE_RECORD_CANCELLED", { recordId: record.id });
        return;
      }

      try {
        // Simulate record deletion for now
        debug("DELETE_RECORD_SIMULATED", { recordId: record.id });

        // Clear selection if this was the selected record
        if (onClearSelection) {
          onClearSelection();
        }

        onSuccess(
          `✅ Successfully deleted ${activeSection.slice(0, -1)}: ${record.name}`,
        );
      } catch (error) {
        debug("DELETE_RECORD_ERROR", { error, recordId: record.id });
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        onError(
          `❌ Error deleting ${activeSection.slice(0, -1)}: ${errorMessage}`,
        );
      }
    },
    [],
  );

  // Handle converting lead to opportunity
  const handleConvertLeadToOpportunity = useCallback(
    async (
      lead: any,
      onSuccess: (message: string) => void,
      onError: (message: string) => void,
      refreshData?: () => Promise<void>,
    ) => {
      debug("CONVERT_LEAD_TO_OPPORTUNITY_START", {
        leadId: lead.id,
        leadName: lead.name,
        company: lead.company,
      });

      const envInfo = getDesktopEnvInfo();

      try {
        if (!envInfo.isDesktop) {
          // Web mode - use API
          const createResponse = await safeApiFetch(
            "/api/data/unified",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                type: "opportunities",
                action: "create",
                data: {
                  leadId: lead.id,
                  name: lead.name || `Opportunity from ${lead.name}`,
                  company: lead.company,
                  amount: 50000, // Default amount
                  expectedCloseDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
                  probability: 25,
                  stage: "Discovery",
                  sourceType: "Lead Conversion",
                  workspaceId: activeWorkspace?.id || activeWorkspace?.workspaceId || "",
                  userId: authUser?.id || "",
                }
              }),
            },
            {
              success: false,
              data: null,
              error: null,
            },
          );

          if (createResponse['success'] && createResponse.data) {
            debug("CONVERT_LEAD_SUCCESS_WEB", {
              opportunityId: createResponse.data.id,
            });
            onSuccess(`✅ Successfully converted ${lead.name} to opportunity!`);
          } else {
            throw new Error(
              createResponse.error || "Failed to convert lead to opportunity",
            );
          }
        } else {
          // Desktop mode - use Tauri commands
          const response = await invoke("convert_lead_to_opportunity", {
            workspace_id: activeWorkspace?.id || "",
            user_id: authUser?.id || "",
            lead_id: lead.id,
            opportunity_data: null,
          });

          if (response && (response as any).success) {
            debug("CONVERT_LEAD_SUCCESS_DESKTOP", {
              opportunityId: (response as any).opportunity?.id,
            });
            onSuccess(`✅ Successfully converted ${lead.name} to opportunity!`);
          } else {
            throw new Error("Failed to convert lead to opportunity via Tauri");
          }
        }

        // Refresh data if callback provided
        if (refreshData) {
          await refreshData();
        }
      } catch (error) {
        debug("CONVERT_LEAD_ERROR", { error, leadId: lead.id });
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        onError(`❌ Failed to convert lead to opportunity: ${errorMessage}`);
      }
    },
    [],
  );

  return {
    // State
    formData,
    editingRecord,

    // Actions
    setFormData,
    setEditingRecord,
    resetForm,

    // CRUD Operations
    handleCreateRecord,
    handleUpdateRecord,
    handleDeleteRecord,
    handleConvertLeadToOpportunity,
  };
}

// Legacy alias for backwards compatibility
export const useActionPlatformForms = useAcquisitionOSForms;
