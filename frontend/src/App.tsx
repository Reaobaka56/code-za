import React, { useState, useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import SimpleEditor from "react-simple-code-editor";
import { highlight, languages } from "prismjs";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-python";
import "prismjs/components/prism-java";
import "prismjs/components/prism-c";
import "prismjs/components/prism-cpp";
import "prismjs/components/prism-markup";
import "prismjs/components/prism-jsx";
import "prismjs/themes/prism-tomorrow.css";
import { 
  Play, 
  Terminal as TerminalIcon, 
  Loader2, 
  AlertCircle, 
  CheckCircle2,
  Clock,
  Cpu,
  Layers,
  User,
  Download,
  ArrowRight,
  Zap,
  Shield,
  Code,
  X,
  Cookie,
  FileText,
  Copy,
  Eye,
  Monitor,
  Command,
  Sun,
  Moon,
  Menu,
  LogIn,
  LogOut,
  History,
  Save,
  RotateCcw,
  ShieldCheck,
  Check,
  ChevronRight,
  ChevronDown,
  FolderPlus,
  FilePlus,
  Folder,
  Trash2,
  AlertTriangle,
  Github
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import axios from "axios";
import JSZip from "jszip";

type Language = "cpp" | "python" | "java" | "javascript" | "html" | "react";
type View = "landing" | "playground";
type Tab = "output" | "preview" | "terminal";

interface ExecutionResult {
  output: string;
  error: string;
  duration: number;
}

interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  parentId: string | null;
  content?: string;
  language?: Language;
}

const DEFAULT_CODE: Record<Language, string> = {
  cpp: `#include <iostream>\n\nint main() {\n    std::cout << "Hello from code-za!" << std::endl;\n    return 0;\n}`,
  python: `print("Hello from code-za!")\n\n# Quick logic test\nnums = [x for x in range(10) if x % 2 == 0]\nprint(f"Even numbers: {nums}")`,
  java: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello from code-za!");\n    }\n}`,
  javascript: `console.log("Hello from code-za!");\n\nconst greet = (name) => \`Welcome to the student-built runner, \${name}!\`;\nconsole.log(greet("Student"));`,
  html: `<!DOCTYPE html>\n<html>\n<head>\n  <style>\n    body { \n      background: #050505; \n      color: white; \n      font-family: sans-serif; \n      display: flex; \n      justify-content: center; \n      align-items: center; \n      height: 100vh; \n      margin: 0; \n    }\n    h1 { \n      font-size: 3rem; \n      letter-spacing: -2px; \n    }\n  </style>\n</head>\n<body>\n  <h1>Hello code-za</h1>\n</body>\n</html>`,
  react: `// Simple React example - React and ReactDOM are pre-loaded
const { useState } = window.React;
const root = window.ReactDOM.createRoot(document.getElementById('root'));

function App() {
  const [count, setCount] = useState(0);

  return (
    <div style={{ 
      padding: '40px', 
      color: 'white', 
      fontFamily: 'sans-serif', 
      textAlign: 'center',
      background: '#050505',
      minHeight: '100vh'
    }}>
      <h1 style={{ letterSpacing: '-2px', marginBottom: '20px' }}>React on code-za</h1>
      <p style={{ marginBottom: '20px', fontSize: '18px' }}>Count: <strong>{count}</strong></p>
      <button 
        onClick={() => setCount(c => c + 1)}
        style={{ 
          background: 'white', 
          color: 'black',
          border: 'none', 
          padding: '10px 20px', 
          borderRadius: '20px', 
          fontWeight: 'bold', 
          cursor: 'pointer',
          fontSize: '16px'
        }}
      >
        Increment
      </button>
    </div>
  );
}

root.render(<App />);`
};

const LANGUAGES: { id: Language; name: string }[] = [
  { id: "javascript", name: "JavaScript" },
  { id: "python", name: "Python" },
  { id: "cpp", name: "C++" },
  { id: "java", name: "Java" },
  { id: "html", name: "HTML/CSS" },
  { id: "react", name: "React" },
];

const Logo = ({ className = "w-8 h-8", theme }: { className?: string; theme: 'light' | 'dark' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="42" stroke={theme === 'dark' ? 'white' : 'black'} strokeWidth="8" />
    <text 
      x="50" 
      y="54" 
      textAnchor="middle" 
      dominantBaseline="middle" 
      fill={theme === 'dark' ? 'white' : 'black'} 
      style={{ fontSize: '42px', fontWeight: '950', fontFamily: 'system-ui, sans-serif', letterSpacing: '-1px' }}
    >
      CZ
    </text>
  </svg>
);

const CircularLoader = ({ size = 48, theme = 'dark' }: { size?: number, theme?: string }) => (
  <div className="relative" style={{ width: size, height: size }}>
    <svg className="w-full h-full rotate-[-90deg]">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={size / 2 - 4}
        fill="none"
        stroke={theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}
        strokeWidth="4"
      />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={size / 2 - 4}
        fill="none"
        stroke={theme === 'dark' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'}
        strokeWidth="4"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ 
          pathLength: [0, 0.75, 0],
          pathOffset: [0, 0.25, 1],
          opacity: [0.4, 0.8, 0.4]
        }}
        transition={{ 
          duration: 2, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
      />
    </svg>
    <motion.div 
      className="absolute inset-0 flex items-center justify-center"
      animate={{ scale: [0.9, 1.1, 0.9] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
    >
      <div className={`w-1.5 h-1.5 rounded-full ${theme === 'dark' ? 'bg-white/20' : 'bg-black/20'}`} />
    </motion.div>
  </div>
);

const ThreeDBackground = ({ theme }: { theme: 'light' | 'dark' }) => (
  <div className="hidden md:block fixed inset-0 pointer-events-none overflow-hidden">
    <style>{`
      @keyframes float1 {
        0%, 100% { transform: translate(0, 0) rotateX(0deg) rotateY(0deg); }
        33% { transform: translate(50px, 40px) rotateX(45deg) rotateY(30deg); }
        66% { transform: translate(-30px, -50px) rotateX(-30deg) rotateY(-45deg); }
      }
      @keyframes float2 {
        0%, 100% { transform: translate(0, 0) rotateX(0deg) rotateY(0deg); }
        33% { transform: translate(-60px, 30px) rotateX(-40deg) rotateY(50deg); }
        66% { transform: translate(40px, -60px) rotateX(50deg) rotateY(-30deg); }
      }
      @keyframes float3 {
        0%, 100% { transform: translate(0, 0) rotateX(0deg) rotateY(0deg); }
        33% { transform: translate(35px, -45px) rotateX(60deg) rotateY(-30deg); }
        66% { transform: translate(-50px, 50px) rotateX(-45deg) rotateY(45deg); }
      }
      @keyframes glow {
        0%, 100% { box-shadow: 0 0 30px rgba(99, 102, 241, 0.2), 0 0 60px rgba(99, 102, 241, 0.1); }
        50% { box-shadow: 0 0 50px rgba(99, 102, 241, 0.4), 0 0 100px rgba(99, 102, 241, 0.2); }
      }
      .cube3d {
        transform-style: preserve-3d;
        animation: glow 4s ease-in-out infinite;
      }
    `}</style>
    
    {/* Cube 1 - Top Left */}
    <motion.div 
      className="absolute top-[15%] left-[10%] w-24 h-24 cube3d"
      style={{
        perspective: '1200px',
        backgroundColor: theme === 'dark' ? 'rgba(99, 102, 241, 0.05)' : 'rgba(99, 102, 241, 0.03)',
        border: `2px solid ${theme === 'dark' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)'}`,
        borderRadius: '16px',
      }}
      animate={{
        rotateX: [0, 360],
        rotateY: [0, 360],
      }}
      transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
    />

    {/* Cube 2 - Bottom Right */}
    <motion.div 
      className="absolute bottom-[20%] right-[12%] w-20 h-20 cube3d"
      style={{
        perspective: '1200px',
        backgroundColor: theme === 'dark' ? 'rgba(139, 92, 246, 0.05)' : 'rgba(139, 92, 246, 0.03)',
        border: `2px solid ${theme === 'dark' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.1)'}`,
        borderRadius: '12px',
      }}
      animate={{
        rotateX: [0, -360],
        rotateY: [0, -360],
      }}
      transition={{ duration: 25, repeat: Infinity, ease: 'linear', delay: 2 }}
    />

    {/* Cube 3 - Center Right */}
    <motion.div 
      className="absolute top-[45%] right-[8%] w-16 h-16 cube3d"
      style={{
        perspective: '1200px',
        backgroundColor: theme === 'dark' ? 'rgba(59, 130, 246, 0.05)' : 'rgba(59, 130, 246, 0.03)',
        border: `2px solid ${theme === 'dark' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)'}`,
        borderRadius: '8px',
      }}
      animate={{
        rotateX: [360, 0],
        rotateY: [360, 0],
        rotateZ: [0, 360],
      }}
      transition={{ duration: 30, repeat: Infinity, ease: 'linear', delay: 4 }}
    />

    {/* Glowing line elements */}
    <motion.div 
      className="absolute top-[25%] left-[30%] w-32 h-1"
      style={{
        background: `linear-gradient(90deg, ${theme === 'dark' ? 'rgba(99, 102, 241, 0)' : 'rgba(99, 102, 241, 0)'}, ${theme === 'dark' ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.15)'}, ${theme === 'dark' ? 'rgba(99, 102, 241, 0)' : 'rgba(99, 102, 241, 0)'})`,
        borderRadius: '999px',
      }}
      animate={{ opacity: [0.3, 0.8, 0.3], rotateZ: [0, 180, 360] }}
      transition={{ duration: 6, repeat: Infinity }}
    />

    <motion.div 
      className="absolute bottom-[35%] right-[25%] w-40 h-1"
      style={{
        background: `linear-gradient(90deg, ${theme === 'dark' ? 'rgba(139, 92, 246, 0)' : 'rgba(139, 92, 246, 0)'}, ${theme === 'dark' ? 'rgba(139, 92, 246, 0.3)' : 'rgba(139, 92, 246, 0.15)'}, ${theme === 'dark' ? 'rgba(139, 92, 246, 0)' : 'rgba(139, 92, 246, 0)'})`,
        borderRadius: '999px',
      }}
      animate={{ opacity: [0.3, 0.8, 0.3], rotateZ: [360, 180, 0] }}
      transition={{ duration: 7, repeat: Infinity, delay: 1 }}
    />
  </div>
);

const LandingScreenshotBackdrop = ({ theme }: { theme: 'light' | 'dark' }) => (
  <div className="w-full max-w-4xl px-4 hidden md:block">
    <motion.div
      className={`mx-auto w-full max-w-3xl rounded-[28px] border relative overflow-hidden ${
        theme === 'dark'
          ? 'bg-[#0B1016]/70 border-white/20 shadow-[0_35px_80px_rgba(0,0,0,0.65)] liquid-glass liquid-glass-dark'
          : 'bg-[#FAF6EE]/85 border-black/10 shadow-[0_30px_70px_rgba(0,0,0,0.2)] liquid-glass liquid-glass-light'
      }`}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, ease: [0.2, 1, 0.2, 1] }}
    >
      <div className={`absolute inset-0 ${theme === 'dark' ? 'bg-[radial-gradient(circle_at_20%_-20%,rgba(146,110,255,0.24),transparent_55%),radial-gradient(circle_at_88%_15%,rgba(44,193,255,0.15),transparent_50%)]' : 'bg-[radial-gradient(circle_at_20%_-20%,rgba(146,110,255,0.2),transparent_55%),radial-gradient(circle_at_88%_15%,rgba(44,193,255,0.12),transparent_50%)]'} pointer-events-none`} />
      <div className={`h-10 px-4 border-b ${theme === 'dark' ? 'border-white/10' : 'border-black/10'} flex items-center gap-2 relative`}>
        <span className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
        <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
        <span className={`ml-3 text-[10px] font-mono ${theme === 'dark' ? 'text-white/45' : 'text-black/45'}`}>ide-screenshot.png</span>
      </div>
      <div className="p-6 space-y-4 relative">
        <div className={`h-28 rounded-2xl border ${theme === 'dark' ? 'border-white/10 bg-black/30' : 'border-black/10 bg-black/5'} p-4`}>
          <div className="grid grid-cols-3 gap-3 h-full">
            <div className={`rounded-xl ${theme === 'dark' ? 'bg-white/5' : 'bg-black/5'}`} />
            <div className={`rounded-xl ${theme === 'dark' ? 'bg-indigo-400/20' : 'bg-indigo-500/15'}`} />
            <div className={`rounded-xl ${theme === 'dark' ? 'bg-cyan-300/20' : 'bg-cyan-500/15'}`} />
          </div>
        </div>
        <div className={`rounded-2xl border ${theme === 'dark' ? 'border-white/10 bg-[#05090F]/85' : 'border-black/10 bg-white/80'} p-4 font-mono text-[11px] space-y-2`}>
          <p className={theme === 'dark' ? 'text-emerald-300/70' : 'text-emerald-700/70'}>{`const sdk = language("javascript");`}</p>
          <p className={theme === 'dark' ? 'text-sky-300/70' : 'text-sky-700/70'}>{`sdk.run("Hello, code-za");`}</p>
          <p className={theme === 'dark' ? 'text-fuchsia-300/70' : 'text-fuchsia-700/70'}>{`// preview updates in real-time`}</p>
        </div>
      </div>
      <div className="absolute -top-4 left-12 w-24 h-8 rounded-b-2xl bg-gradient-to-b from-slate-300/80 to-slate-500/50 shadow-lg" />
    </motion.div>
  </div>
);

const TestingPhaseModal = ({ theme, onContinue, onIgnore }: { theme: 'light' | 'dark'; onContinue: () => void; onIgnore: () => void }) => (
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-[120] flex items-center justify-center p-4"
  >
    {/* Backdrop */}
    <motion.div 
      initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
      animate={{ opacity: 1, backdropFilter: 'blur(12px)' }}
      exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
      className={`absolute inset-0 ${theme === 'dark' ? 'bg-black/60' : 'bg-white/60'}`}
      onClick={onIgnore}
    />

    {/* Modal Card */}
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      className={`relative w-full max-w-md p-8 rounded-3xl border backdrop-blur-xl ${
        theme === 'dark' 
          ? 'bg-[#0A0A0A]/90 border-white/10 shadow-2xl shadow-purple-500/10' 
          : 'bg-white/90 border-black/10 shadow-xl'
      }`}
    >
      {/* Decorative top border glow */}
      <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 rounded-full blur-lg ${
        theme === 'dark' ? 'bg-indigo-500/30' : 'bg-indigo-400/20'
      }`} />

      {/* Header */}
      <div className="space-y-4 mb-8">
        <div className="flex items-center gap-4">
          <motion.div 
            className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
              theme === 'dark' ? 'bg-indigo-500/20' : 'bg-indigo-400/10'
            }`}
            animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.05, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <AlertCircle className={`w-6 h-6 ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}`} />
          </motion.div>
          <div>
            <h2 className={`text-2xl font-bold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
              Testing Phase
            </h2>
            <p className={`text-xs uppercase tracking-[0.15em] font-bold ${theme === 'dark' ? 'text-indigo-400/60' : 'text-indigo-600/60'}`}>
              Early Access
            </p>
          </div>
        </div>

        <p className={`text-sm leading-relaxed ${theme === 'dark' ? 'text-white/70' : 'text-black/70'}`}>
          code-za is currently in the testing phase. Some features may be unstable or not fully optimized. We appreciate your patience as we improve the platform.
        </p>
      </div>

      {/* Features list */}
      <div className={`p-4 rounded-2xl mb-8 space-y-3 ${theme === 'dark' ? 'bg-white/5' : 'bg-black/5'}`}>
        <div className="flex items-start gap-3">
          <CheckCircle2 className={`w-4 h-4 mt-0.5 shrink-0 ${theme === 'dark' ? 'text-green-500/60' : 'text-green-600/60'}`} />
          <p className={`text-xs ${theme === 'dark' ? 'text-white/60' : 'text-black/60'}`}>
            Multi-language code execution (C++, Python, Java, JS)
          </p>
        </div>
        <div className="flex items-start gap-3">
          <CheckCircle2 className={`w-4 h-4 mt-0.5 shrink-0 ${theme === 'dark' ? 'text-green-500/60' : 'text-green-600/60'}`} />
          <p className={`text-xs ${theme === 'dark' ? 'text-white/60' : 'text-black/60'}`}>
            Real-time preview with HTML & React support
          </p>
        </div>
        <div className="flex items-start gap-3">
          <CheckCircle2 className={`w-4 h-4 mt-0.5 shrink-0 ${theme === 'dark' ? 'text-green-500/60' : 'text-green-600/60'}`} />
          <p className={`text-xs ${theme === 'dark' ? 'text-white/60' : 'text-black/60'}`}>
            GitHub integration & code sharing
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onContinue}
          className={`w-full py-3 px-6 rounded-2xl font-bold text-sm uppercase tracking-widest transition-all ${
            theme === 'dark'
              ? 'bg-white text-black hover:bg-white/90 shadow-lg shadow-white/20'
              : 'bg-black text-white hover:bg-black/90 shadow-lg shadow-black/20'
          }`}
        >
          Continue →
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onIgnore}
          className={`w-full py-3 px-6 rounded-2xl font-bold text-sm uppercase tracking-widest transition-all border ${
            theme === 'dark'
              ? 'border-white/20 text-white/60 hover:text-white hover:bg-white/5'
              : 'border-black/20 text-black/60 hover:text-black hover:bg-black/5'
          }`}
        >
          Dismiss
        </motion.button>
      </div>

      {/* Footer badge */}
      <p className={`text-center text-[10px] uppercase tracking-[0.1em] font-bold mt-6 ${
        theme === 'dark' ? 'text-white/30' : 'text-black/30'
      }`}>
        Built by students for students
      </p>
    </motion.div>
  </motion.div>
);

export default function App() {
  const [view, setView] = useState<View>("landing");
  const [activeTab, setActiveTab] = useState<Tab>("output");
  const [language, setLanguage] = useState<Language>("javascript");
  const [code, setCode] = useState<string>(DEFAULT_CODE.javascript);
  const [output, setOutput] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [duration, setDuration] = useState<number | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showCookies, setShowCookies] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showPlaygroundOptions, setShowPlaygroundOptions] = useState(false);
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [cloneUrl, setCloneUrl] = useState("");
  const [cloneLoading, setCloneLoading] = useState(false);
  const [cloneError, setCloneError] = useState("");
  const [history, setHistory] = useState<{ code: string; timestamp: number; language: Language }[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showOutputPanel, setShowOutputPanel] = useState(false);
  const [isPlaygroundMenuOpen, setIsPlaygroundMenuOpen] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [files, setFiles] = useState<FileNode[]>([
    { id: 'src-folder', name: 'src', type: 'folder', parentId: null },
    { id: 'main-file', name: 'main.js', type: 'file', parentId: 'src-folder', content: DEFAULT_CODE.javascript, language: 'javascript' }
  ]);
  const [activeFileId, setActiveFileId] = useState<string>('main-file');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['src-folder']));
  const [isSwitchingFile, setIsSwitchingFile] = useState(false);
  const [isBooting, setIsBooting] = useState(true);
  const [showFixModal, setShowFixModal] = useState<{lang: string, tool: string} | null>(null);
  const [isExploring, setIsExploring] = useState(false);
  const [githubAppInfo, setGithubAppInfo] = useState<any>(null);
  const [showTestingPhase, setShowTestingPhase] = useState(true);
  const [completionSuggestions, setCompletionSuggestions] = useState<string[]>([]);
  const [showCompletions, setShowCompletions] = useState(false);
  const [isLoadingCompletions, setIsLoadingCompletions] = useState(false);
  const [completionError, setCompletionError] = useState<string>("");
  const [highlightedIndex, setHighlightedIndex] = useState<number>(0);
  const [lastSaved, setLastSaved] = useState<number>(Date.now());
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [comingSoonMessage, setComingSoonMessage] = useState<string>("");
  const [copyStatus, setCopyStatus] = useState<string>("");
  const completionTimeoutRef = useRef<NodeJS.Timeout>();
  const autoSaveRef = useRef<NodeJS.Timeout>();
  const comingSoonTimeoutRef = useRef<NodeJS.Timeout>();
  const copyTimeoutRef = useRef<NodeJS.Timeout>();

  const handleExplore = () => {
    setIsExploring(true);
    setTimeout(() => {
      setShowPlaygroundOptions(true);
      setIsExploring(false);
    }, 800);
  };

  useEffect(() => {
    const timer = setTimeout(() => setIsBooting(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    return () => {
      if (comingSoonTimeoutRef.current) clearTimeout(comingSoonTimeoutRef.current);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    const checkGithubApp = async () => {
      try {
        const response = await axios.get('/api/github/app-info');
        setGithubAppInfo(response.data);
      } catch (err) {
        // App not configured or error
      }
    };
    checkGithubApp();

    // Try to restore auto-saved code
    try {
      const saved = localStorage.getItem('code-za-autosave');
      if (saved) {
        const data = JSON.parse(saved);
        // Only restore if user has been away for a bit or on fresh load
        if (data.code && data.timestamp) {
          // Auto-restore on app start (user can always undo with history)
          setCode(data.code);
          setLanguage(data.language || 'javascript');
          if (data.files && data.files.length > 0) {
            setFiles(data.files);
          }
          if (data.activeFileId) {
            setActiveFileId(data.activeFileId);
          }
        }
      }
    } catch (e) {
      console.log('Could not restore auto-save');
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showCompletions && completionSuggestions.length > 0) {
        // Arrow Down - move to next suggestion
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setHighlightedIndex(prev => (prev + 1) % completionSuggestions.length);
        }
        // Arrow Up - move to previous suggestion
        else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setHighlightedIndex(prev => (prev - 1 + completionSuggestions.length) % completionSuggestions.length);
        }
        // Enter - accept highlighted suggestion
        else if (e.key === 'Enter') {
          e.preventDefault();
          acceptCompletion(completionSuggestions[highlightedIndex]);
        }
        // Escape - close completions
        else if (e.key === 'Escape') {
          setShowCompletions(false);
        }
      }
      
      // Ctrl+G or Cmd+G to manually trigger completions
      if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
        e.preventDefault();
        if (code) {
          fetchCompletions(code);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (completionTimeoutRef.current) {
        clearTimeout(completionTimeoutRef.current);
      }
    };
  }, [showCompletions, completionSuggestions, highlightedIndex, code, language]);

  // Auto-save to localStorage
  useEffect(() => {
    if (!autoSaveEnabled || !code) return;

    if (autoSaveRef.current) {
      clearTimeout(autoSaveRef.current);
    }

    autoSaveRef.current = setTimeout(() => {
      try {
        const saveData = {
          code,
          language,
          timestamp: Date.now(),
          files,
          activeFileId
        };
        localStorage.setItem('code-za-autosave', JSON.stringify(saveData));
        setLastSaved(Date.now());
      } catch (e) {
        console.error('Auto-save failed:', e);
      }
    }, 3000); // Auto-save after 3 seconds of inactivity

    return () => {
      if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    };
  }, [code, language, files, activeFileId, autoSaveEnabled]);

  // Auto-execute non-HTML/React code for preview
  const autoExecuteRef = useRef<NodeJS.Timeout>();
  const isExecuting = useRef(false);
  useEffect(() => {
    // Only auto-execute for Python, C++, Java, JavaScript (not HTML/React)
    if (language === 'html' || language === 'react' || !code || !code.trim()) {
      // Reset running state when switching to HTML/React
      if (language === 'html' || language === 'react') {
        setIsRunning(false);
        setOutput("");
        setError("");
        setDuration(null);
      }
      return;
    }

    // Clear previous timeout
    if (autoExecuteRef.current) {
      clearTimeout(autoExecuteRef.current);
    }

    // Execute after 1 second of inactivity
    autoExecuteRef.current = setTimeout(async () => {
      if (isExecuting.current) return;
      isExecuting.current = true;
      
      try {
        setIsRunning(true);
        const response = await axios.post<ExecutionResult>("/api/run", {
          language,
          code
        });
        
        setOutput(response.data.output || "");
        setError(response.data.error || "");
        setDuration(response.data.duration || null);
      } catch (err: any) {
        console.error('Auto-execute error:', err);
        setError(err.response?.data?.error || "Connection error. Is the server running?");
        setOutput("");
        setDuration(null);
      } finally {
        setIsRunning(false);
        isExecuting.current = false;
      }
    }, 1000); // Auto-execute after 1 second

    return () => {
      if (autoExecuteRef.current) {
        clearTimeout(autoExecuteRef.current);
      }
    };
  }, [code, language]);

  const activeFile = files.find(f => f.id === activeFileId);

  const createFile = (parentId: string | null = null) => {
    const name = prompt("File name (e.g. index.js, script.py):");
    if (!name) return;
    const id = Math.random().toString(36).substr(2, 9);
    const ext = name.split('.').pop();
    let lang: Language = 'javascript';
    if (ext === 'py') lang = 'python';
    if (ext === 'cpp') lang = 'cpp';
    if (ext === 'java') lang = 'java';
    if (ext === 'html') lang = 'html';
    if (ext === 'jsx' || ext === 'tsx') lang = 'react';

    const newFile: FileNode = {
      id,
      name,
      type: 'file',
      parentId,
      content: DEFAULT_CODE[lang] || '',
      language: lang
    };
    setFiles([...files, newFile]);
    setActiveFileId(id);
    setLanguage(lang);
    setCode(newFile.content || '');
  };

  const createFolder = (parentId: string | null = null) => {
    const name = prompt("Folder name:");
    if (!name) return;
    const id = Math.random().toString(36).substr(2, 9);
    const newFolder: FileNode = {
      id,
      name,
      type: 'folder',
      parentId
    };
    setFiles([...files, newFolder]);
    if (parentId) {
      setExpandedFolders(new Set([...expandedFolders, parentId]));
    }
  };

  const deleteNode = (id: string) => {
    if (!confirm("Are you sure you want to delete this?")) return;
    // Recursive delete for folders
    const getChildren = (parentId: string): string[] => {
      const children = files.filter(f => f.parentId === parentId).map(f => f.id);
      return [...children, ...children.flatMap(getChildren)];
    };
    const toDelete = [id, ...(files.find(f => f.id === id)?.type === 'folder' ? getChildren(id) : [])];
    setFiles(files.filter(f => !toDelete.includes(f.id)));
    if (toDelete.includes(activeFileId)) {
      setActiveFileId('');
    }
  };

  const toggleFolder = (id: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedFolders(newExpanded);
  };

  const selectFile = (file: FileNode) => {
    if (file.id === activeFileId) return;
    setIsSwitchingFile(true);
    setTimeout(() => {
      setActiveFileId(file.id);
      if (file.language) setLanguage(file.language);
      setCode(file.content || '');
      setIsSwitchingFile(false);
    }, 150);
  };

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    setFiles(prev => prev.map(f => f.id === activeFileId ? { ...f, content: newCode } : f));
    
    // Trigger completion suggestions for all languages except when in output/terminal tab
    if (newCode && activeTab !== "terminal") {
      debouncedFetchCompletions(newCode);
    }
  };

  const FileTree = ({ parentId = null, level = 0 }: { parentId?: string | null, level?: number }) => {
    const children = files.filter(f => f.parentId === parentId).sort((a, b) => {
      if (a.type === b.type) return a.name.localeCompare(b.name);
      return a.type === 'folder' ? -1 : 1;
    });

    return (
      <div className="flex flex-col">
        <AnimatePresence initial={false}>
          {children.map(node => (
            <motion.div 
              key={node.id} 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex flex-col"
            >
              <div 
                className={`flex items-center justify-between group px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${activeFileId === node.id ? (theme === 'dark' ? 'bg-white/10 text-white' : 'bg-black/10 text-black') : (theme === 'dark' ? 'hover:bg-white/5 text-white/40' : 'hover:bg-black/5 text-black/40')}`}
                style={{ paddingLeft: `${level * 12 + 8}px` }}
                onClick={() => node.type === 'folder' ? toggleFolder(node.id) : selectFile(node)}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  {node.type === 'folder' ? (
                    expandedFolders.has(node.id) ? <ChevronDown className="w-3 h-3 shrink-0" /> : <ChevronRight className="w-3 h-3 shrink-0" />
                  ) : (
                    <FileText className="w-3 h-3 shrink-0" />
                  )}
                  {node.type === 'folder' && <Folder className="w-3 h-3 shrink-0 opacity-40" />}
                  <span className="text-[11px] font-medium truncate">{node.name}</span>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {node.type === 'folder' && (
                    <>
                      <button onClick={(e) => { e.stopPropagation(); createFile(node.id); }} className="p-1 hover:bg-white/10 rounded"><FilePlus className="w-2.5 h-2.5" /></button>
                      <button onClick={(e) => { e.stopPropagation(); createFolder(node.id); }} className="p-1 hover:bg-white/10 rounded"><FolderPlus className="w-2.5 h-2.5" /></button>
                    </>
                  )}
                  <button onClick={(e) => { e.stopPropagation(); deleteNode(node.id); }} className="p-1 hover:bg-red-500/20 text-red-500/60 hover:text-red-500 rounded"><Trash2 className="w-2.5 h-2.5" /></button>
                </div>
              </div>
              {node.type === 'folder' && expandedFolders.has(node.id) && (
                <FileTree parentId={node.id} level={level + 1} />
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    );
  };
  
  // Terminal state
  const [terminalInput, setTerminalInput] = useState("");
  const [terminalHistory, setTerminalHistory] = useState<{cmd: string, out: string, err: string}[]>([]);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      setShowCookies(true);
    }
  }, []);

  const toggleTheme = () => {
    setTheme(prev => prev === "dark" ? "light" : "dark");
  };

  const showComingSoon = (_platform: "Windows" | "macOS") => {
    setComingSoonMessage("Coming soon.");
    if (comingSoonTimeoutRef.current) clearTimeout(comingSoonTimeoutRef.current);
    comingSoonTimeoutRef.current = setTimeout(() => setComingSoonMessage(""), 2200);
  };

  const copyRepositoryUrl = async () => {
    if (!cloneUrl.trim()) {
      setCopyStatus("Enter a repository URL first");
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopyStatus(""), 2000);
      return;
    }

    try {
      await navigator.clipboard.writeText(cloneUrl.trim());
      setCopyStatus("Repository URL copied");
    } catch {
      setCopyStatus("Copy failed. Clipboard access is blocked.");
    }

    if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    copyTimeoutRef.current = setTimeout(() => setCopyStatus(""), 2000);
  };

  const handleCloneRepository = async () => {
    if (!cloneUrl.trim()) {
      setCloneError("Please enter a repository URL");
      return;
    }

    setCloneLoading(true);
    setCloneError("");
    try {
      const response = await axios.post('/api/github/clone', { repoUrl: cloneUrl });
      if (response.data.success) {
        const rawFiles: any[] = response.data.files || [];
        // flatten nested structure into FileNode[]
        const flatten = (items: any[], parentId: string | null = null): FileNode[] => {
          return items.flatMap((it) => {
            const node: FileNode = {
              id: it.id,
              name: it.name,
              type: it.type,
              parentId,
              content: it.content,
            };
            if (it.type === 'folder' && it.children) {
              return [node, ...flatten(it.children, it.id)];
            }
            return [node];
          });
        };
        const newFiles = flatten(rawFiles);
        setFiles(newFiles);
        const firstFile = newFiles.find(f => f.type === 'file');
        if (firstFile) {
          setActiveFileId(firstFile.id);
          setCode(firstFile.content || "");
        }
        setView("playground");
        setShowCloneModal(false);
        setCloneUrl("");
      }
    } catch (error: any) {
      setCloneError(error.response?.data?.error || 'Failed to clone repository');
    } finally {
      setCloneLoading(false);
    }
  };

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [terminalHistory]);

  const acceptCookies = () => {
    localStorage.setItem("cookie-consent", "true");
    setShowCookies(false);
  };

  const handleLanguageChange = (newLang: Language) => {
    setLanguage(newLang);
    const newCode = DEFAULT_CODE[newLang];
    setCode(newCode);
    setOutput("");
    setError("");
    setDuration(null);
    
    if (activeFileId) {
      setFiles(prev => prev.map(f => f.id === activeFileId ? { ...f, language: newLang, content: newCode } : f));
    } else {
      const id = Math.random().toString(36).substr(2, 9);
      const extensions: Record<Language, string> = {
        cpp: "cpp", python: "py", java: "java", javascript: "js", html: "html", react: "jsx"
      };
      const newFile: FileNode = {
        id,
        name: `main.${extensions[newLang]}`,
        type: 'file',
        parentId: null,
        content: newCode,
        language: newLang
      };
      setFiles([...files, newFile]);
      setActiveFileId(id);
    }

    if (newLang === "html" || newLang === "react") {
      setActiveTab("preview");
    } else {
      setActiveTab("output");
    }
    
    // Auto show output panel on mobile when language changes to something that needs output
    if (window.innerWidth < 1024) {
      setShowOutputPanel(true);
    }
  };

  const runCode = async () => {
    // For all languages, show results in preview tab
    setActiveTab("preview");
    setIsRunning(true);
    setOutput("");
    setError("");
    setDuration(null);

    // For HTML/React, just let the auto-update handle it
    if (language === "html" || language === "react") {
      setIsRunning(false);
      if (window.innerWidth < 1024) setShowOutputPanel(true);
      return;
    }

    // For other languages, execute code
    if (window.innerWidth < 1024) setShowOutputPanel(true);

    try {
      const response = await axios.post<ExecutionResult>("/api/run", {
        language,
        code
      });

      setOutput(response.data.output);
      setError(response.data.error);
      setDuration(response.data.duration);
    } catch (err: any) {
      setError(err.response?.data?.error || "Connection error. Is the server running?");
    } finally {
      setIsRunning(false);
    }
  };

  const fetchCompletions = async (currentCode: string) => {
    if (!currentCode || currentCode.length < 3) {
      setShowCompletions(false);
      return;
    }

    setIsLoadingCompletions(true);
    setCompletionError("");
    setHighlightedIndex(0);
    
    try {
      const response = await axios.post("/api/completion/complete", {
        code: currentCode,
        language
      });

      if (response.data.error) {
        setCompletionError(response.data.error);
        setShowCompletions(false);
      } else if (response.data.suggestions && response.data.suggestions.length > 0) {
        setCompletionSuggestions(response.data.suggestions);
        setShowCompletions(true);
        setCompletionError("");
      } else {
        setShowCompletions(false);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || 'Failed to get suggestions.';
      setCompletionError(errorMsg);
      console.error('Completion error:', err);
      setShowCompletions(false);
    } finally {
      setIsLoadingCompletions(false);
    }
  };

  const debouncedFetchCompletions = (currentCode: string) => {
    if (completionTimeoutRef.current) {
      clearTimeout(completionTimeoutRef.current);
    }
    
    completionTimeoutRef.current = setTimeout(() => {
      fetchCompletions(currentCode);
    }, 800); // 800ms debounce
  };

  const acceptCompletion = (suggestion: string) => {
    if (!suggestion) return;
    const newCode = code + suggestion;
    setCode(newCode);
    setFiles(prev => prev.map(f => f.id === activeFileId ? { ...f, content: newCode } : f));
    setShowCompletions(false);
    setHighlightedIndex(0);
  };

  const runTerminalCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminalInput.trim()) return;

    const cmd = terminalInput;
    setTerminalInput("");
    
    try {
      const response = await axios.post("/api/terminal", { command: cmd });
      setTerminalHistory(prev => [...prev, { 
        cmd, 
        out: response.data.output, 
        err: response.data.error 
      }]);
    } catch (err: any) {
      setTerminalHistory(prev => [...prev, { 
        cmd, 
        out: "", 
        err: err.response?.data?.error || "Failed to execute command" 
      }]);
    }
  };

  const exportToZip = async () => {
    const zip = new JSZip();
    const extensions: Record<Language, string> = {
      cpp: "cpp",
      python: "py",
      java: "java",
      javascript: "js",
      html: "html",
      react: "jsx"
    };
    
    zip.file(`solution.${extensions[language]}`, code);
    const content = await zip.generateAsync({ type: "blob" });
    
    const url = window.URL.createObjectURL(content);
    const a = document.createElement("a");
    a.href = url;
    a.download = `code-za_export_${language}.zip`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getPreviewContent = () => {
    if (language === "html") {
      const hasProperHTML = code.includes("<!DOCTYPE") || code.includes("<html") || code.includes("<body");
      if (!hasProperHTML) {
        return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
  </style>
</head>
<body style="margin: 0; padding: 0;">
${code}
</body>
</html>`;
      }
      return code;
    }
    
    if (language === "react") {
      return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.jsdelivr.net/npm/@babel/standalone@7/babel.min.js"><\/script>
  <script src="https://cdn.jsdelivr.net/npm/react@18/umd/react.production.min.js"><\/script>
  <script src="https://cdn.jsdelivr.net/npm/react-dom@18/umd/react-dom.production.min.js"><\/script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100vw; height: 100vh; overflow: hidden; }
    body { 
      background: #050505; 
      color: white; 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      margin: 0;
      padding: 0;
    }
    #root {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  </style>
</head>
<body>
  <div id="root"></div>
  <script>
    window.React = React;
    window.ReactDOM = ReactDOM;
  <\/script>
  <script type="text/babel">
  (function() {
    try {
      // Auto-wrap if user code doesn't render directly
      ${code.includes('root.render') || code.includes('ReactDOM.render') ? code : `
        ${code.startsWith('function') || code.startsWith('const') ? code + '\\n' : ''}
        const root = ReactDOM.createRoot(document.getElementById('root'));
        if (typeof App !== 'undefined') {
          root.render(<App />);
        }
      `}
    } catch(e) {
      console.error('React Error:', e);
      document.getElementById('root').innerHTML = '<div style="color: #ff6b6b; padding: 20px; font-family: monospace; white-space: pre-wrap; font-size: 12px; line-height: 1.5; max-width: 90%; max-height: 90%; overflow: auto;"><strong style="display: block; margin-bottom: 10px; color: #ff9999;">⚠️ React Error</strong><div style="font-size: 11px; word-break: break-all;">' + (e.stack || e.message || 'Unknown error') + '</div></div>';
    }
  })();
  <\/script>
</body>
</html>`;
    }
    
    // For other languages (Python, C++, Java, JavaScript) - show backend execution results
    const safeOutput = (output || "").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    const safeError = (error || "").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    
     let bodyContent = '';
     if (!code) {
       bodyContent = '<div class="empty-state"><p>✏️ Start typing code to see results here</p></div>';
     } else if (isRunning) {
       bodyContent = `<div class="loading"><p>⏳ Running ${language.toUpperCase()} code...</p></div>`;
     } else {
       let output_html = '';
       if (safeOutput) {
         output_html = `<div class="output-section">${safeOutput}</div>`;
       }
       let error_html = '';
       if (safeError) {
         error_html = `<div class="error-section"><span class="error-label">⚠️ Error:</span>${safeError}</div>`;
       }
       let empty_html = '';
       if (!safeOutput && !safeError) {
         empty_html = '<div class="empty-state"><p>✓ Code executed successfully with no output</p></div>';
       }
       let duration_html = '';
       if (duration !== null) {
         duration_html = `<div class="duration">⏱️ Execution time: ${duration}ms</div>`;
       }
       bodyContent = output_html + error_html + empty_html + duration_html;
     }
     return `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: 100%; height: 100%; font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; }
      body { 
        background: #0f0f0f; 
        color: #e0e0e0;
        padding: 16px;
        overflow: auto;
        font-size: 13px;
        line-height: 1.6;
      }
      .container { max-width: 100%; }
      .header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 12px 16px;
        border-radius: 6px;
        margin-bottom: 12px;
        font-weight: 600;
        color: white;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .status-running {
        display: inline-block;
        width: 8px;
        height: 8px;
        background: #4ade80;
        border-radius: 50%;
        animation: pulse 2s infinite;
      }
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
      .output-section, .error-section {
        background: #1a1a1a;
        border: 1px solid #333;
        border-radius: 6px;
        padding: 12px;
        margin-bottom: 12px;
        white-space: pre-wrap;
        word-break: break-all;
        max-height: 70vh;
        overflow: auto;
      }
      .output-section { border-left: 3px solid #4ade80; }
      .error-section { 
        border-left: 3px solid #ef4444;
        color: #ff6b6b;
      }
      .error-label {
        color: #ff9999;
        font-weight: 600;
        margin-bottom: 8px;
        display: block;
      }
      .empty-state {
        text-align: center;
        color: #666;
        padding: 40px 20px;
      }
      .loading {
        text-align: center;
        padding: 20px;
      }
      .duration {
        font-size: 11px;
        color: #999;
        margin-top: 8px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <span class="status-running"></span>
        ${isRunning ? 'Executing...' : 'Execution Complete'}
      </div>
      ${bodyContent}
    </div>
  </body>
  </html>`;
  };

  const PrivacyModal = () => (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`${theme === 'dark' ? 'bg-[#0A0A0A]' : 'bg-[#FAF9F6]'} border ${theme === 'dark' ? 'border-white/10' : 'border-black/10'} w-full max-w-2xl overflow-hidden rounded-3xl flex flex-col shadow-2xl max-h-[80vh]`}
      >
        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/5 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <ShieldCheck className={`w-5 h-5 ${theme === 'dark' ? 'text-white/40' : 'text-black/40'}`} />
            <h2 className={`text-xl font-bold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Legal & Privacy</h2>
          </div>
          <button onClick={() => setShowPrivacy(false)} className={`p-2 ${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-black/5'} rounded-full transition-colors`}>
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className={`flex-1 overflow-auto p-8 prose prose-invert max-w-none ${theme === 'dark' ? 'text-white/60' : 'text-black/60'} text-sm leading-relaxed space-y-8`}>
          <section className="space-y-3">
            <h3 className={`${theme === 'dark' ? 'text-white' : 'text-black'} font-bold uppercase tracking-widest text-[10px]`}>1. Terms of Service</h3>
            <p>By using code-za, you agree to use the platform for educational purposes only. You are responsible for the code you write and execute. We do not tolerate malicious use of our infrastructure.</p>
          </section>
          <section className="space-y-3">
            <h3 className={`${theme === 'dark' ? 'text-white' : 'text-black'} font-bold uppercase tracking-widest text-[10px]`}>2. Data Collection</h3>
            <p>code-za is built with privacy as a core principle. We do not store your code permanently. All execution happens in ephemeral sandboxes that are destroyed immediately after use.</p>
          </section>
          <section className="space-y-3">
            <h3 className={`${theme === 'dark' ? 'text-white' : 'text-black'} font-bold uppercase tracking-widest text-[10px]`}>3. Cookies</h3>
            <p>We use minimal local storage to remember your language preferences and cookie consent status. No third-party tracking cookies are used.</p>
          </section>
          <section className="space-y-3">
            <h3 className={`${theme === 'dark' ? 'text-white' : 'text-black'} font-bold uppercase tracking-widest text-[10px]`}>4. Student Built</h3>
            <p>This platform is an educational tool built by students for students. We prioritize open-source principles and transparent execution.</p>
          </section>
          <section className="space-y-3">
            <h3 className={`${theme === 'dark' ? 'text-white' : 'text-black'} font-bold uppercase tracking-widest text-[10px]`}>5. Security</h3>
            <p>While we provide a secure sandbox, please do not run sensitive or malicious code. We reserve the right to terminate sessions that violate our safety protocols.</p>
          </section>
        </div>
        <div className="p-6 border-t border-white/5 bg-white/5 backdrop-blur-xl flex justify-end">
          <button 
            onClick={() => setShowPrivacy(false)}
            className={`${theme === 'dark' ? 'bg-white text-black' : 'bg-black text-white'} px-6 py-2 rounded-full text-xs font-bold hover:opacity-90 transition-opacity`}
          >
            I Accept
          </button>
        </div>
      </motion.div>
    </motion.div>
  );

  const saveSnapshot = () => {
    const newSnapshot = { code, timestamp: Date.now(), language };
    setHistory(prev => [newSnapshot, ...prev].slice(0, 20)); // Keep last 20
    // Optional: show a toast or feedback
  };

  const revertToSnapshot = (snapshot: { code: string; language: Language }) => {
    setLanguage(snapshot.language);
    setCode(snapshot.code);
    setShowHistory(false);
  };

  const CookieBanner = () => (
    <motion.div 
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className="fixed bottom-8 right-8 z-[90] w-full max-w-sm px-6"
    >
      <div className={`${theme === 'dark' ? 'bg-[#0A0A0A]/90' : 'bg-[#FAF9F6]/90'} backdrop-blur-3xl border ${theme === 'dark' ? 'border-white/10' : 'border-black/10'} p-6 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center gap-6`}>
        <div className={`w-14 h-14 rounded-2xl ${theme === 'dark' ? 'bg-white/5' : 'bg-black/5'} flex items-center justify-center shrink-0`}>
          <Cookie className={`w-7 h-7 ${theme === 'dark' ? 'text-white/40' : 'text-black/40'}`} />
        </div>
        <div className="flex-1 space-y-1">
          <p className={`text-xs font-bold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Cookie Consent</p>
          <p className={`text-[10px] leading-relaxed ${theme === 'dark' ? 'text-white/40' : 'text-black/40'}`}>We use cookies to enhance your coding experience.</p>
          <button onClick={() => setShowPrivacy(true)} className={`text-[9px] ${theme === 'dark' ? 'text-white/40 hover:text-white' : 'text-black/40 hover:text-black'} underline underline-offset-4 uppercase tracking-widest font-bold transition-colors`}>Read Policy</button>
        </div>
        <button 
          onClick={acceptCookies}
          className={`${theme === 'dark' ? 'bg-white text-black' : 'bg-black text-white'} px-6 py-2.5 rounded-full text-[11px] font-black hover:scale-105 active:scale-95 transition-all whitespace-nowrap`}
        >
          Accept
        </button>
      </div>
    </motion.div>
  );

  const HistoryModal = () => (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`${theme === 'dark' ? 'bg-[#0A0A0A]' : 'bg-[#FAF9F6]'} border ${theme === 'dark' ? 'border-white/10' : 'border-black/10'} w-full max-w-lg overflow-hidden rounded-3xl flex flex-col shadow-2xl max-h-[80vh]`}
      >
        <div className="p-8 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <History className="w-5 h-5 text-white/40" />
            <h2 className="text-xl font-bold tracking-tight">Version History</h2>
          </div>
          <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-4 space-y-2">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-white/20 gap-4">
              <RotateCcw className="w-10 h-10 opacity-20" />
              <p className="text-xs uppercase tracking-widest font-bold">No history yet</p>
            </div>
          ) : (
            history.map((snapshot, i) => (
              <button
                key={i}
                onClick={() => revertToSnapshot(snapshot)}
                className={`w-full p-4 rounded-2xl border ${theme === 'dark' ? 'border-white/5 hover:bg-white/5' : 'border-black/5 hover:bg-black/5'} transition-all flex items-center justify-between group`}
              >
                <div className="flex flex-col items-start gap-1">
                  <span className={`text-[10px] uppercase tracking-widest font-bold ${theme === 'dark' ? 'text-white/40' : 'text-black/40'}`}>{snapshot.language}</span>
                  <span className="text-sm font-medium">{new Date(snapshot.timestamp).toLocaleString()}</span>
                </div>
                <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${theme === 'dark' ? 'bg-white/5 text-white/40 group-hover:bg-white group-hover:text-black' : 'bg-black/5 text-black/40 group-hover:bg-black group-hover:text-white'} transition-all`}>
                  Revert
                </div>
              </button>
            ))
          )}
        </div>
      </motion.div>
    </motion.div>
  );

  const PlaygroundOptionsModal = () => (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`${theme === 'dark' ? 'bg-[#0A0A0A]' : 'bg-[#FAF9F6]'} border ${theme === 'dark' ? 'border-white/10' : 'border-black/10'} w-full max-w-md overflow-hidden rounded-3xl flex flex-col shadow-2xl`}
      >
        <div className="p-8 space-y-8">
          <div className="text-center space-y-2">
            <h2 className={`text-2xl font-bold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Get Started</h2>
            <p className={`text-sm ${theme === 'dark' ? 'text-white/40' : 'text-black/40'}`}>Clone a GitHub repo or jump straight into the editor.</p>
          </div>
          
          <div className="space-y-6">
            <div className="space-y-4">
              <button 
                onClick={() => {
                  setShowCloneModal(true);
                  setShowPlaygroundOptions(false);
                }}
                className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl border ${theme === 'dark' ? 'border-white/10 hover:bg-white/5' : 'border-black/10 hover:bg-black/5'} transition-all font-bold text-sm`}
              >
                <Github className="w-4 h-4" />
                Clone Repository
              </button>
              
              <div className="relative flex items-center justify-center">
                <div className={`absolute inset-0 flex items-center ${theme === 'dark' ? 'opacity-10' : 'opacity-5'}`}>
                  <div className={`w-full border-t ${theme === 'dark' ? 'border-white' : 'border-black'}`} />
                </div>
                <span className={`relative px-4 text-[10px] uppercase tracking-widest font-bold ${theme === 'dark' ? 'text-white/20 bg-[#0A0A0A]' : 'text-black/20 bg-[#FAF9F6]'}`}>OR</span>
              </div>

              <button 
                onClick={() => {
                  if (!acceptedTerms) return;
                  setView("playground");
                  setShowPlaygroundOptions(false);
                }}
                disabled={!acceptedTerms}
                className={`w-full py-4 rounded-2xl ${theme === 'dark' ? 'bg-white text-black' : 'bg-black text-white'} font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-20 disabled:cursor-not-allowed`}
              >
                Start Coding
              </button>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-2xl bg-black/5 border border-black/5">
              <button 
                onClick={() => setAcceptedTerms(!acceptedTerms)}
                className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-all ${acceptedTerms ? 'bg-green-500 border-green-500' : (theme === 'dark' ? 'border-white/20' : 'border-black/20')}`}
              >
                {acceptedTerms && <Check className="w-3 h-3 text-white" />}
              </button>
              <p className={`text-[10px] leading-relaxed ${theme === 'dark' ? 'text-white/40' : 'text-black/40'}`}>
                I agree to the <button onClick={() => setShowPrivacy(true)} className="underline hover:text-white transition-colors">Terms & Conditions</button> and acknowledge that code-za is a student-built educational tool.
              </p>
            </div>
          </div>
        </div>
        <button 
          onClick={() => setShowPlaygroundOptions(false)}
          className={`p-4 text-[10px] uppercase tracking-widest font-bold ${theme === 'dark' ? 'text-white/20 hover:text-white/40' : 'text-black/20 hover:text-black/40'} transition-colors`}
        >
          Cancel
        </button>
      </motion.div>
    </motion.div>
  );

  const CloneRepositoryModal = () => (
    <AnimatePresence>
      {showCloneModal && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
        >
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`${theme === 'dark' ? 'bg-[#0A0A0A]' : 'bg-[#FAF9F6]'} border ${theme === 'dark' ? 'border-white/10' : 'border-black/10'} w-full max-w-md overflow-hidden rounded-3xl flex flex-col shadow-2xl`}
          >
            <div className="p-8 space-y-6">
              <div className="text-center space-y-2">
                <h2 className={`text-2xl font-bold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Clone Repository</h2>
                <p className={`text-sm ${theme === 'dark' ? 'text-white/40' : 'text-black/40'}`}>Enter a GitHub repository URL to clone</p>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="relative">
                    <input 
                      type="text"
                      placeholder="https://github.com/owner/repo"
                      value={cloneUrl}
                      onChange={(e) => setCloneUrl(e.target.value)}
                      className={`w-full px-4 py-3 pr-28 rounded-xl border ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white placeholder-white/30' : 'bg-black/5 border-black/10 text-black placeholder-black/30'} focus:outline-none focus:border-white/30 transition-colors`}
                    />
                    <button
                      type="button"
                      onClick={copyRepositoryUrl}
                      className={`absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border flex items-center gap-1.5 ${theme === 'dark' ? 'border-white/15 bg-white/5 text-white/70 hover:text-white' : 'border-black/15 bg-black/5 text-black/70 hover:text-black'} transition-colors`}
                    >
                      <Copy className="w-3 h-3" />
                      Copy
                    </button>
                  </div>
                  {copyStatus && (
                    <p className={`text-xs ${theme === 'dark' ? 'text-white/50' : 'text-black/50'}`}>{copyStatus}</p>
                  )}
                </div>
                
                {cloneError && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                    <p className="text-sm text-red-500">{cloneError}</p>
                  </div>
                )}
                
                <button 
                  onClick={handleCloneRepository}
                  disabled={cloneLoading}
                  className={`w-full py-3 rounded-xl ${theme === 'dark' ? 'bg-white text-black' : 'bg-black text-white'} font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                >
                  {cloneLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Cloning...
                    </>
                  ) : (
                    <>
                      <Github className="w-4 h-4" />
                      Clone Repository
                    </>
                  )}
                </button>
              </div>
            </div>
            
            <button 
              onClick={() => {
                setShowCloneModal(false);
                setCloneUrl("");
                setCloneError("");
              }}
              className={`p-4 text-[10px] uppercase tracking-widest font-bold ${theme === 'dark' ? 'text-white/20 hover:text-white/40' : 'text-black/20 hover:text-black/40'} transition-colors`}
            >
              Cancel
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (view === "landing") {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-[#050505] text-[#EDEDED]' : 'bg-[#F2F1ED] text-[#1A1A1A]'} font-sans selection:bg-white/20 flex flex-col relative overflow-hidden transition-colors duration-500`}>
        <ThreeDBackground theme={theme} />
        {/* Background Glows */}
        <div className={`absolute inset-0 ${theme === 'dark' ? 'bg-[radial-gradient(circle_at_50%_-18%,rgba(128,82,255,0.5),transparent_48%),radial-gradient(circle_at_80%_10%,rgba(52,199,255,0.2),transparent_40%),radial-gradient(circle_at_20%_80%,rgba(130,87,255,0.18),transparent_46%)]' : 'bg-[radial-gradient(circle_at_50%_-18%,rgba(128,82,255,0.22),transparent_48%),radial-gradient(circle_at_80%_10%,rgba(52,199,255,0.12),transparent_40%),radial-gradient(circle_at_20%_80%,rgba(130,87,255,0.1),transparent_46%)]'} pointer-events-none`} />

        <nav className={`h-20 flex items-center justify-between px-6 md:px-12 border-b ${theme === 'dark' ? 'border-white/10 bg-black/20 liquid-glass liquid-glass-dark' : 'border-black/10 bg-[#FAF9F6]/20 liquid-glass liquid-glass-light'} backdrop-blur-md sticky top-0 z-50`}>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Logo theme={theme} className="w-8 h-8" />
            </div>
            <div className={`px-2 py-0.5 rounded border ${theme === 'dark' ? 'border-white/10 text-white/40' : 'border-black/10 text-black/40'} text-[9px] uppercase tracking-widest font-bold`}>v1.0</div>
          </div>
          
          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-12">
            <button onClick={toggleTheme} className={`p-2 rounded-full ${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-black/5'} transition-colors`}>
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button onClick={() => setShowPrivacy(true)} className={`text-[10px] uppercase tracking-[0.2em] ${theme === 'dark' ? 'text-white/40 hover:text-white' : 'text-black/40 hover:text-black'} font-bold transition-colors`}>Privacy</button>
            <button 
              onClick={() => setShowPlaygroundOptions(true)}
              className={`text-[10px] uppercase tracking-[0.2em] ${theme === 'dark' ? 'text-white' : 'text-black'} font-bold hover:opacity-70 transition-opacity`}
            >
              Playground
            </button>
          </div>

          {/* Mobile Nav Toggle */}
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden p-2">
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </nav>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`fixed inset-0 z-40 md:hidden pt-24 px-6 ${theme === 'dark' ? 'bg-[#050505]' : 'bg-[#F2F1ED]'} flex flex-col gap-8`}
            >
              <button onClick={() => { setShowPlaygroundOptions(true); setIsMenuOpen(false); }} className="text-2xl font-bold tracking-tighter flex items-center justify-between">
                Playground <ChevronRight className="w-6 h-6" />
              </button>
              <button onClick={() => { setShowPrivacy(true); setIsMenuOpen(false); }} className="text-2xl font-bold tracking-tighter flex items-center justify-between">
                Privacy <ChevronRight className="w-6 h-6" />
              </button>
              <button onClick={() => { toggleTheme(); setIsMenuOpen(false); }} className="text-2xl font-bold tracking-tighter flex items-center justify-between">
                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'} <ChevronRight className="w-6 h-6" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <main className="flex-1 flex flex-col relative z-10">
          {/* Hero Section */}
          <section className={`flex-1 flex flex-col items-center justify-center px-6 pt-20 pb-32 border-b ${theme === 'dark' ? 'border-white/10' : 'border-black/10'}`}>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-6xl w-full space-y-16 text-center"
            >
              <div className="space-y-8">
                <div className={`inline-flex items-center gap-3 px-4 py-2 rounded-full ${theme === 'dark' ? 'bg-white/5 border-white/10 liquid-glass liquid-glass-dark' : 'bg-black/5 border-black/10 liquid-glass liquid-glass-light'} border backdrop-blur-md`}>
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className={`text-[10px] uppercase tracking-[0.2em] font-bold ${theme === 'dark' ? 'text-white/60' : 'text-black/60'}`}>Built by students for the next generation</span>
                </div>
                <h1 className={`text-[14vw] md:text-[10vw] tracking-tighter leading-[0.86] ${theme === 'dark' ? 'text-white' : 'text-black'}`} style={{ fontFamily: "'EB Garamond', serif", fontWeight: 600 }}>
                  CODE <br/> <span className={`${theme === 'dark' ? 'text-white/25' : 'text-black/25'} italic`}>WITHOUT</span> <br/> FRICTION.
                </h1>
                <p className={`text-lg md:text-[20px] ${theme === 'dark' ? 'text-white/70' : 'text-black/65'} max-w-2xl mx-auto font-medium leading-relaxed`}>
                  Live coding workspace with real-time output, online runtimes.
                </p>
              </div>

              <div className="flex flex-col items-center gap-12">
                <button
                  onClick={handleExplore}
                  disabled={isExploring}
                  className={`group relative ${theme === 'dark' ? 'text-white hero-cta' : 'bg-black/5 border-black/10 text-black'} border backdrop-blur-xl px-16 py-6 rounded-[12px] text-xl font-bold transition-all hover:scale-105 active:scale-95 flex items-center gap-4 shadow-2xl overflow-hidden min-w-[320px] justify-center`}
                >
                  {isExploring ? (
                    <CircularLoader size={24} theme={theme} />
                  ) : (
                    <>
                      Explore Playground
                      <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                    </>
                  )}
                </button>

                <LandingScreenshotBackdrop theme={theme} />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 w-full max-w-4xl pt-20">
                  <div className={`space-y-4 text-left p-8 rounded-3xl ${theme === 'dark' ? 'bg-white/[0.02] border-white/10 liquid-glass liquid-glass-dark' : 'bg-black/[0.02] border-black/5 liquid-glass liquid-glass-light'} border backdrop-blur-sm`}>
                    <div className={`w-10 h-10 rounded-xl ${theme === 'dark' ? 'bg-white/5 text-white/40' : 'bg-black/5 text-black/40'} flex items-center justify-center`}>
                      <Zap className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold uppercase tracking-widest">Instant</h3>
                    <p className={`text-sm ${theme === 'dark' ? 'text-white/30' : 'text-black/30'} leading-relaxed`}>Zero setup. Zero lag. Just pure execution in a high-performance Linux sandbox.</p>
                  </div>
                  <div className={`space-y-4 text-left p-8 rounded-3xl ${theme === 'dark' ? 'bg-white/[0.02] border-white/10 liquid-glass liquid-glass-dark' : 'bg-black/[0.02] border-black/5 liquid-glass liquid-glass-light'} border backdrop-blur-sm`}>
                    <div className={`w-10 h-10 rounded-xl ${theme === 'dark' ? 'bg-white/5 text-white/40' : 'bg-black/5 text-black/40'} flex items-center justify-center`}>
                      <Shield className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold uppercase tracking-widest">Secure</h3>
                    <p className={`text-sm ${theme === 'dark' ? 'text-white/30' : 'text-black/30'} leading-relaxed`}>Isolated ephemeral environments that vanish the moment you're done. Your code, your privacy.</p>
                  </div>
                  <div className={`space-y-4 text-left p-8 rounded-3xl ${theme === 'dark' ? 'bg-white/[0.02] border-white/10 liquid-glass liquid-glass-dark' : 'bg-black/[0.02] border-black/5 liquid-glass liquid-glass-light'} border backdrop-blur-sm`}>
                    <div className={`w-10 h-10 rounded-xl ${theme === 'dark' ? 'bg-white/5 text-white/40' : 'bg-black/5 text-black/40'} flex items-center justify-center`}>
                      <Code className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold uppercase tracking-widest">Polyglot</h3>
                    <p className={`text-sm ${theme === 'dark' ? 'text-white/30' : 'text-black/30'} leading-relaxed`}>Support for the languages that matter. C++, Python, Java, and JavaScript at your fingertips.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </section>

          {/* Manifesto Section */}
          <section className={`py-32 px-12 grid grid-cols-1 lg:grid-cols-2 gap-20 border-b ${theme === 'dark' ? 'border-white/10' : 'border-black/10'}`}>
            <div className="space-y-8">
              <h2 className="text-4xl md:text-6xl font-bold tracking-tighter leading-tight">
                Built by students. <br/>
                <span className={theme === 'dark' ? 'text-white/20' : 'text-black/20'}>For the community.</span>
              </h2>
              <p className={`text-xl ${theme === 'dark' ? 'text-white/40' : 'text-black/40'} leading-relaxed max-w-lg`}>
                We were tired of bloated IDEs and slow online compilers. So we built the one we wanted to use. code-za is a testament to minimal design and maximum performance.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className={`aspect-square rounded-3xl ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'} border flex flex-col items-center justify-center p-8 text-center gap-4`}>
                <span className="text-5xl font-bold tracking-tighter">0.0s</span>
                <span className={`text-[10px] uppercase tracking-widest font-bold ${theme === 'dark' ? 'text-white/40' : 'text-black/40'}`}>Setup Time</span>
              </div>
              <div className={`aspect-square rounded-3xl ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'} border flex flex-col items-center justify-center p-8 text-center gap-4`}>
                <span className="text-5xl font-bold tracking-tighter">6+</span>
                <span className={`text-[10px] uppercase tracking-widest font-bold ${theme === 'dark' ? 'text-white/40' : 'text-black/40'}`}>Languages</span>
              </div>
              <div className={`aspect-square rounded-3xl ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'} border flex flex-col items-center justify-center p-8 text-center gap-4`}>
                <span className="text-5xl font-bold tracking-tighter">∞</span>
                <span className={`text-[10px] uppercase tracking-widest font-bold ${theme === 'dark' ? 'text-white/40' : 'text-black/40'}`}>Possibilities</span>
              </div>
              <div className={`aspect-square rounded-3xl ${theme === 'dark' ? 'bg-white text-black' : 'bg-black text-white'} flex flex-col items-center justify-center p-8 text-center gap-4`}>
                <User className="w-8 h-8" />
                <span className="text-[10px] uppercase tracking-widest font-bold">Student Powered</span>
              </div>
            </div>
          </section>
        </main>

        <footer className={`py-20 px-12 flex flex-col md:flex-row items-center justify-between gap-8 ${theme === 'dark' ? 'bg-black/20' : 'bg-[#FAF9F6]/20'} backdrop-blur-sm`}>
          <div className="flex items-center gap-4">
            <Logo theme={theme} className="w-6 h-6" />
            <span className={`text-[10px] uppercase tracking-[0.3em] ${theme === 'dark' ? 'text-white/20' : 'text-black/20'} font-bold`}>© 2024</span>
          </div>
          <div className="flex items-center gap-12">
            <button onClick={() => setShowPrivacy(true)} className={`text-[10px] uppercase tracking-[0.2em] ${theme === 'dark' ? 'text-white/40 hover:text-white' : 'text-black/40 hover:text-black'} font-bold transition-colors`}>Privacy Policy</button>
            <span className={`text-[10px] uppercase tracking-[0.2em] ${theme === 'dark' ? 'text-white/20' : 'text-black/20'} font-bold`}>Built with passion in the lab</span>
          </div>
        </footer>

        <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">
          <button
            onClick={() => showComingSoon("Windows")}
            className={`px-4 py-2 rounded-full border text-xs font-bold tracking-wide ${theme === 'dark' ? 'bg-black/60 border-white/15 text-white/80 hover:text-white liquid-glass liquid-glass-dark' : 'bg-white/80 border-black/15 text-black/80 hover:text-black liquid-glass liquid-glass-light'} backdrop-blur-md transition-colors`}
          >
            Windows SDK
          </button>
          <button
            onClick={() => showComingSoon("macOS")}
            className={`px-4 py-2 rounded-full border text-xs font-bold tracking-wide ${theme === 'dark' ? 'bg-black/60 border-white/15 text-white/80 hover:text-white liquid-glass liquid-glass-dark' : 'bg-white/80 border-black/15 text-black/80 hover:text-black liquid-glass liquid-glass-light'} backdrop-blur-md transition-colors`}
          >
            macOS SDK
          </button>
          {comingSoonMessage && (
            <div className={`mt-1 px-4 py-2 rounded-xl text-xs font-medium ${theme === 'dark' ? 'bg-black/80 border border-white/15 text-white/80' : 'bg-white/90 border border-black/10 text-black/80'} backdrop-blur-md`}>
              {comingSoonMessage}
            </div>
          )}
        </div>

        <AnimatePresence>
          {showPrivacy && <PrivacyModal />}
          {showCookies && <CookieBanner />}
          {showPlaygroundOptions && <PlaygroundOptionsModal />}
          {showCloneModal && <CloneRepositoryModal />}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-[#050505] text-[#EDEDED]' : 'bg-[#F2F1ED] text-[#1A1A1A]'} font-sans selection:bg-white/20 flex flex-col transition-colors duration-500`}>
      <ThreeDBackground theme={theme} />
      <AnimatePresence>
        {isBooting && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-[#050505] flex flex-col items-center justify-center gap-8"
          >
            <motion.div
              animate={{ 
                scale: [1, 1.05, 1],
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="relative"
            >
              <CircularLoader size={120} theme="dark" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Logo theme="dark" className="w-12 h-12" />
              </div>
            </motion.div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden relative">
                <motion.div 
                  className="absolute inset-0 bg-white"
                  initial={{ x: '-100%' }}
                  animate={{ x: '100%' }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/40">Initializing Environment</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Navigation / Sidebar-style Header */}
      <nav className={`h-14 border-b ${theme === 'dark' ? 'border-white/10 bg-black/40' : 'border-black/10 bg-[#FAF9F6]/40'} flex items-center justify-between px-4 md:px-8 backdrop-blur-xl sticky top-0 z-50`}>
        <div className="flex items-center gap-4 md:gap-6">
          <button 
            onClick={() => setView("landing")}
            className="flex items-center gap-2 hover:opacity-70 transition-opacity"
          >
            <Logo theme={theme} className="w-6 h-6" />
          </button>
          <button 
            onClick={() => setShowSidebar(!showSidebar)}
            className={`hidden md:flex p-2 rounded-lg ${theme === 'dark' ? 'hover:bg-white/5 text-white/40' : 'hover:bg-black/5 text-black/40'} transition-colors ${showSidebar ? (theme === 'dark' ? 'bg-white/10 text-white' : 'bg-black/10 text-black') : ''}`}
            title="Toggle Sidebar"
          >
            <Monitor className="w-4 h-4" />
          </button>
          <div className={`hidden md:block h-4 w-[1px] ${theme === 'dark' ? 'bg-white/20' : 'bg-black/20'} mx-2`} />
          <span className={`hidden md:block text-[10px] uppercase tracking-[0.2em] ${theme === 'dark' ? 'text-white/40' : 'text-black/40'} font-medium`}>
            Built by student for students
          </span>
        </div>

        <div className="flex items-center gap-2 md:gap-4 flex-1 justify-end">
          {/* Desktop Language Selector */}
          <div className={`hidden sm:flex items-center gap-1 ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-black/5 border-black/5'} backdrop-blur-md p-1 rounded-full border shrink-0`}>
            {LANGUAGES.map((lang) => (
              <button
                key={lang.id}
                onClick={() => handleLanguageChange(lang.id)}
                className={`px-3 md:px-4 py-1 rounded-full text-[10px] md:text-[11px] font-semibold transition-all duration-300 ${
                  language === lang.id
                    ? (theme === 'dark' ? "bg-white text-black shadow-lg shadow-white/10" : "bg-black text-white shadow-lg shadow-black/10")
                    : (theme === 'dark' ? "text-white/40 hover:text-white hover:bg-white/5" : "text-black/40 hover:text-black hover:bg-black/5")
                }`}
              >
                {lang.name}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={runCode}
              disabled={isRunning}
              className={`flex items-center gap-2 ${theme === 'dark' ? 'bg-white text-black hover:bg-[#E5E5E5]' : 'bg-black text-white hover:bg-[#333]'} disabled:opacity-50 px-4 md:px-5 py-1.5 rounded-full text-[11px] md:text-[12px] font-bold transition-all active:scale-95 shadow-lg relative overflow-hidden`}
            >
              {isRunning && (
                <motion.div 
                  className="absolute inset-0 bg-black/10 dark:bg-white/10"
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              )}
              {isRunning ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current" />
              )}
              <span className="hidden md:inline">{isRunning ? "Running" : "Run"}</span>
            </button>

            <button
              onClick={() => setShowOutputPanel(!showOutputPanel)}
              className={`lg:hidden p-2 rounded-full ${theme === 'dark' ? 'hover:bg-white/5 text-white/40' : 'hover:bg-black/5 text-black/40'} transition-colors ${showOutputPanel ? (theme === 'dark' ? 'bg-white/10 text-white' : 'bg-black/10 text-black') : ''}`}
              title="Toggle Output"
            >
              <TerminalIcon className="w-4 h-4" />
            </button>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-2">
              <button onClick={toggleTheme} className={`p-2 rounded-full ${theme === 'dark' ? 'hover:bg-white/5 text-white/40' : 'hover:bg-black/5 text-black/40'} transition-colors`}>
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <button onClick={saveSnapshot} className={`p-2 ${theme === 'dark' ? 'text-white/40 hover:text-white hover:bg-white/5' : 'text-black/40 hover:text-black hover:bg-black/5'} rounded-full transition-all`} title="Save Snapshot"><Save className="w-4 h-4" /></button>
              <button onClick={() => setShowHistory(true)} className={`p-2 ${theme === 'dark' ? 'text-white/40 hover:text-white hover:bg-white/5' : 'text-black/40 hover:text-black hover:bg-black/5'} rounded-full transition-all`} title="Version History"><History className="w-4 h-4" /></button>
              <button onClick={exportToZip} className={`p-2 ${theme === 'dark' ? 'text-white/40 hover:text-white hover:bg-white/5' : 'text-black/40 hover:text-black hover:bg-black/5'} rounded-full transition-all`} title="Export ZIP"><Download className="w-4 h-4" /></button>
              <button onClick={() => setShowCloneModal(true)} className={`p-2 rounded-full ${theme === 'dark' ? 'hover:bg-white/5 text-white/40' : 'hover:bg-black/5 text-black/40'}`} title="Clone Repository"><Github className="w-4 h-4" /></button>
            </div>

            {/* Mobile Hamburger Toggle */}
            <button 
              onClick={() => setIsPlaygroundMenuOpen(!isPlaygroundMenuOpen)}
              className={`md:hidden p-2 rounded-full ${theme === 'dark' ? 'hover:bg-white/5 text-white/40' : 'hover:bg-black/5 text-black/40'} transition-colors`}
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Language Bar (Scrollable) */}
      <div className={`md:hidden h-10 border-b ${theme === 'dark' ? 'border-white/5 bg-black/60' : 'border-black/5 bg-[#FAF9F6]/60'} backdrop-blur-md flex items-center px-4 overflow-x-auto no-scrollbar gap-2`}>
        {LANGUAGES.map((lang) => (
          <button
            key={lang.id}
            onClick={() => handleLanguageChange(lang.id)}
            className={`px-4 py-1 rounded-full text-[10px] font-bold whitespace-nowrap transition-all ${
              language === lang.id
                ? (theme === 'dark' ? "bg-white text-black" : "bg-black text-white")
                : (theme === 'dark' ? "text-white/40" : "text-black/40")
            }`}
          >
            {lang.name}
          </button>
        ))}
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isPlaygroundMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`md:hidden fixed inset-x-0 top-14 z-[60] p-6 ${theme === 'dark' ? 'bg-[#0A0A0A] border-white/10' : 'bg-[#FAF9F6] border-black/10'} border-b shadow-2xl flex flex-col gap-6`}
          >
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => { saveSnapshot(); setIsPlaygroundMenuOpen(false); }} className={`flex items-center gap-3 p-4 rounded-2xl ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-black/5 border-black/5'} border`}>
                <Save className="w-4 h-4" /><span className="text-xs font-bold uppercase tracking-widest">Save</span>
              </button>
              <button onClick={() => { setShowHistory(true); setIsPlaygroundMenuOpen(false); }} className={`flex items-center gap-3 p-4 rounded-2xl ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-black/5 border-black/5'} border`}>
                <History className="w-4 h-4" /><span className="text-xs font-bold uppercase tracking-widest">History</span>
              </button>
              <button onClick={() => { exportToZip(); setIsPlaygroundMenuOpen(false); }} className={`flex items-center gap-3 p-4 rounded-2xl ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-black/5 border-black/5'} border`}>
                <Download className="w-4 h-4" /><span className="text-xs font-bold uppercase tracking-widest">Export</span>
              </button>
              <button onClick={() => { toggleTheme(); setIsPlaygroundMenuOpen(false); }} className={`flex items-center gap-3 p-4 rounded-2xl ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-black/5 border-black/5'} border`}>
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                <span className="text-xs font-bold uppercase tracking-widest">{theme === 'dark' ? 'Light' : 'Dark'}</span>
              </button>
            </div>
            
            <div className={`h-[1px] w-full ${theme === 'dark' ? 'bg-white/5' : 'bg-black/5'}`} />
            
            <button onClick={() => { setShowCloneModal(true); setIsPlaygroundMenuOpen(false); }} className={`w-full flex items-center gap-3 p-4 rounded-2xl ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-black/5 border-black/5'} border`}>
              <Github className="w-4 h-4" /><span className="text-xs font-bold uppercase tracking-widest">Clone Repo</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Sidebar */}
        <AnimatePresence>
          {showSidebar && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 260, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className={`hidden md:flex flex-col border-r ${theme === 'dark' ? 'border-white/10 bg-black/20' : 'border-black/10 bg-black/5'} backdrop-blur-xl overflow-hidden shrink-0`}
            >
              <div className="p-4 flex items-center justify-between border-b border-white/5">
                <span className={`text-[10px] font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-white/40' : 'text-black/40'}`}>Explorer</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => createFile()} className={`p-1.5 rounded hover:bg-white/5 ${theme === 'dark' ? 'text-white/40' : 'text-black/40'}`} title="New File"><FilePlus className="w-3.5 h-3.5" /></button>
                  <button onClick={() => createFolder()} className={`p-1.5 rounded hover:bg-white/5 ${theme === 'dark' ? 'text-white/40' : 'text-black/40'}`} title="New Folder"><FolderPlus className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              <div className="flex-1 overflow-auto p-2 no-scrollbar">
                {files.length === 0 ? (
                  <div className="space-y-2 p-2">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className={`h-6 rounded-lg animate-pulse ${theme === 'dark' ? 'bg-white/5' : 'bg-black/5'}`} style={{ width: `${Math.random() * 40 + 60}%` }} />
                    ))}
                  </div>
                ) : (
                  <FileTree />
                )}
              </div>
              <div className={`p-4 border-t ${theme === 'dark' ? 'border-white/5 bg-white/[0.02]' : 'border-black/5 bg-black/[0.02]'}`}>
                <div className={`text-[9px] font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-white/20' : 'text-black/20'} mb-3`}>Environment</div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] ${theme === 'dark' ? 'text-white/40' : 'text-black/40'}`}>Node.js</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] ${theme === 'dark' ? 'text-white/40' : 'text-black/40'}`}>Python 3 (Online)</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] ${theme === 'dark' ? 'text-white/40' : 'text-black/40'}`}>C++ (Online)</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] ${theme === 'dark' ? 'text-white/40' : 'text-black/40'}`}>Java (Online)</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Editor Area */}
        <div className={`flex-1 ${theme === 'dark' ? 'bg-[#050505]' : 'bg-[#FAF9F6]'} relative border-r ${theme === 'dark' ? 'border-white/10' : 'border-black/10'} ${showOutputPanel ? 'hidden lg:block' : 'block'}`}>
          <AnimatePresence>
            {isSwitchingFile && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`absolute inset-0 z-30 flex items-center justify-center ${theme === 'dark' ? 'bg-black/40' : 'bg-white/40'} backdrop-blur-sm`}
              >
                <CircularLoader size={40} theme={theme} />
              </motion.div>
            )}
          </AnimatePresence>
          <div className={`absolute top-4 left-6 z-10 flex items-center gap-2 opacity-40 hover:opacity-100 transition-opacity ${theme === 'dark' ? 'bg-black/40 border-white/5' : 'bg-[#FAF9F6]/40 border-black/5'} backdrop-blur-md px-2 py-1 rounded border`}>
            <FileText className="w-3 h-3" />
            <span className="text-[10px] font-mono uppercase tracking-widest">{activeFile?.name || language}</span>
          </div>
          
          {/* Desktop Editor (Monaco) */}
          <div className="hidden md:block h-full relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeFileId || language}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full"
              >
                <Editor
                  height="100%"
                  theme={theme === "dark" ? "vs-dark" : "light"}
                  language={activeFile?.language === "react" ? "javascript" : (activeFile?.language === "html" ? "html" : activeFile?.language || language)}
                  value={code}
                  onChange={(value) => handleCodeChange(value || "")}
                  options={{
                    fontSize: 13,
                    fontFamily: "'JetBrains Mono', monospace",
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    padding: { top: 40 },
                    cursorSmoothCaretAnimation: "on",
                    smoothScrolling: true,
                    lineNumbersMinChars: 4,
                    lineHeight: 1.6,
                    renderLineHighlight: "none",
                    scrollbar: {
                      vertical: "hidden",
                      horizontal: "hidden"
                    }
                  }}
                  loading={
                    <div className={`flex flex-col items-center justify-center h-full ${theme === 'dark' ? 'bg-[#050505]' : 'bg-white'} gap-4`}>
                      <div className="w-48 h-2 bg-white/5 rounded-full overflow-hidden relative">
                        <motion.div 
                          className="absolute inset-0 bg-white/20"
                          animate={{ x: ['-100%', '100%'] }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                        />
                      </div>
                      <span className={`text-[10px] uppercase tracking-widest ${theme === 'dark' ? 'text-white/20' : 'text-black/20'} font-bold`}>Initializing Editor</span>
                    </div>
                  }
                />
              </motion.div>
            </AnimatePresence>

            {/* AI Code Completions Panel */}
            <AnimatePresence>
              {(showCompletions || completionError) && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`absolute bottom-6 right-6 z-40 max-w-sm ${theme === 'dark' ? 'bg-[#0A0A0A] border-white/10' : 'bg-white border-black/10'} border rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden`}
                >
                  <div className={`px-4 py-3 border-b ${theme === 'dark' ? 'border-white/5 bg-white/5' : 'border-black/5 bg-black/5'} flex items-center justify-between`}>
                    <div className="flex items-center gap-2">
                      <Zap className="w-3.5 h-3.5 text-indigo-500" />
                      <span className={`text-xs font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-white/60' : 'text-black/60'}`}>
                        {completionError ? "Error" : "AI Suggestions"}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setShowCompletions(false);
                        setCompletionError("");
                      }}
                      className={`p-1 rounded transition-colors`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>

                  {completionError ? (
                    <div className={`p-4 ${theme === 'dark' ? 'bg-red-500/10 text-red-400' : 'bg-red-500/10 text-red-600'}`}>
                      <p className="text-xs">{completionError}</p>
                      <p className="text-[10px] mt-2 opacity-60">Check backend completion service configuration.</p>
                    </div>
                  ) : (
                    <div className={`${theme === 'dark' ? 'divide-white/5' : 'divide-black/5'} divide-y max-h-64 overflow-auto`}>
                      {isLoadingCompletions ? (
                        <div className={`p-4 flex items-center justify-center gap-2 ${theme === 'dark' ? 'text-white/40' : 'text-black/40'}`}>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span className="text-xs">Processing...</span>
                        </div>
                      ) : (
                        completionSuggestions.length > 0 ? (
                          completionSuggestions.map((suggestion, index) => (
                            <button
                              key={index}
                              onClick={() => acceptCompletion(suggestion)}
                              className={`w-full text-left px-4 py-3 transition-colors ${
                                highlightedIndex === index
                                  ? (theme === 'dark' ? 'bg-indigo-500/20' : 'bg-indigo-500/10')
                                  : (theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-black/5')
                              }`}
                            >
                              <div className={`text-xs font-mono whitespace-pre-wrap break-words ${highlightedIndex === index ? (theme === 'dark' ? 'text-indigo-300' : 'text-indigo-700') : (theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600')}`}>
                                {suggestion}
                              </div>
                              <div className={`text-[10px] mt-1 ${theme === 'dark' ? 'text-white/30' : 'text-black/30'}`}>
                                {highlightedIndex === index ? "↵ Press Enter or click" : "Click to insert"}
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className={`p-4 text-center ${theme === 'dark' ? 'text-white/40' : 'text-black/40'}`}>
                            <p className="text-xs">No suggestions available</p>
                          </div>
                        )
                      )}
                    </div>
                  )}

                  {!completionError && (
                    <div className={`px-4 py-2 border-t ${theme === 'dark' ? 'border-white/5 bg-white/5 text-white/40' : 'border-black/5 bg-black/5 text-black/40'} text-[10px] flex items-center justify-between`}>
                      <span>AI Powered</span>
                      <span>↑↓ Navigate • ⌘+G Retry</span>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Mobile Completions Error Badge */}
            {completionError && (
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className={`md:hidden fixed bottom-20 right-6 z-40 max-w-sm px-4 py-3 rounded-xl ${theme === 'dark' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-500/10 border-red-500/20 text-red-600'} border flex items-start gap-3`}
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs font-bold">Completion Error</p>
                    <p className="text-[10px] mt-1 opacity-80">{completionError}</p>
                  </div>
                  <button
                    onClick={() => setCompletionError("")}
                    className="shrink-0 p-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </motion.div>
              </AnimatePresence>
            )}
          </div>

          {/* Mobile Editor (Simple Editor) */}
          <div className="md:hidden h-full overflow-auto p-4 pt-14">
            <SimpleEditor
              value={code}
              onValueChange={handleCodeChange}
              highlight={code => highlight(code, 
                (activeFile?.language || language) === "python" ? languages.python :
                (activeFile?.language || language) === "cpp" ? languages.cpp :
                (activeFile?.language || language) === "java" ? languages.java :
                (activeFile?.language || language) === "html" ? languages.markup :
                (activeFile?.language || language) === "react" ? languages.jsx :
                languages.js, 
                activeFile?.language || language
              )}
              padding={10}
              style={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: 14,
                minHeight: '100%',
                backgroundColor: 'transparent',
                color: theme === 'dark' ? '#EDEDED' : '#1A1A1A',
              }}
              className="outline-none"
            />
          </div>
        </div>

        {/* Output Area */}
        <div className={`${showOutputPanel ? 'flex' : 'hidden'} w-full lg:w-[520px] ${theme === 'dark' ? 'bg-[#050505]' : 'bg-[#FAF9F6]'} flex flex-col border-l ${theme === 'dark' ? 'border-white/10' : 'border-black/10'} absolute inset-0 z-20 lg:relative lg:inset-auto`}>
          <div className={`h-12 border-b ${theme === 'dark' ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'} flex items-center justify-between px-4 backdrop-blur-xl`}>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setActiveTab("output")}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === "output" ? (theme === 'dark' ? "bg-white/10 text-white" : "bg-black/10 text-black") : (theme === 'dark' ? "text-white/30 hover:text-white/60" : "text-black/30 hover:text-black/60")}`}
              >
                <TerminalIcon className="w-3 h-3" />
                Output
              </button>
              {(language === "html" || language === "react") && (
                <button 
                  onClick={() => setActiveTab("preview")}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === "preview" ? (theme === 'dark' ? "bg-white/10 text-white" : "bg-black/10 text-black") : (theme === 'dark' ? "text-white/30 hover:text-white/60" : "text-black/30 hover:text-black/60")}`}
                >
                  <Eye className="w-3 h-3" />
                  Preview
                </button>
              )}
              <button 
                onClick={() => setActiveTab("terminal")}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === "terminal" ? (theme === 'dark' ? "bg-white/10 text-white" : "bg-black/10 text-black") : (theme === 'dark' ? "text-white/30 hover:text-white/60" : "text-black/30 hover:text-black/60")}`}
              >
                <Command className="w-3 h-3" />
                Terminal
              </button>
            </div>
            <div className="flex items-center gap-4">
              {duration !== null && activeTab === "output" && (
                <div className={`hidden sm:flex items-center gap-1.5 text-[10px] ${theme === 'dark' ? 'text-white/30' : 'text-black/30'} font-mono`}>
                  <Clock className="w-3 h-3" />
                  {duration}ms
                </div>
              )}
              <button 
                onClick={() => setShowOutputPanel(false)}
                className={`lg:hidden p-2 rounded-full ${theme === 'dark' ? 'hover:bg-white/5 text-white/40' : 'hover:bg-black/5 text-black/40'} transition-colors`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-0 font-mono text-[13px] leading-relaxed relative">
            <AnimatePresence mode="wait">
              {activeTab === "output" && (
                <motion.div 
                  key="output"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-8 h-full"
                >
                  {!output && !error && !isRunning && (
                    <div className={`flex flex-col items-center justify-center h-full ${theme === 'dark' ? 'text-white/20' : 'text-black/20'} text-center gap-6`}>
                      <div className={`w-12 h-12 rounded-full border ${theme === 'dark' ? 'border-white/5 bg-white/5' : 'border-black/5 bg-black/5'} backdrop-blur-md flex items-center justify-center`}>
                        <User className="w-5 h-5 opacity-40" />
                      </div>
                      <div className="space-y-4">
                        <p className="max-w-[240px] text-[11px] leading-loose tracking-wide uppercase">
                          Ready for your input.<br/>Built for students, by students.
                        </p>
                        
                        {language === 'react' && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`p-4 rounded-2xl border ${theme === 'dark' ? 'bg-indigo-500/5 border-indigo-500/10' : 'bg-indigo-500/5 border-indigo-500/10'} max-w-[280px] mx-auto`}
                          >
                            <div className="flex items-center gap-2 mb-2 justify-center">
                              <Zap className="w-3 h-3 text-indigo-400" />
                              <span className="text-[9px] font-bold uppercase tracking-widest text-indigo-400">React Tip</span>
                            </div>
                            <p className="text-[10px] leading-relaxed text-indigo-400/60 lowercase">
                              React is pre-installed. No need to run <code className="bg-indigo-500/10 px-1 rounded">npm install</code>. Just write your components and they'll appear in the preview!
                            </p>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  )}

                  {isRunning && (
                    <div className={`flex flex-col items-center justify-center h-full ${theme === 'dark' ? 'text-white/40' : 'text-black/40'} gap-8`}>
                      <CircularLoader size={64} theme={theme} />
                      <div className="flex flex-col items-center gap-2">
                        <p className="text-[10px] uppercase tracking-[0.3em] font-bold opacity-40">Executing Code</p>
                        <p className="text-[9px] italic opacity-20">Breathe in... Breathe out...</p>
                      </div>
                    </div>
                  )}

                  {(output || error) && !isRunning && (
                    <div className="space-y-8">
                      {output && (
                        <div className="space-y-3">
                          <div className={`flex items-center gap-2 ${theme === 'dark' ? 'text-white/40' : 'text-black/40'} text-[9px] font-bold uppercase tracking-widest`}>
                            <CheckCircle2 className="w-3 h-3" />
                            Output
                          </div>
                          <pre className={`${theme === 'dark' ? 'text-white/90 bg-white/5 border-white/5' : 'text-black/90 bg-black/5 border-black/5'} whitespace-pre-wrap break-all selection:bg-white/10 backdrop-blur-sm p-4 rounded-2xl border`}>
                            {output}
                          </pre>
                        </div>
                      )}

                      {error && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-red-500/60 text-[9px] font-bold uppercase tracking-widest">
                            <AlertCircle className="w-3 h-3" />
                            Error
                          </div>
                          <pre className="text-red-400/80 whitespace-pre-wrap break-all selection:bg-red-500/10 bg-red-500/5 backdrop-blur-sm p-4 rounded-2xl border border-red-500/10">
                            {error}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === "preview" && (
                <motion.div 
                  key="preview"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full relative flex flex-col"
                >
                  {/* Loading State */}
                  {!code && (
                    <div className="flex-1 flex items-center justify-center bg-white">
                      <p className="text-gray-400">No code to preview</p>
                    </div>
                  )}
                  
                  {/* Preview iframe - key forces remount when code changes */}
                  {code && (
                    <iframe 
                      key={`preview-${language}-${code.length}-${output.length}-${error.length}-${duration}`}
                      srcDoc={getPreviewContent()}
                      className="w-full h-full border-none flex-1"
                      title="code-za live preview"
                      sandbox="allow-scripts allow-modals allow-same-origin allow-popups allow-presentation"
                      style={{ background: 'white', display: 'block' }}
                      onLoad={(e) => {
                        try {
                          e.currentTarget.style.opacity = '1';
                        } catch (err) {
                          console.log('iframe load:', err);
                        }
                      }}
                      onError={(e) => {
                        console.error('iframe error:', e);
                      }}
                    />
                  )}
                  
                  {language === 'react' && code && (
                    <div className="absolute bottom-4 right-4 z-10">
                      <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-xl shadow-xl flex items-center gap-3 border border-white/20"
                      >
                        <Zap className="w-3 h-3" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">React Mode Active</span>
                      </motion.div>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === "terminal" && (
                <motion.div 
                  key="terminal"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={`p-6 h-full flex flex-col ${theme === 'dark' ? 'bg-black' : 'bg-[#F5F5F5]'}`}
                >
                  <div className="flex-1 overflow-auto space-y-4 mb-4 no-scrollbar">
                    <div className="flex items-center justify-between mb-6">
                      <div className={`${theme === 'dark' ? 'text-white/40' : 'text-black/40'} text-[10px] uppercase tracking-widest`}>
                        Welcome to code-za Terminal v1.0
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[8px] uppercase tracking-tighter font-bold opacity-30">Session Active</span>
                      </div>
                    </div>

                    {terminalHistory.length === 0 && (
                      <div className={`p-4 rounded-2xl border ${theme === 'dark' ? 'bg-white/5 border-white/5 text-white/40' : 'bg-black/5 border-black/5 text-black/40'} mb-8`}>
                        <p className="text-[10px] font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                          <Zap className="w-3 h-3 text-indigo-400" />
                          Terminal Tips
                        </p>
                        <ul className="space-y-2 text-[10px] leading-relaxed">
                          <li className="flex gap-2">
                            <span className="text-indigo-400">•</span>
                            <span>Use <code className="text-indigo-400">ls</code> to list files in your current directory.</span>
                          </li>
                          <li className="flex gap-2">
                            <span className="text-indigo-400">•</span>
                            <span>Run <code className="text-indigo-400">python3 main.py</code> to execute Python scripts.</span>
                          </li>
                          <li className="flex gap-2">
                            <span className="text-indigo-400">•</span>
                            <span>If <code className="text-indigo-400">npm install</code> fails with a 404, check your package name.</span>
                          </li>
                        </ul>
                      </div>
                    )}
                    {terminalHistory.map((entry, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex items-center gap-2 text-indigo-400">
                          <span className="opacity-50">$</span>
                          <span>{entry.cmd}</span>
                        </div>
                        {entry.out && <pre className={`${theme === 'dark' ? 'text-white/80' : 'text-black/80'} pl-4`}>{entry.out}</pre>}
                        {entry.err && <pre className="text-red-400/80 pl-4">{entry.err}</pre>}
                      </div>
                    ))}
                    <div ref={terminalEndRef} />
                  </div>
                  <form onSubmit={runTerminalCommand} className={`flex items-center gap-3 ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'} p-3 rounded-xl border`}>
                    <span className="text-indigo-400 font-bold">$</span>
                    <input 
                      type="text"
                      value={terminalInput}
                      onChange={(e) => setTerminalInput(e.target.value)}
                      placeholder="Type a command..."
                      className={`flex-1 bg-transparent border-none outline-none ${theme === 'dark' ? 'text-white' : 'text-black'} text-sm`}
                      autoFocus
                    />
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Minimal Footer Stats */}
          <div className={`p-6 border-t ${theme === 'dark' ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'} flex items-center justify-between backdrop-blur-xl`}>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className={`text-[10px] ${theme === 'dark' ? 'text-white/40' : 'text-black/40'} uppercase tracking-widest font-bold`}>System Online</span>
              </div>
            </div>
            <div className={`flex items-center gap-2 ${theme === 'dark' ? 'text-white/20' : 'text-black/20'}`}>
              <Cpu className="w-3 h-3" />
              <span className="text-[10px] font-mono uppercase">Linux-x64</span>
            </div>
          </div>
        </div>
      </main>

      <AnimatePresence>
        {showPrivacy && <PrivacyModal />}
        {showCookies && <CookieBanner />}
        {showPlaygroundOptions && <PlaygroundOptionsModal />}
        {showCloneModal && <CloneRepositoryModal />}
        {showHistory && <HistoryModal />}
        {showTestingPhase && (
          <TestingPhaseModal 
            theme={theme}
            onContinue={() => setShowTestingPhase(false)}
            onIgnore={() => setShowTestingPhase(false)}
          />
        )}
        {showFixModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFixModal(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={`relative w-full max-w-md p-8 rounded-3xl border ${theme === 'dark' ? 'bg-[#0A0A0A] border-white/10' : 'bg-white border-black/10'} shadow-2xl`}
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Missing {showFixModal.lang} Runtime</h3>
                  <p className={`text-xs ${theme === 'dark' ? 'text-white/40' : 'text-black/40'}`}>Tool: {showFixModal.tool}</p>
                </div>
              </div>
              
              <div className={`p-4 rounded-2xl ${theme === 'dark' ? 'bg-white/5' : 'bg-black/5'} mb-6`}>
                <p className="text-[11px] leading-relaxed opacity-80">
                  The {showFixModal.lang} compiler is not pre-installed in this sandboxed web environment. To run {showFixModal.lang} code, you have two options:
                </p>
                <ul className="mt-4 space-y-3">
                  <li className="flex gap-3">
                    <div className="w-4 h-4 rounded-full bg-blue-500/20 flex items-center justify-center text-[10px] font-bold text-blue-500 shrink-0">1</div>
                    <p className="text-[10px] opacity-60">Install the {showFixModal.lang} extension in your local VS Code environment.</p>
                  </li>
                  <li className="flex gap-3">
                    <div className="w-4 h-4 rounded-full bg-blue-500/20 flex items-center justify-center text-[10px] font-bold text-blue-500 shrink-0">2</div>
                    <p className="text-[10px] opacity-60">Use a cloud-based development environment like GitHub Codespaces or Replit.</p>
                  </li>
                </ul>
              </div>

              <button 
                onClick={() => setShowFixModal(null)}
                className={`w-full py-4 rounded-2xl ${theme === 'dark' ? 'bg-white text-black' : 'bg-black text-white'} font-bold text-xs uppercase tracking-widest transition-transform active:scale-95`}
              >
                Got it
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
