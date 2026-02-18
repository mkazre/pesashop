import React from 'react';
import { useHistory } from '@/components/builder/context/HistoryContext';
import { Clock, RotateCcw } from 'lucide-react';

export const HistoryPanel = () => {
  const { history, historyIndex, canUndo, canRedo, undo, redo, jumpToHistory, clearHistory } = useHistory();

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);

    if (diffSecs < 60) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  const handleHistoryItemClick = (index) => {
    jumpToHistory(index);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-gray-700 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-200">History</span>
          <div className="flex items-center gap-1">
            <button
              onClick={undo}
              disabled={!canUndo}
              className="p-1 rounded hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed text-gray-400"
              title="Undo"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>
        <div className="text-xs text-gray-500">
          {history.length > 0 ? `${historyIndex + 1} of ${history.length}` : 'No history'}
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {history.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            <Clock size={24} className="mx-auto mb-2 opacity-50" />
            <p>No history yet</p>
            <p className="text-xs mt-1">Start editing to see changes</p>
          </div>
        ) : (
          <div className="py-2">
            {history.map((item, index) => (
              <div
                key={index}
                onClick={() => handleHistoryItemClick(index)}
                className={`px-3 py-2 cursor-pointer border-l-2 transition-colors ${
                  index === historyIndex
                    ? 'bg-gray-700 border-blue-500 text-white'
                    : index < historyIndex
                    ? 'border-gray-600 text-gray-400 hover:bg-gray-800 hover:text-gray-300'
                    : 'border-gray-700 text-gray-500 hover:bg-gray-800 hover:text-gray-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock size={12} className={index === historyIndex ? 'text-blue-400' : ''} />
                    <span className="text-xs font-medium">{item.description}</span>
                  </div>
                  <span className="text-xs opacity-75">
                    {formatTimestamp(item.timestamp)}
                  </span>
                </div>
                {index === historyIndex && (
                  <div className="text-xs text-blue-400 mt-1">Current state</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {history.length > 0 && (
        <div className="p-3 border-t border-gray-700 shrink-0">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Memory: {history.length}/{50} states</span>
            <button
              onClick={() => {
                if (window.confirm('Clear all history? This cannot be undone.')) {
                  clearHistory();
                }
              }}
              className="hover:text-red-400 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryPanel;
