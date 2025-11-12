'use client';

import React, { useState } from 'react';
import SearchBar from '@/components/SearchBar';
import PersonaSelector from '@/components/PersonaSelector';
import MetricsPanel from '@/components/MetricsPanel';
import ResultsGrid from '@/components/ResultsGrid';
import InsightsPanel from '@/components/InsightsPanel';
import {
  Persona,
  BrubbleAnalysis,
  PersonaResults,
  ComparisonMetrics,
} from '@/types';
import { Sparkles, AlertCircle } from 'lucide-react';

export default function Home() {
  const [selectedPersonas, setSelectedPersonas] = useState<Persona[]>([]);
  const [analysis, setAnalysis] = useState<BrubbleAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePersonaToggle = (persona: Persona) => {
    setSelectedPersonas((prev) => {
      const isSelected = prev.some((p) => p.id === persona.id);
      if (isSelected) {
        return prev.filter((p) => p.id !== persona.id);
      } else {
        return [...prev, persona];
      }
    });
  };

  const handleSearch = async (query: string) => {
    if (selectedPersonas.length < 2) {
      setError('Please select at least 2 personas to compare');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Call API to perform search
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          personas: selectedPersonas,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to perform search');
      }

      const data: BrubbleAnalysis = await response.json();
      setAnalysis(data);
    } catch (err) {
      console.error('Search error:', err);
      setError(
        err instanceof Error ? err.message : 'An error occurred during search'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Brubble
                </h1>
                <p className="text-sm text-gray-600">
                  Break Your Information Bubble
                </p>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              {selectedPersonas.length > 0 && (
                <span>
                  {selectedPersonas.length} persona
                  {selectedPersonas.length !== 1 ? 's' : ''} selected
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero section */}
        {!analysis && (
          <div className="text-center mb-12 mt-8">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              Discover How Different People See the Same Information
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Compare search results across different demographics, political
              leanings, and geographic locations. Understand your information
              bubble and explore diverse perspectives.
            </p>
          </div>
        )}

        {/* Search bar */}
        <SearchBar onSearch={handleSearch} isLoading={isLoading} />

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900">Error</h3>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Persona selector */}
        <PersonaSelector
          selectedPersonas={selectedPersonas}
          onPersonaToggle={handlePersonaToggle}
          maxSelections={3}
        />

        {/* Loading state */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
            <p className="mt-4 text-gray-600 font-medium">
              Searching across multiple perspectives...
            </p>
          </div>
        )}

        {/* Results */}
        {analysis && !isLoading && (
          <div className="space-y-8 animate-fade-in">
            {/* Insights */}
            {analysis.insights && analysis.insights.length > 0 && (
              <InsightsPanel
                insights={analysis.insights}
                query={analysis.query}
              />
            )}

            {/* Metrics */}
            {analysis.metrics && analysis.metrics.length > 0 && (
              <MetricsPanel
                metrics={analysis.metrics}
                personas={analysis.personas}
              />
            )}

            {/* Results grid */}
            {analysis.results && analysis.results.length > 0 && (
              <ResultsGrid personaResults={analysis.results} />
            )}
          </div>
        )}

        {/* Empty state */}
        {!analysis && !isLoading && (
          <div className="text-center py-12 text-gray-500">
            <div className="mb-4">
              <Sparkles className="h-16 w-16 mx-auto text-gray-400" />
            </div>
            <p className="text-lg">
              Select at least 2 personas and enter a search query to begin
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 py-8 border-t border-gray-200 bg-white/50">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-600 text-sm">
            Brubble helps you understand information bubbles and explore diverse
            perspectives
          </p>
          <p className="text-gray-500 text-xs mt-2">
            Built with Next.js, React, and AI-powered insights
          </p>
        </div>
      </footer>
    </div>
  );
}
