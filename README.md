# Brubble - Break Your Information Bubble

Brubble helps you understand information bubbles and explore diverse perspectives by comparing search results across different demographics, political leanings, and geographic locations.

## Features

- **Multi-Perspective Search**: Compare search results across up to 3 different personas simultaneously
- **Real-Time News Integration**: Powered by NewsAPI for live news content
- **Visual Analytics**: Interactive metrics panels showing echo chamber effects, sentiment analysis, and source diversity
- **Smart Insights**: AI-generated insights highlighting information bubbles and perspective gaps
- **Beautiful UI**: Modern, responsive interface built with Next.js 14 and Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- NewsAPI key (free tier available at https://newsapi.org/register)

### Installation

1. **Navigate to the project directory**:
   ```bash
   cd brubble
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` and add your NewsAPI key:
   ```
   NEWSAPI_KEY=your_actual_newsapi_key_here
   ```

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

Currently integrated:
- **NewsAPI**: Live news articles from thousands of sources

Future integrations planned:
- YouTube Search API
- Reddit API
- Twitter/X API
- Google Custom Search API

## Building for Production

```bash
npm run build
npm start
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEWSAPI_KEY` | NewsAPI authentication key | Yes |

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for learning and development.

## Acknowledgments

- Built with ❤️ to combat information bubbles
- Powered by NewsAPI for real-time news data
- Icons by Lucide React

## Support

For issues, questions, or suggestions, please open an issue on the GitHub repository.
