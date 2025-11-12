'use client';

import React from 'react';
import { Persona, DEFAULT_PERSONAS } from '@/types';
import { Check, User, MapPin, Calendar } from 'lucide-react';

interface PersonaSelectorProps {
  selectedPersonas: Persona[];
  onPersonaToggle: (persona: Persona) => void;
  maxSelections?: number;
}

export default function PersonaSelector({
  selectedPersonas,
  onPersonaToggle,
  maxSelections = 3,
}: PersonaSelectorProps) {
  const isSelected = (persona: Persona) =>
    selectedPersonas.some((p) => p.id === persona.id);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'political':
        return <User className="h-4 w-4" />;
      case 'geographic':
        return <MapPin className="h-4 w-4" />;
      case 'generational':
        return <Calendar className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const groupedPersonas = DEFAULT_PERSONAS.reduce((acc, persona) => {
    if (!acc[persona.category]) {
      acc[persona.category] = [];
    }
    acc[persona.category].push(persona);
    return acc;
  }, {} as Record<string, Persona[]>);

  return (
    <div className="w-full max-w-6xl mx-auto mb-8">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Select Perspectives to Compare
        </h2>
        <p className="text-gray-600">
          Choose up to {maxSelections} personas to see how search results differ
          {' '}
          <span className="text-sm">
            ({selectedPersonas.length}/{maxSelections} selected)
          </span>
        </p>
      </div>

      <div className="space-y-6">
        {Object.entries(groupedPersonas).map(([category, personas]) => (
          <div key={category} className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-2 mb-4">
              {getCategoryIcon(category)}
              <h3 className="text-lg font-semibold text-gray-800 capitalize">
                {category}
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {personas.map((persona) => {
                const selected = isSelected(persona);
                const disabled =
                  !selected && selectedPersonas.length >= maxSelections;

                return (
                  <button
                    key={persona.id}
                    onClick={() => onPersonaToggle(persona)}
                    disabled={disabled}
                    className={`
                      relative p-4 rounded-lg border-2 transition-all duration-200
                      ${
                        selected
                          ? 'border-current shadow-lg scale-105'
                          : disabled
                          ? 'border-gray-200 opacity-50 cursor-not-allowed'
                          : 'border-gray-200 hover:border-gray-400 hover:shadow-md'
                      }
                    `}
                    style={{
                      borderColor: selected ? persona.color : undefined,
                      backgroundColor: selected
                        ? `${persona.color}10`
                        : 'white',
                    }}
                  >
                    {selected && (
                      <div
                        className="absolute top-2 right-2 rounded-full p-1"
                        style={{ backgroundColor: persona.color }}
                      >
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: persona.color }}
                      />
                      <div className="text-left flex-1">
                        <div className="font-semibold text-gray-800">
                          {persona.name}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          {Object.entries(persona.attributes)
                            .map(([key, value]) => value)
                            .join(', ')}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {selectedPersonas.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-blue-900">Selected:</span>
              {selectedPersonas.map((persona) => (
                <span
                  key={persona.id}
                  className="px-3 py-1 rounded-full text-sm font-medium text-white"
                  style={{ backgroundColor: persona.color }}
                >
                  {persona.name}
                </span>
              ))}
            </div>
            <button
              onClick={() =>
                selectedPersonas.forEach((p) => onPersonaToggle(p))
              }
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear All
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
