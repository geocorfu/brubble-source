'use client';

import React, { useState } from 'react';
import { BarChart3, PieChart, Cloud, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import {
  BarChart,
  Bar,
  PieChart as RechartsPie,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart,
} from 'recharts';

interface VisualizationsPanelProps {
  visualizationData: {
    venn_diagram: any;
    sentiment_map: any;
    word_clouds: any;
    timeline: any;
  } | null;
}

export default function VisualizationsPanel({ visualizationData }: VisualizationsPanelProps) {
  const [activeTab, setActiveTab] = useState<'overlap' | 'sentiment' | 'words' | 'timeline'>('overlap');
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  if (!visualizationData) return null;

  const tabs = [
    { id: 'overlap', label: 'Result Overlap', icon: PieChart },
    { id: 'sentiment', label: 'Sentiment Analysis', icon: BarChart3 },
    { id: 'words', label: 'Key Topics', icon: Cloud },
    { id: 'timeline', label: 'Timeline', icon: Clock },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto mb-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <BarChart3 className="h-6 w-6" />
        Visual Analytics
      </h2>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content Panels */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        {activeTab === 'overlap' && (
          <OverlapVisualization data={visualizationData.venn_diagram} />
        )}
        {activeTab === 'sentiment' && (
          <SentimentVisualization data={visualizationData.sentiment_map} />
        )}
        {activeTab === 'words' && (
          <WordCloudVisualization
            data={visualizationData.word_clouds}
            expandedSection={expandedSection}
            setExpandedSection={setExpandedSection}
          />
        )}
        {activeTab === 'timeline' && (
          <TimelineVisualization data={visualizationData.timeline} />
        )}
      </div>
    </div>
  );
}

// Overlap Visualization Component
function OverlapVisualization({ data }: { data: any }) {
  if (!data || !data.sets) return <div className="text-gray-500">No overlap data available</div>;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Result Overlap Between Personas</h3>
        <p className="text-sm text-gray-600 mb-6">
          Shows how many search results are shared between different personas. Higher overlap indicates similar information exposure.
        </p>
      </div>

      {/* Set Sizes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {data.sets.map((set: any) => (
          <div
            key={set.id}
            className="p-4 rounded-lg border-2"
            style={{ borderColor: set.color }}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-gray-800">{set.label}</div>
                <div className="text-sm text-gray-600">Total Results</div>
              </div>
              <div className="text-3xl font-bold" style={{ color: set.color }}>
                {set.size}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Overlap Details */}
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-800">Shared Results</h4>
        {data.overlaps.map((overlap: any, index: number) => {
          const personaNames = overlap.sets.map((setId: string) =>
            data.sets.find((s: any) => s.id === setId)?.label
          ).join(' & ');

          const overlapPercentage = ((overlap.size / Math.max(...data.sets.map((s: any) => s.size))) * 100).toFixed(1);

          return (
            <div key={index} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium text-gray-800">{personaNames}</div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">{overlapPercentage}% overlap</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-semibold">
                    {overlap.size} shared
                  </span>
                </div>
              </div>
              {overlap.size > 0 && (
                <div className="text-xs text-gray-500 mt-2">
                  Common articles: {overlap.items.slice(0, 3).map((item: any) => item.title).join(', ')}
                  {overlap.items.length > 3 && ` and ${overlap.items.length - 3} more...`}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Sentiment Visualization Component
function SentimentVisualization({ data }: { data: any }) {
  if (!data || !data.personas) return <div className="text-gray-500">No sentiment data available</div>;

  // Prepare data for stacked bar chart
  const chartData = data.personas.map((p: any) => ({
    name: p.persona.name,
    Positive: p.distribution.positive,
    Neutral: p.distribution.neutral,
    Negative: p.distribution.negative,
    avgSentiment: p.avgSentiment,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Sentiment Distribution</h3>
        <p className="text-sm text-gray-600 mb-6">
          Analyzes the emotional tone of search results for each persona. Positive, neutral, and negative sentiment breakdowns.
        </p>
      </div>

      {/* Stacked Bar Chart */}
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="Positive" stackId="a" fill="#10B981" />
          <Bar dataKey="Neutral" stackId="a" fill="#F59E0B" />
          <Bar dataKey="Negative" stackId="a" fill="#EF4444" />
        </BarChart>
      </ResponsiveContainer>

      {/* Average Sentiment Scores */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {data.personas.map((p: any) => {
          const sentiment = p.avgSentiment;
          const sentimentColor = sentiment > 0.3 ? '#10B981' : sentiment < -0.3 ? '#EF4444' : '#F59E0B';
          const sentimentLabel = sentiment > 0.3 ? 'Positive' : sentiment < -0.3 ? 'Negative' : 'Neutral';

          return (
            <div key={p.persona.id} className="p-4 bg-gray-50 rounded-lg">
              <div className="font-semibold text-gray-800 mb-2">{p.persona.name}</div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Avg Sentiment</span>
                <span className="font-bold" style={{ color: sentimentColor }}>
                  {sentimentLabel}
                </span>
              </div>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all"
                  style={{
                    width: `${Math.abs(sentiment) * 100}%`,
                    backgroundColor: sentimentColor,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Word Cloud Visualization Component
function WordCloudVisualization({ data, expandedSection, setExpandedSection }: {
  data: any;
  expandedSection: string | null;
  setExpandedSection: (id: string | null) => void;
}) {
  if (!data || !data.clouds) return <div className="text-gray-500">No word data available</div>;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Key Topics & Terms</h3>
        <p className="text-sm text-gray-600 mb-6">
          Most frequently mentioned words and topics in search results for each persona.
        </p>
      </div>

      <div className="space-y-4">
        {data.clouds.map((cloud: any) => {
          const isExpanded = expandedSection === cloud.persona.id;
          const topWords = isExpanded ? cloud.words : cloud.words.slice(0, 15);

          return (
            <div key={cloud.persona.id} className="border rounded-lg">
              <button
                onClick={() => setExpandedSection(isExpanded ? null : cloud.persona.id)}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: cloud.persona.color }}
                  />
                  <span className="font-semibold text-gray-800">{cloud.persona.name}</span>
                  <span className="text-sm text-gray-600">
                    ({cloud.words.length} unique terms)
                  </span>
                </div>
                {isExpanded ? (
                  <ChevronUp className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                )}
              </button>

              <div className="p-4 border-t">
                <div className="flex flex-wrap gap-2">
                  {topWords.map((word: any, index: number) => {
                    const fontSize = Math.max(12, Math.min(24, 12 + (word.value / topWords[0].value) * 12));
                    return (
                      <span
                        key={index}
                        className="px-3 py-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors cursor-default"
                        style={{
                          fontSize: `${fontSize}px`,
                          color: cloud.persona.color,
                          fontWeight: word.value > topWords[0].value / 2 ? 600 : 400,
                        }}
                      >
                        {word.text}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Timeline Visualization Component
function TimelineVisualization({ data }: { data: any }) {
  if (!data || !data.timelines) return <div className="text-gray-500">No timeline data available</div>;

  // Prepare data for time period chart
  const periodData = data.timelines.map((t: any) => ({
    name: t.persona.name,
    'Last 24h': t.periods.lastDay,
    'Last Week': t.periods.lastWeek,
    'Last Month': t.periods.lastMonth,
    'Older': t.periods.older,
    color: t.persona.color,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Publication Timeline</h3>
        <p className="text-sm text-gray-600 mb-6">
          When results were published. Shows freshness of information for each persona.
        </p>
      </div>

      {/* Time Period Distribution */}
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={periodData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="Last 24h" fill="#10B981" />
          <Bar dataKey="Last Week" fill="#3B82F6" />
          <Bar dataKey="Last Month" fill="#F59E0B" />
          <Bar dataKey="Older" fill="#6B7280" />
        </BarChart>
      </ResponsiveContainer>

      {/* Timeline Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {data.timelines.map((t: any) => (
          <div key={t.persona.id} className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: t.persona.color }}
              />
              <div className="font-semibold text-gray-800">{t.persona.name}</div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Newest:</span>
                <span className="font-medium text-gray-800">
                  {t.newestResult ? new Date(t.newestResult).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Oldest:</span>
                <span className="font-medium text-gray-800">
                  {t.oldestResult ? new Date(t.oldestResult).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Recent (24h):</span>
                <span className="font-medium text-green-600">{t.periods.lastDay}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
