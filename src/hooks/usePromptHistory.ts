import { useState, useCallback } from 'react';
import { addPromptToHistory, loadPromptHistory, savePromptHistory } from '../utils/storage';

interface UsePromptHistoryReturn {
  history: string[];
  addPrompt: (prompt: string) => void;
}

export function usePromptHistory(): UsePromptHistoryReturn {
  const [history, setHistory] = useState<string[]>(() => loadPromptHistory());

  const addPrompt = useCallback((prompt: string) => {
    setHistory((prev) => {
      const next = addPromptToHistory(prev, prompt);
      savePromptHistory(next);
      return next;
    });
  }, []);

  return { history, addPrompt };
}
