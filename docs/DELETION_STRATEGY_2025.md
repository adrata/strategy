# 🗑️ Deletion Strategy 2025 - Best Practices

## Overview

This document outlines the comprehensive deletion strategy implemented for the Adrata platform, following 2025 best practices for data management, compliance, and performance.

## 🎯 Strategy: Hybrid Deletion Approach

### 1. **Soft Delete (Immediate)**
- **Purpose**: Data recovery, audit trails, compliance
- **Implementation**: `deletedAt` timestamp field
- **Benefits**: 
  - Undo functionality for users
  - Maintains referential integrity
  - Compliance with GDPR/HIPAA regulations
  - Audit trail preservation

### 2. **Hard Delete (Eventual)**
- **Purpose**: Performance optimization, storage management
- **Implementation**: Automated cleanup job
- **Benefits**:
  - Prevents database bloat
  - Improves query performance
  - Reduces storage costs
  - Maintains data hygiene

## 📊 Retention Periods

| Entity Type | Retention Period | Rationale |
|-------------|------------------|-----------|
| **Companies** | 365 days | Business relationships may be rekindled |
| **People** | 180 days | Contact information changes frequently |
| **Actions** | 90 days | Historical activity tracking |
| **Audit Logs** | 2555 days (7 years) | Compliance requirements |

## 🛠️ Implementation

### Database Schema

```prisma
model companies {
  // ... other fields
  deletedAt DateTime?
  @@index([deletedAt])
}

model people {
  // ... other fields
  deletedAt DateTime?
  @@index([deletedAt])
}

model actions {
  // ... other fields
  deletedAt DateTime?
  @@index([deletedAt])
}
```

### API Endpoints

#### Soft Delete
```typescript
POST /api/v1/deletion
{
  "action": "soft_delete",
  "entityType": "companies",
  "entityId": "company_123"
}
```

#### Restore
```typescript
POST /api/v1/deletion
{
  "action": "restore",
  "entityType": "companies", 
  "entityId": "company_123"
}
```

#### Hard Delete
```typescript
POST /api/v1/deletion
{
  "action": "hard_delete",
  "entityType": "companies",
  "entityId": "company_123"
}
```

#### Statistics
```typescript
GET /api/v1/deletion?action=stats
```

### React Hook Usage

```typescript
import { useDeletion, DeletionButton } from '@/platform/hooks/useDeletion';

function MyComponent() {
  const { softDelete, restore, hardDelete, getStats } = useDeletion();

  const handleDelete = async () => {
    await softDelete({
      entityType: 'companies',
      entityId: 'company_123',
      onSuccess: () => console.log('Deleted successfully'),
      onError: (error) => console.error('Delete failed:', error)
    });
  };

  return (
    <DeletionButton
      entityType="companies"
      entityId="company_123"
      action="soft_delete"
      onSuccess={() => console.log('Success')}
      className="bg-red-500 text-white px-4 py-2 rounded"
    >
      Delete Company
    </DeletionButton>
  );
}
```

## 🧹 Automated Cleanup

### Manual Cleanup
```bash
# Dry run (see what would be deleted)
npm run cleanup:deletion:dry-run

# Actual cleanup
npm run cleanup:deletion
```

### Scheduled Cleanup
The cleanup job can be scheduled using:

1. **Cron Jobs** (Linux/macOS)
2. **GitHub Actions** (CI/CD)
3. **Cloud Functions** (AWS Lambda, Google Cloud Functions)
4. **Kubernetes CronJobs**

Example cron job (runs daily at 2 AM):
```bash
0 2 * * * cd /path/to/adrata && npm run cleanup:deletion
```

## 📈 Monitoring & Analytics

### Key Metrics
- **Soft Deleted Records**: Track accumulation over time
- **Retention Compliance**: Records past retention period
- **Cleanup Performance**: Execution time and batch sizes
- **Storage Impact**: Database size before/after cleanup

### Alerts
- High number of soft-deleted records (>1000 companies, >5000 people)
- Cleanup job failures
- Retention compliance violations

## 🔒 Security & Compliance

### Audit Trail
All deletion actions are logged in the `audit_logs` table:
- User who performed the action
- Timestamp of the action
- Entity type and ID
- Action type (SOFT_DELETE, RESTORE, HARD_DELETE)

### Data Privacy
- Soft-deleted records are excluded from all queries by default
- Personal data is anonymized before hard deletion
- Compliance with GDPR "right to be forgotten"

### Access Control
- Deletion actions require proper authentication
- Role-based permissions for different deletion types
- Admin-only access to hard delete operations

## 🚀 Performance Considerations

### Database Indexes
- `deletedAt` fields are indexed for fast filtering
- Composite indexes on `(workspaceId, deletedAt)` for multi-tenant queries

### Query Optimization
- All queries automatically filter `deletedAt: null`
- Batch processing for cleanup operations
- Configurable batch sizes to prevent timeouts

### Storage Management
- Regular cleanup prevents database bloat
- Configurable retention periods per entity type
- Monitoring of storage usage trends

## 🔧 Configuration

### Environment Variables
```env
# Deletion service configuration
DELETION_RETENTION_COMPANIES=365
DELETION_RETENTION_PEOPLE=180
DELETION_RETENTION_ACTIONS=90
DELETION_BATCH_SIZE=1000
DELETION_MAX_EXECUTION_TIME=300000
```

### Custom Configuration
```typescript
import { DeletionService } from '@/platform/services/deletion-service';

const deletionService = new DeletionService({
  retentionPeriods: {
    companies: 180,  // 6 months
    people: 90,      // 3 months
    actions: 30,     // 1 month
  },
  batchSizes: {
    companies: 50,
    people: 200,
    actions: 500,
  }
});
```

## 📋 Best Practices

### 1. **Always Use Soft Delete First**
- Provides safety net for accidental deletions
- Enables user-friendly undo functionality
- Maintains data integrity

### 2. **Implement Proper Retention Policies**
- Balance between data recovery needs and storage costs
- Consider business requirements and compliance needs
- Regular review and adjustment of retention periods

### 3. **Monitor and Alert**
- Track deletion patterns and trends
- Set up alerts for unusual deletion activity
- Regular cleanup job monitoring

### 4. **Test Cleanup Jobs**
- Always run dry-run before actual cleanup
- Test in staging environment first
- Monitor performance impact

### 5. **Document Deletion Policies**
- Clear documentation for users and administrators
- Regular training on deletion procedures
- Compliance documentation for auditors

## 🔮 Future Enhancements

### Planned Features
1. **Granular Retention Policies**: Per-workspace or per-user retention settings
2. **Deletion Analytics Dashboard**: Visual monitoring of deletion patterns
3. **Automated Compliance Reporting**: GDPR/HIPAA compliance reports
4. **Advanced Recovery Tools**: Point-in-time recovery capabilities
5. **Deletion Workflows**: Approval processes for sensitive deletions

### Integration Opportunities
1. **Backup Systems**: Integration with backup and recovery systems
2. **Data Warehouses**: Archive deleted data for analytics
3. **Compliance Tools**: Integration with compliance monitoring systems
4. **Performance Monitoring**: Real-time performance impact tracking

## 📞 Support

For questions or issues with the deletion system:
1. Check the logs in `/logs/deletion.log`
2. Review the audit trail in the database
3. Contact the development team
4. Refer to this documentation

---

*Last updated: January 2025*
*Version: 1.0*
