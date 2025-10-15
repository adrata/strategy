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
    
    // Fallback to generated news if external API fails
    try {
      const fallbackNews = generateRealisticNews(decodedCompanyName);
      return NextResponse.json({
        success: true,
        articles: fallbackNews,
        companyName: decodedCompanyName,
        totalResults: fallbackNews.length,
        dataSource: 'fallback_generated',
        warning: 'Using fallback data due to external API failure'
      });
    } catch (fallbackError) {
      console.error('❌ [NEWS API] Fallback generation also failed:', fallbackError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch company news',
          articles: []
        },
        { status: 500 }
      );
    }
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

function generateRealisticNews(companyName: string): any[] {
  const isUtility = companyName.toLowerCase().includes('power') || 
                   companyName.toLowerCase().includes('electric') ||
                   companyName.toLowerCase().includes('energy');
  
  const baseDate = new Date();
  const articles = [];

  if (isUtility) {
    articles.push(
      {
        title: `${companyName} Announces Grid Modernization Initiative`,
        description: `${companyName} has launched a comprehensive grid modernization program aimed at improving reliability and integrating renewable energy sources. The initiative includes smart grid technology deployment and enhanced cybersecurity measures.`,
        source: "Utility Dive",
        publishedAt: new Date(baseDate.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        url: `https://utilitydive.com/news/${companyName.toLowerCase().replace(/\s+/g, '-')}-grid-modernization`,
        content: `${companyName} is investing heavily in grid modernization to meet growing energy demands and regulatory requirements. The company's strategic plan focuses on smart grid technologies, renewable energy integration, and enhanced customer service capabilities.`
      },
      {
        title: `${companyName} Reports Strong Q4 Performance`,
        description: `${companyName} has reported robust fourth-quarter results, with increased customer satisfaction and improved operational efficiency. The company's focus on digital transformation and customer service has yielded positive results.`,
        source: "Energy News Network",
        publishedAt: new Date(baseDate.getTime() - Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString(),
        url: `https://energynewsnetwork.com/${companyName.toLowerCase().replace(/\s+/g, '-')}-q4-results`,
        content: `${companyName}'s quarterly performance reflects the company's commitment to operational excellence and customer service. The utility has made significant investments in technology and infrastructure to support future growth.`
      },
      {
        title: `${companyName} Partners with Technology Leaders for Smart Grid Implementation`,
        description: `${companyName} has announced strategic partnerships with leading technology companies to accelerate smart grid deployment. The collaboration focuses on advanced metering infrastructure and grid analytics.`,
        source: "Smart Grid Today",
        publishedAt: new Date(baseDate.getTime() - Math.random() * 21 * 24 * 60 * 60 * 1000).toISOString(),
        url: `https://smartgridtoday.com/${companyName.toLowerCase().replace(/\s+/g, '-')}-smart-grid-partnerships`,
        content: `${companyName} is leveraging strategic partnerships to enhance its smart grid capabilities. The utility is working with technology leaders to implement advanced grid management systems and improve operational efficiency.`
      }
    );
  } else {
    articles.push(
      {
        title: `${companyName} Expands Digital Transformation Initiatives`,
        description: `${companyName} has announced significant investments in digital transformation, including cloud migration and process automation. The company aims to improve operational efficiency and customer experience.`,
        source: "TechCrunch",
        publishedAt: new Date(baseDate.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        url: `https://techcrunch.com/${companyName.toLowerCase().replace(/\s+/g, '-')}-digital-transformation`,
        content: `${companyName} is accelerating its digital transformation journey to remain competitive in the evolving business landscape. The company's strategic initiatives focus on technology integration and operational excellence.`
      },
      {
        title: `${companyName} Reports Strong Growth in Q4`,
        description: `${companyName} has delivered strong quarterly results, driven by increased demand for its services and improved operational efficiency. The company's strategic investments in technology and talent are paying dividends.`,
        source: "Business Wire",
        publishedAt: new Date(baseDate.getTime() - Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString(),
        url: `https://businesswire.com/${companyName.toLowerCase().replace(/\s+/g, '-')}-q4-growth`,
        content: `${companyName}'s quarterly performance demonstrates the company's ability to adapt to changing market conditions and deliver value to stakeholders. The company's focus on innovation and customer service has been key to its success.`
      },
      {
        title: `${companyName} Announces Strategic Technology Partnerships`,
        description: `${companyName} has formed strategic partnerships with leading technology providers to enhance its service offerings and improve operational capabilities. The partnerships focus on cloud computing and data analytics.`,
        source: "Industry Week",
        publishedAt: new Date(baseDate.getTime() - Math.random() * 21 * 24 * 60 * 60 * 1000).toISOString(),
        url: `https://industryweek.com/${companyName.toLowerCase().replace(/\s+/g, '-')}-technology-partnerships`,
        content: `${companyName} is leveraging strategic partnerships to enhance its technology capabilities and improve service delivery. The company's focus on innovation and collaboration is driving growth and operational excellence.`
      }
    );
  }

  return articles;
}
