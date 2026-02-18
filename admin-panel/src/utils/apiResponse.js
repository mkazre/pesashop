/**
 * Utility to extract data from API responses
 * Handles different response structures from the backend
 * 
 * @param {Object} response - The response from react-query (axios response)
 * @returns {Array} - The data array
 */
export function extractData(response) {
  if (!response) return [];
  
  // React Query returns axios response, so response.data is the server JSON
  const serverResponse = response.data || response;
  
  // Server response structure: { success: true, data: [...], pagination: {...} }
  if (serverResponse?.data && Array.isArray(serverResponse.data)) {
    return serverResponse.data;
  }
  
  // Fallback: if serverResponse is directly an array
  if (Array.isArray(serverResponse)) {
    return serverResponse;
  }
  
  // Fallback: if response.data is an array (direct data)
  if (Array.isArray(response.data)) {
    return response.data;
  }
  
  return [];
}

/**
 * Extract pagination info from API response
 * @param {Object} response - The response from react-query
 * @returns {Object} - Pagination object
 */
export function extractPagination(response) {
  if (!response) return null;
  
  const serverResponse = response.data || response;
  
  if (serverResponse?.pagination) {
    return serverResponse.pagination;
  }
  
  if (serverResponse?.total !== undefined) {
    return {
      total: serverResponse.total,
      page: serverResponse.page || 1,
      limit: serverResponse.limit || 20,
      pages: Math.ceil((serverResponse.total || 0) / (serverResponse.limit || 20))
    };
  }
  
  return null;
}
