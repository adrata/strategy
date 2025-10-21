import { NextRequest, NextResponse } from 'next/server';

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
          return data.articles.map((article: any) => ({
            title: article.title,
            description: article.description,
            source: article.source?.name || 'Unknown Source',
            publishedAt: article.publishedAt,
            url: article.url,
            content: article.content || article.description
          }));
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
              return parsedNews;
            }
          } catch (parseError) {
            console.warn('⚠️ [NEWS API] Failed to parse Perplexity AI response as JSON');
          }
        }
      } else {
        console.warn(`⚠️ [NEWS API] Perplexity AI returned status ${perplexityResponse.status}`);
      }
    }
    
    // If no external APIs are configured or available, throw error to trigger fallback
    if (!process.env.NEWS_API_KEY && !process.env.PERPLEXITY_API_KEY) {
      throw new Error('No external news APIs configured');
    }
    
    throw new Error('All external news APIs failed');
    
  } catch (error) {
    console.error('❌ [NEWS API] Error fetching real news:', error);
    throw error;
  }
}

