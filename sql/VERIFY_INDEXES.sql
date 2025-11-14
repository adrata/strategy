-- Check if our performance indexes were created successfully
SELECT 
  tablename, 
  indexname, 
  indexdef 
FROM pg_indexes 
WHERE tablename IN ('companies', 'people', 'actions')
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

