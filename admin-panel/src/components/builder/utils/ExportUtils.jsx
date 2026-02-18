// Utility functions for exporting pages/templates

export const exportPageAsJSON = (pageData) => {
  const exportData = {
    name: pageData.name,
    slug: pageData.slug,
    templateType: pageData.templateType,
    components: pageData.components,
    dynamicBindings: pageData.dynamicBindings,
    seo: pageData.seo,
    metadata: pageData.metadata,
    exportedAt: new Date().toISOString(),
    version: '1.0',
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${pageData.slug || 'page'}-${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const importPageFromJSON = (jsonData) => {
  // Validate JSON structure
  if (!jsonData.components) {
    throw new Error('Invalid page JSON: missing components');
  }

  return {
    name: jsonData.name || 'Imported Page',
    slug: jsonData.slug || `imported-${Date.now()}`,
    templateType: jsonData.templateType || 'page',
    components: jsonData.components,
    dynamicBindings: jsonData.dynamicBindings || {},
    seo: jsonData.seo || {},
    metadata: jsonData.metadata || {},
  };
};

// Flutter export preparation (for future implementation)
export const prepareFlutterExport = (components) => {
  // This will be implemented in Part B
  return {
    widgets: [],
    styles: {},
    dependencies: [],
  };
};
