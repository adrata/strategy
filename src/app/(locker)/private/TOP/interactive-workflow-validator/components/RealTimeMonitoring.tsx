"use client";

import React, { useState, useEffect } from 'react';

interface MonitoringData {
  timestamp: number;
  stepId: string;
  stepName: string;
  status: 'started' | 'completed' | 'error';
  duration?: number;
  output?: any;
  error?: string;
  dataSource?: string;
  confidence?: number;
}

interface RealTimeMonitoringProps {
  isActive: boolean;
  onDataUpdate?: (data: MonitoringData) => void;
}

export const RealTimeMonitoring: React.FC<RealTimeMonitoringProps> = ({
  isActive,
  onDataUpdate
}) => {
  const [monitoringData, setMonitoringData] = useState<MonitoringData[]>([]);
  const [systemMetrics, setSystemMetrics] = useState({
    cpuUsage: 0,
    memoryUsage: 0,
    apiCallsPerSecond: 0,
    activeConnections: 0,
    errorRate: 0
  });

  useEffect(() => {
    if (!isActive) return;

    // Simulate real-time system metrics
    const metricsInterval = setInterval(() => {
      setSystemMetrics(prev => ({
        cpuUsage: Math.min(100, prev.cpuUsage + (Math.random() - 0.5) * 10),
        memoryUsage: Math.min(100, prev.memoryUsage + (Math.random() - 0.5) * 5),
        apiCallsPerSecond: Math.max(0, prev.apiCallsPerSecond + (Math.random() - 0.5) * 2),
        activeConnections: Math.max(0, prev.activeConnections + Math.floor((Math.random() - 0.5) * 3)),
        errorRate: Math.max(0, Math.min(100, prev.errorRate + (Math.random() - 0.5) * 2))
      }));
    }, 1000);

    return () => clearInterval(metricsInterval);
  }, [isActive]);

  const addMonitoringData = (data: MonitoringData) => {
    setMonitoringData(prev => [data, ...prev.slice(0, 99)]); // Keep last 100 entries
    onDataUpdate?.(data);
  };

  const getStatusColor = (status: MonitoringData['status']) => {
    switch (status) {
      case 'started': return 'text-blue-600 bg-blue-50';
      case 'completed': return 'text-green-600 bg-green-50';
      case 'error': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: MonitoringData['status']) => {
    switch (status) {
      case 'started': return '🚀';
      case 'completed': return '✅';
      case 'error': return '❌';
      default: return '⏳';
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getMetricColor = (value: number, threshold: number = 80) => {
    if (value >= threshold) return 'text-red-600';
    if (value >= threshold * 0.7) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="space-y-6">
      {/* System Metrics */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">System Metrics</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center">
            <div className={`text-2xl font-bold ${getMetricColor(systemMetrics.cpuUsage)}`}>
              {systemMetrics.cpuUsage.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">CPU Usage</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${systemMetrics.cpuUsage}%` }}
              ></div>
            </div>
          </div>
          
          <div className="text-center">
            <div className={`text-2xl font-bold ${getMetricColor(systemMetrics.memoryUsage)}`}>
              {systemMetrics.memoryUsage.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">Memory Usage</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${systemMetrics.memoryUsage}%` }}
              ></div>
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {systemMetrics.apiCallsPerSecond.toFixed(1)}
            </div>
            <div className="text-sm text-gray-600">API Calls/sec</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, systemMetrics.apiCallsPerSecond * 10)}%` }}
              ></div>
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600">
              {systemMetrics.activeConnections}
            </div>
            <div className="text-sm text-gray-600">Active Connections</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, systemMetrics.activeConnections * 10)}%` }}
              ></div>
            </div>
          </div>
          
          <div className="text-center">
            <div className={`text-2xl font-bold ${getMetricColor(systemMetrics.errorRate, 5)}`}>
              {systemMetrics.errorRate.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">Error Rate</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-red-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, systemMetrics.errorRate * 10)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* API Performance */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">API Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">CoreSignal API</h4>
              <span className="text-green-600 text-sm">✅ Online</span>
            </div>
            <div className="text-sm text-gray-600">
              <div>Response Time: 245ms</div>
              <div>Success Rate: 98.5%</div>
              <div>Rate Limit: 60/min</div>
            </div>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">Perplexity API</h4>
              <span className="text-green-600 text-sm">✅ Online</span>
            </div>
            <div className="text-sm text-gray-600">
              <div>Response Time: 1.2s</div>
              <div>Success Rate: 95.2%</div>
              <div>Rate Limit: 20/min</div>
            </div>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">ZeroBounce API</h4>
              <span className="text-green-600 text-sm">✅ Online</span>
            </div>
            <div className="text-sm text-gray-600">
              <div>Response Time: 180ms</div>
              <div>Success Rate: 99.1%</div>
              <div>Credits: 9,504</div>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Activity Log */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Real-time Activity</h3>
        <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-64 overflow-auto">
          {monitoringData.length === 0 ? (
            <div className="text-gray-500">No activity yet...</div>
          ) : (
            monitoringData.map((data, index) => (
              <div key={index} className="mb-2 flex items-start gap-2">
                <span className="text-gray-500 text-xs">
                  {formatTimestamp(data.timestamp)}
                </span>
                <span className="text-lg">{getStatusIcon(data.status)}</span>
                <div className="flex-1">
                  <span className="font-medium">{data.stepName}</span>
                  {data.status === 'completed' && data.duration && (
                    <span className="text-gray-400 ml-2">({data.duration}ms)</span>
                  )}
                  {data.dataSource && (
                    <span className="text-blue-400 ml-2">[{data.dataSource}]</span>
                  )}
                  {data.confidence && (
                    <span className="text-yellow-400 ml-2">({data.confidence}% confidence)</span>
                  )}
                  {data.error && (
                    <div className="text-red-400 mt-1">Error: {data.error}</div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Parallel Processing Status */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Parallel Processing Status</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="font-medium">Search Execution (5 parallel)</span>
            </div>
            <div className="text-sm text-gray-600">
              <span className="text-green-600">3 completed</span>
              <span className="mx-2">•</span>
              <span className="text-blue-600">2 running</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="font-medium">Profile Collection (10 parallel)</span>
            </div>
            <div className="text-sm text-gray-600">
              <span className="text-green-600">10 completed</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
              <span className="font-medium">Intelligence Analysis (3 parallel)</span>
            </div>
            <div className="text-sm text-gray-600">
              <span className="text-green-600">1 completed</span>
              <span className="mx-2">•</span>
              <span className="text-purple-600">2 running</span>
            </div>
          </div>
        </div>
      </div>

      {/* Data Sources & Confidence */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Sources & Confidence</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Data Sources</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>CoreSignal API</span>
                <span className="text-green-600">95% confidence</span>
              </div>
              <div className="flex justify-between">
                <span>Perplexity AI</span>
                <span className="text-blue-600">88% confidence</span>
              </div>
              <div className="flex justify-between">
                <span>ZeroBounce</span>
                <span className="text-green-600">98% confidence</span>
              </div>
              <div className="flex justify-between">
                <span>Lusha</span>
                <span className="text-yellow-600">85% confidence</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Overall Quality</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Contact Accuracy</span>
                <span className="text-green-600">95%</span>
              </div>
              <div className="flex justify-between">
                <span>Role Assignment</span>
                <span className="text-green-600">92%</span>
              </div>
              <div className="flex justify-between">
                <span>Buyer Group Cohesion</span>
                <span className="text-blue-600">88%</span>
              </div>
              <div className="flex justify-between">
                <span>Intelligence Quality</span>
                <span className="text-green-600">90%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
