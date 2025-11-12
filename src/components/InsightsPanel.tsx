'use client';

import React from 'react';
import { Lightbulb, AlertCircle, TrendingUp, Eye } from 'lucide-react';

interface InsightsPanelProps {
  insights: string[];
  query?: string;
}

export default function InsightsPanel({ insights, query }: InsightsPanelProps) {
  if (insights.length === 0) {
    return null;
  }

  const getInsightIcon = (insight: string) => {
    if (insight.toLowerCase().includes('echo')) {
      return <AlertCircle className="h-5 w-5 text-yellow-600" />;
    }
    if (insight.toLowerCase().includes('divers')) {
      return <TrendingUp className="h-5 w-5 text-green-600" />;
    }
    if (insight.toLowerCase().includes('perspect')) {
      return <Eye className="h-5 w-5 text-blue-600" />;
    }
    return <Lightbulb className="h-5 w-5 text-purple-600" />;
  };

  const getInsightStyle = (insight: string) => {
    if (insight.toLowerCase().includes('echo')) {
      return 'border-yellow-200 bg-yellow-50';
    }
    if (insight.toLowerCase().includes('divers')) {
      return 'border-green-200 bg-green-50';
    }
    if (insight.toLowerCase().includes('perspect')) {
      return 'border-blue-200 bg-blue-50';
    }
    return 'border-purple-200 bg-purple-50';
  };

  return (
    <div className="w-full max-w-6xl mx-auto mb-8">
      <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-xl shadow-lg p-6 border border-purple-200">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="h-6 w-6 text-purple-600" />
          <h2 className="text-2xl font-bold text-gray-800">AI Insights</h2>
          {query && (
            <span className="ml-auto text-sm text-gray-600">
              for &quot;{query}&quot;
            </span>
          )}
        </div>

        <div className="space-y-3">
          {insights.map((insight, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-lg border-2 ${getInsightStyle(
                insight
              )} transition-all duration-200 hover:shadow-md`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getInsightIcon(insight)}
                </div>
                <div className="flex-1">
                  <p className="text-gray-800 leading-relaxed">{insight}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Additional context */}
        <div className="mt-6 pt-4 border-t border-purple-200">
          <div className="text-sm text-gray-600 space-y-1">
            <p className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <span>
                <strong>Echo Chamber Effect:</strong> High overlap in search results
                suggests limited perspective diversity
              </span>
            </p>
            <p className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span>
                <strong>Diverse Sources:</strong> Multiple unique sources indicate
                broader information exposure
              </span>
            </p>
            <p className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-blue-600" />
              <span>
                <strong>Perspective Gaps:</strong> Significant differences reveal
                how personas experience different realities
              </span>
            </p>
          </div>
        </div>

        {/* Call to action */}
        <div className="mt-4 p-3 bg-white/70 rounded-lg border border-purple-200">
          <p className="text-sm text-gray-700">
            💡 <strong>Pro Tip:</strong> Try comparing more personas or different
            search queries to uncover deeper patterns in how information bubbles
            form and persist across different demographics.
          </p>
        </div>
      </div>
    </div>
  );
}
