/**
 * Background script for HackerNews Navigator
 */

// Handle extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('HackerNews Navigator extension installed');
});
