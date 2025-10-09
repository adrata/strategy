-- Add SBI-specific fields to companies table
-- Migration: Add SBI fields to companies table

-- Add status field for company operational status
ALTER TABLE companies ADD COLUMN status VARCHAR(20) DEFAULT 'active';

-- Add parent company information for acquisitions
ALTER TABLE companies ADD COLUMN parent_company_name VARCHAR(255);
ALTER TABLE companies ADD COLUMN parent_company_domain VARCHAR(255);

-- Add acquisition information
ALTER TABLE companies ADD COLUMN acquisition_date TIMESTAMP;

-- Add confidence scoring
ALTER TABLE companies ADD COLUMN confidence DECIMAL(5,2) DEFAULT 0.00;

-- Add data sources tracking
ALTER TABLE companies ADD COLUMN sources TEXT[];

-- Add last verification timestamp
ALTER TABLE companies ADD COLUMN last_verified TIMESTAMP;

-- Add indexes for performance
CREATE INDEX idx_companies_status ON companies(status);
CREATE INDEX idx_companies_confidence ON companies(confidence);
CREATE INDEX idx_companies_parent_company ON companies(parent_company_name);
CREATE INDEX idx_companies_last_verified ON companies(last_verified);

-- Add comments for documentation
COMMENT ON COLUMN companies.status IS 'Company operational status: active, acquired, merged, inactive';
COMMENT ON COLUMN companies.parent_company_name IS 'Name of parent company if acquired';
COMMENT ON COLUMN companies.parent_company_domain IS 'Domain of parent company if acquired';
COMMENT ON COLUMN companies.acquisition_date IS 'Date when company was acquired';
COMMENT ON COLUMN companies.confidence IS 'Confidence score for company data (0-100)';
COMMENT ON COLUMN companies.sources IS 'Array of data sources used for company information';
COMMENT ON COLUMN companies.last_verified IS 'Timestamp of last data verification';

