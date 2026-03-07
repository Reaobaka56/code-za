# scott_za

A minimal, high-performance multi-language code runner built by students for students.

![code-za Preview](https://img.shields.io/badge/code--za-v1.0-000000?style=flat)

## Features

- **🎯 Multi-Language Support**: C++, Python, Java, JavaScript, HTML, React
- **👀 Real-time Preview**: HTML and React components render instantly with fixed blank screen issues
- **⚡ Lightning Fast**: Optimized for speed with zero setup time
- **🔗 GitHub Integration**: Clone repositories directly into the editor
- **📝 Version History**: Save and revert code snapshots
- **🤖 AI Code Completions**: Intelligent suggestions for ALL languages powered by Google Gemini
- **💾 Auto-Save**: Automatic saving to browser storage every 3 seconds
- **⌨️ Keyboard Shortcuts**: Complete keyboard navigation support
- **📱 Responsive Design**: Works flawlessly on desktop, tablet, and mobile
- **🎨 Light/Dark Mode**: Toggle between themes on the fly
- **📦 File Explorer**: Create, organize, and manage multiple files and folders
- **✨ Error Handling**: Real-time error display with helpful messages

## Quick Start

Prerequisites: Node.js (16+)

1. Install dependencies:

```bash
npm install
```

2. Run development server:

```bash
npm run dev
```

3. Build for production:

```bash
npm run build
```

## Features in Detail

### Multi-File Support
- Create and organize multiple files in folders
- Switch between files with instant preview
- Automatic language detection from file extension
- All files in a project auto-saved locally

### Code Completion for All Languages
code-za includes intelligent AI-powered code completion for **ALL supported languages**:

- **JavaScript** - Full ES6+ syntax support
- **Python** - Python 3 completion
- **C++** - Modern C++ patterns
- **Java** - Java 8+ patterns
- **HTML** - DOM and element suggestions
- **React** - JSX and React hook completions

### How to Use Completions

1. **Automatic**: Type for 3+ characters and wait 800ms for suggestions
2. **Manual**: Press `Ctrl+G` (Mac: `Cmd+G`) anytime to trigger completion
3. **Navigation**:
   - ↑↓ Arrow keys to browse suggestions
   - Enter to accept highlighted suggestion
   - Escape to close panel
   - Click any suggestion to insert it

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+G` / `Cmd+G` | Trigger code completions |
| `↑` / `↓` | Navigate suggestions (when shown) |
| `Enter` | Accept highlighted suggestion |
| `Escape` | Close suggestions panel |
| `Ctrl+S` / `Cmd+S` | Save snapshot to history |

### Cloning Repositories

You can clone any GitHub repository directly into code-za:

1. Click the **Clone Repository** button in the playground
2. Enter a GitHub repository URL (e.g., `https://github.com/owner/repo`)
3. The repository structure will be loaded into the file explorer
4. Start editing and running code immediately

Supported repository types:
- Any public GitHub repository
- Multi-language projects
- Nested folder structures

### Preview Stack
- **HTML**: Live preview with auto-wrap for incomplete HTML
- **React**: Pre-loaded React 18 + ReactDOM with Babel transpilation
- **Real-time**: Changes update preview instantly with proper error boundaries

## Configuration

### Environment Variables

```bash
# Required for AI code completion
GEMINI_API_KEY=your_gemini_api_key

# Optional: GitHub integration
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# DevOps
NODE_ENV=production  # or development
```

Get your `GEMINI_API_KEY` from [Google Generative AI](https://makersuite.google.com/app/apikey)

```bash
export GEMINI_API_KEY=your_api_key_here
```

Get your API key from [Google's Generative AI](https://makersuite.google.com/app/apikey)

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+G` / `Cmd+G` | Trigger completions manually |
| `↑` `↓` | Navigate through suggestions |
| `Enter` | Accept highlighted suggestion |
| `Escape` | Close suggestions panel |

## Deployment

### Docker

Build and run with Docker:

```bash
docker-compose up --build
```

The application will be available at `http://localhost:3000`

Environment variables (set in `.env`):
- `GEMINI_API_KEY` - Google Gemini API key
- `GITHUB_CLIENT_ID` - GitHub OAuth client ID
- `GITHUB_CLIENT_SECRET` - GitHub OAuth client secret
- `APP_URL` - Application URL (default: http://localhost:3000)

## Troubleshooting

### White/Blank Preview Screen

If the code preview appears blank when running HTML or React:

1. Check browser console for errors (F12)
2. Ensure your HTML has a valid `<body>` tag
3. For React: verify you're using valid React 18 syntax
4. Click "Run" button to refresh the preview

### Language Runtime Not Found

Some languages may not be available in the web sandbox (C++, Java). For local development:

1. Install the necessary compiler/runtime
2. Run the development server locally with `npm run dev`
3. Use Docker for a consistent environment across systems

## Notes

### Frontend
| Tool | Version | Purpose |
|------|---------|---------|
| ![React](https://img.shields.io/badge/React-19.0.0-61DAFB?style=flat&logo=react&logoColor=white) | UI Framework | Building interactive UI |
| ![TypeScript](https://img.shields.io/badge/TypeScript-5.8.2-3178C6?style=flat&logo=typescript&logoColor=white) | Language | Type-safe development |
| ![Vite](https://img.shields.io/badge/Vite-6.2.0-646CFF?style=flat&logo=vite&logoColor=white) | Build Tool | Fast frontend bundling |
| ![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4.1.14-06B6D4?style=flat&logo=tailwindcss&logoColor=white) | Styling | Utility-first CSS |
| ![Monaco](https://img.shields.io/badge/Monaco%20Editor-Latest-007ACC?style=flat&logo=visual-studio-code&logoColor=white) | Component | Code editor |
| ![Prismjs](https://img.shields.io/badge/Prismjs-1.30.0-F1E05A?style=flat&logo=github&logoColor=white) | Library | Syntax highlighting |
| ![Motion](https://img.shields.io/badge/Motion-12.23.24-000000?style=flat) | Library | Animations |

### Backend
| Tool | Version | Purpose |
|------|---------|---------|
| ![Express.js](https://img.shields.io/badge/Express.js-4.21.2-000000?style=flat&logo=express&logoColor=white) | Framework | Web server |
| ![Node.js](https://img.shields.io/badge/Node.js-16%2B-339933?style=flat&logo=node.js&logoColor=white) | Runtime | JavaScript runtime |
| ![TSX](https://img.shields.io/badge/TSX-4.21.0-3178C6?style=flat&logo=typescript&logoColor=white) | Tool | TypeScript executor |
| ![SQLite](https://img.shields.io/badge/SQLite-12.4.1-003B57?style=flat&logo=sqlite&logoColor=white) | Database | Data storage |

### External Services & APIs
| Service | Purpose |
|---------|---------|
| ![Google Cloud](https://img.shields.io/badge/Google%20Gemini-Latest-4285F4?style=flat&logo=google&logoColor=white) | AI code assistance |
| ![Firebase](https://img.shields.io/badge/Firebase-12.9.0-FFCA28?style=flat&logo=firebase&logoColor=white) | Auth & Database |
| ![GitHub](https://img.shields.io/badge/GitHub%20Octokit-5.0.5-181717?style=flat&logo=github&logoColor=white) | Repository integration |

### DevOps
| Tool | Purpose |
|------|---------|
| ![Docker](https://img.shields.io/badge/Docker-Latest-2496ED?style=flat&logo=docker&logoColor=white) | Containerization |
| ![Docker Compose](https://img.shields.io/badge/Docker%20Compose-3.9-2496ED?style=flat&logo=docker&logoColor=white) | Orchestration |

## Notes

- This repository was cleaned to remove AI Studio template metadata and branding.
- If you plan to use any external API keys, add them to an `.env` file and do not commit secrets to the repository.

## License

MIT
