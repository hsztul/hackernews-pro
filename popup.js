/**
 * Popup script for saved entries modal
 */

class SavedEntriesModal {
  constructor() {
    this.entries = [];
    this.selectedIndex = 0;
    this.deleteConfirmation = null;
    this.pendingDeleteUrl = null;
    
    this.entriesList = document.getElementById('entriesList');
    this.emptyState = document.getElementById('emptyState');
    this.loadingState = document.getElementById('loadingState');
    this.entryCount = document.getElementById('entryCount');
    
    this.init();
  }
  
  async init() {
    this.addKeyboardListeners();
    await this.loadEntries();
  }
  
  async loadEntries() {
    try {
      this.entries = await this.getSavedEntries();
      this.updateUI();
    } catch (error) {
      console.error('Error loading entries:', error);
      this.showError();
    }
  }
  
  async getSavedEntries() {
    // Use the same function from storage.js
    try {
      const result = await chrome.storage.local.get(['savedEntries']);
      return result.savedEntries || [];
    } catch (error) {
      console.error('Error getting saved entries:', error);
      return [];
    }
  }
  
  updateUI() {
    this.loadingState.style.display = 'none';
    
    if (this.entries.length === 0) {
      this.showEmptyState();
    } else {
      this.showEntries();
    }
    
    this.updateEntryCount();
  }
  
  showEmptyState() {
    this.entriesList.style.display = 'none';
    this.emptyState.style.display = 'flex';
  }
  
  showEntries() {
    this.emptyState.style.display = 'none';
    this.entriesList.style.display = 'block';
    this.renderEntries();
    this.selectEntry(0);
  }
  
  showError() {
    this.loadingState.innerHTML = `
      <div style="color: #ff6b6b;">
        <p>Error loading saved entries</p>
        <p style="font-size: 11px; margin-top: 8px;">Try refreshing the extension</p>
      </div>
    `;
  }
  
  renderEntries() {
    this.entriesList.innerHTML = '';
    
    this.entries.forEach((entry, index) => {
      const entryElement = this.createEntryElement(entry, index);
      this.entriesList.appendChild(entryElement);
    });
  }
  
  createEntryElement(entry, index) {
    const div = document.createElement('div');
    div.className = 'entry-item';
    div.dataset.index = index;
    
    // Extract domain from URL
    const domain = this.extractDomain(entry.url);
    
    // Format saved date
    const savedDate = this.formatDate(entry.savedAt);
    
    div.innerHTML = `
      <div class="entry-title">${this.escapeHtml(entry.title)}</div>
      <div class="entry-meta">
        <span class="entry-domain">${domain}</span>
        <span class="entry-date">${savedDate}</span>
      </div>
    `;
    
    return div;
  }
  
  extractDomain(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return 'unknown';
    }
  }
  
  formatDate(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;
    
    if (diff < minute) {
      return 'just now';
    } else if (diff < hour) {
      const minutes = Math.floor(diff / minute);
      return `${minutes}m ago`;
    } else if (diff < day) {
      const hours = Math.floor(diff / hour);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diff / day);
      return `${days}d ago`;
    }
  }
  
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  updateEntryCount() {
    this.entryCount.textContent = this.entries.length;
  }
  
  selectEntry(index) {
    if (this.entries.length === 0) return;
    
    // Remove previous selection
    const prevSelected = this.entriesList.querySelector('.selected');
    if (prevSelected) {
      prevSelected.classList.remove('selected');
    }
    
    // Ensure index is within bounds
    if (index < 0) index = this.entries.length - 1;
    if (index >= this.entries.length) index = 0;
    
    this.selectedIndex = index;
    
    // Add selection to new entry
    const entries = this.entriesList.querySelectorAll('.entry-item');
    if (entries[this.selectedIndex]) {
      entries[this.selectedIndex].classList.add('selected');
      entries[this.selectedIndex].scrollIntoView({
        block: 'nearest',
        behavior: 'smooth'
      });
    }
  }
  
  openSelectedEntry() {
    if (this.entries.length === 0 || this.selectedIndex < 0) return;
    
    const entry = this.entries[this.selectedIndex];
    if (entry && entry.url) {
      // Open in new tab
      chrome.tabs.create({ url: entry.url });
      
      // Close the popup
      window.close();
    }
  }
  
  async deleteSelectedEntry() {
    if (this.entries.length === 0 || this.selectedIndex < 0) return;
    
    const entry = this.entries[this.selectedIndex];
    if (!entry) return;
    
    console.log('Delete key pressed for entry:', entry);
    
    if (this.deleteConfirmation) {
      // Already showing confirmation, proceed with deletion
      console.log('Confirming deletion...');
      await this.confirmDelete();
    } else {
      // Show confirmation
      console.log('Showing delete confirmation...');
      this.showDeleteConfirmation(entry);
    }
  }
  
  showDeleteConfirmation(entry) {
    console.log('Creating delete confirmation overlay for:', entry.title);
    this.pendingDeleteUrl = entry.url;
    
    const overlay = document.createElement('div');
    overlay.className = 'delete-confirmation';
    overlay.innerHTML = `
      <div class="delete-confirmation-content">
        <h3>Delete saved entry?</h3>
        <p>"${this.escapeHtml(entry.title)}"</p>
        <div class="confirmation-buttons">
          <span>Press <kbd>Delete</kbd> again to confirm or <kbd>Esc</kbd> to cancel</span>
        </div>
      </div>
    `;
    
    document.body.appendChild(overlay);
    this.deleteConfirmation = overlay;
    console.log('Delete confirmation overlay created and added to DOM');
  }
  
  async confirmDelete() {
    console.log('confirmDelete called, pendingDeleteUrl:', this.pendingDeleteUrl);
    if (!this.pendingDeleteUrl) return;
    
    try {
      console.log('Attempting to remove entry from storage...');
      // Remove from storage
      const success = await this.removeEntry(this.pendingDeleteUrl);
      console.log('Remove entry result:', success);
      
      if (success) {
        // Remove from local array
        const beforeCount = this.entries.length;
        this.entries = this.entries.filter(entry => entry.url !== this.pendingDeleteUrl);
        const afterCount = this.entries.length;
        console.log(`Entries count: ${beforeCount} -> ${afterCount}`);
        
        // Update UI
        this.hideDeleteConfirmation();
        this.updateUI();
        
        // Adjust selection if needed
        if (this.selectedIndex >= this.entries.length) {
          this.selectedIndex = Math.max(0, this.entries.length - 1);
        }
        
        if (this.entries.length > 0) {
          this.selectEntry(this.selectedIndex);
        }
        
        console.log('Entry successfully deleted and UI updated');
      } else {
        console.error('Failed to remove entry from storage');
        this.hideDeleteConfirmation();
      }
      
    } catch (error) {
      console.error('Error deleting entry:', error);
      this.hideDeleteConfirmation();
    }
  }
  
  async removeEntry(url) {
    console.log('removeEntry called with URL:', url);
    try {
      const result = await chrome.storage.local.get(['savedEntries']);
      const savedEntries = result.savedEntries || [];
      console.log('Current saved entries count:', savedEntries.length);
      
      const filteredEntries = savedEntries.filter(entry => entry.url !== url);
      console.log('Filtered entries count:', filteredEntries.length);
      
      await chrome.storage.local.set({ savedEntries: filteredEntries });
      console.log('Successfully updated storage');
      return true;
    } catch (error) {
      console.error('Error removing entry:', error);
      return false;
    }
  }
  
  hideDeleteConfirmation() {
    console.log('hideDeleteConfirmation called');
    if (this.deleteConfirmation) {
      console.log('Removing delete confirmation overlay');
      document.body.removeChild(this.deleteConfirmation);
      this.deleteConfirmation = null;
      this.pendingDeleteUrl = null;
    } else {
      console.log('No delete confirmation overlay to remove');
    }
  }
  
  addKeyboardListeners() {
    document.addEventListener('keydown', (event) => {
      console.log('Popup key pressed:', event.key, 'Delete confirmation showing:', !!this.deleteConfirmation);
      
      // If confirmation dialog is showing, only handle Delete and Escape
      if (this.deleteConfirmation) {
        if (event.key === 'Delete' || event.key === 'Backspace') {
          event.preventDefault();
          console.log('Delete/Backspace key pressed during confirmation');
          this.confirmDelete();
        } else if (event.key === 'Escape') {
          event.preventDefault();
          console.log('Escape key pressed during confirmation');
          this.hideDeleteConfirmation();
        }
        return;
      }
      
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          this.selectEntry(this.selectedIndex + 1);
          break;
          
        case 'ArrowUp':
          event.preventDefault();
          this.selectEntry(this.selectedIndex - 1);
          break;
          
        case 'Enter':
          event.preventDefault();
          this.openSelectedEntry();
          break;
          
        case 'Delete':
        case 'Backspace':
          event.preventDefault();
          console.log('Initial delete/backspace key pressed');
          this.deleteSelectedEntry();
          break;
          
        case 'Escape':
          event.preventDefault();
          window.close();
          break;
      }
    });
  }
}

// Initialize the modal when the popup loads
document.addEventListener('DOMContentLoaded', () => {
  new SavedEntriesModal();
});
