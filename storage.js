/**
 * Utility functions for Chrome storage operations
 */

// Save a new entry to storage
async function saveEntry(entry) {
  try {
    // Get existing entries
    const result = await chrome.storage.local.get(['savedEntries']);
    const savedEntries = result.savedEntries || [];
    
    // Check if entry already exists (by URL)
    const existingIndex = savedEntries.findIndex(saved => saved.url === entry.url);
    
    if (existingIndex === -1) {
      // Add new entry with timestamp
      const entryWithTimestamp = {
        ...entry,
        savedAt: Date.now()
      };
      savedEntries.push(entryWithTimestamp);
      
      // Save back to storage
      await chrome.storage.local.set({ savedEntries });
      return true; // Successfully saved
    } else {
      return false; // Already exists
    }
  } catch (error) {
    console.error('Error saving entry:', error);
    return false;
  }
}

// Get all saved entries
async function getSavedEntries() {
  try {
    const result = await chrome.storage.local.get(['savedEntries']);
    return result.savedEntries || [];
  } catch (error) {
    console.error('Error getting saved entries:', error);
    return [];
  }
}

// Remove an entry by URL
async function removeEntry(url) {
  try {
    const result = await chrome.storage.local.get(['savedEntries']);
    const savedEntries = result.savedEntries || [];
    
    const filteredEntries = savedEntries.filter(entry => entry.url !== url);
    await chrome.storage.local.set({ savedEntries: filteredEntries });
    return true;
  } catch (error) {
    console.error('Error removing entry:', error);
    return false;
  }
}

// Clear all saved entries
async function clearAllEntries() {
  try {
    await chrome.storage.local.set({ savedEntries: [] });
    return true;
  } catch (error) {
    console.error('Error clearing entries:', error);
    return false;
  }
}
