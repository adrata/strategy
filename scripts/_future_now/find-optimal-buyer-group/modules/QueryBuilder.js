/**
 * Query Builder Module
 * 
 * Builds Elasticsearch queries for optimal buyer search
 * Supports criteria-based and similar-company searches
 */

class QueryBuilder {
  constructor(qualificationCriteria, searchMode = 'criteria') {
    this.criteria = qualificationCriteria;
    this.searchMode = searchMode;
  }

  /**
   * Build Elasticsearch query
   * @returns {object} Elasticsearch query object
   */
  build() {
    if (this.searchMode === 'similar_to_company') {
      return this.buildSimilarCompanyQuery();
    }
    
    return this.buildCriteriaQuery();
  }

  buildCriteriaQuery() {
    return {
      "query": {
        "bool": {
          "must": [
            // Industry filter
            ...(this.criteria.industries.length > 0 ? [
              { "terms": { "company_industry": this.criteria.industries } }
            ] : []),
            
            // Size range filter
            ...(this.criteria.sizeRange ? [
              { "match": { "company_size_range": this.criteria.sizeRange } }
            ] : []),
            
            // Growth signal filter
            {
              "range": {
                "company_employees_count_change_yearly_percentage": {
                  "gte": this.criteria.minGrowthRate
                }
              }
            },
            
            // B2B focus
            ...(this.criteria.b2bOnly ? [
              { "term": { "company_is_b2b": 1 } }
            ] : [])
          ],
          
          "should": [
            // Boost for technology keywords
            ...(this.criteria.keywords.length > 0 ? [
              { 
                "terms": { 
                  "company_categories_and_keywords": this.criteria.keywords,
                  "boost": 2.0
                } 
              }
            ] : []),
            
            // Boost for recent activity
            {
              "range": {
                "company_last_updated_at": {
                  "gte": "now-90d",
                  "boost": 1.5
                }
              }
            },
            
            // Boost for funding activity
            {
              "exists": {
                "field": "company_last_funding_round_date",
                "boost": 1.3
              }
            }
          ],
          
          "filter": [
            // Location filter
            ...(this.criteria.locations.length > 0 ? [
              { "terms": { "company_hq_country": this.criteria.locations } }
            ] : [])
          ]
        }
      },
      "size": 100
    };
  }

  buildSimilarCompanyQuery() {
    return {
      "query": {
        "bool": {
          "must": [
            { "range": { "company_employees_count_change_yearly_percentage": { "gte": 5 } } },
            { "term": { "company_is_b2b": 1 } }
          ]
        }
      },
      "size": 100
    };
  }
}

module.exports = { QueryBuilder };

