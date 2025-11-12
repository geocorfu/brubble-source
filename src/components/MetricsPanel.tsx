'use client';

import React from 'react';
import { ComparisonMetrics, Persona } from '@/types';
import {
  TrendingUp,
  TrendingDown,
  Circle,
  BarChart3,
  PieChart,
  Target,
} from 'lucide-react';

interface MetricsPanelProps {
  metrics: ComparisonMetrics[];
  personas: Persona[];
}

export default function MetricsPanel({ metrics, personas }: MetricsPanelProps) {
  if (metrics.length === 0 || personas.length < 2) {
    return null;
  }

  const getEchoScoreColor = (score: number) => {
    if (score >= 70) return 'text-red-600 bg-red-50';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  const getEchoScoreIcon = (score: number) => {
    if (score >= 70) return <TrendingUp className="h-5 w-5" />;
    if (score >= 40) return <Circle className="h-5 w-5" />;
    return <TrendingDown className="h-5 w-5" />;
  };

  const getEchoScoreLabel = (score: number) => {
    if (score >= 70) return 'High Echo Chamber';
    if (score >= 40) return 'Moderate Diversity';
    return 'High Diversity';
  };

  return (
    <div className="w-full max-w-6xl mx-auto mb-8">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <BarChart3 className="h-6 w-6" />
          Comparison Metrics
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {metrics.map((metric, idx) => {
            const personaA = personas[idx];
            const personaB = personas[idx + 1] || personas[0];

            return (
              <div
                key={`metric-${idx}`}
                className="border-2 border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                {/* Persona comparison header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: personaA.color }}
                    />
                    <span className="text-sm font-medium text-gray-700">
                      {personaA.name}
                    </span>
                  </div>
                  <span className="text-gray-400">vs</span>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: personaB.color }}
                    />
                    <span className="text-sm font-medium text-gray-700">
                      {personaB.name}
                    </span>
                  </div>
                </div>

                {/* Echo Score */}
                <div
                  className={`p-3 rounded-lg mb-3 ${getEchoScoreColor(
                    metric.echo_score
                  )}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getEchoScoreIcon(metric.echo_score)}
                      <span className="font-semibold">Echo Score</span>
                    </div>
                    <span className="text-2xl font-bold">
                      {metric.echo_score.toFixed(0)}%
                    </span>
                  </div>
                  <div className="text-xs font-medium">
                    {getEchoScoreLabel(metric.echo_score)}
                  </div>
                </div>

                {/* Overlap Percentage */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600 flex items-center gap-1">
                      <PieChart className="h-4 w-4" />
                      Result Overlap
                    </span>
                    <span className="text-sm font-semibold text-gray-800">
                      {metric.overlap_percentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: `${metric.overlap_percentage}%`,
                        background: `linear-gradient(90deg, ${personaA.color}, ${personaB.color})`,
                      }}
                    />
                  </div>
                </div>

                {/* Sentiment Divergence */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600 flex items-center gap-1">
                      <Target className="h-4 w-4" />
                      Sentiment Gap
                    </span>
                    <span className="text-sm font-semibold text-gray-800">
                      {metric.sentiment_divergence.toFixed(2)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {metric.sentiment_divergence < 0.3
                      ? 'Similar sentiment'
                      : metric.sentiment_divergence < 0.6
                      ? 'Moderate difference'
                      : 'Strong divergence'}
                  </div>
                </div>

                {/* Source Diversity */}
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Source Diversity</span>
                    <span className="text-sm font-semibold text-gray-800">
                      {metric.source_diversity_score.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Unique results count */}
                <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between text-xs text-gray-600">
                  <span>
                    Unique to {personaA.name}: {metric.unique_to_a.length}
                  </span>
                  <span>
                    Unique to {personaB.name}: {metric.unique_to_b.length}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Overall insights */}
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-gray-800 mb-2">Key Insights:</h3>
          <ul className="space-y-1 text-sm text-gray-700">
            <li>
              • Average echo score:{' '}
              {(
                metrics.reduce((sum, m) => sum + m.echo_score, 0) /
                metrics.length
              ).toFixed(1)}
              %
            </li>
            <li>
              • Average overlap:{' '}
              {(
                metrics.reduce((sum, m) => sum + m.overlap_percentage, 0) /
                metrics.length
              ).toFixed(1)}
              %
            </li>
            <li>
              • Total unique results found:{' '}
              {metrics.reduce(
                (sum, m) => sum + m.unique_to_a.length + m.unique_to_b.length,
                0
              )}
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
