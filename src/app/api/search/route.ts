import { NextRequest, NextResponse } from 'next/server';
import Parser from 'rss-parser';
import {
  Persona,
  BrubbleAnalysis,
  PersonaResults,
  SearchResult,
  ComparisonMetrics,
} from '@/types';

// The Guardian API integration (generous free tier: 500 req/day)
const GUARDIAN_API_KEY = process.env.GUARDIAN_API_KEY || '';
const GUARDIAN_BASE_URL = 'https://content.guardianapis.com/search';

// YouTube Data API integration
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || '';
const YOUTUBE_BASE_URL = 'https://www.googleapis.com/youtube/v3';

// Reddit API integration
const REDDIT_CLIENT_ID = process.env.REDDIT_CLIENT_ID || '';
const REDDIT_CLIENT_SECRET = process.env.REDDIT_CLIENT_SECRET || '';
const REDDIT_BASE_URL = 'https://www.reddit.com';

// Twitter/X API v2 integration
const TWITTER_BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN || '';
const TWITTER_BASE_URL = 'https://api.twitter.com/2';

// Google Custom Search API integration
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || '';
const GOOGLE_SEARCH_ENGINE_ID = process.env.GOOGLE_SEARCH_ENGINE_ID || '';
const GOOGLE_BASE_URL = 'https://www.googleapis.com/customsearch/v1';

// RSS Feed sources organized by political leaning
const RSS_FEEDS = {
  progressive: [
    'https://www.theguardian.com/us-news/rss',
    'https://www.npr.org/rss/rss.php?id=1001',
    'https://www.democracynow.org/democracynow.rss',
  ],
  conservative: [
    'https://www.foxnews.com/rss',
    'https://www.wsj.com/xml/rss/3_7085.xml',
    'https://nypost.com/feed/',
  ],
  centrist: [
    'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml',
    'https://feeds.bbci.co.uk/news/rss.xml',
    'https://www.reuters.com/rssFeed/topNews',
  ],
  general: [
    'https://news.google.com/rss',
    'https://www.theguardian.com/world/rss',
    'https://feeds.bbci.co.uk/news/world/rss.xml',
  ],
};

// Initialize RSS parser
const rssParser = new Parser({
  timeout: 5000,
  headers: {
    'User-Agent': 'Brubble/1.0',
  },
});

interface GuardianArticle {
  id: string;
  webTitle: string;
  webUrl: string;
  webPublicationDate: string;
  sectionName: string;
  fields?: {
    bodyText?: string;
    trailText?: string;
  };
}

interface GuardianResponse {
  response: {
    status: string;
    results: GuardianArticle[];
  };
}

interface YouTubeVideo {
  id: {
    videoId: string;
  };
  snippet: {
    title: string;
    description: string;
    channelTitle: string;
    publishedAt: string;
  };
}

interface YouTubeSearchResponse {
  items: YouTubeVideo[];
}

interface RedditPost {
  data: {
    title: string;
    selftext: string;
    url: string;
    permalink: string;
    subreddit: string;
    author: string;
    created_utc: number;
    score: number;
    num_comments: number;
  };
}

interface RedditSearchResponse {
  data: {
    children: RedditPost[];
  };
}

interface TwitterTweet {
  id: string;
  text: string;
  author_id: string;
  created_at: string;
  public_metrics?: {
    retweet_count: number;
    reply_count: number;
    like_count: number;
  };
}

interface TwitterUser {
  id: string;
  username: string;
  name: string;
}

interface TwitterSearchResponse {
  data?: TwitterTweet[];
  includes?: {
    users?: TwitterUser[];
  };
  meta?: {
    result_count: number;
  };
}

interface GoogleSearchItem {
  title: string;
  link: string;
  snippet: string;
  displayLink: string;
}

interface GoogleSearchResponse {
  items?: GoogleSearchItem[];
  searchInformation?: {
    totalResults: string;
  };
}

// Fetch news from RSS feeds based on persona
async function fetchRSSNews(
  query: string,
  persona: Persona
): Promise<SearchResult[]> {
  const results: SearchResult[] = [];

  // Select feeds based on political leaning
  let feedUrls: string[] = RSS_FEEDS.general;

  if (persona.category === 'political') {
    const leaning = persona.attributes.political_leaning;
    if (leaning === 'progressive') {
      feedUrls = RSS_FEEDS.progressive;
    } else if (leaning === 'conservative') {
      feedUrls = RSS_FEEDS.conservative;
    } else {
      feedUrls = RSS_FEEDS.centrist;
    }
  }

  // Fetch from selected feeds
  const feedPromises = feedUrls.map(async (feedUrl) => {
    try {
      const feed = await rssParser.parseURL(feedUrl);
      const queryLower = query.toLowerCase();

      // Filter items that match the query
      const matchingItems = feed.items
        .filter((item) => {
          const title = item.title?.toLowerCase() || '';
          const content = item.contentSnippet?.toLowerCase() || '';
          return title.includes(queryLower) || content.includes(queryLower);
        })
        .slice(0, 5); // Limit to 5 items per feed

      return matchingItems.map((item) => ({
        title: item.title || 'Untitled',
        url: item.link || '',
        snippet: item.contentSnippet || item.content?.substring(0, 300) || '',
        source: feed.title || 'RSS Feed',
        timestamp: item.pubDate ? new Date(item.pubDate) : new Date(),
        sentiment: calculateSentiment(item.title + ' ' + item.contentSnippet, persona),
        relevance_score: calculateRelevance(item.title + ' ' + item.contentSnippet, query),
        platform: 'news' as const,
      }));
    } catch (error) {
      console.error(`Error fetching RSS feed ${feedUrl}:`, error);
      return [];
    }
  });

  const feedResults = await Promise.all(feedPromises);
  return feedResults.flat();
}

// Fetch news from The Guardian API
async function fetchGuardianNews(
  query: string,
  persona: Persona
): Promise<SearchResult[]> {
  if (!GUARDIAN_API_KEY) {
    console.log('Guardian API key not configured, skipping Guardian results');
    return [];
  }

  try {
    const params = new URLSearchParams({
      q: query,
      'api-key': GUARDIAN_API_KEY,
      'page-size': '10',
      'show-fields': 'trailText,bodyText',
      'order-by': 'relevance',
    });

    const url = `${GUARDIAN_BASE_URL}?${params.toString()}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Brubble/1.0',
      },
    });

    if (!response.ok) {
      console.error(`Guardian API error: ${response.status} ${response.statusText}`);
      return [];
    }

    const data: GuardianResponse = await response.json();

    if (data.response.status !== 'ok' || !data.response.results) {
      console.error('Guardian API returned error:', data);
      return [];
    }

    return data.response.results.map((article) => ({
      title: article.webTitle,
      url: article.webUrl,
      snippet: article.fields?.trailText || article.fields?.bodyText?.substring(0, 300) || '',
      source: 'The Guardian',
      timestamp: new Date(article.webPublicationDate),
      sentiment: calculateSentiment(article.webTitle + ' ' + article.fields?.trailText, persona),
      relevance_score: calculateRelevance(article.webTitle + ' ' + article.fields?.trailText, query),
      platform: 'news' as const,
    }));
  } catch (error) {
    console.error('Error fetching Guardian news:', error);
    return [];
  }
}

// Fetch from Google News RSS (query-specific)
async function fetchGoogleNewsRSS(
  query: string,
  persona: Persona
): Promise<SearchResult[]> {
  try {
    const encodedQuery = encodeURIComponent(query);
    const feedUrl = `https://news.google.com/rss/search?q=${encodedQuery}&hl=en-US&gl=US&ceid=US:en`;

    const feed = await rssParser.parseURL(feedUrl);

    return feed.items.slice(0, 10).map((item) => ({
      title: item.title || 'Untitled',
      url: item.link || '',
      snippet: item.contentSnippet || item.content?.substring(0, 300) || '',
      source: 'Google News',
      timestamp: item.pubDate ? new Date(item.pubDate) : new Date(),
      sentiment: calculateSentiment(item.title + ' ' + item.contentSnippet, persona),
      relevance_score: calculateRelevance(item.title + ' ' + item.contentSnippet, query),
      platform: 'news' as const,
    }));
  } catch (error) {
    console.error('Error fetching Google News RSS:', error);
    return [];
  }
}

// Hybrid news fetching strategy combining all sources
async function fetchNewsForPersona(
  query: string,
  persona: Persona
): Promise<SearchResult[]> {
  try {
    // Fetch from all news sources in parallel
    const [rssResults, guardianResults, googleNewsResults] = await Promise.all([
      fetchRSSNews(query, persona),
      fetchGuardianNews(query, persona),
      fetchGoogleNewsRSS(query, persona),
    ]);

    // Combine all results
    const allResults = [...rssResults, ...guardianResults, ...googleNewsResults];

    // If no results found, return mock data
    if (allResults.length === 0) {
      console.log('No news results found from any source');
      return generateMockResults(query, persona);
    }

    // Remove duplicates based on URL
    const uniqueResults = allResults.filter((result, index, self) =>
      index === self.findIndex((r) => r.url === result.url)
    );

    // Sort by relevance score
    return uniqueResults.sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0));
  } catch (error) {
    console.error('Error fetching news:', error);
    return generateMockResults(query, persona);
  }
}

// Fetch YouTube videos based on persona
async function fetchYouTubeForPersona(
  query: string,
  persona: Persona
): Promise<SearchResult[]> {
  if (!YOUTUBE_API_KEY) {
    console.log('YouTube API key not configured, skipping YouTube results');
    return [];
  }

  try {
    // Build query parameters based on persona attributes
    let searchQuery = query;

    // Adjust search based on persona
    if (persona.category === 'political') {
      if (persona.attributes.political_leaning === 'progressive') {
        searchQuery += ' progressive perspective climate';
      } else if (persona.attributes.political_leaning === 'conservative') {
        searchQuery += ' conservative perspective traditional';
      } else {
        searchQuery += ' balanced analysis';
      }
    }

    if (persona.category === 'generational') {
      const age = persona.attributes.age;
      if (age === '18-25') {
        searchQuery += ' trending viral';
      } else if (age === '26-40') {
        searchQuery += ' explained analysis';
      } else {
        searchQuery += ' documentary history';
      }
    }

    // Construct API URL
    const params = new URLSearchParams({
      part: 'snippet',
      q: searchQuery,
      key: YOUTUBE_API_KEY,
      maxResults: '10',
      type: 'video',
      order: 'relevance',
    });

    const url = `${YOUTUBE_BASE_URL}/search?${params.toString()}`;

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`YouTube API error: ${response.status} ${response.statusText}`);
      return [];
    }

    const data: YouTubeSearchResponse = await response.json();

    if (!data.items || data.items.length === 0) {
      console.log('No YouTube results found');
      return [];
    }

    // Convert YouTube videos to SearchResults
    return data.items
      .filter((video) => video.id.videoId) // Filter out any items without videoId
      .map((video) => ({
        title: video.snippet.title,
        url: `https://www.youtube.com/watch?v=${video.id.videoId}`,
        snippet: video.snippet.description || '',
        source: video.snippet.channelTitle,
        timestamp: new Date(video.snippet.publishedAt),
        sentiment: calculateSentiment(video.snippet.title + ' ' + video.snippet.description, persona),
        relevance_score: calculateRelevance(video.snippet.title + ' ' + video.snippet.description, query),
        platform: 'youtube' as const,
      }));
  } catch (error) {
    console.error('Error fetching YouTube videos:', error);
    return [];
  }
}

// Fetch Reddit posts based on persona
async function fetchRedditForPersona(
  query: string,
  persona: Persona
): Promise<SearchResult[]> {
  try {
    // Build query parameters based on persona attributes
    let searchQuery = query;
    let sort = 'relevance';
    let time = 'all';

    // Adjust search based on persona
    if (persona.category === 'political') {
      if (persona.attributes.political_leaning === 'progressive') {
        searchQuery += ' subreddit:politics OR subreddit:progressive';
      } else if (persona.attributes.political_leaning === 'conservative') {
        searchQuery += ' subreddit:conservative OR subreddit:republican';
      } else {
        searchQuery += ' subreddit:neutralpolitics OR subreddit:moderatepolitics';
      }
    }

    if (persona.category === 'generational') {
      const age = persona.attributes.age;
      if (age === '18-25') {
        searchQuery += ' subreddit:genz';
        sort = 'hot';
      } else if (age === '26-40') {
        searchQuery += ' subreddit:millennials';
      } else {
        searchQuery += ' subreddit:genx';
      }
    }

    // Construct API URL - Reddit's JSON API doesn't require authentication for basic searches
    const params = new URLSearchParams({
      q: searchQuery,
      limit: '10',
      sort,
      t: time,
      type: 'link,self',
    });

    const url = `${REDDIT_BASE_URL}/search.json?${params.toString()}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Brubble/1.0',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`Reddit API error: ${response.status} ${response.statusText}`);
      return [];
    }

    const data: RedditSearchResponse = await response.json();

    if (!data.data || !data.data.children || data.data.children.length === 0) {
      console.log('No Reddit results found');
      return [];
    }

    // Convert Reddit posts to SearchResults
    return data.data.children.map((post) => ({
      title: post.data.title,
      url: post.data.url.startsWith('http')
        ? post.data.url
        : `${REDDIT_BASE_URL}${post.data.permalink}`,
      snippet: post.data.selftext ? post.data.selftext.substring(0, 300) : `Posted in r/${post.data.subreddit} by u/${post.data.author}. ${post.data.score} upvotes, ${post.data.num_comments} comments.`,
      source: `r/${post.data.subreddit}`,
      timestamp: new Date(post.data.created_utc * 1000),
      sentiment: calculateSentiment(post.data.title + ' ' + post.data.selftext, persona),
      relevance_score: calculateRelevance(post.data.title + ' ' + post.data.selftext, query),
      platform: 'reddit' as const,
    }));
  } catch (error) {
    console.error('Error fetching Reddit posts:', error);
    return [];
  }
}

// Fetch Twitter/X posts based on persona
async function fetchTwitterForPersona(
  query: string,
  persona: Persona
): Promise<SearchResult[]> {
  if (!TWITTER_BEARER_TOKEN) {
    console.log('Twitter API bearer token not configured, skipping Twitter results');
    return [];
  }

  try {
    // Build query parameters based on persona attributes
    let searchQuery = query;

    // Adjust search based on persona
    if (persona.category === 'political') {
      if (persona.attributes.political_leaning === 'progressive') {
        searchQuery += ' (climate OR equality OR justice) -is:retweet';
      } else if (persona.attributes.political_leaning === 'conservative') {
        searchQuery += ' (traditional OR security OR freedom) -is:retweet';
      } else {
        searchQuery += ' (policy OR analysis) -is:retweet';
      }
    } else {
      searchQuery += ' -is:retweet'; // Exclude retweets for cleaner results
    }

    if (persona.category === 'generational') {
      const age = persona.attributes.age;
      if (age === '18-25') {
        searchQuery += ' lang:en'; // Focus on trending topics
      }
    }

    // Construct API URL
    const params = new URLSearchParams({
      query: searchQuery,
      max_results: '10',
      'tweet.fields': 'created_at,public_metrics,author_id',
      'user.fields': 'username,name',
      expansions: 'author_id',
    });

    const url = `${TWITTER_BASE_URL}/tweets/search/recent?${params.toString()}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${TWITTER_BEARER_TOKEN}`,
        'User-Agent': 'Brubble/1.0',
      },
    });

    if (!response.ok) {
      console.error(`Twitter API error: ${response.status} ${response.statusText}`);
      return [];
    }

    const data: TwitterSearchResponse = await response.json();

    if (!data.data || data.data.length === 0) {
      console.log('No Twitter results found');
      return [];
    }

    // Create a map of author IDs to usernames
    const userMap = new Map<string, TwitterUser>();
    if (data.includes?.users) {
      data.includes.users.forEach((user) => {
        userMap.set(user.id, user);
      });
    }

    // Convert Twitter tweets to SearchResults
    return data.data.map((tweet) => {
      const author = userMap.get(tweet.author_id);
      const username = author ? `@${author.username}` : 'Twitter User';
      const metrics = tweet.public_metrics;
      const engagement = metrics
        ? `${metrics.like_count} likes, ${metrics.retweet_count} retweets`
        : '';

      return {
        title: tweet.text.substring(0, 100) + (tweet.text.length > 100 ? '...' : ''),
        url: `https://twitter.com/i/web/status/${tweet.id}`,
        snippet: tweet.text + (engagement ? ` | ${engagement}` : ''),
        source: username,
        timestamp: new Date(tweet.created_at),
        sentiment: calculateSentiment(tweet.text, persona),
        relevance_score: calculateRelevance(tweet.text, query),
        platform: 'twitter' as const,
      };
    });
  } catch (error) {
    console.error('Error fetching Twitter posts:', error);
    return [];
  }
}

// Fetch Google Custom Search results based on persona
async function fetchGoogleForPersona(
  query: string,
  persona: Persona
): Promise<SearchResult[]> {
  if (!GOOGLE_API_KEY || !GOOGLE_SEARCH_ENGINE_ID) {
    console.log('Google Custom Search API not fully configured, skipping Google results');
    return [];
  }

  try {
    // Build query parameters based on persona attributes
    let searchQuery = query;

    // Adjust search based on persona
    if (persona.category === 'political') {
      if (persona.attributes.political_leaning === 'progressive') {
        searchQuery += ' progressive left-wing liberal';
      } else if (persona.attributes.political_leaning === 'conservative') {
        searchQuery += ' conservative right-wing traditional';
      } else {
        searchQuery += ' centrist moderate balanced';
      }
    }

    if (persona.category === 'geographic') {
      const location = persona.attributes.location;
      if (location?.includes('US')) {
        searchQuery += ' site:.us OR site:america';
      } else if (location?.includes('Europe')) {
        searchQuery += ' site:.eu OR site:europe';
      }
    }

    // Construct API URL
    const params = new URLSearchParams({
      key: GOOGLE_API_KEY,
      cx: GOOGLE_SEARCH_ENGINE_ID,
      q: searchQuery,
      num: '10',
    });

    const url = `${GOOGLE_BASE_URL}?${params.toString()}`;

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`Google Custom Search API error: ${response.status} ${response.statusText}`);
      return [];
    }

    const data: GoogleSearchResponse = await response.json();

    if (!data.items || data.items.length === 0) {
      console.log('No Google search results found');
      return [];
    }

    // Convert Google search results to SearchResults
    return data.items.map((item) => ({
      title: item.title,
      url: item.link,
      snippet: item.snippet,
      source: item.displayLink,
      timestamp: new Date(), // Google Custom Search doesn't provide publish date
      sentiment: calculateSentiment(item.title + ' ' + item.snippet, persona),
      relevance_score: calculateRelevance(item.title + ' ' + item.snippet, query),
      platform: 'google' as const,
    }));
  } catch (error) {
    console.error('Error fetching Google search results:', error);
    return [];
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

// Generate Venn diagram data showing overlaps between persona results
function generateVennDiagramData(personaResults: PersonaResults[]): any {
  if (personaResults.length < 2) return null;

  const sets: any[] = [];
  const overlaps: any[] = [];

  // Create sets for each persona
  personaResults.forEach((pr, index) => {
    sets.push({
      id: pr.persona.id,
      label: pr.persona.name,
      size: pr.results.length,
      color: pr.persona.color,
    });
  });

  // Calculate overlaps between all pairs
  for (let i = 0; i < personaResults.length; i++) {
    for (let j = i + 1; j < personaResults.length; j++) {
      const resultsA = personaResults[i].results;
      const resultsB = personaResults[j].results;

      // Find common URLs
      const commonUrls = resultsA.filter((rA) =>
        resultsB.some((rB) => rB.url === rA.url || rB.title === rA.title)
      );

      overlaps.push({
        sets: [personaResults[i].persona.id, personaResults[j].persona.id],
        size: commonUrls.length,
        items: commonUrls.map((r) => ({ title: r.title, url: r.url })),
      });
    }
  }

  // Calculate three-way overlaps if there are 3+ personas
  if (personaResults.length >= 3) {
    for (let i = 0; i < personaResults.length; i++) {
      for (let j = i + 1; j < personaResults.length; j++) {
        for (let k = j + 1; k < personaResults.length; k++) {
          const resultsA = personaResults[i].results;
          const resultsB = personaResults[j].results;
          const resultsC = personaResults[k].results;

          const commonUrls = resultsA.filter(
            (rA) =>
              resultsB.some((rB) => rB.url === rA.url) &&
              resultsC.some((rC) => rC.url === rA.url)
          );

          if (commonUrls.length > 0) {
            overlaps.push({
              sets: [
                personaResults[i].persona.id,
                personaResults[j].persona.id,
                personaResults[k].persona.id,
              ],
              size: commonUrls.length,
              items: commonUrls.map((r) => ({ title: r.title, url: r.url })),
            });
          }
        }
      }
    }
  }

  return { sets, overlaps };
}

// Generate sentiment map data for visualization
function generateSentimentMapData(personaResults: PersonaResults[]): any {
  const sentimentData = personaResults.map((pr) => {
    // Group results by sentiment ranges
    const positive = pr.results.filter((r) => (r.sentiment || 0) > 0.3).length;
    const neutral = pr.results.filter(
      (r) => (r.sentiment || 0) >= -0.3 && (r.sentiment || 0) <= 0.3
    ).length;
    const negative = pr.results.filter((r) => (r.sentiment || 0) < -0.3).length;

    // Calculate sentiment distribution by platform
    const platformSentiment: Record<string, { positive: number; neutral: number; negative: number }> = {};
    pr.results.forEach((result) => {
      if (!platformSentiment[result.platform]) {
        platformSentiment[result.platform] = { positive: 0, neutral: 0, negative: 0 };
      }
      const sentiment = result.sentiment || 0;
      if (sentiment > 0.3) platformSentiment[result.platform].positive++;
      else if (sentiment < -0.3) platformSentiment[result.platform].negative++;
      else platformSentiment[result.platform].neutral++;
    });

    return {
      persona: {
        id: pr.persona.id,
        name: pr.persona.name,
        color: pr.persona.color,
      },
      avgSentiment: pr.summary_stats.avg_sentiment,
      distribution: {
        positive,
        neutral,
        negative,
      },
      platformSentiment,
      sentimentRange: {
        min: Math.min(...pr.results.map((r) => r.sentiment || 0)),
        max: Math.max(...pr.results.map((r) => r.sentiment || 0)),
      },
    };
  });

  return { personas: sentimentData };
}

// Generate word cloud data from result titles and snippets
function generateWordCloudData(personaResults: PersonaResults[]): any {
  // Common stop words to exclude
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
    'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'i',
    'you', 'he', 'she', 'it', 'we', 'they', 'what', 'which', 'who', 'when',
    'where', 'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more',
    'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own',
    'same', 'so', 'than', 'too', 'very', 'just', 'about', 's', 't',
  ]);

  const wordClouds = personaResults.map((pr) => {
    // Combine all text from titles and snippets
    const allText = pr.results
      .map((r) => `${r.title} ${r.snippet}`)
      .join(' ')
      .toLowerCase()
      .replace(/[^\w\s]/g, ' '); // Remove punctuation

    // Count word frequencies
    const wordCount: Record<string, number> = {};
    allText.split(/\s+/).forEach((word) => {
      if (word.length > 3 && !stopWords.has(word)) {
        wordCount[word] = (wordCount[word] || 0) + 1;
      }
    });

    // Convert to array and sort by frequency
    const words = Object.entries(wordCount)
      .map(([text, value]) => ({ text, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 50); // Top 50 words

    return {
      persona: {
        id: pr.persona.id,
        name: pr.persona.name,
        color: pr.persona.color,
      },
      words,
    };
  });

  return { clouds: wordClouds };
}

// Generate timeline data showing when results were published
function generateTimelineData(personaResults: PersonaResults[]): any {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const timelineData = personaResults.map((pr) => {
    // Group results by time periods
    const lastDay = pr.results.filter((r) => r.timestamp && r.timestamp >= oneDayAgo).length;
    const lastWeek = pr.results.filter(
      (r) => r.timestamp && r.timestamp >= oneWeekAgo && r.timestamp < oneDayAgo
    ).length;
    const lastMonth = pr.results.filter(
      (r) => r.timestamp && r.timestamp >= oneMonthAgo && r.timestamp < oneWeekAgo
    ).length;
    const older = pr.results.filter((r) => r.timestamp && r.timestamp < oneMonthAgo).length;

    // Group by hour for recent results (last 24 hours)
    const hourlyData: Record<string, number> = {};
    pr.results
      .filter((r) => r.timestamp && r.timestamp >= oneDayAgo)
      .forEach((result) => {
        if (result.timestamp) {
          const hour = result.timestamp.getHours();
          const key = `${hour}:00`;
          hourlyData[key] = (hourlyData[key] || 0) + 1;
        }
      });

    // Create sorted hourly distribution
    const hourlyDistribution = Object.entries(hourlyData)
      .map(([hour, count]) => ({ hour, count }))
      .sort((a, b) => parseInt(a.hour) - parseInt(b.hour));

    return {
      persona: {
        id: pr.persona.id,
        name: pr.persona.name,
        color: pr.persona.color,
      },
      periods: {
        lastDay,
        lastWeek,
        lastMonth,
        older,
      },
      hourlyDistribution,
      oldestResult: pr.results.reduce((oldest, r) => {
        if (!r.timestamp) return oldest;
        if (!oldest || r.timestamp < oldest) return r.timestamp;
        return oldest;
      }, null as Date | null),
      newestResult: pr.results.reduce((newest, r) => {
        if (!r.timestamp) return newest;
        if (!newest || r.timestamp > newest) return r.timestamp;
        return newest;
      }, null as Date | null),
    };
  });

  return { timelines: timelineData };
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

    // Fetch results for each persona from multiple sources
    const personaResultsPromises = personas.map(async (persona) => {
      // Fetch from all available sources in parallel
      const [newsResults, youtubeResults, redditResults, twitterResults, googleResults] = await Promise.all([
        fetchNewsForPersona(query, persona),
        fetchYouTubeForPersona(query, persona),
        fetchRedditForPersona(query, persona),
        fetchTwitterForPersona(query, persona),
        fetchGoogleForPersona(query, persona),
      ]);

      // Combine all results
      const results = [...newsResults, ...youtubeResults, ...redditResults, ...twitterResults, ...googleResults];

      // Calculate summary stats
      const uniqueSources = new Set(results.map((r) => r.source));
      const avgSentiment =
        results.length > 0
          ? results.reduce((sum, r) => sum + (r.sentiment || 0), 0) / results.length
          : 0;
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

    // Generate visualization data
    const visualizationData = {
      venn_diagram: generateVennDiagramData(personaResults),
      sentiment_map: generateSentimentMapData(personaResults),
      word_clouds: generateWordCloudData(personaResults),
      timeline: generateTimelineData(personaResults),
    };

    // Build the analysis response
    const analysis: BrubbleAnalysis = {
      query,
      timestamp: new Date(),
      personas,
      results: personaResults,
      metrics,
      insights,
      visualization_data: visualizationData,
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
