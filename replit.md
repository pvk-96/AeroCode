# AeroCode - Multi-Language Code Editor

## Project Overview
AeroCode is a simple, modern web-based code editor designed for beginner programmers. It provides syntax highlighting for multiple programming languages in a clean, minimal interface.

## User Preferences
- App name: AeroCode
- Simple and minimal design
- Dark theme inspired by Cursor AI IDE (without AI features)
- Focus on beginners and simplicity
- Multi-language support

## Project Architecture
- **Frontend**: React with Vite
- **Backend**: Express.js (minimal API)
- **Storage**: In-memory (MemStorage)
- **Code Editor**: Monaco Editor for syntax highlighting
- **Languages Supported**: Python, JavaScript, HTML, CSS, Java, C++, C
- **UI Framework**: Tailwind CSS + shadcn/ui components

## Key Features
- Multi-language syntax highlighting
- Real-time error detection and display
- Simple code execution with output display
- Local file save/load functionality
- Clean, minimal UI with navigation
- Dark theme only
- Responsive design
- Keyboard shortcuts for all major operations
- Auto-language detection from file extensions
- VS Code-style problem panel with clickable errors
- Advanced editor settings (font size, word wrap, minimap)
- Code history with auto-save functionality
- Code formatting and beautification
- Enhanced toolbar with professional features
- Settings panel for customizing editor behavior
- Local code history with timestamps and language tracking

## File Operations
- **Save:** Download code to local computer (Ctrl+S)
- **Open:** Load local files into editor (Ctrl+O)
- **New:** Create new file with template (Ctrl+N)
- **Run:** Execute code with simple output (Ctrl+Enter)
- **Clear:** Clear editor content
- **Auto-detect:** Language detection from file extensions

## Recent Changes
- Initial project setup with modern full-stack architecture
- Implemented data schema for files and projects
- Set up Monaco Editor integration
- Created minimal UI inspired by Cursor IDE
- Added simple code execution simulation with output panel
- Implemented Run button and keyboard shortcuts for code execution
- Added output panel that displays text-based results only
- Added local file save/load functionality with auto-language detection
- Implemented comprehensive keyboard shortcuts for file operations
- Added real-time error detection for all supported languages
- Implemented VS Code-style problem panel with clickable error navigation
- Added error count display in header and status bar
- Enhanced error detection with improved syntax checking for JavaScript
- Added comprehensive C language support with syntax highlighting and error detection
- Improved code execution simulation with better parsing for all languages
- Added C-specific error detection for missing includes and syntax errors
- Enhanced Java execution simulation to handle complex programs, loops, and user input
- Improved Python execution simulation with f-strings, loops, and variable handling
- Added better support for arithmetic expressions and string concatenation in all languages
- Added professional editor settings panel with font size, word wrap, and minimap controls
- Implemented code history system with local storage and timestamp tracking
- Added auto-save functionality with 30-second intervals when enabled
- Enhanced toolbar with formatting, history, and settings buttons
- Improved user experience with modal panels for settings and history management
- Added visual feedback for all editor state changes and configurations

## Development Status
- ✓ Project initialization
- ✓ Core editor functionality implemented
- ✓ Simple output display system added
- → Further refinements and feature additions as needed