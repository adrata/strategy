/**
 * 📊 DATA SPACE MANAGER
 * Comprehensive storage management for extensions, applications, and cache
 */

"use client";

import React, { useState, useEffect } from "react";
import {
  CircleStackIcon,
  TrashIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon,
  FolderIcon,
  ChartPieIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  CloudArrowDownIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  GlobeAltIcon,
} from "@heroicons/react/24/outline";
import {
  desktopExpansionManager,
  InstalledExpansion,
  DesktopStorageInfo,
} from "@/platform/desktop/expansion-manager";

interface DataSpaceManagerProps {
  isDesktop?: boolean;
  isMobile?: boolean;
  userId: string;
  accountId: string;
}

interface StorageItem {
  id: string;
  name: string;
  type: "extension" | "application" | "cache" | "data";
  size: number; // MB
  lastAccessed: Date;
  path: string;
  canDelete: boolean;
  platform: "web" | "desktop" | "mobile";
}

interface StorageCategory {
  name: string;
  totalSize: number;
  items: StorageItem[];
  color: string;
}

export const DataSpaceManager: React.FC<DataSpaceManagerProps> = ({
  isDesktop = false,
  isMobile = false,
  userId,
  accountId,
}) => {
  const [storageInfo, setStorageInfo] = useState<DesktopStorageInfo | null>(
    null,
  );
  const [storageCategories, setStorageCategories] = useState<StorageCategory[]>(
    [],
  );
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [cleaning, setCleaning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"name" | "size" | "date">("size");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const currentPlatform = isMobile ? "mobile" : isDesktop ? "desktop" : "web";

  useEffect(() => {
    loadStorageData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadStorageData = async () => {
    setLoading(true);
    try {
      if (isDesktop) {
        // Load desktop storage info
        const info = desktopExpansionManager.getStorageInfo();
        setStorageInfo(info);

        // Load installed extensions
        const extensions = desktopExpansionManager.getAllInstalledExpansions();
        const extensionItems: StorageItem[] = extensions.map(
          (ext: {
            id: string;
            name: string;
            fileSize: number;
            lastUsed: Date;
            installPath: string;
          }) => ({
            id: ext.id,
            name: ext.name,
            type: "extension",
            size: ext.fileSize,
            lastAccessed: ext.lastUsed,
            path: ext.installPath,
            canDelete: true,
            platform: "desktop",
          }),
        );

        // Simulate other storage categories
        const categories: StorageCategory[] = [
          {
            name: "Extensions",
            totalSize: extensionItems.reduce((sum, item) => sum + item.size, 0),
            items: extensionItems,
            color: "bg-blue-500",
          },
          {
            name: "Applications",
            totalSize: 45.6,
            items: [
              {
                id: "academy-app",
                name: "Academy App",
                type: "application",
                size: 25.3,
                lastAccessed: new Date(),
                path: "/Applications/Academy.app",
                canDelete: true,
                platform: "desktop",
              },
              {
                id: "garage-app",
                name: "Garage App",
                type: "application",
                size: 20.3,
                lastAccessed: new Date(Date.now() - 86400000),
                path: "/Applications/Garage.app",
                canDelete: true,
                platform: "desktop",
              },
            ],
            color: "bg-green-500",
          },
          {
            name: "Cache & Temporary",
            totalSize: info.cacheSize,
            items: [
              {
                id: "image-cache",
                name: "Image Cache",
                type: "cache",
                size: info.cacheSize * 0.6,
                lastAccessed: new Date(),
                path: "/Library/Caches/images",
                canDelete: true,
                platform: "desktop",
              },
              {
                id: "temp-files",
                name: "Temporary Files",
                type: "cache",
                size: info.cacheSize * 0.4,
                lastAccessed: new Date(),
                path: "/tmp/adrata",
                canDelete: true,
                platform: "desktop",
              },
            ],
            color: "bg-yellow-500",
          },
          {
            name: "User Data",
            totalSize: 12.8,
            items: [
              {
                id: "user-settings",
                name: "User Settings",
                type: "data",
                size: 0.5,
                lastAccessed: new Date(),
                path: "/Library/Preferences/com.adrata.plist",
                canDelete: false,
                platform: "desktop",
              },
              {
                id: "local-database",
                name: "Local Database",
                type: "data",
                size: 12.3,
                lastAccessed: new Date(),
                path: "/Library/Application Support/database.db",
                canDelete: false,
                platform: "desktop",
              },
            ],
            color: "bg-purple-500",
          },
        ];

        setStorageCategories(categories);
      } else {
        // Mock data for web/mobile
        const mockCategories: StorageCategory[] = [
          {
            name: "Downloaded Extensions",
            totalSize: 23.4,
            items: [
              {
                id: "action-rings-web",
                name: "Action Rings",
                type: "extension",
                size: 2.5,
                lastAccessed: new Date(),
                path: "localStorage",
                canDelete: true,
                platform: currentPlatform,
              },
              {
                id: "red-pill-web",
                name: "Red Pill Analytics",
                type: "extension",
                size: 5.2,
                lastAccessed: new Date(),
                path: "localStorage",
                canDelete: true,
                platform: currentPlatform,
              },
            ],
            color: "bg-blue-500",
          },
          {
            name: "Browser Cache",
            totalSize: 45.7,
            items: [
              {
                id: "browser-cache",
                name: "Browser Cache",
                type: "cache",
                size: 45.7,
                lastAccessed: new Date(),
                path: "browser cache",
                canDelete: true,
                platform: currentPlatform,
              },
            ],
            color: "bg-yellow-500",
          },
        ];

        setStorageCategories(mockCategories);
        setStorageInfo({
          totalUsed: mockCategories.reduce(
            (sum, cat) => sum + cat.totalSize,
            0,
          ),
          totalAvailable: 1000,
          expansionsPath: "browser storage",
          applicationsPath: "browser storage",
          cacheSize: 45.7,
        });
      }
    } catch (error) {
      console.error("Error loading storage data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleItemSelect = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const handleSelectAll = (categoryName: string) => {
    const category = storageCategories.find((cat) => cat['name'] === categoryName);
    if (category) {
      const newSelected = new Set(selectedItems);
      const allSelected = category.items.every(
        (item) => selectedItems.has(item.id) || !item.canDelete,
      );

      category.items.forEach((item) => {
        if (item.canDelete) {
          if (allSelected) {
            newSelected.delete(item.id);
          } else {
            newSelected.add(item.id);
          }
        }
      });

      setSelectedItems(newSelected);
    }
  };

  const handleCleanup = async () => {
    if (selectedItems['size'] === 0) return;

    setShowDeleteConfirm(true);
  };

  const confirmCleanup = async () => {
    setCleaning(true);
    setShowDeleteConfirm(false);

    try {
      let totalCleaned = 0;

      for (const itemId of selectedItems) {
        // Find the item across all categories
        for (const category of storageCategories) {
          const item = category.items.find((i) => i['id'] === itemId);
          if (item) {
            if (item['type'] === "extension" && isDesktop) {
              await desktopExpansionManager.uninstallExpansion(item.id);
            } else if (item['type'] === "cache") {
              if (isDesktop) {
                totalCleaned += await desktopExpansionManager.cleanupCache();
              } else {
                // Clear web/mobile cache
                totalCleaned += item.size;
              }
            }
            totalCleaned += item.size;
            break;
          }
        }
      }

      // Reload storage data
      await loadStorageData();
      setSelectedItems(new Set());

      alert(
        `Successfully cleaned up ${totalCleaned.toFixed(1)} MB of storage space.`,
      );
    } catch (error) {
      console.error("Error during cleanup:", error);
      alert("Failed to cleanup some items. Please try again.");
    } finally {
      setCleaning(false);
    }
  };

  const sortItems = (items: StorageItem[]): StorageItem[] => {
    return [...items].sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "size":
          return b.size - a.size;
        case "date":
          return b.lastAccessed.getTime() - a.lastAccessed.getTime();
        default:
          return 0;
      }
    });
  };

  const getStoragePercentage = (): number => {
    if (!storageInfo) return 0;
    return (storageInfo.totalUsed / storageInfo.totalAvailable) * 100;
  };

  const getStorageColor = (): string => {
    const percentage = getStoragePercentage();
    if (percentage >= 90) return "bg-red-500";
    if (percentage >= 75) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "web":
        return <GlobeAltIcon className="h-4 w-4" />;
      case "desktop":
        return <ComputerDesktopIcon className="h-4 w-4" />;
      case "mobile":
        return <DevicePhoneMobileIcon className="h-4 w-4" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const selectedSize = Array.from(selectedItems).reduce((sum, itemId) => {
    for (const category of storageCategories) {
      const item = category.items.find((i) => i['id'] === itemId);
      if (item) return sum + item.size;
    }
    return sum;
  }, 0);

  return (
    <div className="h-full bg-panel-background">
      {/* Header */}
      <div className="bg-background shadow-sm border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CircleStackIcon className="h-8 w-8 text-muted" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Data Space Manager
                </h1>
                <p className="text-sm text-muted">
                  Manage your storage usage across {currentPlatform} platform
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm font-medium text-foreground">
                  {storageInfo?.totalUsed.toFixed(1)} MB /{" "}
                  {storageInfo?.totalAvailable} MB
                </div>
                <div className="text-xs text-muted">
                  {getStoragePercentage().toFixed(1)}% used
                </div>
              </div>
              <div className="w-32">
                <div className="w-full bg-loading-bg rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${getStorageColor()}`}
                    style={{
                      width: `${Math.min(getStoragePercentage(), 100)}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Storage Overview */}
      <div className="p-6">
        <div className="bg-background rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-medium text-foreground mb-4">
            Storage Breakdown
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {storageCategories.map((category) => (
              <div key={category.name} className="flex items-center space-x-3">
                <div className={`w-4 h-4 rounded ${category.color}`}></div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-foreground">
                    {category.name}
                  </div>
                  <div className="text-xs text-muted">
                    {category.totalSize.toFixed(1)} MB
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="bg-background rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="size">Sort by Size</option>
                <option value="name">Sort by Name</option>
                <option value="date">Sort by Date</option>
              </select>

              {selectedItems.size > 0 && (
                <div className="text-sm text-muted">
                  {selectedItems.size} items selected ({selectedSize.toFixed(1)}{" "}
                  MB)
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => loadStorageData()}
                className="inline-flex items-center px-3 py-2 border border-border shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-background hover:bg-panel-background focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <ArrowPathIcon className="h-4 w-4 mr-2" />
                Refresh
              </button>

              {selectedItems.size > 0 && (
                <button
                  onClick={handleCleanup}
                  disabled={cleaning}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                >
                  {cleaning ? (
                    <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <TrashIcon className="h-4 w-4 mr-2" />
                  )}
                  {cleaning ? "Cleaning..." : "Clean Up"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Storage Categories */}
        <div className="space-y-6">
          {storageCategories.map((category) => (
            <div key={category.name} className="bg-background rounded-lg shadow">
              <div className="px-6 py-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded ${category.color}`}></div>
                    <h3 className="text-lg font-medium text-foreground">
                      {category.name}
                    </h3>
                    <span className="text-sm text-muted">
                      ({category.items.length} items,{" "}
                      {category.totalSize.toFixed(1)} MB)
                    </span>
                  </div>
                  <button
                    onClick={() => handleSelectAll(category.name)}
                    className="text-sm text-indigo-600 hover:text-indigo-900"
                  >
                    {category.items.every(
                      (item) => selectedItems.has(item.id) || !item.canDelete,
                    )
                      ? "Deselect All"
                      : "Select All"}
                  </button>
                </div>
              </div>

              <div className="divide-y divide-gray-200">
                {sortItems(category.items).map((item) => (
                  <div
                    key={item.id}
                    className="px-6 py-4 flex items-center justify-between"
                  >
                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        checked={selectedItems.has(item.id)}
                        onChange={() => handleItemSelect(item.id)}
                        disabled={!item.canDelete}
                        className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-border rounded disabled:opacity-50"
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-sm font-medium text-foreground">
                            {item.name}
                          </h4>
                          {getPlatformIcon(item.platform)}
                          {!item['canDelete'] && (
                            <ExclamationTriangleIcon
                              className="h-4 w-4 text-yellow-500"
                              title="System file - cannot delete"
                            />
                          )}
                        </div>
                        <p className="text-xs text-muted mt-1">
                          {item.path}
                        </p>
                        <p className="text-xs text-muted mt-1">
                          Last accessed:{" "}
                          {item.lastAccessed.toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-medium text-foreground">
                        {item.size.toFixed(1)} MB
                      </div>
                      <div className="text-xs text-muted capitalize">
                        {item.type}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-background">
            <div className="mt-3 text-center">
              <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500" />
              <h3 className="text-lg font-medium text-foreground mt-2">
                Confirm Cleanup
              </h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-muted">
                  Are you sure you want to delete {selectedItems.size} items?
                  This will free up {selectedSize.toFixed(1)} MB of storage
                  space.
                </p>
                <p className="text-xs text-red-600 mt-2">
                  This action cannot be undone.
                </p>
              </div>
              <div className="flex items-center justify-center space-x-3 mt-4">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-800 text-sm font-medium rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmCleanup}
                  className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataSpaceManager;
