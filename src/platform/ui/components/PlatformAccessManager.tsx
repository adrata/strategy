"use client";

import React, { useState, useEffect } from "react";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  UserIcon,
  BuildingOfficeIcon,
  CogIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import PlatformAccessManager, {
  PlatformAccessConfig,
  PlatformAccessLevel,
} from "@/platform/services/platform-access-manager";

interface PlatformAccessManagerProps {
  onClose?: () => void;
}

export function PlatformAccessManagerComponent({ onClose }: PlatformAccessManagerProps) {
  const [configs, setConfigs] = useState<PlatformAccessConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingConfig, setEditingConfig] = useState<PlatformAccessConfig | null>(null);

  // Load configurations
  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      setLoading(true);
      const allConfigs = await PlatformAccessManager.getAllConfigs();
      setConfigs(allConfigs);
    } catch (error) {
      console.error("Failed to load platform access configs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId: string) => {
    if (confirm("Are you sure you want to delete this platform access configuration?")) {
      try {
        await PlatformAccessManager.deleteUserAccess(userId);
        await loadConfigs();
      } catch (error) {
        console.error("Failed to delete config:", error);
      }
    }
  };

  const handleEdit = (config: PlatformAccessConfig) => {
    setEditingConfig(config);
    setShowCreateModal(true);
  };

  const handleCreateNew = () => {
    setEditingConfig(null);
    setShowCreateModal(true);
  };

  return (
    <div className="fixed inset-0 bg-[var(--foreground)]/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[var(--background)] rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-[var(--foreground)]">Platform Access Manager</h2>
            <p className="text-[var(--muted)] text-sm">
              Configure user access levels: Monaco standalone or full AOS platform
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleCreateNew}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="h-4 w-4" />
              Add User Access
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="text-[var(--muted)] hover:text-[var(--muted)]"
              >
                <XCircleIcon className="h-6 w-6" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-[var(--muted)]">Loading configurations...</div>
            </div>
          ) : configs['length'] === 0 ? (
            <div className="text-center py-12">
              <UserIcon className="h-12 w-12 text-[var(--muted)] mx-auto mb-4" />
              <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">
                No Platform Access Configurations
              </h3>
              <p className="text-[var(--muted)] mb-6">
                Create your first user platform access configuration to get started.
              </p>
              <button
                onClick={handleCreateNew}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create First Configuration
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Legend */}
              <div className="bg-[var(--panel-background)] rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-[var(--foreground)] mb-3">Platform Access Levels</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-4 h-4 bg-blue-500 rounded-full mt-1"></div>
                    <div>
                      <div className="font-medium text-[var(--foreground)]">Monaco Standalone</div>
                      <div className="text-sm text-[var(--muted)]">
                        Simplified interface with Monaco buyer group intelligence only
                      </div>
                      <div className="text-xs text-[var(--muted)] mt-1">
                        Apps: Monaco • Features: Basic
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-4 h-4 bg-green-500 rounded-full mt-1"></div>
                    <div>
                      <div className="font-medium text-[var(--foreground)]">Full AOS Platform</div>
                      <div className="text-sm text-[var(--muted)]">
                        Complete platform with all apps and advanced features
                      </div>
                      <div className="text-xs text-[var(--muted)] mt-1">
                        Apps: Monaco, Speedrun, Pipeline, Oasis, Tower, Garage
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Configurations Table */}
              <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg overflow-hidden">
                <div className="px-6 py-3 bg-[var(--panel-background)] border-b border-[var(--border)]">
                  <h3 className="font-medium text-[var(--foreground)]">User Access Configurations</h3>
                </div>
                <div className="divide-y divide-gray-200">
                  {configs.map((config) => (
                    <div key={config.id} className="px-6 py-4 hover:bg-[var(--panel-background)]">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              config['platformAccess'] === "monaco-standalone"
                                ? "bg-blue-500"
                                : "bg-green-500"
                            }`}
                          ></div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <UserIcon className="h-4 w-4 text-[var(--muted)]" />
                              <span className="font-medium text-[var(--foreground)]">
                                User ID: {config.userId}
                              </span>
                              {config['workspaceId'] && (
                                <>
                                  <BuildingOfficeIcon className="h-4 w-4 text-[var(--muted)] ml-2" />
                                  <span className="text-[var(--muted)]">
                                    Workspace: {config.workspaceId}
                                  </span>
                                </>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-[var(--muted)]">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  config['platformAccess'] === "monaco-standalone"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-green-100 text-green-800"
                                }`}
                              >
                                {config['platformAccess'] === "monaco-standalone"
                                  ? "Monaco Standalone"
                                  : "Full AOS Platform"}
                              </span>
                              <span>{config.availableApps.join(", ")}</span>
                              <span>
                                {config.features.multipleApps ? "Multi-App" : "Single App"}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(config)}
                            className="p-2 text-[var(--muted)] hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit configuration"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => config['userId'] && handleDelete(config.userId)}
                            className="p-2 text-[var(--muted)] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete configuration"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Create/Edit Modal */}
        {showCreateModal && (
          <CreateEditModal
            config={editingConfig}
            onClose={() => {
              setShowCreateModal(false);
              setEditingConfig(null);
            }}
            onSave={() => {
              setShowCreateModal(false);
              setEditingConfig(null);
              loadConfigs();
            }}
          />
        )}
      </div>
    </div>
  );
}

interface CreateEditModalProps {
  config?: PlatformAccessConfig | null;
  onClose: () => void;
  onSave: () => void;
}

function CreateEditModal({ config, onClose, onSave }: CreateEditModalProps) {
  const [userId, setUserId] = useState(config?.userId || "");
  const [workspaceId, setWorkspaceId] = useState(config?.workspaceId || "");
  const [platformAccess, setPlatformAccess] = useState<PlatformAccessLevel>(
    config?.platformAccess || "monaco-standalone"
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!userId.trim()) {
      alert("User ID is required");
      return;
    }

    try {
      setSaving(true);
      
      if (config) {
        // Update existing
        await PlatformAccessManager.updateUserAccess(userId, platformAccess, "admin");
      } else {
        // Create new
        await PlatformAccessManager.createUserAccess(
          userId,
          platformAccess,
          "admin",
          workspaceId || undefined
        );
      }
      
      onSave();
    } catch (error) {
      console.error("Failed to save configuration:", error);
      alert("Failed to save configuration. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
      <div className="bg-[var(--background)] rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="px-6 py-4 border-b border-[var(--border)]">
          <h3 className="text-lg font-semibold text-[var(--foreground)]">
            {config ? "Edit" : "Create"} Platform Access Configuration
          </h3>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              User ID *
            </label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="e.g., demo-user-2025, dan, ross"
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500/20 focus:border-[var(--border)]"
              disabled={!!config} // Don't allow changing user ID for existing configs
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Workspace ID (Optional)
            </label>
            <input
              type="text"
              value={workspaceId}
              onChange={(e) => setWorkspaceId(e.target.value)}
              placeholder="e.g., demo-workspace, adrata"
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500/20 focus:border-[var(--border)]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Platform Access Level *
            </label>
            <div className="space-y-3">
              <label className="flex items-start gap-3 p-3 border border-[var(--border)] rounded-lg cursor-pointer hover:bg-[var(--panel-background)]">
                <input
                  type="radio"
                  name="platformAccess"
                  value="monaco-standalone"
                  checked={platformAccess === "monaco-standalone"}
                  onChange={(e) => setPlatformAccess(e.target.value as PlatformAccessLevel)}
                  className="mt-1"
                />
                <div>
                  <div className="font-medium text-[var(--foreground)]">Monaco Standalone</div>
                  <div className="text-sm text-[var(--muted)]">
                    Simplified interface focused on buyer group intelligence
                  </div>
                  <div className="text-xs text-[var(--muted)] mt-1">
                    Perfect for sales reps who need focused prospecting tools
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 border border-[var(--border)] rounded-lg cursor-pointer hover:bg-[var(--panel-background)]">
                <input
                  type="radio"
                  name="platformAccess"
                  value="aos-full"
                  checked={platformAccess === "aos-full"}
                  onChange={(e) => setPlatformAccess(e.target.value as PlatformAccessLevel)}
                  className="mt-1"
                />
                <div>
                  <div className="font-medium text-[var(--foreground)]">Full AOS Platform</div>
                  <div className="text-sm text-[var(--muted)]">
                    Complete platform with all apps and advanced features
                  </div>
                  <div className="text-xs text-[var(--muted)] mt-1">
                    Ideal for power users, managers, and advanced sales professionals
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-[var(--border)] rounded-lg hover:bg-[var(--panel-background)] transition-colors"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !userId.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : config ? "Update" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
} 