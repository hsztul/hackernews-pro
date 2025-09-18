# HackerNews Keyboard Navigation Chrome Extension: Detailed Dev Plan

**Project Name:** hnav

**Overall Goal:** To provide intuitive keyboard navigation and a "save for later" functionality for HackerNews main listing pages, with a minimal and cool aesthetic inspired by Raycast/Arc.

## Scope & Requirements

### Target Pages
- HackerNews "new" and "past" pages only (to start)
- Focus on main story links, not comments

### Core Features
- **Arrow Key Navigation:** Up/down arrows navigate between story entries
- **Entry Actions:**
  - `Enter`: Opens selected entry in current tab
  - `Shift+Enter`: Opens comments in new tab
  - `Shift+O`: Opens entry in new tab
  - `Shift+S`: Saves current selected entry
- **Saved Entries Modal:** 
  - `Command+K`: Opens modal with saved entries
  - Arrow keys navigate within modal
  - `Enter`: Opens selected saved entry
  - `Delete`: Removes entry (with confirmation)
- **Data Storage:** Local storage for saved entries (URL + title + HN link)
- **Visual Design:** Very minimal, very cool aesthetic (inspired by Raycast/Arc)

---

## Phase 1: Core Navigation & Selection

**Module:** `content_script.js` (for injecting into HN pages) & `styles.css`

### Tasks

#### 1. DOM Element Identification
- [x] Identify the main container element for HackerNews entries (e.g., `<table>` with class `itemlist`)
- [x] Identify individual story entry elements within this container
- [x] Each entry typically consists of a `<tr>` containing the rank, title, URL, score, and comments link
- [x] Parse these to extract the URL, title, and comments URL

#### 2. Initial State & Selection
- [x] On page load, identify the first visible story entry and apply a "selected" class to it
- [x] Maintain an internal variable `selectedIndex` to track the currently selected entry

#### 3. Keyboard Event Listener
- [x] Add a global keyboard event listener to `document` for `keydown` events
- [x] Filter events to only respond when a specific key is pressed and not within an input field
- [x] Prevent interference with HN's existing functionality (like search)

#### 4. Arrow Key Navigation (`ArrowUp`, `ArrowDown`)
**Logic:**
- [x] When `ArrowDown` is pressed: Increment `selectedIndex`
  - [x] If it exceeds the number of entries, wrap around to the first entry
- [x] When `ArrowUp` is pressed: Decrement `selectedIndex`
  - [x] If it goes below zero, wrap around to the last entry

**Visual Update:**
- [x] Remove the "selected" class from the previously selected entry
- [x] Add the "selected" class to the newly selected entry
- [x] Ensure the selected entry is scrolled into view if it's off-screen using `scrollIntoView({ block: 'nearest' })`

#### 5. Visual Indication (Outline)
**CSS (`styles.css`):**
- [x] Define a CSS class (e.g., `.hn-selected-entry`) that applies a subtle outline
- [x] Use minimal, cool color and thickness that complements HN's existing design
- [x] This CSS will be injected into the page

**Injection:**
- [x] The `content_script.js` will dynamically add/remove this class

---

## Phase 2: Actions & Persistence

**Module:** `content_script.js`, `background.js`, `storage.js` (helper), `manifest.json`

### Tasks

#### 1. Open Entry (`Enter`)
- [x] When `Enter` is pressed: Get the URL of the currently selected main story link
- [x] Navigate the current tab to this URL using `window.location.href = url`

#### 2. Open Entry in New Tab (`Shift+O`)
- [x] When `Shift+O` is pressed: Get the URL of the currently selected main story link
- [x] Open a new tab with this URL using `window.open(url, '_blank')`

#### 3. Open Comments (`Shift+Enter`)
- [x] When `Shift+Enter` is pressed: Get the URL of the comments section for the currently selected story
- [x] Parse the HN entry to find the comments link
- [x] Open a new tab with the comments URL

#### 4. Save Entry (`Shift+S`)
**Data Structure:**
```javascript
{
  url: string,        // The actual story URL
  title: string,      // Story title
  hnLink: string,     // HackerNews post URL
  savedAt: number     // Timestamp
}
```

**Local Storage (`storage.js`):**
- [x] Implement functions to `saveEntry(entry)` and `getSavedEntries()` using `chrome.storage.local`
- [x] Handle potential errors (e.g., storage full, although unlikely for this data)

**Logic:**
- [x] When `Shift+S` is pressed: Extract the URL, title, and HackerNews post URL from the current selected entry
- [x] Call `saveEntry()` to store it
- [x] Provide subtle visual feedback that the entry has been saved (e.g., temporary "Saved!" notification)

#### 5. Manifest Permissions
- [x] Update `manifest.json` to include necessary permissions:
- [x] `activeTab` (for `window.open` and `window.location.href` context)
- [x] `storage` (for saving entries)

---

## Phase 3: Saved Entries Modal (Raycast/Arc Inspired)

**Module:** `popup.html`, `popup.css`, `popup.js`, `background.js` (for communication)

### Tasks

#### 1. Modal Trigger (`Command+K` / `Meta+K`)
**`background.js`:**
- [x] Listen for a `chrome.commands` shortcut
- [x] When triggered, open the extension's popup
- [x] The popup itself will contain the modal

#### 2. Modal UI (`popup.html`, `popup.css`)
**HTML Structure:**
- [x] Create a minimal, clean HTML structure for the modal
- [x] Display a list of saved entries

**Styling (`popup.css`):**
- [x] Implement the "very minimal, very cool" aesthetic, drawing inspiration from Raycast/Arc:
- [x] Dark theme with clean typography
- [x] Subtle shadows/borders
- [x] No unnecessary visual clutter
- [x] Centered layout with appropriate sizing
- [x] Consider dark/light mode support

#### 3. Loading Saved Entries (`popup.js`)
- [x] On `popup.html` load, call `getSavedEntries()` from `storage.js`
- [x] `popup.js` can directly access `chrome.storage`
- [x] Render the saved entries dynamically into the modal's list

#### 4. Modal Navigation (`ArrowUp`, `ArrowDown`)
- [x] Similar to Phase 1, add keyboard event listeners within the modal
- [x] Implement selection logic and visual outline for the selected saved entry within the modal

#### 5. Open Saved Entry (`Enter` in Modal)
- [x] When `Enter` is pressed while a saved entry is selected in the modal: Get its `url`
- [x] Open the URL in a new tab (as the modal itself is not a content page)
- [x] Close the modal after opening (optional, but likely desired)

#### 6. Delete Saved Entry (`Delete` in Modal)
**Confirmation:**
- [x] Before deletion, display a brief, non-intrusive confirmation message within the modal
- [x] Example: "Press Delete again to confirm"

**If confirmed:**
- [x] Remove the entry from `chrome.storage.local`
- [x] Update the modal UI to reflect the deletion

#### 7. Close Modal (`Escape`)
- [x] Add a keyboard event listener for `Escape` to close the modal (and thus the popup)

---

## Phase 4: Refinements & Edge Cases

**Module:** All relevant modules

### Tasks

#### 1. Error Handling & Robustness
- [x] Gracefully handle cases where elements aren't found on the HN page
- [x] Account for potential changes in HN's DOM structure
- [x] Add basic error logging

#### 2. Performance
- [x] Ensure keyboard event listeners are efficient and don't cause jank
- [x] Optimize DOM manipulation

#### 3. User Experience
- [x] Consider adding subtle animation to the outline selection for smoothness
- [x] Provide clear feedback for save/delete actions
- [x] Ensure accessibility considerations

#### 4. Manifest Configuration
- [x] Set `matches` in `manifest.json` to target only:
- [x] `*://news.ycombinator.com/*`
- [x] `*://news.ycombinator.com/newest*`
- [x] Any other specific paths for "new" and "past" pages

#### 5. Code Structure & Comments
- [x] Ensure the code is well-organized, modular, and has clear comments
- [x] Make it easy for future modifications and debugging

---

## Final Deliverables

### File Structure
```
hn-nav-extension/
├── manifest.json
├── content_script.js
├── background.js
├── storage.js (utility file for local storage interactions)
├── styles.css (for injecting into HN pages for selection outline)
├── popup.html (for the saved entries modal)
├── popup.css (for modal styling)
└── popup.js (for modal logic)
```

### Key Files Description
- **`manifest.json`**: Extension configuration and permissions
- **`content_script.js`**: Main navigation logic, injected into HN pages
- **`background.js`**: Background processes and communication
- **`storage.js`**: Utility functions for local storage interactions
- **`styles.css`**: CSS for selection outline on HN pages
- **`popup.html`**: HTML structure for saved entries modal
- **`popup.css`**: Styling for modal (Raycast/Arc inspired)
- **`popup.js`**: Modal logic and saved entries management

---

## Verification Checklist

### Core Navigation
- [x] Arrow key navigation correctly highlights entries on new/past pages
- [x] `Enter` opens selected entry in current tab
- [x] `Shift+Enter` opens comments in new tab
- [x] `Shift+O` opens selected entry in new tab
- [x] Navigation wraps around correctly at list boundaries

### Saving Functionality
- [x] `Shift+S` successfully saves entries to local storage
- [x] Saved entries include URL, title, and HN link
- [x] Visual feedback confirms successful save

### Saved Entries Modal
- [x] `Command+K` opens the modal
- [x] Modal displays all saved entries
- [x] Arrow navigation works within modal with visual feedback
- [x] `Enter` opens selected saved entry in new tab
- [x] `Delete` removes entry with confirmation prompt
- [x] `Escape` closes modal

### Design & UX
- [x] Overall look and feel is minimal and cool
- [x] Design aligns with Raycast/Arc aesthetic inspiration
- [x] No interference with existing HN functionality
- [x] Smooth, responsive interactions

### Technical
- [x] Extension only activates on specified HN pages
- [x] No console errors or performance issues
- [x] Graceful handling of DOM structure changes
- [x] Proper error handling and edge cases