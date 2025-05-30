# HackerNews Navigator (hnav)

A Chrome extension that provides intuitive keyboard navigation and "save for later" functionality for HackerNews

## Features

### 🎯 Target Pages
- HackerNews front page (`news.ycombinator.com/`)
- Newest stories (`news.ycombinator.com/newest`)
- Past stories (`news.ycombinator.com/past`)
- All paginated pages (e.g., `?p=2`, `?p=3`, etc.)

### ⌨️ Keyboard Navigation

#### Story Navigation
- **↑/↓ Arrow Keys** or **j/k**: Navigate between story entries
- **Enter**: Open selected story in current tab
- **Shift + Enter**: Open selected story in new tab
- **o**: Open selected story in current tab
- **Shift + O**: Open selected story in new tab
- **m**: Go to next page (follows "More" link)
- **Shift + S**: Save current story for later
- **Command/Ctrl + K**: Open saved entries modal

#### Modal Navigation
- **↑/↓ Arrow Keys** or **j/k**: Navigate through saved entries
- **Enter**: Open selected entry in new tab
- **Delete/Backspace**: Remove entry (with confirmation)
- **Escape**: Close modal or cancel deletion

### 💾 Save for Later
- Local storage for saved entries (URL + title + HN link + timestamp)
- Beautiful in-page modal interface for managing saved stories
- Visual feedback when saving stories ("Saved for later!" notification)
- Duplicate detection (prevents saving the same story twice)
- Delete entries with confirmation dialog
- Comprehensive keyboard shortcuts guide in modal

### 🎨 Design
- Minimal, clean aesthetic inspired by Raycast and Arc
- Subtle selection outlines that don't interfere with HN's design
- Smooth animations and transitions
- Professional typography and spacing
- Keyboard shortcuts guide integrated into modal

### 🔄 Smart Page Handling
- Automatic reinitialization when navigating between HN pages
- Works seamlessly with "more" button and pagination
- Maintains functionality across all HackerNews navigation patterns
- Preserves modal state and keyboard shortcuts

## Installation

### From Source (Development)
1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension folder
5. The extension will now be active on HackerNews pages

### Usage
1. Navigate to any supported HackerNews page
2. Use **j/k** or arrow keys to navigate between stories
3. Use **Enter** or **Shift+Enter** to open stories
4. Use **o** or **Shift+O** to open comments
5. Use **Shift+S** to save stories for later
6. Press **Command/Ctrl + K** to view and manage your saved stories

## Keyboard Shortcuts Summary

| Shortcut | Action |
|----------|--------|
| `↑`/`↓` or `j`/`k` | Navigate stories |
| `Enter` | Open story in current tab |
| `Shift + Enter` | Open story in new tab |
| `o` | Open selected story in current tab |
| `Shift + O` | Open selected story in new tab |
| `m` | Go to next page (follows "More" link) |
| `Shift + S` | Save story for later |
| `⌘/Ctrl + K` | Open saved entries modal |

### In Modal
| Shortcut | Action |
|----------|--------|
| `↑`/`↓` or `j`/`k` | Navigate saved entries |
| `Enter` | Open entry |
| `Delete`/`Backspace` | Remove entry |
| `Esc` | Close modal |

## File Structure
```
hacker-news-extension/
├── manifest.json           # Extension configuration
├── content_script.js       # Main navigation and modal logic
├── styles.css             # Visual styling
├── background.js          # Service worker
└── README.md             # This file
```

## Technical Details
- **Manifest Version**: 3
- **Permissions**: `storage` (for saving entries locally)
- **Target Sites**: `*://news.ycombinator.com/*`
- **Storage**: Chrome local storage for saved entries
- **Architecture**: Content script with automatic page change detection

## Browser Compatibility
- Chrome (Manifest V3)
- Other Chromium-based browsers (Edge, Brave, etc.)

## Contributing
Feel free to submit issues and feature requests!
