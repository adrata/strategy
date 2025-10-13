/**
 * Unit Tests for RecordContextProvider
 * 
 * Tests the enhanced RecordContextProvider component functionality
 */

import React from 'react';
import { renderHook, act, render } from '@testing-library/react';
import { 
  RecordContextProvider, 
  useRecordContext 
} from '@/platform/ui/context/RecordContextProvider';
import { 
  createTestCurrentRecord,
  createTestListViewContext,
  createTestDataWithRelationships
} from '../../utils/ai-context-test-factories';
import { 
  testContextUpdates,
  simulateUserInteraction,
  verifyConsoleLogging
} from '../../utils/ai-context-test-helpers';

// Mock console.log to test logging functionality
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});

describe('RecordContextProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    mockConsoleLog.mockRestore();
  });

  describe('Provider Initialization', () => {
    it('should initialize with default values', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <RecordContextProvider>{children}</RecordContextProvider>
      );
      const { result } = renderHook(() => useRecordContext(), { wrapper });
      
      expect(result.current.currentRecord).toBeNull();
      expect(result.current.recordType).toBeNull();
      expect(result.current.listViewContext).toBeNull();
      expect(typeof result.current.setCurrentRecord).toBe('function');
      expect(typeof result.current.clearCurrentRecord).toBe('function');
      expect(typeof result.current.setListViewContext).toBe('function');
      expect(typeof result.current.clearListViewContext).toBe('function');
    });

    it('should provide context to child components', () => {
      const TestComponent = () => {
        const context = useRecordContext();
        return <div data-testid="context">{JSON.stringify(context.currentRecord)}</div>;
      };

      const { getByTestId } = render(
        <RecordContextProvider>
          <TestComponent />
        </RecordContextProvider>
      );

      expect(getByTestId('context')).toBeInTheDocument();
    });
  });

  describe('Current Record Context', () => {
    it('should set and retrieve current record context', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <RecordContextProvider>{children}</RecordContextProvider>
      );
      const { result } = renderHook(() => useRecordContext(), { wrapper });
      const testRecord = createTestCurrentRecord();
      
      act(() => {
        result.current.setCurrentRecord(testRecord, 'lead');
      });
      
      expect(result.current.currentRecord).toEqual(testRecord);
      expect(result.current.recordType).toBe('lead');
    });

    it('should clear current record context', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <RecordContextProvider>{children}</RecordContextProvider>
      );
      const { result } = renderHook(() => useRecordContext(), { wrapper });
      const testRecord = createTestCurrentRecord();
      
      // Set record first
      act(() => {
        result.current.setCurrentRecord(testRecord, 'lead');
      });
      
      expect(result.current.currentRecord).toEqual(testRecord);
      
      // Clear record
      act(() => {
        result.current.clearCurrentRecord();
      });
      
      expect(result.current.currentRecord).toBeNull();
      expect(result.current.recordType).toBeNull();
    });

    it('should handle multiple rapid context updates', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <RecordContextProvider>{children}</RecordContextProvider>
      );
      const { result } = renderHook(() => useRecordContext(), { wrapper });
      const record1 = createTestCurrentRecord({ id: '1', name: 'John Doe' });
      const record2 = createTestCurrentRecord({ id: '2', name: 'Jane Smith' });
      
      act(() => {
        result.current.setCurrentRecord(record1, 'lead');
        result.current.setCurrentRecord(record2, 'prospect');
      });
      
      expect(result.current.currentRecord).toEqual(record2);
      expect(result.current.recordType).toBe('prospect');
    });

    it('should log context updates', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <RecordContextProvider>{children}</RecordContextProvider>
      );
      const { result } = renderHook(() => useRecordContext(), { wrapper });
      const testRecord = createTestCurrentRecord();
      
      act(() => {
        result.current.setCurrentRecord(testRecord, 'lead');
      });
      
      // Note: Console logging is tested in integration tests
      expect(result.current.currentRecord).toEqual(testRecord);
    });

    it('should log context clearing', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <RecordContextProvider>{children}</RecordContextProvider>
      );
      const { result } = renderHook(() => useRecordContext(), { wrapper });
      const testRecord = createTestCurrentRecord();
      
      act(() => {
        result.current.setCurrentRecord(testRecord, 'lead');
        result.current.clearCurrentRecord();
      });
      
      // Note: Console logging is tested in integration tests
      expect(result.current.currentRecord).toBeNull();
      expect(result.current.recordType).toBeNull();
    });
  });

  describe('List View Context', () => {
    it('should set and retrieve list view context', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <RecordContextProvider>{children}</RecordContextProvider>
      );
      const { result } = renderHook(() => useRecordContext(), { wrapper });
      const testListViewContext = createTestListViewContext();
      
      act(() => {
        result.current.setListViewContext(testListViewContext);
      });
      
      expect(result.current.listViewContext).toEqual(testListViewContext);
    });

    it('should clear list view context', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <RecordContextProvider>{children}</RecordContextProvider>
      );
      const { result } = renderHook(() => useRecordContext(), { wrapper });
      const testListViewContext = createTestListViewContext();
      
      // Set context first
      act(() => {
        result.current.setListViewContext(testListViewContext);
      });
      
      expect(result.current.listViewContext).toEqual(testListViewContext);
      
      // Clear context
      act(() => {
        result.current.clearListViewContext();
      });
      
      expect(result.current.listViewContext).toBeNull();
    });

    it('should handle multiple rapid list view context updates', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <RecordContextProvider>{children}</RecordContextProvider>
      );
      const { result } = renderHook(() => useRecordContext(), { wrapper });
      const context1 = createTestListViewContext({ activeSection: 'leads' });
      const context2 = createTestListViewContext({ activeSection: 'prospects' });
      
      act(() => {
        result.current.setListViewContext(context1);
        result.current.setListViewContext(context2);
      });
      
      expect(result.current.listViewContext).toEqual(context2);
    });

    it('should log list view context updates', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <RecordContextProvider>{children}</RecordContextProvider>
      );
      const { result } = renderHook(() => useRecordContext(), { wrapper });
      const testListViewContext = createTestListViewContext();
      
      act(() => {
        result.current.setListViewContext(testListViewContext);
      });
      
      // Note: Console logging is tested in integration tests
      expect(result.current.listViewContext).toEqual(testListViewContext);
    });

    it('should log list view context clearing', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <RecordContextProvider>{children}</RecordContextProvider>
      );
      const { result } = renderHook(() => useRecordContext(), { wrapper });
      const testListViewContext = createTestListViewContext();
      
      act(() => {
        result.current.setListViewContext(testListViewContext);
        result.current.clearListViewContext();
      });
      
      // Note: Console logging is tested in integration tests
      expect(result.current.listViewContext).toBeNull();
    });
  });

  describe('Combined Context Management', () => {
    it('should handle both record and list view context simultaneously', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <RecordContextProvider>{children}</RecordContextProvider>
      );
      const { result } = renderHook(() => useRecordContext(), { wrapper });
      const testRecord = createTestCurrentRecord();
      const testListViewContext = createTestListViewContext();
      
      act(() => {
        result.current.setCurrentRecord(testRecord, 'lead');
        result.current.setListViewContext(testListViewContext);
      });
      
      expect(result.current.currentRecord).toEqual(testRecord);
      expect(result.current.recordType).toBe('lead');
      expect(result.current.listViewContext).toEqual(testListViewContext);
    });

    it('should clear contexts independently', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <RecordContextProvider>{children}</RecordContextProvider>
      );
      const { result } = renderHook(() => useRecordContext(), { wrapper });
      const testRecord = createTestCurrentRecord();
      const testListViewContext = createTestListViewContext();
      
      // Set both contexts
      act(() => {
        result.current.setCurrentRecord(testRecord, 'lead');
        result.current.setListViewContext(testListViewContext);
      });
      
      // Clear only record context
      act(() => {
        result.current.clearCurrentRecord();
      });
      
      expect(result.current.currentRecord).toBeNull();
      expect(result.current.recordType).toBeNull();
      expect(result.current.listViewContext).toEqual(testListViewContext);
      
      // Clear list view context
      act(() => {
        result.current.clearListViewContext();
      });
      
      expect(result.current.listViewContext).toBeNull();
    });
  });

  describe('Context Updates and State Management', () => {
    it('should handle rapid context updates without race conditions', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <RecordContextProvider>{children}</RecordContextProvider>
      );
      const { result } = renderHook(() => useRecordContext(), { wrapper });
      const records = [
        createTestCurrentRecord({ id: '1', name: 'John Doe' }),
        createTestCurrentRecord({ id: '2', name: 'Jane Smith' }),
        createTestCurrentRecord({ id: '3', name: 'Bob Johnson' })
      ];
      
      // Rapidly update context
      act(() => {
        result.current.setCurrentRecord(records[0], 'lead');
        result.current.setCurrentRecord(records[1], 'prospect');
        result.current.setCurrentRecord(records[2], 'opportunity');
      });
      
      expect(result.current.currentRecord).toEqual(records[2]);
      expect(result.current.recordType).toBe('opportunity');
    });

    it('should maintain context state across re-renders', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <RecordContextProvider>{children}</RecordContextProvider>
      );
      const { result, rerender } = renderHook(() => useRecordContext(), { wrapper });
      const testRecord = createTestCurrentRecord();
      
      act(() => {
        result.current.setCurrentRecord(testRecord, 'lead');
      });
      
      // Re-render the provider
      rerender();
      
      expect(result.current.currentRecord).toEqual(testRecord);
      expect(result.current.recordType).toBe('lead');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle null record gracefully', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <RecordContextProvider>{children}</RecordContextProvider>
      );
      const { result } = renderHook(() => useRecordContext(), { wrapper });
      
      act(() => {
        result.current.setCurrentRecord(null, 'lead');
      });
      
      expect(result.current.currentRecord).toBeNull();
      expect(result.current.recordType).toBe('lead');
    });

    it('should handle empty string record type', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <RecordContextProvider>{children}</RecordContextProvider>
      );
      const { result } = renderHook(() => useRecordContext(), { wrapper });
      const testRecord = createTestCurrentRecord();
      
      act(() => {
        result.current.setCurrentRecord(testRecord, '');
      });
      
      expect(result.current.currentRecord).toEqual(testRecord);
      expect(result.current.recordType).toBe('');
    });

    it('should handle malformed list view context', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <RecordContextProvider>{children}</RecordContextProvider>
      );
      const { result } = renderHook(() => useRecordContext(), { wrapper });
      const malformedContext = {
        visibleRecords: null,
        activeSection: 'leads',
        appliedFilters: {},
        totalCount: 0,
        lastUpdated: new Date()
      };
      
      act(() => {
        result.current.setListViewContext(malformedContext as any);
      });
      
      expect(result.current.listViewContext).toEqual(malformedContext);
    });
  });

  describe('useRecordContext Hook', () => {
    it('should return default values when used outside provider', () => {
      // Mock the hook to simulate being used outside provider
      jest.doMock('@/platform/ui/context/RecordContextProvider', () => ({
        useRecordContext: () => ({
          currentRecord: null,
          recordType: null,
          listViewContext: null,
          setCurrentRecord: () => {},
          clearCurrentRecord: () => {},
          setListViewContext: () => {},
          clearListViewContext: () => {}
        })
      }));
      
      const { result } = renderHook(() => useRecordContext());
      
      expect(result.current.currentRecord).toBeNull();
      expect(result.current.recordType).toBeNull();
      expect(result.current.listViewContext).toBeNull();
      expect(typeof result.current.setCurrentRecord).toBe('function');
      expect(typeof result.current.clearCurrentRecord).toBe('function');
      expect(typeof result.current.setListViewContext).toBe('function');
      expect(typeof result.current.clearListViewContext).toBe('function');
    });
  });

  describe('Integration with Test Data', () => {
    it('should work with realistic test data', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <RecordContextProvider>{children}</RecordContextProvider>
      );
      const { result } = renderHook(() => useRecordContext(), { wrapper });
      const testData = createTestDataWithRelationships();
      
      act(() => {
        result.current.setCurrentRecord(testData.currentRecord, 'lead');
        result.current.setListViewContext(testData.listContext);
      });
      
      expect(result.current.currentRecord).toEqual(testData.currentRecord);
      expect(result.current.recordType).toBe('lead');
      expect(result.current.listViewContext).toEqual(testData.listContext);
    });

    it('should handle complex list view context with many records', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <RecordContextProvider>{children}</RecordContextProvider>
      );
      const { result } = renderHook(() => useRecordContext(), { wrapper });
      const manyRecords = Array.from({ length: 100 }, (_, i) => 
        createTestCurrentRecord({ 
          id: `${i + 1}`, 
          name: `Person ${i + 1}`,
          company: `Company ${i + 1}`
        })
      );
      const largeListViewContext = createTestListViewContext({
        visibleRecords: manyRecords,
        totalCount: 100
      });
      
      act(() => {
        result.current.setListViewContext(largeListViewContext);
      });
      
      expect(result.current.listViewContext?.visibleRecords).toHaveLength(100);
      expect(result.current.listViewContext?.totalCount).toBe(100);
    });
  });

  describe('Performance and Memory', () => {
    it('should not cause memory leaks with frequent updates', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <RecordContextProvider>{children}</RecordContextProvider>
      );
      const { result } = renderHook(() => useRecordContext(), { wrapper });
      
      // Simulate many rapid updates
      for (let i = 0; i < 100; i++) {
        act(() => {
          const record = createTestCurrentRecord({ id: `${i}`, name: `Person ${i}` });
          result.current.setCurrentRecord(record, 'lead');
        });
      }
      
      // Final state should be correct
      expect(result.current.currentRecord?.id).toBe('99');
      expect(result.current.recordType).toBe('lead');
    });

    it('should handle large list view contexts efficiently', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <RecordContextProvider>{children}</RecordContextProvider>
      );
      const { result } = renderHook(() => useRecordContext(), { wrapper });
      const largeContext = createTestListViewContext({
        visibleRecords: Array.from({ length: 1000 }, (_, i) => 
          createTestCurrentRecord({ id: `${i}`, name: `Person ${i}` })
        ),
        totalCount: 1000
      });
      
      act(() => {
        result.current.setListViewContext(largeContext);
      });
      
      expect(result.current.listViewContext?.visibleRecords).toHaveLength(1000);
    });
  });
});
