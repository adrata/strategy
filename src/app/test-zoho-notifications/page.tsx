"use client";

import React, { useState, useEffect } from 'react';
import { ZohoNotificationContainer } from '@/platform/ui/components/ZohoNotificationToast';
import { useZohoNotifications } from '@/platform/hooks/useZohoNotifications';

/**
 * 🧪 ZOHO NOTIFICATIONS E2E TEST PAGE
 * 
 * This page allows you to test the complete Zoho notification flow:
 * 1. Send test webhooks to trigger notifications
 * 2. View real-time notifications in the browser
 * 3. Test the notification UI components
 * 4. Verify the complete end-to-end flow
 */

export default function ZohoNotificationsTestPage() {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [workspaceId] = useState('01K1VBYV8ETM2RCQA4GNN9EG72'); // Dano's workspace
  const [userId] = useState('test-user-id');

  // Use the Zoho notifications hook to get real-time updates
  const { notifications, activeNotification, dismissNotification, markAsRead, refreshNotifications } = useZohoNotifications(
    workspaceId,
    userId,
    (notification) => {
      console.log('🔔 [E2E TEST] New notification received:', notification);
      setTestResults(prev => [...prev, {
        type: 'notification_received',
        timestamp: new Date().toISOString(),
        data: notification,
        success: true
      }]);
    }
  );

  // Test data for different notification types
  const testData = {
    lead: {
      id: 'e2e_test_lead_' + Date.now(),
      First_Name: 'E2E',
      Last_Name: 'Test',
      Email: 'e2e.test@example.com',
      Company: 'E2E Test Company',
      Title: 'Test Manager',
      Phone: '+1-555-0999',
      Description: 'End-to-end test lead with urgent budget approval needed for Q1 implementation',
      Lead_Status: 'New',
      Lead_Source: 'E2E Test',
      workspaceId: workspaceId
    },
    contact: {
      id: 'e2e_test_contact_' + Date.now(),
      First_Name: 'E2E',
      Last_Name: 'Contact',
      Email: 'e2e.contact@example.com',
      Title: 'Test Director',
      Department: 'Engineering',
      Phone: '+1-555-0998',
      Description: 'E2E test contact with immediate purchase decision required',
      Account_Name: 'E2E Test Account',
      workspaceId: workspaceId
    },
    deal: {
      id: 'e2e_test_deal_' + Date.now(),
      Deal_Name: 'E2E Test Deal',
      Amount: '100000',
      Stage: 'Proposal',
      Probability: '85',
      Closing_Date: '2025-02-25',
      Description: 'High-value E2E test deal with approved budget and urgent timeline',
      Contact_Name: 'E2E Test Contact',
      Account_Name: 'E2E Test Account',
      workspaceId: workspaceId
    }
  };

  // Send test webhook
  const sendTestWebhook = async (type: 'lead' | 'contact' | 'deal') => {
    setIsLoading(true);
    const testId = Date.now();
    
    try {
      console.log(`🚀 [E2E TEST] Sending ${type} webhook...`);
      
      setTestResults(prev => [...prev, {
        type: 'webhook_sent',
        timestamp: new Date().toISOString(),
        data: { type, testId },
        success: true
      }]);

      const response = await fetch('/api/webhooks/zoho', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData[type])
      });

      const result = await response.json();
      
      if (response.ok) {
        console.log(`✅ [E2E TEST] ${type} webhook sent successfully`);
        setTestResults(prev => [...prev, {
          type: 'webhook_success',
          timestamp: new Date().toISOString(),
          data: { type, testId, response: result },
          success: true
        }]);
      } else {
        throw new Error(`HTTP ${response.status}: ${JSON.stringify(result)}`);
      }

    } catch (error) {
      console.error(`❌ [E2E TEST] ${type} webhook failed:`, error);
      setTestResults(prev => [...prev, {
        type: 'webhook_error',
        timestamp: new Date().toISOString(),
        data: { type, testId, error: error instanceof Error ? error.message : 'Unknown error' },
        success: false
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Test notifications API
  const testNotificationsAPI = async () => {
    setIsLoading(true);
    
    try {
      console.log('📡 [E2E TEST] Testing notifications API...');
      
      const response = await fetch(`/api/zoho/notifications?workspaceId=${workspaceId}&limit=10`);
      const result = await response.json();
      
      if (response.ok) {
        console.log('✅ [E2E TEST] Notifications API test successful');
        setTestResults(prev => [...prev, {
          type: 'api_success',
          timestamp: new Date().toISOString(),
          data: { notifications: result.notifications, count: result.count },
          success: true
        }]);
      } else {
        throw new Error(`HTTP ${response.status}: ${JSON.stringify(result)}`);
      }

    } catch (error) {
      console.error('❌ [E2E TEST] Notifications API test failed:', error);
      setTestResults(prev => [...prev, {
        type: 'api_error',
        timestamp: new Date().toISOString(),
        data: { error: error instanceof Error ? error.message : 'Unknown error' },
        success: false
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Clear test results
  const clearResults = () => {
    setTestResults([]);
  };

  // Get status color
  const getStatusColor = (success: boolean) => {
    return success ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50';
  };

  // Get type icon
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'webhook_sent': return '🚀';
      case 'webhook_success': return '✅';
      case 'webhook_error': return '❌';
      case 'notification_received': return '🔔';
      case 'api_success': return '📡';
      case 'api_error': return '❌';
      default: return '📋';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🧪 Zoho Notifications E2E Test
          </h1>
          <p className="text-gray-600">
            Test the complete Zoho notification flow in your browser
          </p>
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Workspace ID:</strong> {workspaceId}
            </p>
            <p className="text-sm text-blue-800">
              <strong>User ID:</strong> {userId}
            </p>
            <p className="text-sm text-blue-800">
              <strong>Active Notifications:</strong> {notifications.length}
            </p>
          </div>
        </div>

        {/* Test Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <button
            onClick={() => sendTestWebhook('lead')}
            disabled={isLoading}
            className="p-4 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
          >
            👥 Test Lead Webhook
          </button>
          
          <button
            onClick={() => sendTestWebhook('contact')}
            disabled={isLoading}
            className="p-4 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
          >
            📞 Test Contact Webhook
          </button>
          
          <button
            onClick={() => sendTestWebhook('deal')}
            disabled={isLoading}
            className="p-4 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
          >
            💼 Test Deal Webhook
          </button>
          
          <button
            onClick={testNotificationsAPI}
            disabled={isLoading}
            className="p-4 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
          >
            📡 Test API
          </button>
        </div>

        {/* Additional Controls */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={refreshNotifications}
            className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
          >
            🔄 Refresh Notifications
          </button>
          
          <button
            onClick={clearResults}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
          >
            🗑️ Clear Results
          </button>
        </div>

        {/* Loading Indicator */}
        {isLoading && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600 mr-3"></div>
              <span className="text-yellow-800">Processing test...</span>
            </div>
          </div>
        )}

        {/* Active Notification Display */}
        {activeNotification && (
          <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="text-lg font-semibold text-green-800 mb-2">
              🔔 Active Notification
            </h3>
            <div className="text-sm text-green-700">
              <p><strong>Type:</strong> {activeNotification.note.title}</p>
              <p><strong>Module:</strong> {activeNotification.module}</p>
              <p><strong>Operation:</strong> {activeNotification.operation}</p>
              <p><strong>Priority:</strong> {activeNotification.priority}</p>
              <p><strong>Time:</strong> {new Date(activeNotification.timestamp).toLocaleString()}</p>
            </div>
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => markAsRead(activeNotification.record.id)}
                className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors"
              >
                Mark as Read
              </button>
              <button
                onClick={dismissNotification}
                className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Test Results */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              📊 Test Results ({testResults.length})
            </h2>
          </div>
          
          <div className="p-6">
            {testResults.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No test results yet. Click a test button above to start testing!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {testResults.map((result, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${getStatusColor(result.success)}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <span className="text-lg">{getTypeIcon(result.type)}</span>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium capitalize">
                              {result.type.replace('_', ' ')}
                            </span>
                            <span className="text-xs opacity-75">
                              {new Date(result.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <div className="text-sm">
                            {result.type === 'notification_received' && (
                              <div>
                                <p><strong>Title:</strong> {result.data.note?.title}</p>
                                <p><strong>Module:</strong> {result.data.module}</p>
                                <p><strong>Priority:</strong> {result.data.priority}</p>
                              </div>
                            )}
                            {result.type === 'webhook_success' && (
                              <div>
                                <p><strong>Type:</strong> {result.data.type}</p>
                                <p><strong>Response:</strong> {JSON.stringify(result.data.response)}</p>
                              </div>
                            )}
                            {result.type === 'api_success' && (
                              <div>
                                <p><strong>Notifications Found:</strong> {result.data.count}</p>
                                <p><strong>Response:</strong> {JSON.stringify(result.data.notifications?.slice(0, 2))}</p>
                              </div>
                            )}
                            {(result.type === 'webhook_error' || result.type === 'api_error') && (
                              <div>
                                <p><strong>Error:</strong> {result.data.error}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs opacity-75">
                        {result.success ? '✅' : '❌'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Notifications */}
        <div className="mt-8 bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              🔔 Recent Notifications ({notifications.length})
            </h2>
          </div>
          
          <div className="p-6">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No notifications yet. Send a test webhook to see notifications appear here!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {notifications.slice(0, 5).map((notification, index) => (
                  <div
                    key={index}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-lg">
                            {notification.module === 'leads' && '👥'}
                            {notification.module === 'contacts' && '📞'}
                            {notification.module === 'deals' && '💼'}
                            {notification.module === 'accounts' && '🏢'}
                          </span>
                          <h3 className="font-medium text-gray-900">
                            {notification.note.title}
                          </h3>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            notification.priority === 'HIGH' ? 'bg-red-100 text-red-800' :
                            notification.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {notification.priority}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {notification.note.content}
                        </p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>{notification.module} • {notification.operation}</span>
                          <span>{new Date(notification.timestamp).toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <button
                          onClick={() => markAsRead(notification.record.id)}
                          className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded transition-colors"
                        >
                          Mark Read
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Zoho Notification Container - This will show the toast notifications */}
        <ZohoNotificationContainer 
          workspaceId={workspaceId}
          userId={userId}
          maxNotifications={3}
        />
      </div>
    </div>
  );
}
