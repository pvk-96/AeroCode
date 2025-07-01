# How to Download AeroCode Source Code

## Quick Start Options

### Option 1: Download from Replit (Recommended)
1. Click the **three dots menu** (⋮) in the top-right corner of Replit
2. Select **"Download as zip"** or **"Export"**
3. This will download the complete project as a zip file

### Option 2: Clone with Git (If Repository)
```bash
git clone [repository-url]
cd aerocode
npm install
npm run dev
```

### Option 3: Manual File Copy
Copy these key files and folders to recreate the project:

## Essential Project Structure

```
aerocode/
├── client/
│   ├── src/
│   │   ├── components/ui/          # UI components
│   │   ├── hooks/                  # React hooks
│   │   ├── lib/                    # Utilities
│   │   ├── pages/
│   │   │   └── editor.tsx          # Main editor component
│   │   ├── App.tsx                 # Main app
│   │   ├── main.tsx                # Entry point
│   │   └── index.css               # Styles
│   └── index.html                  # HTML template
├── server/
│   ├── index.ts                    # Server entry
│   ├── routes.ts                   # API routes
│   ├── storage.ts                  # Data storage
│   └── vite.ts                     # Vite setup
├── shared/
│   └── schema.ts                   # Database schema
├── package.json                    # Dependencies
├── vite.config.ts                  # Build config
├── tailwind.config.ts              # Tailwind setup
├── tsconfig.json                   # TypeScript config
└── replit.md                       # Project documentation
```

## Setup Instructions After Download

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

3. **Open in browser:**
   Navigate to `http://localhost:5000`

## Key Dependencies
- React + TypeScript
- Vite (build tool)
- Express.js (server)
- Monaco Editor (code editor)
- Tailwind CSS + shadcn/ui (styling)
- Wouter (routing)

## Features Included
- Multi-language code editor with syntax highlighting
- File save/load functionality
- Code execution simulation with output panel
- Dark theme interface
- Keyboard shortcuts
- Responsive design

The complete source code is ready to run on any system with Node.js installed!