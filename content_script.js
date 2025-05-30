/**
 * HackerNews Keyboard Navigation Content Script
 */

class HackerNewsNavigator {
  constructor() {
    this.currentIndex = -1;
    this.selectedIndex = 0;
    this.entries = [];
    this.isInitialized = false;
    this.savedEntriesModal = null;
    this.modalEntries = [];
    this.modalSelectedIndex = 0;
    this.deleteConfirmation = null;
    this.pendingDeleteUrl = null;
    this.currentUrl = window.location.href;
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init());
    } else {
      this.init();
    }
    
    // Listen for page changes (for SPA-like navigation)
    this.setupPageChangeDetection();
  }
  
  setupPageChangeDetection() {
    // Watch for URL changes
    let lastUrl = location.href;
    new MutationObserver(() => {
      const url = location.href;
      if (url !== lastUrl) {
        lastUrl = url;
        this.handlePageChange();
      }
    }).observe(document, { subtree: true, childList: true });
    
    // Also listen for popstate events (back/forward navigation)
    window.addEventListener('popstate', () => {
      setTimeout(() => this.handlePageChange(), 100);
    });
    
    // Listen for clicks on HN links that might change the page content
    document.addEventListener('click', (event) => {
      const target = event.target.closest('a');
      if (target && target.href && target.href.includes('news.ycombinator.com')) {
        // Give the page time to load new content
        setTimeout(() => this.handlePageChange(), 500);
      }
    });
  }
  
  handlePageChange() {
    // Close any open modals
    if (this.savedEntriesModal) {
      this.closeSavedEntriesModal();
    }
    
    // Reset state
    this.currentIndex = -1;
    this.selectedIndex = 0;
    this.entries = [];
    this.isInitialized = false;
    
    // Wait a bit for content to load, then reinitialize
    setTimeout(() => {
      this.init();
    }, 200);
  }
  
  async init() {
    // Clear any existing highlights
    this.clearAllHighlights();
    
    // Find entries on the current page
    this.findEntries();
    
    if (this.entries.length > 0) {
      this.selectEntry(0);
      
      // Only add keyboard listeners once
      if (!this.isInitialized) {
        this.addKeyboardListeners();
        this.addModalStyles();
      }
      
      this.isInitialized = true;
    } else {
      // If no entries found immediately, try again after a short delay
      if (!this.isInitialized) {
        setTimeout(() => {
          if (!this.isInitialized) {
            this.init();
          }
        }, 500);
      }
    }
  }
  
  clearAllHighlights() {
    // Remove highlights from all entries
    document.querySelectorAll('.hn-selected-entry').forEach(entry => {
      entry.classList.remove('hn-selected-entry');
    });
  }
  
  debugDOMStructure() {
    // Check for different possible table structures
    const tables = document.querySelectorAll('table');
    
    tables.forEach((table, index) => {
      const className = table.className;
      const id = table.id;
    });
    
    // Check for itemlist table specifically
    const itemTable = document.querySelector('table.itemlist');
    
    if (itemTable) {
      const rows = itemTable.querySelectorAll('tr');
      
      // Check for different row patterns
      const athingRows = itemTable.querySelectorAll('tr.athing');
      const allRows = itemTable.querySelectorAll('tr');
      
      // Log first few rows to understand structure
      for (let i = 0; i < Math.min(5, allRows.length); i++) {
        const row = allRows[i];
        const className = row.className;
        const id = row.id;
        const innerHTML = row.innerHTML.substring(0, 100);
      }
    }
  }
  
  findEntries() {
    // Find all story entries in the main table
    // Try different table selectors since HN structure has changed
    let itemTable = document.querySelector('table.itemlist');
    
    if (!itemTable) {
      // Try the main HN table by ID
      itemTable = document.querySelector('table#hnmain');
    }
    
    if (!itemTable) {
      // Try any table that might contain stories
      const tables = document.querySelectorAll('table');
      itemTable = Array.from(tables).find(table => {
        const rows = table.querySelectorAll('tr');
        return rows.length > 5; // Assume story table has multiple rows
      });
    }
    
    if (!itemTable) {
      return;
    }
    
    // Try different approaches to find story rows
    // Method 1: Look for rows with .athing class (traditional approach)
    let storyRows = itemTable.querySelectorAll('tr.athing');
    
    // Method 2: Look for rows that contain story titles and ranks
    if (storyRows.length === 0) {
      const allRows = itemTable.querySelectorAll('tr');
      storyRows = Array.from(allRows).filter(row => {
        // Check if row contains a story link and a rank number
        const links = row.querySelectorAll('a[href]');
        const hasExternalLink = Array.from(links).some(link => 
          link.href.match(/^https?:\/\//) && 
          !link.href.includes('news.ycombinator.com')
        );
        const hasRank = row.textContent.match(/^\s*\d+\./);
        return hasExternalLink && hasRank;
      });
    }
    
    // Method 3: Look for rows with numbered ranks (1., 2., 3., etc.)
    if (storyRows.length === 0) {
      const allRows = itemTable.querySelectorAll('tr');
      storyRows = Array.from(allRows).filter(row => {
        const firstCell = row.querySelector('td:first-child');
        if (!firstCell) return false;
        const text = firstCell.textContent.trim();
        return /^\d+\.$/.test(text);
      });
    }
    
    // Method 4: Look for rows containing title spans or divs
    if (storyRows.length === 0) {
      const allRows = itemTable.querySelectorAll('tr');
      storyRows = Array.from(allRows).filter(row => {
        const titleElement = row.querySelector('.title, .storylink, [class*="title"]');
        return titleElement !== null;
      });
    }
    
    // Debug: Let's see what we're working with
    if (storyRows.length === 0) {
      const allRows = itemTable.querySelectorAll('tr');
      
      // Show first few rows for analysis
      for (let i = 0; i < Math.min(10, allRows.length); i++) {
        const row = allRows[i];
        const cells = row.querySelectorAll('td');
        const links = row.querySelectorAll('a');
        const className = row.className;
        const id = row.id;
        const firstCellText = cells[0]?.textContent?.trim()?.substring(0, 20);
        const linkCount = links.length;
      }
    }
    
    this.entries = Array.from(storyRows);
  }
  
  selectEntry(index) {
    // Remove previous selection
    const prevSelected = document.querySelector('.hn-selected-entry');
    if (prevSelected) {
      prevSelected.classList.remove('hn-selected-entry', 'hn-saved-feedback');
    }
    
    // Ensure index is within bounds
    if (index < 0) index = this.entries.length - 1;
    if (index >= this.entries.length) index = 0;
    
    this.selectedIndex = index;
    
    // Add selection to new entry
    if (this.entries[this.selectedIndex]) {
      this.entries[this.selectedIndex].classList.add('hn-selected-entry');
      
      // Scroll into view if needed
      this.entries[this.selectedIndex].scrollIntoView({
        block: 'nearest',
        behavior: 'smooth'
      });
    }
  }
  
  getCurrentEntry() {
    return this.entries[this.selectedIndex];
  }
  
  getEntryData(entry) {
    if (!entry) return null;
    
    // Try multiple approaches to get story data
    let titleLink, url, title, hnLink;
    
    // Method 1: Look for .titleline > a (current HN structure)
    titleLink = entry.querySelector('.titleline > a');
    
    // Method 2: Look for any link that's not to HN itself
    if (!titleLink) {
      const links = entry.querySelectorAll('a[href]');
      titleLink = Array.from(links).find(link => 
        !link.href.includes('news.ycombinator.com') && 
        link.href.match(/^https?:\/\//)
      );
    }
    
    // Method 3: Look for the first external link
    if (!titleLink) {
      titleLink = entry.querySelector('a[href^="http"]');
    }
    
    if (!titleLink) {
      return null;
    }
    
    url = titleLink.href;
    title = titleLink.textContent.trim();
    
    // Get HN post URL (comments link)
    const storyId = entry.id || entry.querySelector('[id]')?.id;
    if (storyId) {
      hnLink = `https://news.ycombinator.com/item?id=${storyId}`;
    } else {
      // Fallback: look for comments link
      const commentsLink = entry.querySelector('a[href*="item?id="]');
      hnLink = commentsLink ? commentsLink.href : url;
    }
    
    return { url, title, hnLink };
  }
  
  addKeyboardListeners() {
    document.addEventListener('keydown', (event) => {
      // Don't interfere if user is typing in an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName)) {
        return;
      }
      
      // Check if we're in the saved entries modal
      if (this.savedEntriesModal) {
        // If delete confirmation is showing, only handle Delete and Escape
        if (this.deleteConfirmation) {
          if (event.key === 'Delete' || event.key === 'Backspace') {
            event.preventDefault();
            this.confirmModalDelete();
          } else if (event.key === 'Escape') {
            event.preventDefault();
            this.hideModalDeleteConfirmation();
          }
          return;
        }
        
        // Modal navigation
        switch (event.key) {
          case 'ArrowDown':
          case 'j':
          case 'J':
            event.preventDefault();
            this.selectModalEntry(this.modalSelectedIndex + 1);
            break;
            
          case 'ArrowUp':
          case 'k':
          case 'K':
            event.preventDefault();
            this.selectModalEntry(this.modalSelectedIndex - 1);
            break;
            
          case 'Enter':
            event.preventDefault();
            this.openSelectedModalEntry();
            break;
            
          case 'Delete':
          case 'Backspace':
            event.preventDefault();
            this.deleteSelectedModalEntry();
            break;
            
          case 'Escape':
            event.preventDefault();
            this.closeSavedEntriesModal();
            break;
        }
        return;
      }
      
      // Command/Ctrl + K to open saved entries modal
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        this.showSavedEntriesModal();
        return;
      }
      
      // Regular navigation (only if modal is not open)
      switch (event.key) {
        case 'ArrowDown':
        case 'j':
        case 'J':
          event.preventDefault();
          this.selectNext();
          break;
          
        case 'ArrowUp':
        case 'k':
        case 'K':
          event.preventDefault();
          this.selectPrevious();
          break;
          
        case 'Enter':
          if (event.shiftKey) {
            event.preventDefault();
            this.openInNewTab();
          } else {
            event.preventDefault();
            this.openInCurrentTab();
          }
          break;
          
        case 'O':
        case 'o':
          if (event.shiftKey) {
            event.preventDefault();
            this.openInNewTab();
          } else {
            event.preventDefault();
            this.openInCurrentTab();
          }
          break;
          
        case 'S':
        case 's':
          if (event.shiftKey) {
            event.preventDefault();
            this.saveCurrentEntry();
          }
          break;
      }
    });
  }
  
  addModalStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .hn-saved-entries-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.3);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        backdrop-filter: blur(5px);
      }
      
      .hn-modal-content {
        background: #ffffff;
        border-radius: 12px;
        width: 90%;
        max-width: 600px;
        max-height: 80vh;
        border: 1px solid #e1e5e9;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
        overflow: hidden;
      }
      
      .hn-modal-header {
        padding: 20px 24px 16px;
        border-bottom: 1px solid #e1e5e9;
        background: #f8f9fa;
      }
      
      .hn-modal-title {
        color: #1a1a1a;
        font-size: 18px;
        font-weight: 600;
        margin: 0;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }
      
      .hn-modal-subtitle {
        color: #6c757d;
        font-size: 14px;
        margin: 4px 0 0 0;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }
      
      .hn-entries-list {
        max-height: 400px;
        overflow-y: auto;
        padding: 0;
      }
      
      .hn-entry-item {
        padding: 16px 24px;
        border-bottom: 1px solid #f1f3f4;
        cursor: pointer;
        transition: all 0.2s ease;
        background: #ffffff;
      }
      
      .hn-entry-item:hover {
        background: #f8f9fa;
      }
      
      .hn-entry-item.selected {
        background: #007aff;
        color: white;
      }
      
      .hn-entry-item.selected .hn-entry-url {
        color: #cce7ff;
      }
      
      .hn-entry-title {
        color: #1a1a1a;
        font-size: 16px;
        font-weight: 500;
        margin: 0 0 8px 0;
        line-height: 1.4;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }
      
      .hn-entry-url {
        color: #6c757d;
        font-size: 13px;
        margin: 0;
        font-family: monospace;
        word-break: break-all;
      }
      
      .hn-modal-footer {
        padding: 16px 24px;
        background: #f8f9fa;
        border-top: 1px solid #e1e5e9;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .hn-keyboard-shortcuts {
        display: flex;
        gap: 32px;
        justify-content: center;
        width: 100%;
      }
      
      .hn-shortcuts-section {
        flex: 1;
        max-width: 250px;
      }
      
      .hn-shortcuts-section h4 {
        color: #1a1a1a;
        font-size: 14px;
        font-weight: 600;
        margin: 0 0 12px 0;
        text-align: center;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }
      
      .hn-shortcuts-grid {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 8px 16px;
        align-items: center;
      }
      
      .hn-shortcuts-grid span:nth-child(odd) {
        text-align: right;
        white-space: nowrap;
      }
      
      .hn-shortcuts-grid span:nth-child(even) {
        color: #495057;
        font-size: 13px;
        text-align: left;
      }
      
      .hn-keyboard-hint {
        color: #6c757d;
        font-size: 12px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }
      
      .hn-keyboard-hint kbd {
        background: #e9ecef;
        color: #495057;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 11px;
        margin: 0 2px;
        border: 1px solid #ced4da;
      }
      
      .hn-delete-confirmation {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.4);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10001;
      }
      
      .hn-delete-confirmation-content {
        background: #ffffff;
        border-radius: 12px;
        padding: 24px;
        max-width: 400px;
        border: 1px solid #e1e5e9;
        text-align: center;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
      }
      
      .hn-delete-confirmation-content h3 {
        color: #dc3545;
        margin: 0 0 12px 0;
        font-size: 18px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }
      
      .hn-delete-confirmation-content p {
        color: #495057;
        margin: 0 0 20px 0;
        font-size: 14px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }
      
      .hn-confirmation-buttons span {
        color: #6c757d;
        font-size: 13px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }
      
      .hn-empty-state {
        text-align: center;
        padding: 60px 24px;
        color: #6c757d;
      }
      
      .hn-empty-state h3 {
        margin: 0 0 8px 0;
        font-size: 16px;
        color: #495057;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }
      
      .hn-empty-state p {
        margin: 0;
        font-size: 14px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }
    `;
    document.head.appendChild(style);
  }
  
  openInCurrentTab() {
    const entry = this.getCurrentEntry();
    const data = this.getEntryData(entry);
    
    if (data && data.url) {
      window.location.href = data.url;
    }
  }
  
  openInNewTab() {
    const entry = this.getCurrentEntry();
    const data = this.getEntryData(entry);
    
    if (data && data.url) {
      window.open(data.url, '_blank');
    }
  }
  
  openComments() {
    const entry = this.getCurrentEntry();
    const data = this.getEntryData(entry);
    
    if (data && data.hnLink) {
      window.open(data.hnLink, '_blank');
    }
  }
  
  openCommentsInCurrentTab() {
    const entry = this.getCurrentEntry();
    const data = this.getEntryData(entry);
    
    if (data && data.hnLink) {
      window.location.href = data.hnLink;
    }
  }
  
  async saveCurrentEntry() {
    const entry = this.getCurrentEntry();
    
    if (!entry) {
      return;
    }
    
    const data = this.getEntryData(entry);
    
    if (!data || !data.url || !data.title) {
      return;
    }
    
    try {
      // Get existing saved entries
      const result = await chrome.storage.local.get(['savedEntries']);
      const savedEntries = result.savedEntries || [];
      
      // Check if already saved
      const isAlreadySaved = savedEntries.some(saved => saved.url === data.url);
      if (isAlreadySaved) {
        this.showAlreadySavedFeedback(entry);
        return;
      }
      
      // Add new entry
      const newEntry = {
        url: data.url,
        title: data.title,
        hnLink: data.hnLink,
        savedAt: new Date().toISOString()
      };
      
      savedEntries.unshift(newEntry); // Add to beginning
      
      // Save to storage
      await chrome.storage.local.set({ savedEntries });
      
      // Show visual feedback
      this.showSavedFeedback(entry);
      
    } catch (error) {
      console.error('Error saving entry:', error);
    }
  }
  
  showSavedFeedback(entry) {
    // Add saved styling
    entry.classList.add('hn-saved-feedback');
    
    // Create and show "Saved!" text
    const savedText = document.createElement('div');
    savedText.className = 'hn-saved-text';
    savedText.textContent = 'Saved!';
    entry.appendChild(savedText);
    
    // Remove feedback after animation
    setTimeout(() => {
      entry.classList.remove('hn-saved-feedback');
      if (savedText.parentNode) {
        savedText.parentNode.removeChild(savedText);
      }
    }, 2000);
  }
  
  showAlreadySavedFeedback(entry) {
    // Create and show "Already saved!" text
    const savedText = document.createElement('div');
    savedText.className = 'hn-saved-text';
    savedText.textContent = 'Already saved!';
    savedText.style.background = '#ff9500'; // Orange color for "already saved"
    entry.appendChild(savedText);
    
    // Remove feedback after animation
    setTimeout(() => {
      if (savedText.parentNode) {
        savedText.parentNode.removeChild(savedText);
      }
    }, 2000);
  }
  
  async showSavedEntriesModal() {
    // Load saved entries
    try {
      const result = await chrome.storage.local.get(['savedEntries']);
      this.modalEntries = result.savedEntries || [];
    } catch (error) {
      console.error('Error loading saved entries:', error);
      this.modalEntries = [];
    }
    
    // Create modal
    this.savedEntriesModal = document.createElement('div');
    this.savedEntriesModal.className = 'hn-saved-entries-modal';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'hn-modal-content';
    
    // Header
    const header = document.createElement('div');
    header.className = 'hn-modal-header';
    header.innerHTML = `
      <h2 class="hn-modal-title">Saved Entries</h2>
      <p class="hn-modal-subtitle">${this.modalEntries.length} saved stories</p>
    `;
    
    // Content
    const content = document.createElement('div');
    content.className = 'hn-entries-list';
    
    if (this.modalEntries.length === 0) {
      content.innerHTML = `
        <div class="hn-empty-state">
          <h3>No saved entries</h3>
          <p>Press <kbd>Shift</kbd> + <kbd>S</kbd> to save stories for later</p>
        </div>
      `;
    } else {
      this.modalEntries.forEach((entry, index) => {
        const entryElement = document.createElement('div');
        entryElement.className = 'hn-entry-item';
        if (index === this.modalSelectedIndex) {
          entryElement.classList.add('selected');
        }
        
        entryElement.innerHTML = `
          <h3 class="hn-entry-title">${this.escapeHtml(entry.title)}</h3>
          <p class="hn-entry-url">${this.escapeHtml(entry.url)}</p>
        `;
        
        content.appendChild(entryElement);
      });
    }
    
    // Footer
    const footer = document.createElement('div');
    footer.className = 'hn-modal-footer';
    footer.innerHTML = `
      <div class="hn-keyboard-shortcuts">
        <div class="hn-shortcuts-section">
          <h4>Modal Navigation</h4>
          <div class="hn-shortcuts-grid">
            <span><kbd>↑</kbd><kbd>↓</kbd> or <kbd>j</kbd><kbd>k</kbd></span><span>Navigate</span>
            <span><kbd>Enter</kbd></span><span>Open entry</span>
            <span><kbd>Delete</kbd></span><span>Remove entry</span>
            <span><kbd>Esc</kbd></span><span>Close modal</span>
          </div>
        </div>
        <div class="hn-shortcuts-section">
          <h4>Main Navigation</h4>
          <div class="hn-shortcuts-grid">
            <span><kbd>↑</kbd><kbd>↓</kbd> or <kbd>j</kbd><kbd>k</kbd></span><span>Navigate stories</span>
            <span><kbd>Enter</kbd> / <kbd>Shift</kbd>+<kbd>Enter</kbd></span><span>Open story</span>
            <span><kbd>o</kbd> / <kbd>Shift</kbd>+<kbd>O</kbd></span><span>Open story</span>
            <span><kbd>Shift</kbd>+<kbd>S</kbd></span><span>Save story</span>
            <span><kbd>⌘</kbd>+<kbd>K</kbd></span><span>Open this modal</span>
          </div>
        </div>
      </div>
    `;
    
    modalContent.appendChild(header);
    modalContent.appendChild(content);
    modalContent.appendChild(footer);
    this.savedEntriesModal.appendChild(modalContent);
    
    // Add to page
    document.body.appendChild(this.savedEntriesModal);
    
    // Focus modal for keyboard events
    this.savedEntriesModal.focus();
    
    // Add click outside to close
    this.savedEntriesModal.addEventListener('click', (e) => {
      if (e.target === this.savedEntriesModal) {
        this.closeSavedEntriesModal();
      }
    });
  }
  
  closeSavedEntriesModal() {
    if (this.savedEntriesModal) {
      document.body.removeChild(this.savedEntriesModal);
      this.savedEntriesModal = null;
      this.modalSelectedIndex = 0;
    }
    
    // Also close any delete confirmation
    this.hideModalDeleteConfirmation();
  }
  
  selectModalEntry(index) {
    if (this.modalEntries.length === 0) return;
    
    // Wrap around selection
    if (index < 0) {
      this.modalSelectedIndex = this.modalEntries.length - 1;
    } else if (index >= this.modalEntries.length) {
      this.modalSelectedIndex = 0;
    } else {
      this.modalSelectedIndex = index;
    }
    
    // Update UI
    const entryItems = this.savedEntriesModal.querySelectorAll('.hn-entry-item');
    entryItems.forEach((item, i) => {
      if (i === this.modalSelectedIndex) {
        item.classList.add('selected');
      } else {
        item.classList.remove('selected');
      }
    });
    
    // Scroll into view
    if (entryItems[this.modalSelectedIndex]) {
      entryItems[this.modalSelectedIndex].scrollIntoView({ 
        behavior: 'smooth', 
        block: 'nearest' 
      });
    }
  }
  
  openSelectedModalEntry() {
    if (this.modalEntries.length === 0) return;
    
    const entry = this.modalEntries[this.modalSelectedIndex];
    if (entry) {
      window.open(entry.url, '_blank');
      this.closeSavedEntriesModal();
    }
  }
  
  async deleteSelectedModalEntry() {
    if (this.modalEntries.length === 0 || this.modalSelectedIndex < 0) return;
    
    const entry = this.modalEntries[this.modalSelectedIndex];
    if (!entry) return;
    
    if (this.deleteConfirmation) {
      // Already showing confirmation, proceed with deletion
      await this.confirmModalDelete();
    } else {
      // Show confirmation
      this.showModalDeleteConfirmation(entry);
    }
  }
  
  showModalDeleteConfirmation(entry) {
    this.pendingDeleteUrl = entry.url;
    
    const overlay = document.createElement('div');
    overlay.className = 'hn-delete-confirmation';
    overlay.innerHTML = `
      <div class="hn-delete-confirmation-content">
        <h3>Delete saved entry?</h3>
        <p>"${this.escapeHtml(entry.title)}"</p>
        <div class="hn-confirmation-buttons">
          <span>Press <kbd>Delete</kbd> again to confirm or <kbd>Esc</kbd> to cancel</span>
        </div>
      </div>
    `;
    
    document.body.appendChild(overlay);
    this.deleteConfirmation = overlay;
  }
  
  async confirmModalDelete() {
    if (!this.pendingDeleteUrl) return;
    
    try {
      // Remove from storage
      const success = await this.removeModalEntry(this.pendingDeleteUrl);
      
      if (success) {
        // Remove from local array
        const beforeCount = this.modalEntries.length;
        this.modalEntries = this.modalEntries.filter(entry => entry.url !== this.pendingDeleteUrl);
        const afterCount = this.modalEntries.length;
        
        // Update UI
        this.hideModalDeleteConfirmation();
        
        // Adjust selection if needed
        if (this.modalSelectedIndex >= this.modalEntries.length) {
          this.modalSelectedIndex = Math.max(0, this.modalEntries.length - 1);
        }
        
        // Refresh the modal content
        this.refreshModalContent();
      } else {
        console.error('Failed to remove entry from storage');
        this.hideModalDeleteConfirmation();
      }
      
    } catch (error) {
      console.error('Error deleting modal entry:', error);
      this.hideModalDeleteConfirmation();
    }
  }
  
  async removeModalEntry(url) {
    try {
      const result = await chrome.storage.local.get(['savedEntries']);
      const savedEntries = result.savedEntries || [];
      
      const filteredEntries = savedEntries.filter(entry => entry.url !== url);
      
      await chrome.storage.local.set({ savedEntries: filteredEntries });
      return true;
    } catch (error) {
      console.error('Error removing modal entry:', error);
      return false;
    }
  }
  
  hideModalDeleteConfirmation() {
    if (this.deleteConfirmation) {
      document.body.removeChild(this.deleteConfirmation);
      this.deleteConfirmation = null;
      this.pendingDeleteUrl = null;
    }
  }
  
  refreshModalContent() {
    if (!this.savedEntriesModal) return;
    
    // Update header
    const subtitle = this.savedEntriesModal.querySelector('.hn-modal-subtitle');
    if (subtitle) {
      subtitle.textContent = `${this.modalEntries.length} saved stories`;
    }
    
    // Update content
    const content = this.savedEntriesModal.querySelector('.hn-entries-list');
    if (content) {
      content.innerHTML = '';
      
      if (this.modalEntries.length === 0) {
        content.innerHTML = `
          <div class="hn-empty-state">
            <h3>No saved entries</h3>
            <p>Press <kbd>Shift</kbd> + <kbd>S</kbd> to save stories for later</p>
          </div>
        `;
      } else {
        this.modalEntries.forEach((entry, index) => {
          const entryElement = document.createElement('div');
          entryElement.className = 'hn-entry-item';
          if (index === this.modalSelectedIndex) {
            entryElement.classList.add('selected');
          }
          
          entryElement.innerHTML = `
            <h3 class="hn-entry-title">${this.escapeHtml(entry.title)}</h3>
            <p class="hn-entry-url">${this.escapeHtml(entry.url)}</p>
          `;
          
          content.appendChild(entryElement);
        });
      }
    }
  }
  
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  selectNext() {
    this.selectEntry(this.selectedIndex + 1);
  }
  
  selectPrevious() {
    this.selectEntry(this.selectedIndex - 1);
  }
  
  openCommentsInNewTab() {
    const entry = this.getCurrentEntry();
    const data = this.getEntryData(entry);
    if (data.hnLink) {
      window.open(data.hnLink, '_blank');
    }
  }
}

// Initialize the navigator
const navigator = new HackerNewsNavigator();
