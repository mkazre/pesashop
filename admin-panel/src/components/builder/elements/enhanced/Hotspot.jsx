import React, { useState, useRef, useEffect } from 'react';
import { useNode, useEditor } from '@craftjs/core';
import { MapPin } from 'lucide-react';
import { ColorControl, TextControl, NumberControl } from '@/components/builder/controls/PropertyControls';

export const Hotspot = ({ children, className = '', style = {} }) => {
  const {
    connectors: { connect, drag },
    selected,
    hovered,
    id,
    actions: { setProp },
  } = useNode((state) => ({
    selected: state.events.selected,
    hovered: state.events.hovered,
    id: state.id,
  }));

  const [showTooltip, setShowTooltip] = useState(false);
  const [markers, setMarkers] = useState([
    { id: 1, x: 50, y: 50, text: 'Default hotspot', color: '#3b82f6' }
  ]);

  const addMarker = () => {
    const newMarker = {
      id: Date.now(),
      x: 50,
      y: 50,
      text: 'New hotspot',
      color: '#3b82f6'
    };
    setMarkers([...markers, newMarker]);
    setProp((p) => { p.markers = [...markers, newMarker]; });
  };

  const updateMarker = (markerId, updates) => {
    const updatedMarkers = markers.map(m => 
      m.id === markerId ? { ...m, ...updates } : m
    );
    setMarkers(updatedMarkers);
    setProp((p) => { p.markers = updatedMarkers; });
  };

  const deleteMarker = (markerId) => {
    const updatedMarkers = markers.filter(m => m.id !== markerId);
    setMarkers(updatedMarkers);
    setProp((p) => { p.markers = updatedMarkers; });
  };

  return (
    <div
      ref={(ref) => connect(drag(ref))}
      data-craft-id={id}
      className={`hotspot-container relative ${className} ${
        selected ? 'ring-2 ring-blue-500' : ''
      } ${hovered ? 'ring-2 ring-blue-300' : ''}`}
      style={{ ...style, position: 'relative', minHeight: '200px' }}
    >
      {/* Background image or content */}
      <div className="hotspot-content w-full h-full">
        {children}
      </div>

      {/* Hotspot markers */}
      {markers.map((marker) => (
        <div
          key={marker.id}
          className="hotspot-marker absolute w-6 h-6 rounded-full cursor-pointer transform -translate-x-1/2 -translate-y-1/2 hover:scale-110 transition-transform"
          style={{
            left: `${marker.x}%`,
            top: `${marker.y}%`,
            backgroundColor: marker.color,
            border: '2px solid white',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}
          onMouseEnter={() => setShowTooltip(marker.id)}
          onMouseLeave={() => setShowTooltip(null)}
          onClick={() => setShowTooltip(showTooltip === marker.id ? null : marker.id)}
        >
          <div className="w-full h-full flex items-center justify-center">
            <MapPin size={12} className="text-white" />
          </div>
          
          {/* Tooltip */}
          {showTooltip === marker.id && (
            <div 
              className="absolute z-50 bg-gray-900 text-white p-2 rounded shadow-lg whitespace-nowrap"
              style={{
                bottom: '100%',
                left: '50%',
                transform: 'translateX(-50%) translateY(-4px)',
                marginBottom: '4px'
              }}
            >
              <div className="text-sm">{marker.text}</div>
              <div 
                className="absolute w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"
                style={{
                  top: '100%',
                  left: '50%',
                  transform: 'translateX(-50%)'
                }}
              />
            </div>
          )}
        </div>
      ))}

      {/* Add marker button */}
      {selected && (
        <button
          onClick={addMarker}
          className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600"
        >
          + Add Hotspot
        </button>
      )}
    </div>
  );
};

// Settings Panel Component
export const HotspotSettings = ({ nodeId }) => {
  const nodeProps = useEditor((state) => state.nodes[nodeId]?.data?.props ?? {});
  const { actions } = useEditor();
  const setProp = (cb) => actions.setProp(nodeId, cb);
  const {
    markers = []
  } = nodeProps;

  const [selectedMarker, setSelectedMarker] = useState(null);

  const updateMarker = (markerId, field, value) => {
    setProp((p) => {
      p.markers = p.markers.map(m => 
        m.id === markerId ? { ...m, [field]: value } : m
      );
    });
  };

  const deleteMarker = (markerId) => {
    setProp((p) => { p.markers = p.markers.filter(m => m.id !== markerId); });
    setSelectedMarker(null);
  };

  const addMarker = () => {
    const newMarker = {
      id: Date.now(),
      x: 50,
      y: 50,
      text: 'New hotspot',
      color: '#3b82f6'
    };
    setProp((p) => { p.markers = [...(p.markers || []), newMarker]; });
    setSelectedMarker(newMarker.id);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">Hotspot Markers</h3>
        <button
          onClick={addMarker}
          className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Add Marker
        </button>
      </div>

      {markers.length === 0 ? (
        <p className="text-sm text-gray-500">No markers added yet</p>
      ) : (
        <div className="space-y-2">
          {markers.map((marker) => (
            <div
              key={marker.id}
              className={`p-2 border rounded cursor-pointer ${
                selectedMarker === marker.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              }`}
              onClick={() => setSelectedMarker(marker.id)}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Marker {marker.id}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteMarker(marker.id);
                  }}
                  className="text-red-500 hover:text-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedMarker && (
        <div className="space-y-3 pt-3 border-t">
          <h4 className="text-sm font-medium text-gray-700">Edit Marker</h4>
          
          <TextControl
            label="Text"
            value={markers.find(m => m.id === selectedMarker)?.text || ''}
            onChange={(value) => updateMarker(selectedMarker, 'text', value)}
          />

          <NumberControl
            label="X Position (%)"
            value={markers.find(m => m.id === selectedMarker)?.x || 50}
            onChange={(value) => updateMarker(selectedMarker, 'x', value)}
            min={0}
            max={100}
          />

          <NumberControl
            label="Y Position (%)"
            value={markers.find(m => m.id === selectedMarker)?.y || 50}
            onChange={(value) => updateMarker(selectedMarker, 'y', value)}
            min={0}
            max={100}
          />

          <ColorControl
            label="Color"
            value={markers.find(m => m.id === selectedMarker)?.color || '#3b82f6'}
            onChange={(value) => updateMarker(selectedMarker, 'color', value)}
          />
        </div>
      )}
    </div>
  );
};

// Craft.js Configuration
Hotspot.craft = {
  displayName: 'Hotspot',
  props: {
    className: '',
    style: {},
    markers: [],
    dynamicBindings: {},
  },
  rules: {
    canDrag: () => true,
    canMoveIn: () => true,
    canMoveOut: () => true,
  },
  related: {
    settings: HotspotSettings,
  },
};

export default Hotspot;
