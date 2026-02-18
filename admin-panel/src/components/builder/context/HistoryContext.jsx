import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { useEditor } from '@craftjs/core';

const MAX_HISTORY = 50;

const HistoryContext = createContext({
  history: [],
  historyIndex: -1,
  canUndo: false,
  canRedo: false,
  saveState: () => {},
  undo: () => {},
  redo: () => {},
  clearHistory: () => {},
});

export const useHistory = () => {
  const context = useContext(HistoryContext);
  if (!context) {
    throw new Error('useHistory must be used within a HistoryProvider');
  }
  return context;
};

export const HistoryProvider = ({ children }) => {
  const { query, actions } = useEditor();
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isRestoring = useRef(false);

  const saveState = useCallback(() => {
    if (isRestoring.current) return;
    
    try {
      const currentState = query.serialize();
      setHistory((prev) => {
        const newHistory = prev.slice(0, historyIndex + 1);
        newHistory.push({
          state: currentState,
          timestamp: Date.now(),
          description: getStateDescription(currentState)
        });
        if (newHistory.length > MAX_HISTORY) newHistory.shift();
        setHistoryIndex(newHistory.length - 1);
        return newHistory;
      });
    } catch (error) {
      console.error('Error saving state:', error);
    }
  }, [query, historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      isRestoring.current = true;
      const previousState = history[historyIndex - 1].state;
      try {
        actions.deserialize(previousState);
        setHistoryIndex(historyIndex - 1);
      } catch (error) {
        console.error('Error undoing:', error);
      } finally {
        setTimeout(() => {
          isRestoring.current = false;
        }, 100);
      }
    }
  }, [history, historyIndex, actions]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      isRestoring.current = true;
      const nextState = history[historyIndex + 1].state;
      try {
        actions.deserialize(nextState);
        setHistoryIndex(historyIndex + 1);
      } catch (error) {
        console.error('Error redoing:', error);
      } finally {
        setTimeout(() => {
          isRestoring.current = false;
        }, 100);
      }
    }
  }, [history, historyIndex, actions]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    setHistoryIndex(-1);
  }, []);

  const jumpToHistory = useCallback((targetIndex) => {
    if (targetIndex >= 0 && targetIndex < history.length) {
      isRestoring.current = true;
      const targetState = history[targetIndex].state;
      try {
        actions.deserialize(targetState);
        setHistoryIndex(targetIndex);
      } catch (error) {
        console.error('Error jumping to history:', error);
      } finally {
        setTimeout(() => {
          isRestoring.current = false;
        }, 100);
      }
    }
  }, [history, actions]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const value = {
    history,
    historyIndex,
    canUndo,
    canRedo,
    saveState,
    undo,
    redo,
    clearHistory,
    jumpToHistory,
  };

  return (
    <HistoryContext.Provider value={value}>
      {children}
    </HistoryContext.Provider>
  );
};

// Helper function to generate state descriptions
function getStateDescription(state) {
  try {
    const nodeCount = Object.keys(state.nodes || {}).length;
    const rootNode = state.nodes?.ROOT;
    const rootChildren = rootNode?.nodes?.length || 0;
    
    if (nodeCount === 0) return 'Empty canvas';
    if (nodeCount === 1 && rootChildren === 0) return 'New canvas';
    return `${nodeCount} elements`;
  } catch (error) {
    return 'Unknown state';
  }
}

export default HistoryContext;
