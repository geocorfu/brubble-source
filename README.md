# Brubble - Break Your Information Bubble

Brubble helps you understand information bubbles and explore diverse perspectives by comparing search results across different demographics, political leanings, and geographic locations.

## Features

- **Multi-Perspective Search**: Compare search results across up to 3 different personas simultaneously
- **Multi-Source Integration**: Aggregates content from 7 data sources:
  - **RSS Feeds** - Free, persona-specific feeds from major outlets (NPR, Fox News, NYT, BBC, etc.)
  - **The Guardian API** - Quality journalism with generous free tier (500 req/day)
  - **Google News RSS** - Query-specific news aggregation, completely free
  - **YouTube** - Video content from YouTube search
  - **Reddit** - Community discussions and posts
  - **Twitter/X** - Recent tweets and social media discourse
  - **Google Custom Search** - General web search results
- **Visual Analytics**: Interactive metrics panels showing echo chamber effects, sentiment analysis, and source diversity
- **Smart Insights**: AI-generated insights highlighting information bubbles and perspective gaps
- **Beautiful UI**: Modern, responsive interface built with Next.js 14 and Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- **No API keys required** - The app works out-of-the-box with free RSS feeds!
- **Optional** (for enhanced functionality):
  - The Guardian API key - Free tier: 500 req/day (https://open-platform.theguardian.com/access/)
  - YouTube Data API v3 key (https://console.cloud.google.com/apis/credentials)
  - Twitter/X API Bearer Token (https://developer.twitter.com/en/portal/dashboard)
  - Google Custom Search API key + Search Engine ID (https://developers.google.com/custom-search/v1/overview)

### Installation

1. **Navigate to the project directory**:
   ```bash
   cd brubble
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables (optional)**:
   ```bash
   cp .env.example .env.local
   ```

   The app works immediately with free RSS feeds and Google News RSS! Optionally add API keys for enhanced results:
   ```
   # Optional - add these for enhanced multi-source results
   GUARDIAN_API_KEY=your_guardian_api_key
   YOUTUBE_API_KEY=your_youtube_api_key
   TWITTER_BEARER_TOKEN=your_twitter_bearer_token
   GOOGLE_API_KEY=your_google_api_key
   GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id
   ```

   **Note**: News works without any API keys! Other sources gracefully skip if API keys are not provided.

4. **Run the development server**:
   ```bash
   npm run dev
   ```

5. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## How to Use

1. **Select Personas**: Choose 2-3 personas from different categories (political, generational, or geographic)
2. **Enter Search Query**: Type a topic you want to explore (e.g., "climate change", "artificial intelligence")
3. **Click Brubble**: The system will search from each persona's perspective
4. **Explore Results**: View side-by-side comparisons, metrics, and AI-generated insights

## Project Structure

```
brubble/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── search/          # API route for search functionality
│   │   ├── page.tsx             # Main application page
│   │   ├── layout.tsx           # Root layout
│   │   └── globals.css          # Global styles
│   ├── components/
│   │   ├── SearchBar.tsx        # Search input component
│   │   ├── PersonaSelector.tsx  # Persona selection interface
│   │   ├── MetricsPanel.tsx     # Comparison metrics display
│   │   ├── ResultsGrid.tsx      # Search results grid
│   │   └── InsightsPanel.tsx    # AI insights display
│   ├── types/
│   │   └── index.ts             # TypeScript type definitions
│   └── lib/                     # Utility functions
├── public/                      # Static assets
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.js
```

## Technologies Used

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Lucide React icons
- **Data Visualization**: Recharts
- **API Integration**: NewsAPI
- **State Management**: React Hooks

## Available Personas

### Political
- Progressive
- Conservative
- Centrist

### Generational
- Gen Z (18-25)
- Millennial (26-40)
- Gen X+ (40+)

### Geographic
- Urban US
- Rural US
- European

## API Integration

### Hybrid News Strategy (No API Keys Required!)

Brubble uses a smart hybrid approach for news that works completely free:

1. **RSS Feeds** (Primary) - Persona-specific news feeds:
   - Progressive: The Guardian US, NPR, Democracy Now
   - Conservative: Fox News, Wall Street Journal, NY Post
   - Centrist: New York Times, BBC, Reuters
   - Always free, no authentication required

2. **Google News RSS** - Query-specific news aggregation:
   - Completely free, no API key needed
   - Real-time news from thousands of sources

3. **The Guardian API** (Optional Enhancement):
   - Free tier: 500 requests/day (vs NewsAPI's 100)
   - High-quality journalism
   - Get your key: https://open-platform.theguardian.com/access/

### Other Data Sources (All Optional)

- **YouTube Data API v3**: Video content and metadata
  - Free tier: 10,000 quota units/day (~100 searches)
  - Get your key: https://console.cloud.google.com/apis/credentials

- **Reddit API**: Community discussions and posts
  - Works without credentials (with rate limits) or create an app for higher limits
  - Create app: https://www.reddit.com/prefs/apps

- **Twitter/X API v2**: Recent tweets (last 7 days)
  - Requires Essential access or higher (free tier available)
  - Get Bearer Token: https://developer.twitter.com/en/portal/dashboard

- **Google Custom Search API**: General web search results
  - Free tier: 100 queries/day
  - Setup: https://developers.google.com/custom-search/v1/overview
  - Requires both API key and Search Engine ID

## Building for Production

```bash
npm run build
npm start
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GUARDIAN_API_KEY` | The Guardian API key (500 req/day free) | No |
| `YOUTUBE_API_KEY` | YouTube Data API v3 key | No |
| `TWITTER_BEARER_TOKEN` | Twitter/X API v2 bearer token | No |
| `GOOGLE_API_KEY` | Google Custom Search API key | No |
| `GOOGLE_SEARCH_ENGINE_ID` | Google Custom Search engine ID | No |

**Note**: All API keys are optional! The app works out-of-the-box with free RSS feeds and Google News RSS. Additional API keys enhance the experience with more data sources.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for learning and development.

## Acknowledgments

- Built with ❤️ to combat information bubbles
- Data powered by:
  - Free RSS feeds from major news outlets (NPR, Fox News, NYT, BBC, Reuters, etc.)
  - Google News RSS for query-specific aggregation
  - The Guardian Open Platform for quality journalism
  - YouTube Data API for video content
  - Reddit for community discussions
  - Twitter/X API for social media discourse
  - Google Custom Search for web results
- Icons by Lucide React
- Special thanks to all news organizations providing free RSS feeds

## Support

For issues, questions, or suggestions, please open an issue on the GitHub repository.
