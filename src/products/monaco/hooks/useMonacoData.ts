import { useState, useCallback, useEffect } from "react";
import { Company, Partner, Person } from "../types";
import { demoScenarioService } from "@/platform/services/DemoScenarioService";

// DYNAMIC: Monaco data hook with database-driven demo scenarios
export const useMonacoData = () => {
  console.log("🚀 Monaco: Dynamic scenario loading");
  
  // DYNAMIC: Load data from current demo scenario
  const [companies, setCompanies] = useState<Company[]>([]);
  const [partners] = useState<Partner[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [sellers, setSellers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastScenario, setLastScenario] = useState<string | null>(null);

  // Load demo data based on current scenario
  const loadDemoData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (demoScenarioService.isDemoMode()) {
        // Get current scenario for API calls
        const currentScenario = demoScenarioService.getCurrentScenario();
        console.log(`📊 Monaco Data: Loading data for scenario: ${currentScenario}`);
        
        if (!currentScenario) {
          console.warn('⚠️ Monaco Data: No current scenario set, retrying in 500ms...');
          // Retry after short delay if no scenario is set
          setTimeout(() => loadDemoData(), 500);
          setLoading(false);
          return;
        }
        
        // Load dynamic demo data from API endpoints
        console.log(`🌐 Monaco Data: Fetching from APIs for scenario: ${currentScenario}`);
        const [companiesResponse, peopleResponse, sellersResponse] = await Promise.all([
          fetch(`/api/demo-scenarios/companies?scenario=${currentScenario}`),
          fetch(`/api/demo-scenarios/people?scenario=${currentScenario}`),
          fetch(`/api/demo-scenarios/sellers?scenario=${currentScenario}`)
        ]);

        const [companiesData, peopleData, sellersData] = await Promise.all([
          companiesResponse.json(),
          peopleResponse.json(),
          sellersResponse.json()
        ]);

        if (companiesData['success'] && peopleData['success'] && sellersData.success) {
          setCompanies(companiesData.companies as Company[]);
          setPeople(peopleData.people as Person[]);
          setSellers(sellersData.sellers || []);
          setLastScenario(currentScenario);
          
          console.log(`✅ Monaco: Loaded ${companiesData.companies?.length || 0} companies, ${peopleData.people?.length || 0} people, and ${sellersData.sellers?.length || 0} sellers from scenario: ${currentScenario}`);
        } else {
          console.error('❌ Monaco Data: API returned failure:', companiesData, peopleData, sellersData);
          throw new Error('Failed to load demo data from API');
        }
      } else {
        // Production mode - could load real data here
        setCompanies([]);
        setPeople([]);
        setSellers([]);
        console.log("📊 Monaco: Production mode - no demo data loaded");
      }
    } catch (err) {
      console.error('❌ Monaco: Error loading demo data:', err);
      setError('Failed to load demo data');
      // Fallback to empty arrays
      setCompanies([]);
      setPeople([]);
      setSellers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    console.log('🚀 Monaco Data: Initial data load triggered');
    loadDemoData();
  }, [loadDemoData]);

  // Check for scenario changes and reload data if needed
  useEffect(() => {
    const currentScenario = demoScenarioService.getCurrentScenario();
    if (currentScenario !== lastScenario && lastScenario !== null) {
      console.log(`🔄 Monaco: Scenario changed from ${lastScenario} to ${currentScenario} - reloading data`);
      loadDemoData();
    }
  }, [lastScenario, loadDemoData]);

  // DYNAMIC: Search with loaded data
  const searchCompanies = useCallback((query: string) => {
    if (!query.trim()) return companies;
    return (companies || []).filter((company: any) => 
      company.name.toLowerCase().includes(query.toLowerCase()) ||
      company.industry.toLowerCase().includes(query.toLowerCase())
    );
  }, [companies]);

  // Force refresh data (useful for debugging)
  const forceRefresh = useCallback(async () => {
    console.log('🔄 Monaco Data: Force refreshing data...');
    setLastScenario(null); // Reset scenario to force reload
    await loadDemoData();
  }, [loadDemoData]);

  return {
    companies,
    partners,
    people,
    sellers,
    loading,
    error,
    searchCompanies,
    forceRefresh,
  };
};

// Legacy functions kept for backwards compatibility but now return empty arrays
// All data is now loaded dynamically from DemoScenarioService
export function createSampleCompanies(): Company[] {
  console.warn("⚠️ createSampleCompanies is deprecated - use DemoScenarioService instead");
  return [];
}

export function createSamplePeople(): Person[] {
  console.warn("⚠️ createSamplePeople is deprecated - use DemoScenarioService instead");
  return [];
}
