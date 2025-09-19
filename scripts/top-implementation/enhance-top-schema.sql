-- TOP BUYER GROUP SCHEMA ENHANCEMENTS
-- Adds fields needed for buyer group intelligence and enrichment tracking

-- Enhance people table for buyer group intelligence
ALTER TABLE people ADD COLUMN IF NOT EXISTS buyerGroupRole VARCHAR(100);
ALTER TABLE people ADD COLUMN IF NOT EXISTS buyerGroupConfidence DECIMAL(5,2);
ALTER TABLE people ADD COLUMN IF NOT EXISTS influenceScore INTEGER DEFAULT 0;
ALTER TABLE people ADD COLUMN IF NOT EXISTS authorityLevel VARCHAR(50);
ALTER TABLE people ADD COLUMN IF NOT EXISTS painPoints TEXT[] DEFAULT '{}';
ALTER TABLE people ADD COLUMN IF NOT EXISTS buyingSignals TEXT[] DEFAULT '{}';
ALTER TABLE people ADD COLUMN IF NOT EXISTS coreSignalId INTEGER;
ALTER TABLE people ADD COLUMN IF NOT EXISTS perplexityVerified BOOLEAN DEFAULT false;
ALTER TABLE people ADD COLUMN IF NOT EXISTS lastBuyerGroupUpdate TIMESTAMP;

-- Enhance companies table for buyer group tracking
ALTER TABLE companies ADD COLUMN IF NOT EXISTS coreSignalId INTEGER;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS buyerGroupsGenerated BOOLEAN DEFAULT false;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS lastBuyerGroupUpdate TIMESTAMP;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS buyingProcess JSONB;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS competitiveLandscape TEXT[] DEFAULT '{}';
ALTER TABLE companies ADD COLUMN IF NOT EXISTS technologyStack TEXT[] DEFAULT '{}';
ALTER TABLE companies ADD COLUMN IF NOT EXISTS recentNews JSONB;

-- Enhance buyer_groups table for intelligence tracking
ALTER TABLE buyer_groups ADD COLUMN IF NOT EXISTS cohesionScore DECIMAL(5,2);
ALTER TABLE buyer_groups ADD COLUMN IF NOT EXISTS completeness DECIMAL(5,2);
ALTER TABLE buyer_groups ADD COLUMN IF NOT EXISTS confidence DECIMAL(5,2);
ALTER TABLE buyer_groups ADD COLUMN IF NOT EXISTS generationMethod VARCHAR(50);
ALTER TABLE buyer_groups ADD COLUMN IF NOT EXISTS lastValidated TIMESTAMP;
ALTER TABLE buyer_groups ADD COLUMN IF NOT EXISTS validationSource VARCHAR(50);

-- Add performance indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_people_buyer_group_role ON people(buyerGroupRole) WHERE buyerGroupRole IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_people_influence_score ON people(influenceScore) WHERE influenceScore > 0;
CREATE INDEX IF NOT EXISTS idx_people_coresignal_id ON people(coreSignalId) WHERE coreSignalId IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_people_authority_level ON people(authorityLevel) WHERE authorityLevel IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_companies_buyer_groups_generated ON companies(buyerGroupsGenerated) WHERE buyerGroupsGenerated = true;
CREATE INDEX IF NOT EXISTS idx_companies_coresignal_id ON companies(coreSignalId) WHERE coreSignalId IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_companies_last_buyer_group_update ON companies(lastBuyerGroupUpdate) WHERE lastBuyerGroupUpdate IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_buyer_groups_confidence ON buyer_groups(confidence) WHERE confidence IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_buyer_groups_completeness ON buyer_groups(completeness) WHERE completeness IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_buyer_groups_generation_method ON buyer_groups(generationMethod) WHERE generationMethod IS NOT NULL;

-- Add buyer group role enum values for consistency
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'buyer_group_role_enum') THEN
    CREATE TYPE buyer_group_role_enum AS ENUM (
      'decision_maker',
      'champion', 
      'coach',
      'influencer',
      'stakeholder',
      'blocker',
      'introducer',
      'none'
    );
  END IF;
END$$;

-- Add authority level enum for consistency
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'authority_level_enum') THEN
    CREATE TYPE authority_level_enum AS ENUM (
      'budget',
      'technical',
      'influence',
      'input',
      'veto',
      'access',
      'none'
    );
  END IF;
END$$;

-- Update constraints for data integrity
ALTER TABLE people ADD CONSTRAINT check_influence_score_range 
  CHECK (influenceScore >= 0 AND influenceScore <= 100);

ALTER TABLE buyer_groups ADD CONSTRAINT check_confidence_range 
  CHECK (confidence >= 0 AND confidence <= 100);

ALTER TABLE buyer_groups ADD CONSTRAINT check_completeness_range 
  CHECK (completeness >= 0 AND completeness <= 100);

ALTER TABLE buyer_groups ADD CONSTRAINT check_cohesion_score_range 
  CHECK (cohesionScore >= 0 AND cohesionScore <= 100);

-- Add comments for documentation
COMMENT ON COLUMN people.buyerGroupRole IS 'Current role in buyer group (decision_maker, champion, etc.)';
COMMENT ON COLUMN people.buyerGroupConfidence IS 'Confidence in role assignment (0-100)';
COMMENT ON COLUMN people.influenceScore IS 'Influence score within organization (0-100)';
COMMENT ON COLUMN people.authorityLevel IS 'Type of authority (budget, technical, influence, etc.)';
COMMENT ON COLUMN people.coreSignalId IS 'CoreSignal person ID for tracking and updates';
COMMENT ON COLUMN people.perplexityVerified IS 'Whether contact info was verified by Perplexity';

COMMENT ON COLUMN companies.buyerGroupsGenerated IS 'Whether buyer groups have been generated for this company';
COMMENT ON COLUMN companies.coreSignalId IS 'CoreSignal company ID for tracking';
COMMENT ON COLUMN companies.buyingProcess IS 'JSON object describing decision process and criteria';

COMMENT ON COLUMN buyer_groups.cohesionScore IS 'How organizationally cohesive the buyer group is (0-100)';
COMMENT ON COLUMN buyer_groups.completeness IS 'How complete the buyer group is (0-100)';
COMMENT ON COLUMN buyer_groups.confidence IS 'Overall confidence in buyer group accuracy (0-100)';
COMMENT ON COLUMN buyer_groups.generationMethod IS 'How the buyer group was generated (coresignal, perplexity, manual)';

-- Create view for easy buyer group analysis
CREATE OR REPLACE VIEW buyer_group_analysis AS
SELECT 
  bg.id,
  bg.name,
  c.name as company_name,
  bg.confidence,
  bg.completeness,
  bg.cohesionScore,
  COUNT(bgp.personId) as total_members,
  COUNT(CASE WHEN bgp.role = 'decision_maker' THEN 1 END) as decision_makers,
  COUNT(CASE WHEN bgp.role = 'champion' THEN 1 END) as champions,
  COUNT(CASE WHEN bgp.role = 'stakeholder' THEN 1 END) as stakeholders,
  COUNT(CASE WHEN bgp.role = 'blocker' THEN 1 END) as blockers,
  COUNT(CASE WHEN bgp.role = 'introducer' THEN 1 END) as introducers,
  bg.lastValidated,
  bg.generationMethod
FROM buyer_groups bg
JOIN companies c ON bg.companyId = c.id
LEFT JOIN BuyerGroupToPerson bgp ON bg.id = bgp.buyerGroupId
WHERE bg.deletedAt IS NULL
GROUP BY bg.id, bg.name, c.name, bg.confidence, bg.completeness, bg.cohesionScore, bg.lastValidated, bg.generationMethod;

COMMENT ON VIEW buyer_group_analysis IS 'Analysis view for buyer group metrics and composition';

-- Grant permissions for the application user
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO postgres;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT SELECT ON buyer_group_analysis TO postgres;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'TOP buyer group schema enhancements applied successfully!';
  RAISE NOTICE 'New fields added to people, companies, and buyer_groups tables';
  RAISE NOTICE 'Performance indexes created for fast queries';
  RAISE NOTICE 'Data integrity constraints added';
  RAISE NOTICE 'Analysis view created: buyer_group_analysis';
END$$;
