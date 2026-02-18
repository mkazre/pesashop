import React from 'react';
import { Info, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { ELEMENT_CATEGORIES, NESTING_RULES, getElementCategory } from '@/components/builder/utils/NestingRules';

export const NestingGuide = () => {
  const getCategoryColor = (category) => {
    switch (category) {
      case 'STRUCTURAL': return 'bg-green-100 text-green-700';
      case 'TEXT_ONLY': return 'bg-blue-100 text-blue-700';
      case 'MEDIA': return 'bg-purple-100 text-purple-700';
      case 'INTERACTIVE': return 'bg-orange-100 text-orange-700';
      case 'COMPLEX': return 'bg-indigo-100 text-indigo-700';
      case 'ENHANCED': return 'bg-pink-100 text-pink-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getCategoryDescription = (category) => {
    switch (category) {
      case 'STRUCTURAL': return 'Can contain other elements';
      case 'TEXT_ONLY': return 'Text content only';
      case 'MEDIA': return 'Media content only';
      case 'INTERACTIVE': return 'Interactive elements';
      case 'COMPLEX': return 'Special components';
      case 'ENHANCED': return 'Advanced features';
      default: return 'Unknown type';
    }
  };

  return (
    <div className="p-4 text-sm text-gray-300">
      <div className="flex items-center gap-2 mb-4">
        <Info size={16} className="text-blue-400" />
        <h3 className="font-semibold text-gray-200">Nesting Rules</h3>
      </div>

      {/* Element Categories */}
      <div className="mb-6">
        <h4 className="text-xs font-semibold text-gray-400 uppercase mb-3">Element Categories</h4>
        <div className="space-y-2">
          {Object.entries(ELEMENT_CATEGORIES).map(([category, elements]) => (
            <div key={category} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded ${getCategoryColor(category)}`}>
                  {category}
                </span>
                <span className="text-xs text-gray-400">
                  {getCategoryDescription(category)}
                </span>
              </div>
              <div className="text-xs text-gray-500">
                {elements.length} types
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Nesting Rules */}
      <div className="mb-6">
        <h4 className="text-xs font-semibold text-gray-400 uppercase mb-3">Valid Nesting</h4>
        <div className="space-y-3">
          <div className="flex items-start gap-2">
            <CheckCircle size={14} className="text-green-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-xs text-gray-300">Text/Heading <ArrowRight size={12} className="inline mx-1" /> Container/Section</div>
              <div className="text-xs text-gray-500">Text elements can be nested into structural elements</div>
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <CheckCircle size={14} className="text-green-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-xs text-gray-300">Button/Image <ArrowRight size={12} className="inline mx-1" /> Container/Section</div>
              <div className="text-xs text-gray-500">Interactive and media elements can be nested into structural elements</div>
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <CheckCircle size={14} className="text-green-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-xs text-gray-300">Container <ArrowRight size={12} className="inline mx-1" /> Container/Section</div>
              <div className="text-xs text-gray-500">Structural elements can be nested into other structural elements</div>
            </div>
          </div>
        </div>
      </div>

      {/* Invalid Nesting */}
      <div className="mb-6">
        <h4 className="text-xs font-semibold text-gray-400 uppercase mb-3">Invalid Nesting</h4>
        <div className="space-y-3">
          <div className="flex items-start gap-2">
            <XCircle size={14} className="text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-xs text-gray-300">Container <ArrowRight size={12} className="inline mx-1" /> Text/Heading</div>
              <div className="text-xs text-gray-500">Structural elements cannot be nested into text elements</div>
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <XCircle size={14} className="text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-xs text-gray-300">Any element <ArrowRight size={12} className="inline mx-1" /> Same type</div>
              <div className="text-xs text-gray-500">Elements cannot be nested into the same type</div>
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <XCircle size={14} className="text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-xs text-gray-300">Any element <ArrowRight size={12} className="inline mx-1" /> Button/Image</div>
              <div className="text-xs text-gray-500">Interactive and media elements cannot contain other elements</div>
            </div>
          </div>
        </div>
      </div>

      {/* Drag & Drop Tips */}
      <div>
        <h4 className="text-xs font-semibold text-gray-400 uppercase mb-3">Drag & Drop Tips</h4>
        <div className="space-y-2 text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Green indicators = valid drop zone</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span>Red indicators = invalid drop zone</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>Blue arrows = reordering position</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-600 rounded-full"></div>
            <span>Green arrow = nesting inside</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NestingGuide;
