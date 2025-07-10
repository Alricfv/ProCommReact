/**
 * API Configuration Utility
 * 
 * Handles API URL management with primary/fallback logic:
 * 1. Tries primary API (VM) first
 * 2. Falls back to local API if VM is unavailable
 */

// Get URLs from environment variables or use defaults
const PRIMARY_API_URL = process.env.REACT_APP_PRIMARY_API_URL || "https://40.76.138.219.nip.io";
const FALLBACK_API_URL = process.env.REACT_APP_FALLBACK_API_URL || "http://localhost:5000";

/**
 * Make a fetch request with automatic fallback to secondary API if primary fails
 */
export async function fetchWithFallback(endpoint, options = {}) {
  console.log(`Attempting request to primary API: ${PRIMARY_API_URL}${endpoint}`);
  
  // Try primary server first (VM)
  try {
    // Create a timeout of 5 seconds for VM requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const primaryResponse = await fetch(`${PRIMARY_API_URL}${endpoint}`, {
      ...options,
      // Add timeout to prevent long waits if VM is slow
      signal: options.signal || controller.signal
    });
    
    clearTimeout(timeoutId); // Clear the timeout
    
    if (primaryResponse.ok) {
      console.log("Primary API request successful");
      return primaryResponse;
    }
    console.log(`Primary API returned status: ${primaryResponse.status}`);
  } catch (e) {
    console.log(`Primary API request failed: ${e.message}`);
  }
  
  // If primary fails, try fallback (local)
  console.log(`Attempting fallback API: ${FALLBACK_API_URL}${endpoint}`);
  return fetch(`${FALLBACK_API_URL}${endpoint}`, options);
}

/**
 * Helper for common GET requests
 */
export async function getJSON(endpoint, options = {}) {
  const response = await fetchWithFallback(endpoint, options);
  return response.json();
}

/**
 * Helper for POST with JSON body
 */
export async function postJSON(endpoint, data, options = {}) {
  return fetchWithFallback(endpoint, {
    ...options,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    body: JSON.stringify(data)
  });
}

/**
 * Helper for POST with FormData body
 */
export async function postFormData(endpoint, formData, options = {}) {
  return fetchWithFallback(endpoint, {
    ...options,
    method: 'POST',
    body: formData
  });
}

export default {
  fetchWithFallback,
  getJSON,
  postJSON,
  postFormData,
  PRIMARY_API_URL,
  FALLBACK_API_URL
};
