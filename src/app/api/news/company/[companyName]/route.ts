import { NextRequest, NextResponse } from 'next/server';

// Required for static export (desktop build)
export const dynamic = 'force-static';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyName: string }> }
) {
  try {
    const { companyName } = await params;
    const decodedCompanyName = decodeURIComponent(companyName);
    
    console.log(`📰 [NEWS API] Fetching news for company: ${decodedCompanyName}`);

    // Try to fetch real news from external APIs
    const newsArticles = await fetchRealNews(decodedCompanyName);

    return NextResponse.json({
      success: true,
      articles: newsArticles,
      companyName: decodedCompanyName,
      totalResults: newsArticles.length,
      dataSource: 'external_api'
    });

  } catch (error) {
    console.error('❌ [NEWS API] Error fetching company news:', error);
    
    // Return empty articles array when external APIs fail
    return NextResponse.json({
      success: true,
      articles: [],
      companyName: decodedCompanyName,
      totalResults: 0,
      dataSource: 'no_news_available'
    });
  }
}

// Helper function to check if an article is relevant to the company
function isArticleRelevant(article: any, companyName: string): boolean {
  if (!article || !companyName) return false;
  
  // Normalize company name - remove common legal suffixes and extra words
  const normalizedCompanyName = companyName
    .toLowerCase()
    .replace(/\b(inc|llc|ltd|corp|corporation|company|co|llp|lp|partners|group|associates|services|solutions|technologies|tech|systems|enterprises|ventures|holdings|international|global|worldwide)\b\.?/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Get searchable text from article
  const title = (article.title || '').toLowerCase();
  const description = (article.description || '').toLowerCase();
  const content = (article.content || '').toLowerCase();
  const searchText = `${title} ${description} ${content}`;
  
  // Check if company name appears in the text
  if (searchText.includes(normalizedCompanyName)) {
    return true;
  }
  
  // Check for partial matches - require at least 2 significant words from company name
  const companyWords = normalizedCompanyName.split(' ').filter(word => word.length > 2);
  if (companyWords.length >= 2) {
    const matchingWords = companyWords.filter(word => searchText.includes(word));
    // Require at least 2/3 of significant words to match
    return matchingWords.length >= Math.ceil(companyWords.length * 0.67);
  }
  
  // For single word company names, require exact match
  if (companyWords.length === 1) {
    return searchText.includes(companyWords[0]);
  }
  
  return false;
}

async function fetchRealNews(companyName: string): Promise<any[]> {
  const newsArticles: any[] = [];
  
  try {
    // Try NewsAPI first (requires API key)
    if (process.env.NEWS_API_KEY) {
      console.log(`📰 [NEWS API] Attempting to fetch from NewsAPI for: ${companyName}`);
      
      const newsApiUrl = `https://newsapi.org/v2/everything?q=${encodeURIComponent(companyName)}&apiKey=${process.env.NEWS_API_KEY}&language=en&sortBy=publishedAt&pageSize=5`;
      
      const response = await fetch(newsApiUrl, {
        headers: {
          'User-Agent': 'Adrata-News-Client/1.0'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.articles && data.articles.length > 0) {
          console.log(`✅ [NEWS API] Found ${data.articles.length} articles from NewsAPI`);
          
          // Transform NewsAPI format to our format
          const transformedArticles = data.articles.map((article: any) => ({
            title: article.title,
            description: article.description,
            source: article.source?.name || 'Unknown Source',
            publishedAt: article.publishedAt,
            url: article.url,
            content: article.content || article.description
          }));
          
          // Filter for relevance
          const relevantArticles = transformedArticles.filter((article: any) => 
            isArticleRelevant(article, companyName)
          );
          
          console.log(`🔍 [NEWS API] Relevance check: ${transformedArticles.length} total → ${relevantArticles.length} relevant`);
          
          // Log filtered out articles for debugging
          const filteredArticles = transformedArticles.filter((article: any) => 
            !isArticleRelevant(article, companyName)
          );
          if (filteredArticles.length > 0) {
            console.log(`❌ [NEWS API] Filtered out ${filteredArticles.length} irrelevant articles:`);
            filteredArticles.forEach((article, index) => {
              console.log(`  ${index + 1}. "${article.title}" (${article.source})`);
            });
          }
          
          if (relevantArticles.length > 0) {
            return relevantArticles;
          } else {
            console.log(`❌ [NEWS API] No relevant articles found for ${companyName}`);
          }
        }
      } else {
        console.warn(`⚠️ [NEWS API] NewsAPI returned status ${response.status}`);
      }
    }
    
    // Try Perplexity AI API (if available)
    if (process.env.PERPLEXITY_API_KEY) {
      console.log(`📰 [NEWS API] Attempting to fetch from Perplexity AI for: ${companyName}`);
      
      const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-small-128k-online',
          messages: [
            {
              role: 'user',
              content: `Find recent news articles about ${companyName}. Return 3-5 recent news articles in JSON format with title, description, source, publishedAt, url, and content fields.`
            }
          ],
          max_tokens: 2000
        })
      });
      
      if (perplexityResponse.ok) {
        const data = await perplexityResponse.json();
        const content = data.choices?.[0]?.message?.content;
        
        if (content) {
          try {
            // Try to parse JSON from the response
            const parsedNews = JSON.parse(content);
            if (Array.isArray(parsedNews) && parsedNews.length > 0) {
              console.log(`✅ [NEWS API] Found ${parsedNews.length} articles from Perplexity AI`);
              
              // Filter for relevance
              const relevantArticles = parsedNews.filter((article: any) => 
                isArticleRelevant(article, companyName)
              );
              
              console.log(`🔍 [PERPLEXITY] Relevance check: ${parsedNews.length} total → ${relevantArticles.length} relevant`);
              
              // Log filtered out articles for debugging
              const filteredArticles = parsedNews.filter((article: any) => 
                !isArticleRelevant(article, companyName)
              );
              if (filteredArticles.length > 0) {
                console.log(`❌ [PERPLEXITY] Filtered out ${filteredArticles.length} irrelevant articles:`);
                filteredArticles.forEach((article, index) => {
                  console.log(`  ${index + 1}. "${article.title}" (${article.source})`);
                });
              }
              
              if (relevantArticles.length > 0) {
                return relevantArticles;
              } else {
                console.log(`❌ [PERPLEXITY] No relevant articles found for ${companyName}`);
              }
            }
          } catch (parseError) {
            console.warn('⚠️ [NEWS API] Failed to parse Perplexity AI response as JSON');
          }
        }
      } else {
        console.warn(`⚠️ [NEWS API] Perplexity AI returned status ${perplexityResponse.status}`);
      }
    }
    
    // If no external APIs are configured or available, return empty array
    if (!process.env.NEWS_API_KEY && !process.env.PERPLEXITY_API_KEY) {
      console.log('❌ [NEWS API] No external news APIs configured');
      return [];
    }
    
    console.log('❌ [NEWS API] All external news APIs failed or returned no relevant articles');
    return [];
    
  } catch (error) {
    console.error('❌ [NEWS API] Error fetching real news:', error);
    throw error;
  }
}

