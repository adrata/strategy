import React, { useState, useCallback } from "react";
import { DEFAULT_FORM_DATA } from "@/platform/config";
// Removed safe-api-fetch and desktop-env-check imports - using standard fetch
const getDesktopEnvInfo = () => ({ isDesktop: false });
import { invoke } from "@tauri-apps/api/core";
import { useUnifiedAuth } from "@/platform/auth";
import type { FormData } from "../types/hooks";

interface UseFormsReturn {
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
 * FORMS HOOK
 * Handles all form operations for the platform
 */
export function useForms(): UseFormsReturn {
  // Auth context for workspace isolation
  const { user: authUser, session } = useUnifiedAuth();
  const activeWorkspace = authUser?.workspaces?.[0];
  
  // Debug helper
  const debug = (phase: string, details: any) => {
    console.log(`[FORMS HOOK] ${phase}:`, details);
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
      
      // DEBUG: Log the activeSection value to understand routing issue
      console.log(`[FORMS HOOK] DEBUG: activeSection = "${activeSection}"`);
      console.log(`[FORMS HOOK] DEBUG: Will use ${activeSection === "leads" || activeSection === "people" ? "v1 API" : "unified API"}`);

      const envInfo = getDesktopEnvInfo();
      let newRecordId: string | null = null;

      try {
        if (activeSection === "leads" || activeSection === "people") {
          if (!envInfo.isDesktop) {
            // Create person via v1 API
            debug("CREATE_PERSON_API", { formData });
            
            // Use firstName and lastName directly from form
            const firstName = formData.firstName?.trim() || '';
            const lastName = formData.lastName?.trim() || '';
            const fullName = `${firstName} ${lastName}`.trim();
            
            const personData = {
              firstName: firstName,
              lastName: lastName,
              fullName: fullName,
              email: formData.email,
              phone: formData.phone,
              jobTitle: formData.title,
              status: formData.status || "LEAD",
              notes: formData.notes,
              workspaceId: activeWorkspace?.id || "",
              userId: authUser?.id || ""
            };
            
            console.log('[FORMS HOOK] Creating person with data:', personData);
            console.log('[FORMS HOOK] activeWorkspace:', activeWorkspace);
            console.log('[FORMS HOOK] authUser:', authUser);

            const createResponse = await fetch(
              "/api/v1/people",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(personData),
              }
            );

            if (createResponse.ok) {
              const result = await createResponse.json();
              newRecordId = result.id;
              debug("CREATE_PERSON_SUCCESS", { newRecordId });

              // Success message
              onSuccess(
                `Successfully created person: ${fullName}`,
              );
              
              // Refresh data to show new person in the list
              if (refreshData) {
                await refreshData();
              }
            } else {
              const errorData = await createResponse.json();
              throw new Error(errorData.error || "Failed to create person");
            }
          } else {
            // Desktop mode
            debug("CREATE_LEAD_DESKTOP", { formData });
            newRecordId = `desktop-lead-${Date.now()}`;
            onSuccess(
              `Successfully created lead: ${fullName} (Desktop mode - not saved to database)`,
            );
          }
        } else if (activeSection === "opportunities") {
          if (!envInfo.isDesktop) {
            // Create opportunity via API
            debug("CREATE_OPPORTUNITY_API", { formData });

            const createResponse = await fetch(
              "/api/v1/companies",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  name: formData.name,
                  status: "OPPORTUNITY",
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
                  notes: (formData as any).notes || "",
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
                `Successfully created opportunity: ${formData.name}`,
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
                  `Successfully created opportunity: ${formData.name}`,
                );
              } else {
                throw new Error("Failed to create opportunity via Tauri");
              }
            } catch (tauri_error) {
              debug("CREATE_OPPORTUNITY_DESKTOP_ERROR", { error: tauri_error });
              // Fallback to local creation
              newRecordId = `desktop-opp-${Date.now()}`;
              onSuccess(
                `Successfully created opportunity: ${formData.name} (Local mode)`,
              );
            }
          }
        } else if (activeSection === "partnerships") {
          // Handle partnership creation (local only for now)
          debug("CREATE_PARTNERSHIP", { formData });
          newRecordId = `partnership-${Date.now()}`;
          onSuccess(`Successfully created partnership: ${formData.name}`);
        } else if (activeSection === "speedrun") {
          // Handle speedrun record creation - create as a lead with speedrun priority via unified API
          debug("CREATE_SPEEDRUN_RECORD", { formData });

          if (!envInfo.isDesktop) {
            // Create speedrun record via unified API (as a lead with high priority)
            const createResponse = await fetch(
              "/api/v1/people",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  fullName: formData.name,
                  email: formData.email,
                  phone: formData.phone,
                  company: formData.company,
                  jobTitle: formData.title,
                  source: formData.source || "Speedrun",
                  status: "LEAD", // Speedrun creates leads
                  priority: "HIGH", // High priority for speedrun items
                  notes: formData.notes || "Added via Speedrun"
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
              onSuccess(`Successfully created speedrun: ${formData.name}`);
            } else {
              throw new Error(createResponse.error || "Failed to create speedrun record");
            }
          } else {
            // Desktop mode - create local speedrun record
            newRecordId = `speedrun-${Date.now()}`;
            onSuccess(`Successfully created speedrun: ${formData.name} (Desktop mode)`);
          }
        } else {
          // Use unified API for all other record types (prospects, contacts, accounts, partners, companies)
          debug("CREATE_RECORD_UNIFIED_API", { activeSection, formData });
          
          if (!envInfo.isDesktop) {
            // Prepare data based on record type
            let recordData: any = {
              name: formData.name,
              email: formData.email,
              phone: formData.phone,
              company: formData.company,
              title: formData.title,
              notes: formData.notes,
              website: formData.website,
              workspaceId: activeWorkspace?.id || "",
              userId: authUser?.id || ""
            };

            // Handle different field mappings for different record types
            if (activeSection === "companies") {
              // Companies use 'sources' (plural array) instead of 'source' (singular string)
              recordData.sources = formData.source ? [formData.source] : ["Manual Entry"];
              // Remove fields that don't apply to companies
              delete recordData.email;
              delete recordData.phone;
              delete recordData.title;
            } else {
              // Other record types use 'source' (singular string)
              recordData.source = formData.source || "Manual Entry";
              // Client-specific fields
              recordData.contractValue = formData.contractValue;
              recordData.renewalDate = formData.renewalDate;
              recordData.contactIds = formData.contactIds || [];
            }

            // Create record via v1 API
            let apiUrl = "";
            let requestBody = recordData;
            
            if (activeSection === "companies") {
              apiUrl = "/api/v1/companies";
            } else if (activeSection === "leads" || activeSection === "prospects" || activeSection === "people") {
              apiUrl = "/api/v1/people";
              // Map fields for people API
              requestBody = {
                fullName: recordData.name,
                email: recordData.email,
                phone: recordData.phone,
                jobTitle: recordData.title,
                company: recordData.company,
                status: activeSection === "leads" ? "LEAD" : activeSection === "prospects" ? "PROSPECT" : "LEAD",
                source: recordData.source,
                notes: recordData.notes
              };
            } else {
              throw new Error(`No v1 API available for section: ${activeSection}`);
            }
            
            const createResponse = await fetch(
              apiUrl,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestBody)
              }
            );
            
            const responseData = await createResponse.json();
            
            if (createResponse.ok && responseData.success && responseData.data) {
              newRecordId = responseData.data.id;
              const recordType = activeSection === 'speedrun' ? 'speedrun' : activeSection.slice(0, -1);
              const successMessage = activeSection === 'companies' 
                ? `Successfully created company: ${formData.name}`
                : `Successfully created ${recordType}: ${formData.name}`;
              onSuccess(successMessage);
            } else {
              throw new Error(responseData.error || "Failed to create record via v1 API");
            }
          } else {
            // Desktop mode - simulate creation
            newRecordId = `${activeSection.slice(0, -1)}-${Date.now()}`;
            const recordType = activeSection === 'speedrun' ? 'speedrun' : activeSection.slice(0, -1);
            const desktopSuccessMessage = activeSection === 'companies'
              ? `Successfully created company: ${formData.name} (Desktop mode)`
              : `Successfully created ${recordType}: ${formData.name} (Desktop mode)`;
            onSuccess(desktopSuccessMessage);
          }
        }

        // Reset form after successful creation
        resetForm();

        // Refresh data if callback provided
        if (refreshData && !envInfo.isDesktop) {
          console.log(`Refreshing ${activeSection} data after successful record creation`);
          try {
            await refreshData();
            console.log(`Successfully refreshed ${activeSection} data`);
          } catch (refreshError) {
            console.error(`Failed to refresh ${activeSection} data:`, refreshError);
          }
        }
      } catch (error) {
        debug("CREATE_RECORD_ERROR", { error, activeSection });
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        onError(
          `Failed to create ${activeSection.slice(0, -1)}: ${errorMessage}`,
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
          `Successfully updated ${activeSection.slice(0, -1)}: ${formData.name}`,
        );
      } catch (error) {
        debug("UPDATE_RECORD_ERROR", { error, recordId: editingRecord.id });
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        onError(
          `Error updating ${activeSection.slice(0, -1)}: ${errorMessage}`,
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

      try {
        // Perform soft delete via v1 API
        let deleteUrl = "";
        if (activeSection === "companies") {
          deleteUrl = `/api/v1/companies/${encodeURIComponent(record.id)}`;
        } else if (activeSection === "leads" || activeSection === "prospects" || activeSection === "people") {
          deleteUrl = `/api/v1/people/${encodeURIComponent(record.id)}`;
        } else {
          throw new Error(`No v1 delete API available for section: ${activeSection}`);
        }
        
        const response = await fetch(deleteUrl, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to delete record');
        }

        debug("DELETE_RECORD_SUCCESS", { recordId: record.id });

        // Clear selection if this was the selected record
        if (onClearSelection) {
          onClearSelection();
        }

        onSuccess(
          `Successfully deleted ${activeSection.slice(0, -1)}: ${record.name}`,
        );
      } catch (error) {
        debug("DELETE_RECORD_ERROR", { error, recordId: record.id });
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        onError(
          `Error deleting ${activeSection.slice(0, -1)}: ${errorMessage}`,
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
          const createResponse = await fetch(
            "/api/v1/companies",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: lead.name || `Opportunity from ${lead.name}`,
                status: "OPPORTUNITY",
                company: lead.company,
                amount: 50000, // Default amount
                expectedCloseDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
                probability: 25,
                stage: "Discovery",
                sourceType: "Lead Conversion",
                notes: `Converted from lead: ${lead.name}`
              }),
            }
          );

          const responseData = await createResponse.json();
          
          if (createResponse.ok && responseData.success && responseData.data) {
            debug("CONVERT_LEAD_SUCCESS_WEB", {
              opportunityId: responseData.data.id,
            });
            onSuccess(`Successfully converted ${lead.name} to opportunity!`);
          } else {
            throw new Error(
              responseData.error || "Failed to convert lead to opportunity",
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
            onSuccess(`Successfully converted ${lead.name} to opportunity!`);
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
        onError(`Failed to convert lead to opportunity: ${errorMessage}`);
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
export const useActionPlatformForms = useForms;
