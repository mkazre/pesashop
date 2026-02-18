import { useState, useCallback, useEffect } from 'react';
import { useEditor } from '@craftjs/core';

const MAX_HISTORY = 50;

export const useUndoRedo = () => {
  const { query, actions } = useEditor();
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // Expose canUndo/canRedo to window for toolbar buttons
  useEffect(() => {
    window.canUndo = historyIndex > 0;
    window.canRedo = historyIndex < history.length - 1;
  }, [historyIndex, history.length]);

  const saveState = useCallback(() => {
    try {
      const currentState = query.serialize();
      setHistory((prev) => {
        const newHistory = prev.slice(0, historyIndex + 1);
        newHistory.push(currentState);
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
      const previousState = history[historyIndex - 1];
      try {
        actions.deserialize(previousState);
        setHistoryIndex(historyIndex - 1);
      } catch (error) {
        console.error('Error undoing:', error);
      }
    }
  }, [history, historyIndex, actions]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      try {
        actions.deserialize(nextState);
        setHistoryIndex(historyIndex + 1);
      } catch (error) {
        console.error('Error redoing:', error);
      }
    }
  }, [history, historyIndex, actions]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  return {
    saveState,
    undo,
    redo,
    canUndo,
    canRedo,
  };
};
