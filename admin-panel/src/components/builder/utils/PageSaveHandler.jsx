import { useEditor } from '@craftjs/core';

export const usePageSave = () => {
  const { query, actions } = useEditor((state) => ({
    query: state.query,
    actions: state.actions,
  }));

  const savePage = async () => {
    try {
      // Serialize the current editor state
      const json = query.serialize();
      return json;
    } catch (error) {
      console.error('Error saving page:', error);
      throw error;
    }
  };

  const loadPage = async (components) => {
    try {
      if (!components || Object.keys(components).length === 0) {
        return false;
      }
      
      // Deserialize the component tree
      actions.deserialize(components);
      return true;
    } catch (error) {
      console.error('Error loading page:', error);
      return false;
    }
  };

  return { savePage, loadPage };
};
