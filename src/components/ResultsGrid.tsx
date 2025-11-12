'use client';

import React, { useState } from 'react';
import { PersonaResults } from '@/types';
import {
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Minus,
  Globe,
  Clock,
} from 'lucide-react';

interface ResultsGridProps {
  personaResults: PersonaResults[];
}

export default function ResultsGrid({ personaResults }: ResultsGridProps) {
  const [expandedPersona, setExpandedPersona] = useState<string | null>(null);

  if (personaResults.length === 0) {
    return null;
  }

  const getSentimentIcon = (sentiment?: number) => {
    if (!sentiment) return <Minus className="h-4 w-4 text-gray-400" />;
    if (sentiment > 0.3) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (sentiment < -0.3) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-yellow-600" />;
  };

  const getSentimentLabel = (sentiment?: number) => {
    if (!sentiment) return 'Neutral';
    if (sentiment > 0.3) return 'Positive';
    if (sentiment < -0.3) return 'Negative';
    return 'Neutral';
  };

  const getPlatformBadgeColor = (platform: string) => {
    const colors: Record<string, string> = {
      google: 'bg-blue-100 text-blue-800',
      youtube: 'bg-red-100 text-red-800',
      reddit: 'bg-orange-100 text-orange-800',
      twitter: 'bg-sky-100 text-sky-800',
      news: 'bg-purple-100 text-purple-800',
      bing: 'bg-teal-100 text-teal-800',
      duckduckgo: 'bg-green-100 text-green-800',
    };
    return colors[platform] || 'bg-gray-100 text-gray-800';
  };

  const formatTimestamp = (timestamp?: Date) => {
    if (!timestamp) return 'Recently';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="w-full max-w-6xl mx-auto mb-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <Globe className="h-6 w-6" />
        Search Results by Perspective
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {personaResults.map((personaResult) => {
          const { persona, results, summary_stats } = personaResult;
          const isExpanded = expandedPersona === persona.id;
          const displayResults = isExpanded ? results : results.slice(0, 5);

          return (
            <div
              key={persona.id}
              className="bg-white rounded-xl shadow-lg overflow-hidden border-t-4"
              style={{ borderTopColor: persona.color }}
            >
              {/* Header */}
              <div
                className="p-4"
                style={{
                  backgroundColor: `${persona.color}15`,
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: persona.color }}
                    />
                    {persona.name}
                  </h3>
                  <span className="text-sm font-semibold text-gray-600">
                    {summary_stats.total_results} results
                  </span>
                </div>

                {/* Summary stats */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white/70 rounded p-2">
                    <div className="text-gray-600">Unique Sources</div>
                    <div className="font-semibold text-gray-800">
                      {summary_stats.unique_sources}
                    </div>
                  </div>
                  <div className="bg-white/70 rounded p-2">
                    <div className="text-gray-600">Avg Sentiment</div>
                    <div className="font-semibold text-gray-800 flex items-center gap-1">
                      {getSentimentIcon(summary_stats.avg_sentiment)}
                      {getSentimentLabel(summary_stats.avg_sentiment)}
                    </div>
                  </div>
                </div>

                {/* Top sources */}
                {summary_stats.top_sources.length > 0 && (
                  <div className="mt-2">
                    <div className="text-xs text-gray-600 mb-1">Top Sources:</div>
                    <div className="flex flex-wrap gap-1">
                      {summary_stats.top_sources.slice(0, 3).map((source, idx) => (
                        <span
                          key={idx}
                          className="text-xs px-2 py-0.5 bg-white/70 rounded-full"
                        >
                          {source}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Results */}
              <div className="divide-y divide-gray-200">
                {displayResults.map((result, idx) => (
                  <div key={idx} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <a
                        href={result.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 group"
                      >
                        <h4 className="text-sm font-semibold text-gray-800 group-hover:text-blue-600 line-clamp-2">
                          {result.title}
                        </h4>
                      </a>
                      <ExternalLink className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    </div>

                    <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                      {result.snippet}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${getPlatformBadgeColor(
                            result.platform
                          )}`}
                        >
                          {result.platform}
                        </span>
                        <span className="text-xs text-gray-500">{result.source}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {result.sentiment !== undefined && (
                          <div className="flex items-center gap-1">
                            {getSentimentIcon(result.sentiment)}
                          </div>
                        )}
                        {result.timestamp && (
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="h-3 w-3" />
                            {formatTimestamp(result.timestamp)}
                          </div>
                        )}
                      </div>
                    </div>

                    {result.relevance_score && (
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-1">
                          <div
                            className="h-1 rounded-full"
                            style={{
                              width: `${result.relevance_score * 100}%`,
                              backgroundColor: persona.color,
                            }}
                          />
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          Relevance: {(result.relevance_score * 100).toFixed(0)}%
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Expand/Collapse button */}
              {results.length > 5 && (
                <div className="p-4 bg-gray-50 border-t border-gray-200">
                  <button
                    onClick={() =>
                      setExpandedPersona(isExpanded ? null : persona.id)
                    }
                    className="w-full text-sm font-medium text-blue-600 hover:text-blue-800"
                  >
                    {isExpanded
                      ? 'Show Less'
                      : `Show ${results.length - 5} More Results`}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
