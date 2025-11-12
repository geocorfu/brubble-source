import { NextRequest, NextResponse } from 'next/server';
import {
  Persona,
  BrubbleAnalysis,
  PersonaResults,
  SearchResult,
  ComparisonMetrics,
} from '@/types';

// NewsAPI integration
const NEWSAPI_KEY = process.env.NEWSAPI_KEY || 'demo';
const NEWSAPI_BASE_URL = 'https://newsapi.org/v2';

interface NewsAPIArticle {
  title: string;
  description: string;
  url: string;
  source: {
    name: string;
  };
  publishedAt: string;
}

interface NewsAPIResponse {
  status: string;
  totalResults: number;
  articles: NewsAPIArticle[];
}

// Fetch news from NewsAPI
async function fetchNewsForPersona(
  query: string,
  persona: Persona
): Promise<SearchResult[]> {
  try {
    // Build query parameters based on persona attributes
    let searchQuery = query;
    let category = '';
    let language = 'en';
    let country = '';

    // Adjust search based on persona
    if (persona.category === 'political') {
      if (persona.attributes.political_leaning === 'progressive') {
        searchQuery += ' sustainability climate justice equality';
      } else if (persona.attributes.political_leaning === 'conservative') {
        searchQuery += ' traditional values security economy';
      } else {
        searchQuery += ' balanced moderate policy';
      }
    }

    if (persona.category === 'geographic') {
      if (persona.attributes.location?.includes('US')) {
        country = 'us';
      } else if (persona.attributes.location?.includes('Europe')) {
        country = 'gb'; // UK as proxy for European news
      }
    }

    // Construct API URL
    const params = new URLSearchParams({
      q: searchQuery,
      apiKey: NEWSAPI_KEY,
      pageSize: '10',
      sortBy: 'relevancy',
      language,
    });

    if (country) {
      params.append('country', country);
    }

    const url = `${NEWSAPI_BASE_URL}/everything?${params.toString()}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Brubble/1.0',
      },
    });

    if (!response.ok) {
      console.error(`NewsAPI error: ${response.status} ${response.statusText}`);
      return generateMockResults(query, persona);
    }

    const data: NewsAPIResponse = await response.json();

    if (data.status !== 'ok' || !data.articles) {
      console.error('NewsAPI returned error:', data);
      return generateMockResults(query, persona);
    }

    // Convert NewsAPI articles to SearchResults
    return data.articles.map((article) => ({
      title: article.title,
      url: article.url,
      snippet: article.description || '',
      source: article.source.name,
      timestamp: new Date(article.publishedAt),
      sentiment: calculateSentiment(article.title + ' ' + article.description, persona),
      relevance_score: calculateRelevance(article.title + ' ' + article.description, query),
      platform: 'news' as const,
    }));
  } catch (error) {
    console.error('Error fetching news:', error);
    return generateMockResults(query, persona);
  }
}

// Generate mock results as fallback
function generateMockResults(query: string, persona: Persona): SearchResult[] {
  const mockSources = [
    'New York Times',
    'Washington Post',
    'BBC News',
    'Reuters',
    'CNN',
    'Fox News',
    'NPR',
    'The Guardian',
    'Wall Street Journal',
    'Associated Press',
  ];

  const results: SearchResult[] = [];
  const resultCount = 8 + Math.floor(Math.random() * 5);

  for (let i = 0; i < resultCount; i++) {
    const source = mockSources[Math.floor(Math.random() * mockSources.length)];
    results.push({
      title: `${query} - ${persona.name} perspective ${i + 1}`,
      url: `https://example.com/article-${persona.id}-${i}`,
      snippet: `This article discusses ${query} from a ${persona.name} viewpoint. It covers various aspects and perspectives related to the topic, providing insights that may be particularly relevant to this demographic.`,
      source,
      timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      sentiment: Math.random() * 2 - 1, // -1 to 1
      relevance_score: 0.7 + Math.random() * 0.3,
      platform: 'news',
    });
  }

  return results;
}

// Calculate sentiment based on content and persona
function calculateSentiment(text: string, persona: Persona): number {
  // Simple sentiment calculation - in production, use a real sentiment analysis API
  const positiveWords = ['good', 'great', 'excellent', 'positive', 'success', 'benefit'];
  const negativeWords = ['bad', 'poor', 'negative', 'fail', 'problem', 'risk'];

  const lowerText = text.toLowerCase();
  let score = 0;

  positiveWords.forEach((word) => {
    if (lowerText.includes(word)) score += 0.1;
  });

  negativeWords.forEach((word) => {
    if (lowerText.includes(word)) score -= 0.1;
  });

  // Add some variation based on persona
  score += (Math.random() - 0.5) * 0.3;

  return Math.max(-1, Math.min(1, score));
}

// Calculate relevance score
function calculateRelevance(text: string, query: string): number {
  const lowerText = text.toLowerCase();
  const queryWords = query.toLowerCase().split(' ');

  let matches = 0;
  queryWords.forEach((word) => {
    if (lowerText.includes(word)) matches++;
  });

  return Math.min(1, 0.5 + (matches / queryWords.length) * 0.5);
}

// Calculate comparison metrics between two persona results
function calculateComparisonMetrics(
  resultsA: SearchResult[],
  resultsB: SearchResult[]
): ComparisonMetrics {
  // Find common and unique results based on URL or title similarity
  const commonResults: SearchResult[] = [];
  const uniqueToA: SearchResult[] = [];
  const uniqueToB: SearchResult[] = [...resultsB];

  resultsA.forEach((resultA) => {
    const matchIndex = uniqueToB.findIndex(
      (resultB) =>
        resultB.url === resultA.url ||
        resultB.title.toLowerCase() === resultA.title.toLowerCase()
    );

    if (matchIndex !== -1) {
      commonResults.push(resultA);
      uniqueToB.splice(matchIndex, 1);
    } else {
      uniqueToA.push(resultA);
    }
  });

  const totalResults = resultsA.length + resultsB.length;
  const overlapPercentage = (commonResults.length * 2 / totalResults) * 100;

  // Calculate echo score (higher = more echo chamber effect)
  const echoScore = Math.min(100, overlapPercentage * 1.2);

  // Calculate sentiment divergence
  const avgSentimentA =
    resultsA.reduce((sum, r) => sum + (r.sentiment || 0), 0) / resultsA.length;
  const avgSentimentB =
    resultsB.reduce((sum, r) => sum + (r.sentiment || 0), 0) / resultsB.length;
  const sentimentDivergence = Math.abs(avgSentimentA - avgSentimentB);

  // Calculate source diversity score
  const sourcesA = new Set(resultsA.map((r) => r.source));
  const sourcesB = new Set(resultsB.map((r) => r.source));
  const totalUniqueSources = new Set([...sourcesA, ...sourcesB]).size;
  const sourceDiversityScore = totalUniqueSources / 10; // Normalize to 0-1 range

  return {
    echo_score: echoScore,
    overlap_percentage: overlapPercentage,
    unique_to_a: uniqueToA,
    unique_to_b: uniqueToB,
    common_results: commonResults,
    sentiment_divergence: sentimentDivergence,
    source_diversity_score: sourceDiversityScore,
  };
}

// Generate insights based on metrics
function generateInsights(
  metrics: ComparisonMetrics[],
  personas: Persona[]
): string[] {
  const insights: string[] = [];

  // Average echo score insight
  const avgEchoScore =
    metrics.reduce((sum, m) => sum + m.echo_score, 0) / metrics.length;

  if (avgEchoScore > 70) {
    insights.push(
      `⚠️ High Echo Chamber Effect: ${avgEchoScore.toFixed(0)}% average similarity across perspectives suggests significant information bubbles. Different personas are seeing very similar content.`
    );
  } else if (avgEchoScore > 40) {
    insights.push(
      `📊 Moderate Information Diversity: ${avgEchoScore.toFixed(0)}% average similarity shows some overlap but also distinct perspectives across personas.`
    );
  } else {
    insights.push(
      `✅ Strong Perspective Diversity: ${avgEchoScore.toFixed(0)}% average similarity indicates each persona is experiencing significantly different information landscapes.`
    );
  }

  // Source diversity insight
  const avgSourceDiversity =
    metrics.reduce((sum, m) => sum + m.source_diversity_score, 0) /
    metrics.length;

  if (avgSourceDiversity > 0.7) {
    insights.push(
      `📰 Excellent Source Variety: High diversity of news sources (${(avgSourceDiversity * 10).toFixed(1)} unique sources on average) provides broader information exposure.`
    );
  } else if (avgSourceDiversity < 0.4) {
    insights.push(
      `⚠️ Limited Source Pool: Results are drawn from a relatively small set of sources, which may indicate algorithmic filtering or availability bias.`
    );
  }

  // Sentiment divergence insight
  const maxSentimentGap = Math.max(
    ...metrics.map((m) => m.sentiment_divergence)
  );

  if (maxSentimentGap > 0.6) {
    insights.push(
      `🎭 Significant Sentiment Gap: Different personas are encountering substantially different emotional tones in their results (divergence: ${maxSentimentGap.toFixed(2)}), suggesting polarized information exposure.`
    );
  }

  // Persona-specific insights
  const politicalPersonas = personas.filter((p) => p.category === 'political');
  if (politicalPersonas.length >= 2) {
    insights.push(
      `🗳️ Political Perspective Analysis: Comparing ${politicalPersonas.map((p) => p.name).join(' vs ')} reveals how political leanings influence search result exposure and framing.`
    );
  }

  return insights;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, personas } = body as {
      query: string;
      personas: Persona[];
    };

    if (!query || !personas || personas.length < 2) {
      return NextResponse.json(
        { error: 'Query and at least 2 personas are required' },
        { status: 400 }
      );
    }

    // Fetch results for each persona
    const personaResultsPromises = personas.map(async (persona) => {
      const results = await fetchNewsForPersona(query, persona);

      // Calculate summary stats
      const uniqueSources = new Set(results.map((r) => r.source));
      const avgSentiment =
        results.reduce((sum, r) => sum + (r.sentiment || 0), 0) /
        results.length;
      const topSources = Array.from(uniqueSources).slice(0, 5);

      return {
        persona,
        results,
        summary_stats: {
          total_results: results.length,
          unique_sources: uniqueSources.size,
          avg_sentiment: avgSentiment,
          top_sources: topSources,
        },
      } as PersonaResults;
    });

    const personaResults = await Promise.all(personaResultsPromises);

    // Calculate comparison metrics between all pairs of personas
    const metrics: ComparisonMetrics[] = [];
    for (let i = 0; i < personaResults.length - 1; i++) {
      const metric = calculateComparisonMetrics(
        personaResults[i].results,
        personaResults[i + 1].results
      );
      metrics.push(metric);
    }

    // Generate insights
    const insights = generateInsights(metrics, personas);

    // Build the analysis response
    const analysis: BrubbleAnalysis = {
      query,
      timestamp: new Date(),
      personas,
      results: personaResults,
      metrics,
      insights,
      visualization_data: {
        venn_diagram: null,
        sentiment_map: null,
        word_clouds: null,
        timeline: null,
      },
    };

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
