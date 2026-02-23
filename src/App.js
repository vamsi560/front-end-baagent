import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
    UploadCloud, FileText, ListCollapse, Folder, Clock, Settings, CheckCircle, XCircle, 
    ChevronDown, ChevronUp, ChevronRight, Search, Send as SendIcon, Copy, AlertTriangle,
    TrendingUp, Users, Activity, BarChart3, Target, Zap, Eye, Download,
    Bell, User, Calendar, PieChart, ArrowRight, ArrowLeft, Menu, Plus, Link, LogOut, Cloud, X
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import JSZip from 'jszip';
import LoginPage from './LoginPage';
import ReactFlowDiagram from './components/ReactFlowDiagram';
import { generateSystemArchitectureDiagram, generateDatabaseDiagram, generateUserFlowDiagram } from './utils/diagramGenerator';
import EnhancedDocumentViewer from './components/EnhancedDocumentViewer';
import AdvancedSearch from './components/AdvancedSearch';
import ResponsiveLayout, { ResponsiveGrid, ResponsiveCard, ResponsiveButton, ResponsiveModal } from './components/ResponsiveLayout';
import SmartSuggestions from './components/SmartSuggestions';
import RealTimeComments from './components/RealTimeComments';
import MultiLanguageSupport from './components/MultiLanguageSupport';
import WorkItemsBrowser from './components/WorkItemsBrowser';

// API base URL - hardcoded for Vercel backend
const API_BASE_URL = 'https://backend-new-bagaent1.vercel.app';

// React Error Boundary to catch DOM manipulation errors
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.warn('Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-red-800 font-semibold mb-2">Something went wrong</h3>
          <p className="text-red-600 text-sm">
            The application encountered an error. Please refresh the page to continue.
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// --- Enhanced Helper Components ---


function MarkdownRenderer({ markdown, title, className = "" }) {
  const sanitizedMarkdown = markdown || 'No content generated.';
  return (
    <div className={`prose prose-slate max-w-none p-6 bg-white rounded-lg shadow-lg border ${className}`}>
      {title && <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <FileText className="w-6 h-6" />
        {title}
      </h2>}
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
        table: ({node, ...props}) => (
          <div className="overflow-x-auto my-6">
            <table className="min-w-full border border-gray-300 rounded-lg shadow-sm" {...props} />
          </div>
        ),
        th: ({node, ...props}) => (
          <th className="px-4 py-3 border border-gray-300 bg-blue-50 text-left font-semibold text-gray-800 text-sm" {...props} />
        ),
        td: ({node, ...props}) => (
          <td className="px-4 py-3 border border-gray-300 align-top text-gray-700 text-sm leading-relaxed" {...props} />
        ),
        thead: ({node, ...props}) => (
          <thead className="bg-blue-50" {...props} />
        ),
        tbody: ({node, ...props}) => (
          <tbody className="bg-white" {...props} />
        ),
        tr: ({node, ...props}) => (
          <tr className="hover:bg-gray-50 transition-colors" {...props} />
        )
      }}>
        {sanitizedMarkdown}
      </ReactMarkdown>
    </div>
  );
}

function FormattedTextRenderer(props) {
  const { content, title, className = "" } = props;
  const sanitizedContent = content || 'No content generated.';
  
  // Function to remove compliance section and clean up content
  const removeComplianceSection = (text) => {
    // Remove compliance sections (case insensitive)
    const compliancePatterns = [
      /## Compliance[\s\S]*?(?=##|$)/gi,
      /# Compliance[\s\S]*?(?=#|$)/gi,
      /### Compliance[\s\S]*?(?=###|##|#|$)/gi,
      /\*\*Compliance\*\*[\s\S]*?(?=\*\*|\n\n|$)/gi,
      /Compliance Requirements[\s\S]*?(?=\n\n|$)/gi
    ];
    
    let cleanedText = text;
    compliancePatterns.forEach(pattern => {
      cleanedText = cleanedText.replace(pattern, '');
    });
    
    return cleanedText;
  };
  
  // Function to aggressively strip ALL markdown symbols and convert to formatted text
  const formatText = (text) => {
    // First remove compliance section
    let cleanedText = removeComplianceSection(text);
    
    const lines = cleanedText.split('\n');
    const formattedLines = [];
    let skipEmpty = false;
    
    for (let line of lines) {
      // Skip empty lines after headers for better spacing
      if (!line.trim() && skipEmpty) {
        skipEmpty = false;
        continue;
      }
      skipEmpty = false;
      
      // Handle headers (# ## ### etc.) - convert to styled headings
      if (line.match(/^#{1,6}\s+/)) {
        const level = line.match(/^#+/)[0].length;
        let headerText = line.replace(/^#+\s*/, '').replace(/#+\s*$/, '').trim();
        
        // Remove all remaining markdown symbols from header
        headerText = headerText
          .replace(/\*\*(.*?)\*\*/g, '$1')  // Bold
          .replace(/\*(.*?)\*/g, '$1')      // Italic/Bold
          .replace(/__(.*?)__/g, '$1')      // Bold
          .replace(/_(.*?)_/g, '$1')        // Italic
          .replace(/`(.*?)`/g, '$1')        // Code
          .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // Links
          .replace(/[*#`_~]/g, '')          // Any remaining symbols
          .trim();
        
        if (headerText) {
          let headerClass = '';
          
          switch (level) {
            case 1: 
              headerClass = 'text-3xl font-bold text-blue-900 mt-8 mb-6 pb-3 border-b-2 border-blue-200'; 
              break;
            case 2: 
              headerClass = 'text-2xl font-bold text-gray-800 mt-6 mb-4 pb-2 border-b border-gray-200'; 
              break;
            case 3: 
              headerClass = 'text-xl font-semibold text-gray-800 mt-5 mb-3 text-blue-800'; 
              break;
            case 4: 
              headerClass = 'text-lg font-semibold text-gray-700 mt-4 mb-2'; 
              break;
            case 5: 
              headerClass = 'text-base font-semibold text-gray-700 mt-3 mb-2'; 
              break;
            default: 
              headerClass = 'text-sm font-medium text-gray-600 mt-2 mb-1'; 
              break;
          }
          
          formattedLines.push({
            type: 'header',
            content: headerText,
            className: headerClass,
            level: level
          });
          skipEmpty = true;
        }
        continue;
      }
      
      // Handle bullet points (- or * at start)
      if (line.match(/^\s*[-*+]\s+/)) {
        let bulletText = line.replace(/^\s*[-*+]\s*/, '').trim();
        
        // Clean up markdown symbols from bullet text
        bulletText = bulletText
          .replace(/\*\*(.*?)\*\*/g, '$1')  // Bold
          .replace(/\*(.*?)\*/g, '$1')      // Italic/Bold
          .replace(/__(.*?)__/g, '$1')      // Bold
          .replace(/_(.*?)_/g, '$1')        // Italic
          .replace(/`(.*?)`/g, '$1')        // Code
          .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // Links
          .replace(/[*#`_~]/g, '')          // Any remaining symbols
          .trim();
        
        if (bulletText) {
          formattedLines.push({
            type: 'bullet',
            content: bulletText,
            className: 'text-gray-700 ml-6 mb-2'
          });
        }
        continue;
      }
      
      // Handle numbered lists
      if (line.match(/^\s*\d+\.\s+/)) {
        let numberedText = line.trim();
        
        // Clean up markdown symbols from numbered text
        numberedText = numberedText
          .replace(/\*\*(.*?)\*\*/g, '$1')  // Bold
          .replace(/\*(.*?)\*/g, '$1')      // Italic/Bold
          .replace(/__(.*?)__/g, '$1')      // Bold
          .replace(/_(.*?)_/g, '$1')        // Italic
          .replace(/`(.*?)`/g, '$1')        // Code
          .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // Links
          .replace(/[*#`_~]/g, '')          // Any remaining symbols
          .trim();
        
        if (numberedText) {
          formattedLines.push({
            type: 'numbered',
            content: numberedText,
            className: 'text-gray-700 ml-6 mb-2'
          });
        }
        continue;
      }
      
      // Handle regular paragraphs - aggressively clean all markdown
      let processedLine = line.trim();
      
      if (processedLine) {
        // Remove ALL markdown symbols
        processedLine = processedLine
          .replace(/\*\*(.*?)\*\*/g, '$1')      // Bold **text**
          .replace(/\*(.*?)\*/g, '$1')          // Italic/Bold *text*
          .replace(/__(.*?)__/g, '$1')          // Bold __text__
          .replace(/_(.*?)_/g, '$1')            // Italic _text_
          .replace(/`(.*?)`/g, '$1')            // Inline code `text`
          .replace(/```[\s\S]*?```/g, '')       // Code blocks
          .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // Links [text](url)
          .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1') // Images ![alt](url)
          .replace(/>\s*/g, '')                 // Blockquotes
          .replace(/^\s*[-*+]\s*/g, '')         // List markers at start
          .replace(/^\s*\d+\.\s*/g, '')         // Numbered list markers
          .replace(/#{1,6}\s*/g, '')            // Header symbols
          .replace(/[*#`_~]/g, '')              // Any remaining symbols
          .replace(/\s+/g, ' ')                 // Multiple spaces to single
          .trim();
        
        if (processedLine) {
          formattedLines.push({
            type: 'paragraph',
            content: processedLine,
            className: 'text-gray-700 mb-3 leading-relaxed text-justify'
          });
        }
      } else {
        // Add spacing for empty lines
        formattedLines.push({
          type: 'spacing',
          content: '',
          className: 'mb-4'
        });
      }
    }
    
    return formattedLines;
  };
  
  const formattedLines = formatText(sanitizedContent);
  
  return (
    <div className={`max-w-none bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden ${className}`}>
      {title && (
        <div className="p-8 border-b border-gray-200">
          <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <FileText className="w-8 h-8 text-gray-600" />
            {title}
          </h2>
        </div>
      )}
      <div className="p-8">
        <div className="prose prose-lg max-w-none">
          {formattedLines.map((line, index) => {
            if (line.type === 'header') {
              return (
                <div key={index} className={`relative ${line.className}`}>
                  {line.level <= 2 && (
                    <div className="absolute -left-6 top-0 w-1 h-full bg-gradient-to-b from-gray-600 to-gray-700 rounded-full"></div>
                  )}
                  <div className="flex items-center gap-3">
                    {line.level === 1 && <div className="w-3 h-3 bg-gray-600 rounded-full"></div>}
                    {line.level === 2 && <div className="w-2 h-2 bg-gray-700 rounded-full"></div>}
                    <span>{line.content}</span>
                  </div>
                </div>
              );
            } else if (line.type === 'bullet') {
              return (
                <div key={index} className={`flex items-start ${line.className}`}>
                  <div className="w-3 h-3 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full mt-2 mr-4 flex-shrink-0 shadow-sm"></div>
                  <span className="flex-1 leading-relaxed">{line.content}</span>
                </div>
              );
            } else if (line.type === 'numbered') {
              return (
                <div key={index} className={`${line.className} pl-6 relative`}>
                  <div className="absolute left-0 top-0 w-6 h-6 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {line.content.match(/^\d+/) ? line.content.match(/^\d+/)[0] : '•'}
                  </div>
                  <span className="font-medium text-gray-800">{line.content.replace(/^\d+\.\s*/, '')}</span>
                </div>
              );
            } else if (line.type === 'spacing') {
              return <div key={index} className={line.className}></div>;
            } else {
              return (
                <div key={index} className={`${line.className} p-4 bg-gray-50 rounded-lg border-l-4 border-gray-300 my-3`}>
                  <div className="text-gray-800 leading-relaxed">{line.content}</div>
                </div>
              );
            }
          })}
        </div>
        
        {/* Professional Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>Document generated by BA Agent Pro</span>
            </div>
            <div className="text-right">
              <div>Generated: {new Date().toLocaleDateString()}</div>
              <div className="text-xs">Version 1.0</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Enhanced Mermaid Diagram with better error handling and loading states
function MermaidDiagram({ code, id, showDownloadPng, showPngInline, title }) {
  const containerRef = useRef(null);
  const [pngUrl, setPngUrl] = useState(null);
  const [loadingPng, setLoadingPng] = useState(false);
  const [error, setError] = useState(null);
  const [fallbackMode, setFallbackMode] = useState(false);
  const [svgContent, setSvgContent] = useState('');
  const [isRendering, setIsRendering] = useState(false);

  // Function to clean and validate Mermaid code
  const cleanMermaidCode = (code) => {
    if (!code) return '';
    
    let cleaned = code;
    
    // Step 1: Handle <br> tags properly - replace with spaces instead of newlines
    cleaned = cleaned.replace(/<br\s*\/?>/gi, ' ');
    
    // Step 2: Handle specific problematic patterns in node labels
    // Pattern: A[ASP Pages <br> (e.g., Rlv_ISLLPOL_2] -> A[ASP Pages]
    cleaned = cleaned.replace(/([A-Z])\[([^\]]*?)(?:<br>|\([^)]*\))[^\]]*?\]/g, (match, nodeId, content) => {
      const cleanedContent = content.trim();
      return `${nodeId}[${cleanedContent}]`;
    });
    
    // Step 3: Handle patterns like Q[/policies (GET)] -> Q[policies]
    cleaned = cleaned.replace(/([A-Z])\[([^\]]*?)\/\([^)]*\)([^\]]*?)\]/g, (match, nodeId, before, after) => {
      const cleanedContent = (before + after).trim();
      return `${nodeId}[${cleanedContent}]`;
    });
    
    // Step 4: Fix subgraph syntax - completely rewrite subgraph handling
    // First, try to detect if this is a subgraph-based diagram
    if (cleaned.includes('subgraph')) {
      console.log('Original code with subgraph:', cleaned);
      
      // Method 1: Try to fix subgraph syntax with proper spacing
      let fixedSubgraph = cleaned
        .replace(/subgraph\s+([^\n]+)/g, 'subgraph $1')
        .replace(/subgraph\s*([A-Za-z0-9_\s]+)\s*\n/g, 'subgraph $1\n')
        .replace(/end\s*\n/g, 'end\n')
        .replace(/subgraph\s*([^\n]+)\s*{/g, 'subgraph $1\n')
        .replace(/}\s*end/g, '\nend');
      
      // Method 2: If subgraph still fails, convert to simple flowchart
      if (fixedSubgraph.includes('subgraph')) {
        console.log('Attempting to convert subgraph to simple flowchart...');
        
        // Extract all nodes from the original code
        const nodeMatches = cleaned.match(/([A-Z])\[([^\]]+)\]/g) || [];
        const nodes = nodeMatches.map(match => {
          const [, id, label] = match.match(/([A-Z])\[([^\]]+)\]/);
          return { id, label: label.replace(/[<>]/g, '').trim() };
        });
        
        if (nodes.length > 0) {
          // Create a simple flowchart without subgraphs
          let simpleFlowchart = 'flowchart TD\n';
          
          // Add all nodes
          nodes.forEach(node => {
            simpleFlowchart += `  ${node.id}[${node.label}]\n`;
          });
          
          // Add connections (simple sequential)
          for (let i = 0; i < nodes.length - 1; i++) {
            simpleFlowchart += `  ${nodes[i].id} --> ${nodes[i + 1].id}\n`;
          }
          
          console.log('Converted to simple flowchart:', simpleFlowchart);
          return simpleFlowchart;
        }
      }
      
      // Method 3: If all else fails, create a basic architecture diagram
      console.log('Creating fallback architecture diagram due to subgraph issues');
      return `flowchart TD
    UI[User Interface Layer] --> BL[Business Logic Layer]
    BL --> DAL[Data Access Layer]
    DAL --> DB[Database]
    BL --> API[External APIs]
    BL --> SEC[Security Layer]
    UI --> AUTH[Authentication]
    AUTH --> SEC
    style UI fill:#e1f5fe
    style BL fill:#f3e5f5
    style DAL fill:#e8f5e8
    style DB fill:#fff3e0
    style API fill:#fce4ec
    style SEC fill:#ffebee
    style AUTH fill:#f1f8e9`;
    }
    
    // Step 5: Fix flowchart syntax issues
    // Ensure proper spacing after flowchart declaration
    cleaned = cleaned.replace(/flowchart\s*([A-Z]+)/g, 'flowchart $1');
    
    // Step 6: Normalize node definitions with special characters
    // 6a) Convert parentheses-shaped nodes to square-bracket nodes for stability: B(API Gateway) -> B[API Gateway]
    cleaned = cleaned.replace(/\b([A-Za-z][\w]*)\s*\(([^)]+)\)/g, (m, id, label) => `${id}[${label}]`);
    // 6b) If label inside [] contains parentheses, keep the text but drop only the parentheses characters, not the content
    cleaned = cleaned.replace(/([A-Za-z])\[([^\]]*?\([^)]*\)[^\]]*?)\]/g, (match, nodeId, content) => {
      const cleanedContent = content.replace(/[()]/g, '').trim();
      return `${nodeId}[${cleanedContent}]`;
    });
    
    // Step 7: Fix edge definitions
    // Remove quoted or piped edge labels which can trigger unsupported arrow types in some mermaid builds
    cleaned = cleaned.replace(/--\s*"[^\"]*"\s*-->/g, ' --> ');
    cleaned = cleaned.replace(/--\s*\|[^|]*\|\s*-->/g, ' --> ');
    // Normalize spacing
    cleaned = cleaned.replace(/([A-Z])\s*-->\s*([A-Z])/g, '$1 --> $2');
    cleaned = cleaned.replace(/([A-Z])\s*---\s*([A-Z])/g, '$1 --- $2');
    
    // Step 8: Normalize edge spacing and line endings
    cleaned = cleaned.replace(/\s*-->\s*/g, ' --> ');
    cleaned = cleaned.replace(/\s*---\s*/g, ' --- ');
    cleaned = cleaned.replace(/\n\s*\n/g, '\n');
    cleaned = cleaned.trim();
    
    // Step 9: Expand single-letter IDs to avoid Mermaid internal translation warnings
    try {
      const lines = cleaned.split(/\r?\n/);
      const idMap = new Map();
      const getHint = (ln) => {
        const m = ln.match(/:::(\w+)/);
        return m ? m[1].toUpperCase() : null;
      };
      const choose = (hint) => {
        const known = ['UI','APP','BIZ','DATA','SEC','INFRA','API','CTRL','SVC','REPO','DB','UTIL','EXT'];
        return (hint && known.includes(hint)) ? hint : 'NODE';
      };
      // Collect single-letter node defs A[...]
      lines.forEach((ln) => {
        const m = ln.match(/^\s*([A-Za-z])\s*\[/);
        if (m) {
          const id = m[1];
          if (!idMap.has(id)) idMap.set(id, `${choose(getHint(ln))}_${id}`);
        }
      });
      if (idMap.size) {
        let updated = cleaned;
        // Node definitions
        idMap.forEach((newId, oldId) => {
          const reNode = new RegExp(`(^|\\n)(\\s*)${oldId}(?=\\s*\\[)`, 'g');
          updated = updated.replace(reNode, ($0, p1, p2) => `${p1}${p2}${newId}`);
        });
        // class assignments
        updated = updated.replace(/class\s+([A-Za-z0-9_,\s]+)\s+([A-Za-z_][\w]*)\s*;/g, (full, ids, cls) => {
          const mapped = ids.split(',').map(s => {
            const v = s.trim();
            return idMap.get(v) || v;
          }).join(',');
          return `class ${mapped} ${cls};`;
        });
        // other references (avoid inside labels)
        idMap.forEach((newId, oldId) => {
          const reEdge = new RegExp(`\\b${oldId}\\b`, 'g');
          updated = updated.replace(reEdge, (match, offset, str) => {
            const before = str.slice(Math.max(0, offset - 5), offset);
            if (before.includes('[')) return match;
            return newId;
          });
        });
        cleaned = updated;
      }
    } catch (e) {
      console.warn('ID expansion failed:', e);
    }
    
    console.log('Cleaned Mermaid code:', cleaned);
    return cleaned;
  };

  // Create a completely safe fallback diagram
  const createSafeDiagram = (originalCode) => {
    // Try to extract meaningful information from the original code
    const nodeMatches = originalCode.match(/([A-Z])\[([^\]]+)\]/g) || [];
    const nodes = nodeMatches.map(match => {
      const [, id, label] = match.match(/([A-Z])\[([^\]]+)\]/);
      return { id, label: label.replace(/[<>]/g, '').trim() };
    });
    
    if (nodes.length > 0) {
      // Create a simplified diagram with the extracted nodes
      let fallbackCode = 'graph TD\n';
      nodes.forEach(node => {
        fallbackCode += `  ${node.id}[${node.label}]\n`;
      });
      return fallbackCode;
    }
    
    // Default architecture diagram fallback if no nodes can be extracted
    return `flowchart TD
    START[System Architecture] --> FE[Frontend Layer]
    START --> BE[Backend Layer]
    FE --> AUTH[Authentication Service]
    BE --> BL[Business Logic]
    BL --> DB[Database Layer]
    BE --> API[External APIs]
    style START fill:#e3f2fd
    style FE fill:#f3e5f5
    style BE fill:#e8f5e8
    style AUTH fill:#fff3e0
    style BL fill:#fce4ec
    style DB fill:#ffebee
    style API fill:#f1f8e9`;
  };

  useEffect(() => {
    let isMounted = true;
    let renderTimeout;
    
    async function renderMermaid() {
      if (!code) {
        setError('No diagram code provided.');
        return;
      }
      
      try {
        setError(null);
        setFallbackMode(false);
        setIsRendering(true);
        
        // Dynamically import mermaid if not already loaded
        if (!window.mermaid) {
          const mermaidModule = await import('mermaid');
          window.mermaid = mermaidModule.default || mermaidModule;
        }
        
        // Initialize mermaid with more stable configuration for flowcharts
        window.mermaid.initialize({ 
          startOnLoad: false,
          theme: 'default',
          fontFamily: 'Inter, Arial, sans-serif',
          flowchart: { 
            useMaxWidth: true,
            htmlLabels: false, // reduce layout issues
            curve: 'linear',   // simpler edges reduce parser/layout warnings
            nodeSpacing: 50,
            rankSpacing: 60
          },
          securityLevel: 'loose'
        });
        
        if (isMounted) {
          const cleanedCode = cleanMermaidCode(code);
          
          if (cleanedCode && cleanedCode !== code) {
            console.log('Code cleaned for rendering');
            console.log('Original code:', code);
            console.log('Cleaned code:', cleanedCode);
          }
          
          try {
            // Use a unique ID for each render to avoid conflicts
            const uniqueId = `${id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            
            // Render the diagram using mermaid's render function with try-fallback
            let svg;
            try {
              ({ svg } = await window.mermaid.render(uniqueId, cleanedCode));
            } catch (primaryErr) {
              // Try to prefix nodes that are single letters (Mermaid sometimes treats them specially)
              const prefixed = cleanedCode.replace(/\n\s*([A-Z])\s*\[/g, (m, p1) => `\n ${p1}${p1} [`)
                                          .replace(/class\s+([A-Z])(\s|;)/g, (m, p1, p2) => `class ${p1}${p1}${p2}`)
                                          .replace(/\b([A-Z])\b(?![\w\[])/g, '$1');
              ({ svg } = await window.mermaid.render(uniqueId, prefixed));
            }
            
            if (isMounted) {
              setSvgContent(svg);
              setError(null);
            }
          } catch (renderError) {
            console.warn('Primary render failed, trying fallback:', renderError);
            
            if (isMounted) {
              // Try with different Mermaid configurations
              try {
                // Try with more permissive settings
                window.mermaid.initialize({ 
                  startOnLoad: false,
                  theme: 'default',
                  flowchart: { 
                    useMaxWidth: true,
                    htmlLabels: true,
                    curve: 'basis'
                  },
                  securityLevel: 'loose',
                  logLevel: 0 // Disable logging for fallback
                });
                
                const fallbackCode = createSafeDiagram(code);
                const uniqueId = `${id}-fallback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                const { svg } = await window.mermaid.render(uniqueId, fallbackCode);
                setSvgContent(svg);
                setFallbackMode(true);
                setError('Diagram rendered with simplified syntax due to parsing issues.');
              } catch (fallbackError) {
                console.warn('Fallback render also failed:', fallbackError);
                
                // Create a simple text-based representation
                const textRepresentation = `
                  <div style="padding: 20px; text-align: center; color: #666; border: 1px solid #ddd; border-radius: 8px; background: #f9f9f9;">
                    <h4 style="margin: 0 0 10px 0; color: #333;">Diagram could not be rendered</h4>
                    <p style="margin: 0 0 15px 0;">The original diagram contained syntax that could not be parsed.</p>
                    <details style="margin-top: 10px; text-align: left;">
                      <summary style="cursor: pointer; color: #0066cc;">View Original Code</summary>
                      <pre style="background: #f5f5f5; padding: 10px; border-radius: 4px; margin-top: 10px; font-size: 12px; overflow-x: auto;">${code}</pre>
                    </details>
                  </div>
                `;
                
                setSvgContent(textRepresentation);
                setError('Diagram could not be rendered. Check the original code for syntax issues.');
                setFallbackMode(true);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error in renderMermaid:', error);
        if (isMounted) {
          setError(`Failed to render diagram: ${error.message}`);
        }
      } finally {
        if (isMounted) {
          setIsRendering(false);
        }
      }
    }
    
    // Add a small delay to prevent rapid re-renders
    renderTimeout = setTimeout(() => {
    renderMermaid();
    }, 100);
    
    return () => { 
      isMounted = false; 
      if (renderTimeout) {
        clearTimeout(renderTimeout);
      }
    };
  }, [code, id]);

  const downloadPng = async () => {
    try {
      setLoadingPng(true);
      const response = await fetch(`${API_BASE_URL}/api/render_mermaid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${id}.png`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        alert('Failed to generate PNG');
      }
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download diagram');
    } finally {
      setLoadingPng(false);
    }
  };

  const openInDrawio = async () => {
    try {
      const mermaid = typeof code === 'string' ? code : '';
      if (!mermaid) return;
      // Convert Mermaid to draw.io XML via backend
      const res = await fetch(`${API_BASE_URL}/api/convert_mermaid_to_drawio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: mermaid })
      });
      const data = await res.json();
      if (!data.success) {
        alert('Failed to convert to draw.io');
        return;
      }
      const xml = data.xml;
      // Open diagrams.net embed
      const url = 'https://embed.diagrams.net/?embed=1&ui=min&proto=json&spin=1&libraries=1&configure=1';
      const win = window.open(url, '_blank');
      if (!win) {
        alert('Popup blocked. Please allow popups to open diagrams.net.');
        return;
      }
      // PostMessage handshake
      const onMessage = (evt) => {
        if (!evt.data) return;
        const msg = evt.data;
        if (msg === 'ready' || (typeof msg === 'object' && msg.event === 'ready')) {
          // Load our diagram
          win.postMessage(JSON.stringify({ action: 'load', xml }), '*');
        }
      };
      window.addEventListener('message', onMessage, { once: true });
    } catch (e) {
      console.error('Open in draw.io failed', e);
      alert('Could not open in draw.io');
    }
  };

  // Fetch PNG for inline display; detect Lucid handoff token and skip PNG
  const fetchPng = async () => {
    setLoadingPng(true);
    setPngUrl(null);
    try {
      if (code && typeof code === 'string' && code.startsWith('LUCID_EMBED::')) {
        setLoadingPng(false);
        setPngUrl(null);
        return;
      }
      const response = await fetch(`${API_BASE_URL}/api/render_mermaid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        setPngUrl(url);
      } else {
        setPngUrl(null);
      }
    } catch (error) {
      console.error('PNG fetch error:', error);
      setPngUrl(null);
    }
    setLoadingPng(false);
  };

  useEffect(() => {
    if (showPngInline && code) {
      fetchPng();
    }
    return () => {
      if (pngUrl) window.URL.revokeObjectURL(pngUrl);
    };
  }, [showPngInline, code]);

  if (error && fallbackMode) {
    return (
      <div className="glass-card rounded-lg shadow-lg border p-6">
        {title && (
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              {title}
            </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={openInDrawio}
                  className="px-3 py-1 text-sm bg-orange-600 text-white rounded hover:bg-orange-700"
                >
                  Edit in draw.io
                </button>
              </div>
          </div>
        )}
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-yellow-700 mb-3">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-semibold">Diagram Rendering Issue</span>
          </div>
          <p className="text-yellow-700 mb-3">{error}</p>
          {showPngInline && pngUrl && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">PNG Fallback Preview:</h4>
              <img src={pngUrl} alt="Diagram PNG" className="max-w-full border rounded" />
            </div>
          )}
          <div className="bg-white rounded border p-3">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Raw Diagram Code:</h4>
            <pre className="text-xs text-gray-600 bg-gray-50 p-2 rounded overflow-x-auto">
              {code}
            </pre>
          </div>
        </div>
      </div>
    );
  }

  // Show fallback indicator when in fallback mode but no error
  if (fallbackMode && !error) {
    return (
      <div className="glass-card rounded-lg shadow-lg border p-6">
        {title && (
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              {title}
            </h3>
            <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
              Simplified Version
            </div>
          </div>
        )}
        
        <div className="border rounded-lg overflow-hidden bg-gray-50">
          <div ref={containerRef} className="p-4 min-h-[200px] flex items-center justify-center">
            {!code && (
              <div className="text-center">
                <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">No diagram code available</p>
              </div>
            )}
            {code && !containerRef.current?.innerHTML && !error && (
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-gray-600">Rendering diagram...</p>
              </div>
            )}
            {code && error && !fallbackMode && (
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-gray-600">Attempting to fix diagram syntax...</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-blue-700 mb-2">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm font-medium">Simplified Diagram</span>
          </div>
          <p className="text-blue-600 text-xs">The original diagram contained complex syntax. This is a simplified version.</p>
        </div>
      </div>
    );
  }

  const isLucid = code && typeof code === 'string' && code.startsWith('LUCID_EMBED::');

  return (
    <div className="glass-card rounded-lg shadow-lg border p-6">
      {title && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            {title}
          </h3>
          {showDownloadPng && (
            <button
              onClick={downloadPng}
              disabled={loadingPng}
              className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loadingPng ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Download className="w-4 h-4" />
              )}
              Download PNG
            </button>
          )}
        </div>
      )}
      
      <div className="border rounded-lg overflow-hidden bg-gray-50">
        <div ref={containerRef} className="p-4 min-h-[200px] flex items-center justify-center">
          {!code && (
            <div className="text-center">
              <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">No diagram code available</p>
            </div>
          )}
          {code && !isLucid && isRendering && (
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-gray-600">Rendering diagram...</p>
            </div>
          )}
          {code && !isLucid && error && !fallbackMode && (
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-gray-600">Attempting to fix diagram syntax...</p>
            </div>
          )}
          {!isLucid && svgContent && (
            <div 
              className="w-full h-full flex items-center justify-center"
              dangerouslySetInnerHTML={{ __html: svgContent }}
            />
          )}
          {isLucid && (
            <iframe
              title={`Lucid ${id}`}
              src={code.replace('LUCID_EMBED::','')}
              className="w-full h-[600px] border-0 rounded"
              allowFullScreen
            />
          )}
        </div>
      </div>
      
      {showPngInline && pngUrl && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">PNG Preview:</h4>
          <img src={pngUrl} alt="Diagram PNG" className="max-w-full border rounded" />
        </div>
      )}
    </div>
  );
}

// Enhanced Backlog Stats with better visualization
function BacklogStats({ backlog }) {
  const [expanded, setExpanded] = useState({});

  const countItems = (items) => {
    let epics = 0, features = 0, stories = 0;
    items.forEach(item => {
      if (item.type === 'Epic') epics++;
      else if (item.type === 'Feature') features++;
      else if (item.type === 'User Story') stories++;
      if (item.children) {
        const childCounts = countItems(item.children);
        epics += childCounts.epics;
        features += childCounts.features;
        stories += childCounts.stories;
      }
    });
    return { epics, features, stories };
  };

  const counts = countItems(backlog);

  return (
    <div className="bg-white rounded-lg shadow-lg border p-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <BarChart3 className="w-5 h-5" />
        Project Statistics
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-blue-800">Epics</span>
          </div>
          <div className="text-2xl font-bold text-blue-900">{counts.epics}</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-green-600" />
            <span className="font-semibold text-green-800">Features</span>
          </div>
          <div className="text-2xl font-bold text-green-900">{counts.features}</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600" />
            <span className="font-semibold text-purple-800">User Stories</span>
          </div>
          <div className="text-2xl font-bold text-purple-900">{counts.stories}</div>
        </div>
      </div>
    </div>
  );
}

function BacklogBoard({ backlog }) {
  if (!Array.isArray(backlog) || backlog.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500 bg-gray-50 rounded-lg border">
        No backlog items to display
      </div>
    );
  }

  const epics = backlog.filter(i => (i.type || '').toLowerCase() === 'epic');
  const columns = epics.length ? epics : backlog;

  // Color tokens per type
  const epicClasses = 'bg-indigo-50 text-indigo-900 border-indigo-300';
  const featureClasses = 'bg-emerald-50 text-emerald-900 border-emerald-300';
  const storyClasses = 'bg-amber-50 text-amber-900 border-amber-300';

  return (
    <div className="rounded-xl overflow-x-auto">
      <div className="min-w-[800px] bg-gray-800 p-4 md:p-6 rounded-xl border border-gray-700">
        {/* Legend */}
        <div className="flex gap-4 mb-4 text-xs text-white/80">
          <div className="flex items-center gap-2">
            <span className="inline-block w-4 h-4 rounded border border-indigo-300 bg-indigo-50" /> Epic
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-4 h-4 rounded border border-emerald-300 bg-emerald-50" /> Feature
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-4 h-4 rounded border border-amber-300 bg-amber-50" /> User Story
          </div>
        </div>

        <div className="flex gap-4 md:gap-6">
          {columns.map((epic) => {
            const features = (epic.children || []).filter(c => (c.type || '').toLowerCase() === 'feature');
            const directStories = (epic.children || []).filter(c => (c.type || '').toLowerCase() === 'user story');
            const showDirectStories = features.length === 0 && directStories.length > 0;
            return (
              <div key={epic.id} className="w-[260px] flex-shrink-0">
                <div className={`rounded-xl shadow border px-4 py-2 text-center font-semibold mb-3 ${epicClasses}`}>
                  {epic.title || epic.name || 'Epic'}
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {features.length > 0 ? (
                    features.map((feat) => (
                      <div key={feat.id} className={`rounded-lg shadow border p-2 ${featureClasses}`}>
                        <div className="text-sm font-semibold mb-2 text-center">
                          {feat.title || feat.name || 'Feature'}
                        </div>
                        <div className="space-y-2">
                          {(feat.children || []).filter(c => (c.type || '').toLowerCase() === 'user story').map((story) => (
                            <div key={story.id} className={`rounded-md border px-3 py-2 text-xs shadow-sm ${storyClasses}`}>
                              {story.title || story.name || 'User Story'}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : showDirectStories ? (
                    <div className={`rounded-lg shadow border p-2 ${featureClasses}`}>
                      <div className="text-sm font-semibold mb-2 text-center">User Stories</div>
                      <div className="space-y-2">
                        {directStories.map((story) => (
                          <div key={story.id} className={`rounded-md border px-3 py-2 text-xs shadow-sm ${storyClasses}`}>
                            {story.title || story.name || 'User Story'}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white/60 text-gray-600 rounded-lg border border-dashed border-gray-300 px-3 py-6 text-center text-xs">
                      No features
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Enhanced Progress Tracking Component
function ProgressTracker({ currentStep, totalSteps, stepNames }) {
  return (
    <div className="bg-white rounded-lg shadow-lg border p-6 mb-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <Activity className="w-5 h-5" />
        Analysis Progress
      </h3>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Progress</span>
          <span className="text-sm font-medium text-gray-700">{currentStep}/{totalSteps}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          ></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
          {stepNames.map((step, index) => (
            <div 
              key={index}
              className={`p-2 rounded text-xs font-medium ${
                index < currentStep 
                  ? 'bg-green-100 text-green-800 border border-green-200' 
                  : index === currentStep 
                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                    : 'bg-gray-100 text-gray-600 border border-gray-200'
              }`}
            >
              {step}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Enhanced Real-time Collaboration Component
function CollaborationPanel({ notifications, messages }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
      >
        <Bell className="w-6 h-6" />
      </button>
      
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-80 bg-white rounded-lg shadow-xl border">
          <div className="p-4 border-b">
            <h3 className="font-semibold text-gray-800">Collaboration</h3>
          </div>
          <div className="p-4 max-h-64 overflow-y-auto">
            {notifications?.length > 0 ? (
              notifications.map((notification, index) => (
                <div key={index} className="mb-3 p-2 bg-blue-50 rounded border border-blue-200">
                  <p className="text-sm text-blue-800">{notification}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No recent activity</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function BacklogCards({ backlog }) {
  const [expanded, setExpanded] = useState({});
  
  // Debug: Log the backlog prop
  console.log('BacklogCards received:', backlog);
  console.log('BacklogCards type:', typeof backlog);
  console.log('BacklogCards isArray:', Array.isArray(backlog));
  
  if (Array.isArray(backlog) && backlog.length > 0) {
    console.log('BacklogCards: First item details:', {
      id: backlog[0].id,
      type: backlog[0].type,
      title: backlog[0].title,
      description: backlog[0].description,
      hasChildren: backlog[0].children && backlog[0].children.length > 0,
      childrenCount: backlog[0].children ? backlog[0].children.length : 0,
      hasLinkingInfo: !!(backlog[0].trd_sections || backlog[0].requirements_covered)
    });
  }
  
  if (!Array.isArray(backlog) || backlog.length === 0) {
    console.log('BacklogCards: No valid backlog data, showing empty message');
    return <div className="p-4 text-gray-500 text-center">No backlog items were generated.</div>;
  }

  const toggle = (id) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  const renderLinkingInfo = (item) => {
    const hasLinkingInfo = item.trd_sections || item.requirements_covered;
    
    if (!hasLinkingInfo) return null;

    return (
      <div className="mt-2 p-2 bg-blue-50 rounded-md border border-blue-200">
        <div className="text-xs font-medium text-blue-700 mb-1">Links to:</div>
        {item.trd_sections && item.trd_sections.length > 0 && (
          <div className="mb-1">
            <span className="text-xs text-blue-600 font-medium">TRD Sections: </span>
            <span className="text-xs text-blue-800">{item.trd_sections.join(', ')}</span>
          </div>
        )}
        {item.requirements_covered && item.requirements_covered.length > 0 && (
          <div>
            <span className="text-xs text-blue-600 font-medium">Requirements: </span>
            <span className="text-xs text-blue-800">{item.requirements_covered.join(', ')}</span>
          </div>
        )}
      </div>
    );
  };

  const renderTree = (items, level = 0) => (
    <ul className={level > 0 ? "ml-4 pl-4 border-l-2 border-blue-200" : ""}>
      {items.map(item => (
        <li key={item.id} className="mb-3">
          <div className="bg-white rounded-md border border-gray-200 p-3 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              {item.children && item.children.length > 0 ? (
                <button onClick={() => toggle(item.id)} className="focus:outline-none">
                  {expanded[item.id] ? <ChevronDown className="w-4 h-4 text-blue-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
                </button>
              ) : <span className="w-4 h-4" />}
              <span className={`font-semibold w-20 text-center text-xs py-1 rounded-full ${
                  item.type === 'Epic' ? 'bg-purple-100 text-purple-700' :
                  item.type === 'Feature' ? 'bg-sky-100 text-sky-700' :
                  'bg-emerald-100 text-emerald-700'
              }`}>{item.type}</span>
              <span className="text-gray-800 flex-1 font-medium">{item.title}</span>
              {item.priority && (
                <span className={`text-xs px-2 py-1 rounded-full ${
                  item.priority === 'High' ? 'bg-red-100 text-red-700' :
                  item.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-green-100 text-green-700'
                }`}>{item.priority}</span>
              )}
              {item.effort && (
                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                  {item.effort} SP
                </span>
              )}
            </div>
            
            {item.description && (
              <div className="text-sm text-gray-600 mb-2 ml-6">{item.description}</div>
            )}
            
            {renderLinkingInfo(item)}
            
            {item.acceptance_criteria && item.acceptance_criteria.length > 0 && (
              <div className="mt-2 ml-6">
                <div className="text-xs font-medium text-gray-700 mb-1">Acceptance Criteria:</div>
                <ul className="text-xs text-gray-600 space-y-1">
                  {item.acceptance_criteria.map((criterion, index) => (
                    <li key={index} className="flex items-start gap-1">
                      <span className="text-green-500 mt-0.5">•</span>
                      <span>{criterion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          {item.children && item.children.length > 0 && expanded[item.id] && renderTree(item.children, level + 1)}
        </li>
      ))}
    </ul>
  );
  return <div className="bg-blue-50 rounded-lg p-4 shadow-inner">{renderTree(backlog)}</div>;
}

const Sidebar = ({ 
  activeSection, setActiveSection, 
  documents, pastAnalyses, 
  selectedDocument, setSelectedDocument, 
  selectedAnalysis, setSelectedAnalysis, 
  sidebarOpen, setSidebarOpen, onLogout,
  selectedLOB, setSelectedLOB,
  projectTags, setProjectTags,
  availableTags, setAvailableTags,
  showTagInput, setShowTagInput,
  newTag, setNewTag,
  addTag, removeTag, addNewTag,
  lobCategories,
  filteredDocuments, filteredAnalyses
}) => {
  const [showLOBSelector, setShowLOBSelector] = useState(false);
  const [showTagSelector, setShowTagSelector] = useState(false);

  return (
    <aside className={`sidebar fixed lg:relative left-4 lg:left-8 top-20 lg:top-8 h-[calc(100vh-8rem)] lg:h-[calc(100vh-6rem)] w-64 z-40 transition-all duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:flex-shrink-0 rounded-2xl lg:rounded-3xl overflow-hidden bg-white shadow-xl border border-gray-200`}>
    <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
          </div>
            <h1 className="text-lg font-bold text-gray-900">BA Agent Pro</h1>
        </div>
          <p className="text-xs text-gray-600 mt-1">P&C Insurance Solutions</p>
      </div>
      
        {/* LOB Selector */}
        <div className="p-3 border-b border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-700">Line of Business</h3>
            <button
              onClick={() => setShowLOBSelector(!showLOBSelector)}
              className="text-blue-600 hover:text-blue-700"
            >
              {showLOBSelector ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
          
          {showLOBSelector && (
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {lobCategories.map((lob) => (
                <button
                  key={lob.id}
                  onClick={() => setSelectedLOB(lob.id)}
                  className={`w-full p-2 rounded-lg flex items-center gap-2 text-sm transition-all ${
                    selectedLOB === lob.id
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-lg">{lob.icon}</span>
                  <span className="font-medium">{lob.name}</span>
                </button>
              ))}
            </div>
          )}
          
          {/* Current LOB Display */}
          {!showLOBSelector && (
            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
              <span className="text-lg">
                {lobCategories.find(lob => lob.id === selectedLOB)?.icon || '📊'}
              </span>
              <span className="text-sm font-medium text-gray-700">
                {lobCategories.find(lob => lob.id === selectedLOB)?.name || 'All Lines'}
              </span>
            </div>
          )}
        </div>

        {/* Project Tags */}
        <div className="p-3 border-b border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-700">Project Tags</h3>
            <button
              onClick={() => setShowTagSelector(!showTagSelector)}
              className="text-blue-600 hover:text-blue-700"
            >
              {showTagSelector ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
          
          {showTagSelector && (
            <div className="space-y-2">
              {/* Selected Tags */}
              {projectTags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {projectTags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                    >
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
              
              {/* Available Tags */}
              <div className="max-h-32 overflow-y-auto">
                <div className="text-xs text-gray-500 mb-1">Available Tags:</div>
                <div className="flex flex-wrap gap-1">
                  {availableTags
                    .filter(tag => !projectTags.includes(tag))
                    .map((tag) => (
                      <button
                        key={tag}
                        onClick={() => addTag(tag)}
                        className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full hover:bg-gray-200 transition-colors"
                      >
                        + {tag}
                      </button>
                    ))}
                </div>
              </div>
              
              {/* Add New Tag */}
              <div className="pt-2 border-t border-gray-100">
                <button
                  onClick={() => setShowTagInput(!showTagInput)}
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  + Add Custom Tag
                </button>
                {showTagInput && (
                  <div className="mt-2 flex gap-1">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="New tag..."
                      className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                      onKeyPress={(e) => e.key === 'Enter' && addNewTag()}
                    />
                    <button
                      onClick={addNewTag}
                      className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                    >
                      Add
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Current Tags Display */}
          {!showTagSelector && projectTags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {projectTags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                >
                  {tag}
                </span>
              ))}
              {projectTags.length > 3 && (
                <span className="text-xs text-gray-500">+{projectTags.length - 3} more</span>
              )}
            </div>
          )}
        </div>
        
        {/* Navigation */}
      <div className="flex-1 p-3 space-y-2">
        <button
            onClick={() => setActiveSection('upload')}
          className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all duration-200 ${
              activeSection === 'upload' 
              ? 'bg-blue-50 text-blue-600 border border-blue-200 shadow-sm' 
              : 'text-gray-700 hover:bg-gray-50 hover:shadow-sm'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span className="font-medium text-sm">New Analysis</span>
        </button>
        
        <button
          onClick={() => setActiveSection('documents')}
          className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all duration-200 ${
            activeSection === 'documents' 
              ? 'bg-blue-50 text-blue-600 border border-blue-200 shadow-sm' 
              : 'text-gray-700 hover:bg-gray-50 hover:shadow-sm'
          }`}
        >
          <Folder className="w-4 h-4" />
          <span className="font-medium text-sm">Documents ({filteredDocuments.length})</span>
        </button>
        
        <button
          onClick={() => setActiveSection('analyses')}
          className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all duration-200 ${
            activeSection === 'analyses' 
              ? 'bg-blue-50 text-blue-600 border border-blue-200 shadow-sm' 
              : 'text-gray-700 hover:bg-gray-50 hover:shadow-sm'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span className="font-medium text-sm">Past Analyses ({filteredAnalyses.length})</span>
        </button>
        <button
          onClick={() => setActiveSection('work-items')}
          className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all duration-200 ${
            activeSection === 'work-items' 
              ? 'bg-blue-50 text-blue-600 border border-blue-200 shadow-sm' 
              : 'text-gray-700 hover:bg-gray-50 hover:shadow-sm'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span className="font-medium text-sm">Work Items</span>
        </button>
      </div>
      
        {/* Footer */}
      <div className="p-3 border-t border-gray-200 space-y-2">
        <button
          onClick={() => setActiveSection('capabilities')}
          className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all duration-200 ${
            activeSection === 'capabilities' 
              ? 'bg-blue-50 text-blue-600 border border-blue-200 shadow-sm' 
              : 'text-gray-700 hover:bg-gray-50 hover:shadow-sm'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span className="font-medium text-sm">Admin Portal</span>
        </button>
        {/* Render Work Items section outside of button */}
        {activeSection === 'work-items' && (
          <div className="space-y-4">
            <WorkItemsBrowser />
          </div>
        )}
        
        <button
          onClick={onLogout}
          className="w-full p-3 rounded-xl flex items-center gap-3 transition-all duration-200 text-red-600 hover:bg-red-50 hover:shadow-sm border border-transparent hover:border-red-200"
        >
          <LogOut className="w-4 h-4" />
          <span className="font-medium text-sm">Logout</span>
        </button>
      </div>
    </div>
  </aside>
);
};

// Breadcrumb Navigation Component
const BreadcrumbNavigation = ({ activeSection, selectedLOB, projectTags, lobCategories }) => {
  const getSectionIcon = (section) => {
    switch (section) {
      case 'upload': return <UploadCloud className="w-4 h-4" />;
      case 'documents': return <Folder className="w-4 h-4" />;
      case 'analyses': return <Clock className="w-4 h-4" />;
      case 'capabilities': return <Settings className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getSectionName = (section) => {
    switch (section) {
      case 'upload': return 'New Analysis';
      case 'documents': return 'Documents';
      case 'analyses': return 'Past Analyses';
      case 'capabilities': return 'Admin Portal';
      default: return 'Dashboard';
    }
  };

  return (
    <div className="mb-6 p-4 bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <span className="flex items-center gap-1">
          <Target className="w-4 h-4 text-blue-600" />
          <span className="font-medium">BA Agent Pro</span>
        </span>
        <ChevronRight className="w-4 h-4" />
        <span className="flex items-center gap-1">
          {getSectionIcon(activeSection)}

          <span className="font-medium">{getSectionName(activeSection)}</span>
        </span>
        
        {selectedLOB !== 'all' && (
          <>
            <ChevronRight className="w-4 h-4" />
            <span className="flex items-center gap-1">
              <span className="text-lg">
                {lobCategories.find(lob => lob.id === selectedLOB)?.icon}
              </span>
              <span className="font-medium">
                {lobCategories.find(lob => lob.id === selectedLOB)?.name}
              </span>
            </span>
          </>
        )}
        
        {projectTags.length > 0 && (
          <>
            <ChevronRight className="w-4 h-4" />
            <div className="flex items-center gap-1">
              <span className="font-medium">Tags:</span>
              <div className="flex gap-1">
                {projectTags.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full"
                  >
                    {tag}
                  </span>
                ))}
                {projectTags.length > 2 && (
                  <span className="text-xs text-gray-500">+{projectTags.length - 2} more</span>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// Quick Stats Dashboard Component
const QuickStats = ({ documents, analyses, selectedLOB, projectTags, lobCategories, setActiveSection }) => {
  const currentLOB = lobCategories.find(lob => lob.id === selectedLOB);
  
  return (
    <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
      {/* Documents Card - Clickable */}
      <div 
        className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 cursor-pointer hover:shadow-md hover:border-blue-300 transition-all duration-200 group"
        onClick={() => setActiveSection('documents')}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
            <Folder className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Documents</p>
            <p className="text-xl font-bold text-gray-800">{documents.length}</p>
          </div>
        </div>
        <div className="mt-2 flex items-center text-xs text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
          <span>Click to view documents</span>
          <ArrowRight className="w-3 h-3 ml-1" />
        </div>
      </div>
      
      {/* Analyses Card - Clickable */}
      <div 
        className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 cursor-pointer hover:shadow-md hover:border-green-300 transition-all duration-200 group"
        onClick={() => setActiveSection('analyses')}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
            <Clock className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Analyses</p>
            <p className="text-xl font-bold text-gray-800">{analyses.length}</p>
          </div>
        </div>
        <div className="mt-2 flex items-center text-xs text-green-600 opacity-0 group-hover:opacity-100 transition-opacity">
          <span>Click to view analyses</span>
          <ArrowRight className="w-3 h-3 ml-1" />
        </div>
      </div>
      
      {/* Current LOB Card - Not clickable */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <span className="text-lg">{currentLOB?.icon || '📊'}</span>
          </div>
          <div>
            <p className="text-sm text-gray-600">Current LOB</p>
            <p className="text-sm font-bold text-gray-800">{currentLOB?.name || 'All Lines'}</p>
          </div>
        </div>
      </div>
      
      {/* Active Tags Card - Not clickable */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
            <Link className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Active Tags</p>
            <p className="text-xl font-bold text-gray-800">{projectTags.length}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced Search and Filter Component
const SearchAndFilterBar = ({ 
  searchQuery, setSearchQuery, 
  sortBy, setSortBy, 
  sortOrder, setSortOrder, 
  viewMode, setViewMode,
  showAdvancedFilters, setShowAdvancedFilters,
  dateRange, setDateRange,
  statusFilter, setStatusFilter,
  lobCategories
}) => {
  return (
    <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
        {/* Search Bar */}
        <div className="flex-1 min-w-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by document name, content, tags, LOB, file type, or status..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Sort and View Controls */}
        <div className="flex items-center gap-2">
          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="date">Date</option>
            <option value="name">Name</option>
            <option value="lob">Line of Business</option>
            <option value="tags">Tags</option>
          </select>

          {/* Sort Order */}
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
          >
            {sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {/* View Mode Toggle */}
          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              title="Grid View"
            >
              <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
                <div className="w-1.5 h-1.5 bg-current rounded-sm"></div>
                <div className="w-1.5 h-1.5 bg-current rounded-sm"></div>
                <div className="w-1.5 h-1.5 bg-current rounded-sm"></div>
                <div className="w-1.5 h-1.5 bg-current rounded-sm"></div>
              </div>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              title="List View"
            >
              <div className="w-4 h-4 flex flex-col gap-0.5">
                <div className="w-full h-1 bg-current rounded-sm"></div>
                <div className="w-full h-1 bg-current rounded-sm"></div>
                <div className="w-full h-1 bg-current rounded-sm"></div>
              </div>
            </button>
          </div>

          {/* Advanced Filters Toggle */}
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`p-2 border rounded-lg flex items-center gap-2 ${
              showAdvancedFilters ? 'bg-blue-500 text-white border-blue-500' : 'border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span className="text-sm">Filters</span>
          </button>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showAdvancedFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={dateRange.start || ''}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="date"
                  value={dateRange.end || ''}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="in-progress">In Progress</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchQuery('');
                  setDateRange({ start: null, end: null });
                  setStatusFilter('all');
                }}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Clear All Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Enhanced Analytics Dashboard Component
const AnalyticsDashboard = ({ documents, analyses, selectedLOB, projectTags, lobCategories }) => {
  // Calculate analytics
  const totalDocuments = documents.length;
  const totalAnalyses = analyses.length;
  const lobDistribution = lobCategories.reduce((acc, lob) => {
    if (lob.id === 'all') return acc;
    const count = documents.filter(doc => doc.lob === lob.id).length;
    return { ...acc, [lob.name]: count };
  }, {});
  
  const tagUsage = projectTags.reduce((acc, tag) => {
    const count = documents.filter(doc => doc.tags && doc.tags.includes(tag)).length;
    return { ...acc, [tag]: count };
  }, {});
  
  const recentActivity = [...documents, ...analyses]
    .sort((a, b) => new Date(b.uploadDate || b.date) - new Date(a.uploadDate || a.date))
    .slice(0, 5);

  return (
    <div className="mb-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* LOB Distribution */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          Line of Business Distribution
        </h3>
        <div className="space-y-3">
          {Object.entries(lobDistribution).map(([lob, count]) => (
            <div key={lob} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">{lob}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${(count / totalDocuments) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm text-gray-600 w-8 text-right">{count}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tag Usage Analytics */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Link className="w-5 h-5 text-green-600" />
          Tag Usage Analytics
        </h3>
        <div className="space-y-3">
          {Object.entries(tagUsage).map(([tag, count]) => (
            <div key={tag} className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">{tag}</span>
              <div className="flex items-center gap-2">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ width: `${(count / totalDocuments) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm text-gray-600 w-8 text-right">{count}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:col-span-2">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-purple-600" />
          Recent Activity
        </h3>
        <div className="space-y-3">
          {recentActivity.map((item, index) => (
            <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                {item.type === 'document' ? (
                  <FileText className="w-4 h-4 text-blue-600" />
                ) : (
                  <Clock className="w-4 h-4 text-green-600" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">
                  {item.name || item.title || 'Untitled'}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(item.uploadDate || item.date).toLocaleDateString()}
                </p>
              </div>
              {item.lob && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                  {lobCategories.find(lob => lob.id === item.lob)?.icon} {item.lob}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const Capabilities = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
        <UploadCloud className="w-8 h-8 text-blue-500 mb-2" />
        <div className="font-bold text-gray-800 mb-1">Easy Input</div>
        <div className="text-gray-500 text-sm text-center">Upload BRD documents or paste text directly.</div>
      </div>
      <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
        <Search className="w-8 h-8 text-blue-500 mb-2" />
        <div className="font-bold text-gray-800 mb-1">Intelligent Extraction</div>
        <div className="text-gray-500 text-sm text-center">Extracts key text from your documents.</div>
      </div>
      <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
        <ListCollapse className="w-8 h-8 text-blue-500 mb-2" />
        <div className="font-bold text-gray-800 mb-1">Automated TRD</div>
        <div className="text-gray-500 text-sm text-center">Generates Technical Requirements Document.</div>
      </div>
      <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
        <SendIcon className="w-8 h-8 text-blue-500 mb-2" />
        <div className="font-bold text-gray-800 mb-1">Seamless Integration</div>
        <div className="text-gray-500 text-sm text-center">Streamlines TRD approval and DevOps sync.</div>
      </div>
    </div>
  );

const DocumentsSection = ({ documents, selectedDocument, setSelectedDocument, setDocuments, setNotification, selectedLOB, projectTags, lobCategories }) => {
  const [uploading, setUploading] = useState(false);

  const handleDocumentUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`${API_BASE_URL}/api/upload_document`, {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        const newDoc = await response.json();
        setDocuments(prev => [...prev, newDoc]);
        setNotification({ message: 'Document uploaded successfully!', type: 'success' });
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      setNotification({ message: 'Failed to upload document', type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
        <h2 className="text-2xl font-bold text-gray-800">Documents Library</h2>
          <div className="flex items-center gap-2 mt-1">
            {selectedLOB !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                {lobCategories.find(lob => lob.id === selectedLOB)?.icon} {lobCategories.find(lob => lob.id === selectedLOB)?.name}
              </span>
            )}
            {projectTags.map((tag) => (
              <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                {tag}
              </span>
            ))}
            <span className="text-sm text-gray-500">
              Showing {documents.length} of {documents.length} documents
            </span>
          </div>
        </div>
        <label className="bg-blue-600 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-blue-700 transition-all">
          {uploading ? 'Uploading...' : 'Upload Document'}
          <input
            type="file"
            className="hidden"
            accept=".pdf,.docx"
            onChange={handleDocumentUpload}
            disabled={uploading}
          />
        </label>
      </div>
      
      {documents.length === 0 ? (
        <div className="text-center py-12">
          <Folder className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No documents yet</h3>
          <p className="text-gray-500">Upload your first document to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <div
              key={doc.id}
              onClick={() => setSelectedDocument(doc)}
              className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                selectedDocument?.id === doc.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-blue-500" />
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-800 truncate">{doc.name}</h4>
                  <p className="text-sm text-gray-500">{doc.uploadDate}</p>
                </div>
              </div>
            </div>
              
              {/* LOB and Tags */}
              <div className="space-y-2">
                {doc.lob && (
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-500">LOB:</span>
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                      {lobCategories.find(lob => lob.id === doc.lob)?.icon || '📊'} {doc.lob}
                    </span>
                  </div>
                )}
                {doc.tags && doc.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {doc.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                        {tag}
                      </span>
                    ))}
                    {doc.tags.length > 3 && (
                      <span className="text-xs text-gray-500">+{doc.tags.length - 3} more</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const PastAnalysesSection = ({ pastAnalyses, selectedAnalysis, setSelectedAnalysis, selectedLOB, projectTags, lobCategories }) => {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Past Analyses</h2>
          <div className="flex items-center gap-2 mt-1">
            {selectedLOB !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                {lobCategories.find(lob => lob.id === selectedLOB)?.icon} {lobCategories.find(lob => lob.id === selectedLOB)?.name}
              </span>
            )}
            {projectTags.map((tag) => (
              <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                {tag}
              </span>
            ))}
            <span className="text-sm text-gray-500">
              Showing {pastAnalyses.length} of {pastAnalyses.length} analyses
            </span>
          </div>
        </div>
      </div>
      
      {pastAnalyses.length === 0 ? (
        <div className="text-center py-12">
          <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No past analyses</h3>
          <p className="text-gray-500">Your completed analyses will appear here</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Analysis List */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Analysis History</h3>
            {pastAnalyses.map((analysis) => (
              <div
                key={analysis.id}
                onClick={() => setSelectedAnalysis(analysis)}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedAnalysis?.id === analysis.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-800">{analysis.title}</h4>
                    <p className="text-sm text-gray-500">{analysis.date}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      analysis.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {analysis.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Selected Analysis Details */}
          {selectedAnalysis && (
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Analysis Details</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">{selectedAnalysis.title}</h4>
                  <p className="text-sm text-gray-600 mb-2">Created: {selectedAnalysis.date}</p>
                  <p className="text-sm text-gray-600 mb-4">Status: {selectedAnalysis.status}</p>
                </div>
                
                {selectedAnalysis.results && (
                  <div className="space-y-3">
                    <h5 className="font-medium text-gray-700">Generated Content:</h5>
                    <div className="space-y-2">
                      {selectedAnalysis.results.trd && (
                        <div className="flex items-center gap-2 text-sm">
                          <FileText className="w-4 h-4 text-blue-500" />
                          <span>Technical Requirements Document</span>
                        </div>
                      )}
                      {selectedAnalysis.results.hld && (
                        <div className="flex items-center gap-2 text-sm">
                          <BarChart3 className="w-4 h-4 text-green-500" />
                          <span>High Level Design</span>
                        </div>
                      )}
                      {selectedAnalysis.results.lld && (
                        <div className="flex items-center gap-2 text-sm">
                          <BarChart3 className="w-4 h-4 text-green-500" />
                          <span>Low Level Design</span>
                        </div>
                      )}
                      {selectedAnalysis.results.backlog && (
                        <div className="flex items-center gap-2 text-sm">
                          <ListCollapse className="w-4 h-4 text-purple-500" />
                          <span>Project Backlog</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="pt-4 border-t">
                  <button
                    onClick={() => {
                      // Here you could implement a function to load the full analysis results
                      console.log('Loading full analysis:', selectedAnalysis.id);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    <Eye className="w-4 h-4" />
                    View Full Analysis
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

function MainApp() {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Global error handler for DOM manipulation issues
  useEffect(() => {
    const handleGlobalError = (event) => {
      if (event.error && event.error.message && event.error.message.includes('removeChild')) {
        console.warn('DOM manipulation error caught:', event.error.message);
        // Prevent the error from breaking the app
        event.preventDefault();
      }
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', (event) => {
      if (event.reason && event.reason.message && event.reason.message.includes('removeChild')) {
        console.warn('Unhandled DOM manipulation error:', event.reason.message);
        event.preventDefault();
      }
    });

    return () => {
      window.removeEventListener('error', handleGlobalError);
    };
  }, []);

  const [activeSection, setActiveSection] = useState('upload');
  const [documents, setDocuments] = useState([]);
  const [pastAnalyses, setPastAnalyses] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'info' });
  const [imageModal, setImageModal] = useState({ open: false, src: '', alt: '' });
  const [currentStep, setCurrentStep] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [approvalReady, setApprovalReady] = useState(false);

  // Enhanced LOB and Project Tagging State
  const [selectedLOB, setSelectedLOB] = useState('all');
  const [projectTags, setProjectTags] = useState([]);
  const [availableTags, setAvailableTags] = useState([
    'P&C Insurance', 'Personal Auto', 'Commercial Auto', 'Homeowners', 
    'General Liability', 'Workers Comp', 'Cyber Insurance', 'Property',
    'US Market', 'Europe Market', 'High Priority', 'In Progress', 'Completed'
  ]);
  const [showTagInput, setShowTagInput] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [filteredAnalyses, setFilteredAnalyses] = useState([]);

  // Enhanced Search and Filtering State
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date'); // date, name, lob, tags
  const [sortOrder, setSortOrder] = useState('desc'); // asc, desc
  const [viewMode, setViewMode] = useState('grid'); // grid, list, compact
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [dateRange, setDateRange] = useState({ start: null, end: null });
  const [statusFilter, setStatusFilter] = useState('all'); // all, completed, in-progress, pending

  // OneDrive Integration State
  const [showUploadContainer, setShowUploadContainer] = useState(true);

  // Full Analysis Modal State
  const [fullAnalysisModal, setFullAnalysisModal] = useState({ open: false, data: null, loading: false, error: null });

  // LOB Categories for P&C Insurance
  const lobCategories = [
    { id: 'all', name: 'All Lines', icon: '📊', color: 'gray' },
    { id: 'personal_auto', name: 'Personal Auto', icon: '🚗', color: 'blue' },
    { id: 'commercial_auto', name: 'Commercial Auto', icon: '🚛', color: 'green' },
    { id: 'homeowners', name: 'Homeowners', icon: '🏠', color: 'purple' },
    { id: 'property', name: 'Property', icon: '🏢', color: 'orange' },
    { id: 'general_liability', name: 'General Liability', icon: '🛡️', color: 'red' },
    { id: 'workers_comp', name: 'Workers Comp', icon: '👷', color: 'yellow' },
    { id: 'cyber', name: 'Cyber Insurance', icon: '💻', color: 'indigo' },
    { id: 'professional_liability', name: 'Professional Liability', icon: '⚖️', color: 'pink' },
    { id: 'umbrella', name: 'Umbrella', icon: '☂️', color: 'teal' },
    { id: 'marine', name: 'Marine', icon: '🚢', color: 'cyan' },
    { id: 'aviation', name: 'Aviation', icon: '✈️', color: 'amber' }
  ];

  // Filtering functions
  const filterByLOB = (items, lob) => {
    if (lob === 'all') return items;
    return items.filter(item => {
      const itemLOB = item.lob || item.line_of_business || 'unknown';
      return itemLOB.toLowerCase().includes(lob.replace('_', ' '));
    });
  };

  const filterByTags = (items, tags) => {
    if (!tags || tags.length === 0) return items;
    return items.filter(item => {
      const itemTags = item.tags || [];
      return tags.some(tag => itemTags.includes(tag));
    });
  };

  // Enhanced filtering functions
  const filterBySearch = (items, query) => {
    if (!query) return items;
    const lowerQuery = query.toLowerCase().trim();
    
    return items.filter(item => {
      // Document/File name search (highest priority)
      const name = (item.name || item.title || item.filename || '').toLowerCase();
      const nameMatch = name.includes(lowerQuery);
      
      // Content search
      const content = (item.content || item.description || item.original_text || '').toLowerCase();
      const contentMatch = content.includes(lowerQuery);
      
      // Tags search
      const tags = (item.tags || []).join(' ').toLowerCase();
      const tagsMatch = tags.includes(lowerQuery);
      
      // LOB search
      const lob = (item.lob || item.line_of_business || '').toLowerCase();
      const lobMatch = lob.includes(lowerQuery);
      
      // User email search
      const userEmail = (item.user_email || '').toLowerCase();
      const emailMatch = userEmail.includes(lowerQuery);
      
      // File type search
      const fileType = (item.file_type || item.type || '').toLowerCase();
      const fileTypeMatch = fileType.includes(lowerQuery);
      
      // Status search
      const status = (item.status || '').toLowerCase();
      const statusMatch = status.includes(lowerQuery);
      
      // Date search (search in formatted date strings)
      const date = (item.date || item.upload_date || '').toString().toLowerCase();
      const dateMatch = date.includes(lowerQuery);
      
      // Multi-word search support
      const searchTerms = lowerQuery.split(/\s+/);
      const allTermsMatch = searchTerms.every(term => 
        name.includes(term) || 
        content.includes(term) || 
        tags.includes(term) || 
        lob.includes(term) ||
        userEmail.includes(term) ||
        fileType.includes(term) ||
        status.includes(term) ||
        date.includes(term)
      );
      
      return nameMatch || contentMatch || tagsMatch || lobMatch || 
             emailMatch || fileTypeMatch || statusMatch || dateMatch || allTermsMatch;
    });
  };

  const filterByDateRange = (items, range) => {
    if (!range.start && !range.end) return items;
    return items.filter(item => {
      const itemDate = new Date(item.uploadDate || item.date || item.createdAt);
      const startDate = range.start ? new Date(range.start) : null;
      const endDate = range.end ? new Date(range.end) : null;
      
      if (startDate && endDate) {
        return itemDate >= startDate && itemDate <= endDate;
      } else if (startDate) {
        return itemDate >= startDate;
      } else if (endDate) {
        return itemDate <= endDate;
      }
      return true;
    });
  };

  const filterByStatus = (items, status) => {
    if (status === 'all') return items;
    return items.filter(item => {
      const itemStatus = item.status || 'completed';
      return itemStatus.toLowerCase() === status.toLowerCase();
    });
  };

  const sortItems = (items, sortBy, sortOrder) => {
    return [...items].sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = (a.name || a.title || a.filename || '').toLowerCase();
          bValue = (b.name || b.title || b.filename || '').toLowerCase();
          break;
        case 'date':
          aValue = new Date(a.uploadDate || a.date || a.createdAt);
          bValue = new Date(b.uploadDate || b.date || b.createdAt);
          break;
        case 'lob':
          aValue = (a.lob || a.line_of_business || '').toLowerCase();
          bValue = (b.lob || b.line_of_business || '').toLowerCase();
          break;
        case 'tags':
          aValue = (a.tags || []).length;
          bValue = (b.tags || []).length;
          break;
        default:
          aValue = aValue || '';
          bValue = bValue || '';
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  };

  // Update filtered data when selections change
  useEffect(() => {
    let filteredDocs = filterByTags(filterByLOB(documents, selectedLOB), projectTags);
    let filteredAnalyses = filterByTags(filterByLOB(pastAnalyses, selectedLOB), projectTags);
    
    // Apply additional filters
    filteredDocs = filterBySearch(filteredDocs, searchQuery);
    filteredAnalyses = filterBySearch(filteredAnalyses, searchQuery);
    
    filteredDocs = filterByDateRange(filteredDocs, dateRange);
    filteredAnalyses = filterByDateRange(filteredAnalyses, dateRange);
    
    filteredDocs = filterByStatus(filteredDocs, statusFilter);
    filteredAnalyses = filterByStatus(filteredAnalyses, statusFilter);
    
    // Apply sorting
    filteredDocs = sortItems(filteredDocs, sortBy, sortOrder);
    filteredAnalyses = sortItems(filteredAnalyses, sortBy, sortOrder);
    
    setFilteredDocuments(filteredDocs);
    setFilteredAnalyses(filteredAnalyses);
  }, [documents, pastAnalyses, selectedLOB, projectTags, searchQuery, dateRange, statusFilter, sortBy, sortOrder]);

  // Tag management functions
  const addTag = (tag) => {
    if (tag && !projectTags.includes(tag)) {
      setProjectTags([...projectTags, tag]);
      setNewTag('');
      setShowTagInput(false);
    }
  };

  const removeTag = (tagToRemove) => {
    setProjectTags(projectTags.filter(tag => tag !== tagToRemove));
  };

  const addNewTag = () => {
    if (newTag && !availableTags.includes(newTag)) {
      setAvailableTags([...availableTags, newTag]);
    }
    addTag(newTag);
  };

  // Authentication handlers
  const handleLogin = (success) => {
    if (success) {
      setIsAuthenticated(true);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    // Reset any state as needed
    setResults(null);
    setCurrentStep(0);
    setIsProcessing(false);
    setShowUploadContainer(true);
    setNotification({ show: false, message: '', type: 'info' });
  };

  // Enhanced progress tracking
  const stepNames = [
    'Document Upload',
    'Content Extraction', 
    'Planning Analysis',
    'Technical Documentation',
    'Diagram Generation',
    'Backlog Creation',
    'Final Assembly'
  ];

  // Safe event listener cleanup
  const cleanupEventListeners = (listeners) => {
    listeners.forEach(({ event, handler }) => {
      try {
        document.removeEventListener(event, handler);
      } catch (e) {
        console.warn('Event listener cleanup warning:', e.message);
      }
    });
  };

  useEffect(() => {
    const onKeyDown = (e) => { 
      if (e.key === 'Escape') {
        setImageModal({ open: false, src: '', alt: '' }); 
      }
    };
    
    try {
    document.addEventListener('keydown', onKeyDown);
    } catch (e) {
      console.warn('Event listener setup warning:', e.message);
    }
    
    return () => {
      try {
        document.removeEventListener('keydown', onKeyDown);
      } catch (e) {
        console.warn('Event listener cleanup warning:', e.message);
      }
    };
  }, []);

  useEffect(() => {
    const handleTab = (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const sections = ['upload', 'documents', 'analyses'];
        const currentIndex = sections.indexOf(activeSection);
        const nextIndex = (currentIndex + 1) % sections.length;
        setActiveSection(sections[nextIndex]);
      }
    };
    
    try {
    document.addEventListener('keydown', handleTab);
    } catch (e) {
      console.warn('Event listener setup warning:', e.message);
    }
    
    return () => {
      try {
        document.removeEventListener('keydown', handleTab);
      } catch (e) {
        console.warn('Event listener cleanup warning:', e.message);
      }
    };
  }, [activeSection]);

  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      try {
        const [docsResponse, analysesResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/api/documents`),
          fetch(`${API_BASE_URL}/api/analyses`)
        ]);
        
        if (isMounted) {
        if (docsResponse.ok) {
          const docsData = await docsResponse.json();
          setDocuments(docsData);
        }
        
        if (analysesResponse.ok) {
          const analysesData = await analysesResponse.json();
          setPastAnalyses(analysesData);
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    
    loadData();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // If not authenticated, show login page
  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDragOver = (e) => { e.preventDefault(); setDragActive(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setDragActive(false); };

  const handleFileUpload = async (file) => {
    if (!file) return;
    
    setIsProcessing(true);
    setCurrentStep(1);
    setResults(null);
    setApprovalReady(false);
    // Show upload container when starting new analysis
    setShowUploadContainer(true);
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      setNotification({ show: true, message: 'Uploading document...', type: 'info' });
      setCurrentStep(2);
      
      // Simulate incremental progress updates
      const progressInterval = setInterval(() => {
        setCurrentStep(prev => {
          if (prev < stepNames.length - 1) {
            return prev + 1;
          }
          return prev;
        });
      }, 2000); // Update every 2 seconds
      
      const response = await fetch(`${API_BASE_URL}/api/generate`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        clearInterval(progressInterval);
        setCurrentStep(stepNames.length); // Set to 100%
        
        // Debug: Log the received data
        console.log('Received data from backend:', data);
        console.log('Backlog data:', data.backlog);
        console.log('Backlog type:', typeof data.backlog);
        console.log('Backlog length:', Array.isArray(data.backlog) ? data.backlog.length : 'Not an array');
        
        setResults(data);
        setApprovalReady(true);
        // Automatically hide upload container when analysis completes
        setShowUploadContainer(false);
        setNotification({ show: true, message: 'Analysis completed successfully! Upload section hidden for better visibility.', type: 'success' });
        
        // Add to notifications for collaboration
        setNotifications(prev => [...prev, `New analysis completed for ${file.name}`]);
        
        // Reload data
        const [docsResponse, analysesResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/api/documents`),
          fetch(`${API_BASE_URL}/api/analyses`)
        ]);
        
        if (docsResponse.ok) {
          const docsData = await docsResponse.json();
          setDocuments(docsData);
        }
        
        if (analysesResponse.ok) {
          const analysesData = await analysesResponse.json();
          setPastAnalyses(analysesData);
        }
      } else {
        clearInterval(progressInterval);
        const errorData = await response.json();
        setNotification({ show: true, message: `Error: ${errorData.error}`, type: 'error' });
      }
    } catch (error) {
      console.error('Error:', error);
      setNotification({ show: true, message: 'Network error occurred', type: 'error' });
    } finally {
      setIsProcessing(false);
      setCurrentStep(0);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fileInput = document.getElementById('file-upload');
    if (fileInput.files[0]) {
      await handleFileUpload(fileInput.files[0]);
    }
  };

  // OneDrive Integration Handlers
  const handleOneDriveFileSelect = async (onedriveFile) => {
    try {
      setOnedriveLoading(true);
      setNotification({ show: true, message: 'Processing OneDrive file...', type: 'info' });
      
      // The file is already downloaded and converted to a File object by OneDrivePicker
      // Just process it as if it was uploaded locally
      await handleFileUpload(onedriveFile);
      
      setNotification({ 
        show: true, 
        message: `OneDrive file "${onedriveFile.name}" processed successfully!`, 
        type: 'success' 
      });
    } catch (error) {
      console.error('Error processing OneDrive file:', error);
      setNotification({ 
        show: true, 
        message: `Failed to process OneDrive file: ${error.message}`, 
        type: 'error' 
      });
    } finally {
      setOnedriveLoading(false);
    }
  };

  const handleConnectOneDrive = async () => {
    try {
      setOnedriveLoading(true);
      setNotification({ show: true, message: 'Getting OneDrive authorization...', type: 'info' });
      
      // Get the authorization URL
      const response = await fetch('/api/integrations/onedrive/auth');
      if (!response.ok) {
        throw new Error('Failed to get authorization URL');
      }
      
      const data = await response.json();
      
      // Open the authorization URL in a new window
      const authWindow = window.open(data.auth_url, 'OneDrive Auth', 'width=600,height=700');
      
      // Check if the window was opened successfully
      if (!authWindow) {
        setNotification({ 
          show: true, 
          message: 'Please allow popups to connect OneDrive', 
          type: 'warning' 
        });
        return;
      }
      
      setNotification({ 
        show: true, 
        message: 'Please complete the OneDrive authorization in the new window', 
        type: 'info' 
      });
      
      // Poll for completion (user will close the window when done)
      const checkClosed = setInterval(() => {
        if (authWindow.closed) {
          clearInterval(checkClosed);
          setNotification({ 
            show: true, 
            message: 'OneDrive authorization completed! You can now select documents.', 
            type: 'success' 
          });
          // Refresh the status
          setTimeout(() => {
            // Trigger a status refresh
            const event = new CustomEvent('onedrive-status-refresh');
            window.dispatchEvent(event);
          }, 1000);
        }
      }, 1000);
      
    } catch (error) {
      console.error('Error connecting to OneDrive:', error);
      setNotification({ 
        show: true, 
        message: `Failed to connect OneDrive: ${error.message}`, 
        type: 'error' 
      });
    } finally {
      setOnedriveLoading(false);
    }
  };

  const openOneDrivePicker = () => {
    setShowOneDrivePicker(true);
  };

  const closeOneDrivePicker = () => {
    setShowOneDrivePicker(false);
  };

  const handleDownloadAll = () => {
    if (!results) return;
    
    const zip = new JSZip();
    
    // Add TRD
    if (results.trd) {
      zip.file('Technical_Requirements_Document.md', results.trd);
    }
    
    // Add diagrams
    if (results.hld) {
      zip.file('High_Level_Design.md', results.hld);
    }
    if (results.lld) {
      zip.file('Low_Level_Design.md', results.lld);
    }
    
    // Add backlog
    if (results.backlog) {
      zip.file('Project_Backlog.json', JSON.stringify(results.backlog, null, 2));
    }
    
    // Add new specialized analysis results
    if (results.sentiment_analysis) {
      zip.file('Sentiment_Analysis.md', results.sentiment_analysis);
    }
    if (results.risk_assessment) {
      zip.file('Risk_Assessment.md', results.risk_assessment);
    }
    if (results.cost_estimation) {
      zip.file('Cost_Estimation.md', results.cost_estimation);
    }
    
    zip.generateAsync({ type: 'blob' }).then(content => {
      const url = window.URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'BA_Agent_Analysis.zip';
      a.click();
      window.URL.revokeObjectURL(url);
    });
  };
    const handleSendForApproval = async () => {
    if (!results) return;
    
    try {
      setNotification({ show: true, message: 'Sending for approval...', type: 'info' });
      
      const response = await fetch(`${API_BASE_URL}/api/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysis_id: results.analysis_id,
          results: results
        }),
      });
      
      if (response.ok) {
        const approvalData = await response.json();
        setNotification({ 
          show: true, 
          message: `Analysis sent for approval! Approval ID: ${approvalData.approval_id}`, 
          type: 'success' 
        });
        
        // Store the approval ID for later checking
        setResults(prev => ({
          ...prev,
          approval_id: approvalData.approval_id,
          approval_url: approvalData.approval_url
        }));
      } else {
        const errorData = await response.json();
        setNotification({ show: true, message: `Failed to send for approval: ${errorData.error}`, type: 'error' });
      }
    } catch (error) {
      setNotification({ show: true, message: 'Error sending for approval', type: 'error' });
    }
  };

  const handleCopy = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      setNotification({ show: true, message: `${label} copied to clipboard!`, type: 'success' });
    } catch (error) {
      setNotification({ show: true, message: 'Failed to copy to clipboard', type: 'error' });
    }
  };

  const downloadAsDocx = async (markdownContent, filename) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/convert_to_docx`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markdown: markdownContent }),
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        setNotification({ show: true, message: 'Failed to convert to DOCX', type: 'error' });
      }
    } catch (error) {
      setNotification({ show: true, message: 'Error converting to DOCX', type: 'error' });
    }
  };


  const ProgressStepper = () => {
    const [showDetails, setShowDetails] = useState(false);
    
    const getStepIcon = (stepIndex) => {
      const icons = [
        <UploadCloud key="upload" className="w-5 h-5" />,
        <Search key="extract" className="w-5 h-5" />,
        <Target key="planning" className="w-5 h-5" />,
        <FileText key="tech" className="w-5 h-5" />,
        <BarChart3 key="diagram" className="w-5 h-5" />,
        <ListCollapse key="backlog" className="w-5 h-5" />,
        <CheckCircle key="final" className="w-5 h-5" />
      ];
      return icons[stepIndex] || <Activity key="default" className="w-5 h-5" />;
    };

    const getStepDescription = (stepIndex) => {
      const descriptions = [
        "Uploading and validating your document...",
        "Extracting text content and key information...",
        "Analyzing requirements and creating project plan...",
        "Generating technical requirements documentation...",
        "Creating system architecture diagrams...",
        "Building comprehensive project backlog...",
        "Finalizing and assembling all deliverables..."
      ];
      return descriptions[stepIndex] || "Processing...";
    };

    return (
  <div className="mb-8 bg-white rounded-xl shadow-lg p-6 border border-gray-200">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center animate-pulse">
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-ping"></div>
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Analysis in Progress</h3>
          <p className="text-sm text-gray-600">Step {currentStep} of {stepNames.length}</p>
        </div>
      </div>
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="flex items-center gap-2 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
      >
        {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        {showDetails ? 'Hide Details' : 'Show Details'}
      </button>
    </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-1000 ease-out relative"
              style={{ width: `${(currentStep / stepNames.length) * 100}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse"></div>
            </div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0%</span>
            <span>{Math.round((currentStep / stepNames.length) * 100)}%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Current Step Details */}
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStep > 0 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-500'
            }`}>
              {getStepIcon(currentStep - 1)}
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-gray-800">
                {currentStep > 0 ? stepNames[currentStep - 1] : 'Initializing...'}
              </h4>
              <p className="text-sm text-gray-600">
                {currentStep > 0 ? getStepDescription(currentStep - 1) : 'Preparing analysis environment...'}
              </p>
            </div>
            {currentStep > 0 && (
              <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
            )}
          </div>
        </div>

        {/* Detailed Steps */}
        {showDetails && (
          <div className="mt-4 space-y-2">
            <h4 className="font-medium text-gray-700 mb-3">All Steps:</h4>
            {stepNames.map((step, index) => (
              <div
                key={index}
                className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-500 ${
                  index < currentStep
                    ? 'bg-green-50 border border-green-200 animate-step-complete'
                    : index === currentStep - 1
                    ? 'bg-blue-50 border border-blue-200 animate-pulse'
                    : 'bg-gray-50 border border-gray-200'
                }`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  index < currentStep
                    ? 'bg-green-500 text-white'
                    : index === currentStep - 1
                    ? 'bg-blue-600 text-white animate-pulse'
                    : 'bg-gray-300 text-gray-500'
                }`}>
                  {index < currentStep ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    getStepIcon(index)
                  )}
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${
                    index < currentStep
                      ? 'text-green-800'
                      : index === currentStep - 1
                      ? 'text-blue-800'
                      : 'text-gray-600'
                  }`}>
                    {step}
                  </p>
                  <p className={`text-xs ${
                    index < currentStep
                      ? 'text-green-600'
                      : index === currentStep - 1
                      ? 'text-blue-600'
                      : 'text-gray-500'
                  }`}>
                    {index < currentStep
                      ? 'Completed'
                      : index === currentStep - 1
                      ? getStepDescription(index)
                      : 'Pending'
                    }
                  </p>
                </div>
                {index < currentStep && (
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const ResultsTabs = () => {
    const [activeTab, setActiveTab] = useState('overview');
    
    const extractMermaid = (str) => (str || '').replace(/```mermaid\n|```/g, '');
    const download = (data, filename, type) => {
      const blob = new Blob([data], { type });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
    };
    const downloadJson = (obj, filename) => download(JSON.stringify(obj, null, 2), filename, 'application/json');

    // Helper function to check if a section is completed
    const isSectionCompleted = (sectionId) => {
      switch (sectionId) {
        case 'trd':
          return !!results?.trd;
        case 'diagrams':
          return !!(results?.hld || results?.lld);
        case 'backlog':
          return !!results?.backlog;
        case 'azure-devops':
          return !!results?.approval_status;
        default:
          return false;
      }
    };

    const tabs = [
      { id: 'trd', label: 'Technical Requirements', icon: FileText },
      { id: 'diagrams', label: 'Diagrams', icon: BarChart3 },
      { id: 'backlog', label: 'Project Backlog', icon: ListCollapse },
      { id: 'azure-devops', label: 'Azure DevOps', icon: Settings }
    ];

    return (
      <div className="bg-white rounded-lg shadow-lg border">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isCompleted = isSectionCompleted(tab.id);
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {isCompleted && (
                    <CheckCircle className="w-4 h-4 text-green-500 ml-1" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'trd' && results?.trd && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">Technical Requirements Document</h3>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleCopy(results.trd, 'TRD')}
                    className="flex items-center gap-2 px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                  >
                    <Copy className="w-4 h-4" />
                    Copy
                  </button>
                  <button
                    onClick={() => downloadAsDocx(results.trd, 'Technical_Requirements_Document.docx')}
                    className="flex items-center gap-2 px-3 py-1 bg-black text-white rounded hover:bg-gray-800"
                  >
                    <Download className="w-4 h-4" />
                    Download DOCX
                  </button>
                </div>
              </div>
              <FormattedTextRenderer content={results.trd} title="Technical Requirements Document" />
              
              {/* Smart Suggestions */}
              <SmartSuggestions 
                document={selectedDocument}
                analysis={results}
                onApplySuggestion={(suggestion) => {
                  console.log('Applying suggestion:', suggestion);
                  // Here you could implement logic to apply the suggestion to the document
                }}
                onDismissSuggestion={(suggestion) => {
                  console.log('Dismissing suggestion:', suggestion);
                }}
                showSuggestions={true}
                maxSuggestions={5}
              />

              {/* Real-time Comments */}
              <RealTimeComments 
                documentId={selectedDocument?.id || 'current-document'}
                documentTitle={selectedDocument?.filename || 'Current Document'}
                currentUser={{ id: 'user1', name: 'Current User', avatar: null }}
                onCommentAdd={(comment) => {
                  console.log('New comment added:', comment);
                }}
                onCommentUpdate={(commentId, content) => {
                  console.log('Comment updated:', commentId, content);
                }}
                onCommentDelete={(commentId) => {
                  console.log('Comment deleted:', commentId);
                }}
                onCommentReply={(parentId, reply) => {
                  console.log('Reply added:', parentId, reply);
                }}
                showComments={true}
                allowAnonymous={false}
                moderationEnabled={false}
              />

              {/* Multi-language Support */}
              <MultiLanguageSupport 
                document={selectedDocument}
                onLanguageChange={(languageCode) => {
                  console.log('Language changed to:', languageCode);
                }}
                onTranslationRequest={(content, targetLanguage) => {
                  console.log('Translation requested:', targetLanguage);
                }}
                supportedLanguages={[
                  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
                  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
                  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
                  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
                  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
                  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
                  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
                  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
                  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
                  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
                  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
                  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' }
                ]}
                showLanguageSelector={true}
                enableTranslation={true}
                enableAutoDetection={true}
              />
            </div>
          )}

          {activeTab === 'diagrams' && (
            <div className="space-y-6">
              {results?.hld && (
                <div className="glass-card rounded-lg shadow-lg border p-6">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-gray-800">High Level Design</h3>
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCopy(results.hld, 'High Level Design')}
                        className="flex items-center gap-2 px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                      >
                        <Copy className="w-4 h-4" />
                        Copy
                      </button>
                      <button
                        onClick={() => downloadAsDocx(results.hld, 'High_Level_Design.docx')}
                        className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        <Download className="w-4 h-4" />
                        Download DOCX
                      </button>
                    </div>
                  </div>
                  
                  {/* Mermaid Diagram */}
                  <MermaidDiagram 
                    key={`hld-${results?.analysis_id || 'default'}`}
                    code={extractMermaid(results.hld)} 
                    id="hld" 
                    showDownloadPng={true} 
                showPngInline={true}
                    title="High Level Design"
                  />
                </div>
              )}
              
              {results?.lld && (
                <div className="glass-card rounded-lg shadow-lg border p-6">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-gray-800">Low Level Design</h3>
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCopy(results.lld, 'Low Level Design')}
                        className="flex items-center gap-2 px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                      >
                        <Copy className="w-4 h-4" />
                        Copy
                      </button>
                      <button
                        onClick={() => downloadAsDocx(results.lld, 'Low_Level_Design.docx')}
                        className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        <Download className="w-4 h-4" />
                        Download DOCX
                      </button>
                    </div>
                  </div>
                  
                  {/* Mermaid Diagram */}
                  <MermaidDiagram 
                    key={`lld-${results?.analysis_id || 'default'}`}
                    code={extractMermaid(results.lld)} 
                    id="lld" 
                    showDownloadPng={true} 
                showPngInline={true}
                    title="Low Level Design"
                  />
                </div>
              )}
              
              {!results?.hld && !results?.lld && (
                <div className="text-center py-12">
                  <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No diagrams generated</h3>
                  <p className="text-gray-500">Diagrams will appear here after analysis is complete</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'backlog' && results?.backlog && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">Project Backlog</h3>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleCopy(JSON.stringify(results.backlog, null, 2), 'Project Backlog')}
                    className="flex items-center gap-2 px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                  >
                    <Copy className="w-4 h-4" />
                    Copy
                  </button>
                  <button
                    onClick={() => downloadJson(results.backlog, 'Project_Backlog.json')}
                    className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    <Download className="w-4 h-4" />
                    Download JSON
                  </button>
                </div>
              </div>
              

              
              {/* Backlog Statistics */}
              <BacklogStats backlog={results.backlog} />
              
              {/* Board-style Backlog */}
              <div className="glass-card rounded-lg shadow-lg border p-4">
                <BacklogBoard backlog={results.backlog} />
              </div>
            </div>
          )}

          {activeTab === 'azure-devops' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">Azure DevOps Integration</h3>
                  {results?.approval_status && (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      try {
                        const response = await fetch(`${API_BASE_URL}/api/ado/status`);
                        const status = await response.json();
                        setNotification({ 
                          show: true, 
                          message: `Azure DevOps Status: ${status.message}`, 
                          type: status.connected ? 'success' : 'error' 
                        });
                      } catch (error) {
                        setNotification({ 
                          show: true, 
                          message: 'Failed to check Azure DevOps status', 
                          type: 'error' 
                        });
                      }
                    }}
                    className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    <Activity className="w-4 h-4" />
                    Check Status
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        const response = await fetch(`${API_BASE_URL}/api/ado/test`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' }
                        });
                        const result = await response.json();
                        setNotification({ 
                          show: true, 
                          message: result.message, 
                          type: result.success ? 'success' : 'error' 
                        });
                      } catch (error) {
                        setNotification({ 
                          show: true, 
                          message: 'Failed to test Azure DevOps', 
                          type: 'error' 
                        });
                      }
                    }}
                    className="flex items-center gap-2 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    <Settings className="w-4 h-4" />
                    Test Connection
                  </button>
                </div>
              </div>
              
              {/* Azure DevOps Status */}
              <div className="bg-white rounded-lg shadow-lg border p-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Configuration Status</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="font-medium">Azure DevOps Integration</span>
                    </div>
                    <span className="text-sm text-gray-600">Ready for approval workflow</span>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h5 className="font-semibold text-blue-800 mb-2">How it works:</h5>
                    <ol className="text-sm text-blue-700 space-y-1">
                      <li>1. Generate analysis with backlog items</li>
                      <li>2. Send for approval via email</li>
                      <li>3. When approved, work items are automatically created in Azure DevOps</li>
                      <li>4. Epics, Features, and User Stories are created with proper hierarchy</li>
                    </ol>
                  </div>
                  
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h5 className="font-semibold text-yellow-800 mb-2">Required Configuration:</h5>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      <li>• ADO_PERSONAL_ACCESS_TOKEN - Your Azure DevOps PAT</li>
                      <li>• ADO_ORGANIZATION_URL - Your Azure DevOps organization URL</li>
                      <li>• ADO_PROJECT_NAME - Your Azure DevOps project name</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              {/* Approval Status */}
              {results?.approval_status && (
                <div className="bg-white rounded-lg shadow-lg border p-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">Approval Status</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Status:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        results.approval_status.status === 'approved' 
                          ? 'bg-green-100 text-green-700' 
                          : results.approval_status.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {results.approval_status.status}
                      </span>
                    </div>
                    
                    {results.approval_status.ado_result && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <h5 className="font-semibold text-gray-700 mb-2">Azure DevOps Creation Result:</h5>
                        <div className="text-sm text-gray-600">
                          <p><strong>Success:</strong> {results.approval_status.ado_result.success ? 'Yes' : 'No'}</p>
                          <p><strong>Message:</strong> {results.approval_status.ado_result.message}</p>
                          {results.approval_status.ado_result.items && (
                            <div className="mt-2">
                              <p><strong>Items Created:</strong> {results.approval_status.ado_result.items.length}</p>
                              <ul className="mt-1 space-y-1">
                                {results.approval_status.ado_result.items.slice(0, 5).map((item, index) => (
                                  <li key={index} className="text-xs">
                                    {item.type}: {item.title} (ID: {item.id})
                                  </li>
                                ))}
                                {results.approval_status.ado_result.items.length > 5 && (
                                  <li className="text-xs text-gray-500">... and {results.approval_status.ado_result.items.length - 5} more</li>
                                )}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Check Approval Status Button */}
              {results?.analysis_id && (
                <div className="bg-white rounded-lg shadow-lg border p-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">Check Approval Status</h4>
                  <button
                    onClick={async () => {
                      try {
                        if (results.approval_id) {
                          const response = await fetch(`${API_BASE_URL}/api/approval_status/${results.approval_id}`);
                          if (response.ok) {
                            const approvalStatus = await response.json();
                            setResults(prev => ({
                              ...prev,
                              approval_status: approvalStatus
                            }));
                            setNotification({ 
                              show: true, 
                              message: `Approval status: ${approvalStatus.status}`, 
                              type: approvalStatus.status === 'approve' ? 'success' : 'info' 
                            });
                          } else {
                            setNotification({ 
                              show: true, 
                              message: 'Failed to get approval status', 
                              type: 'error' 
                            });
                          }
                        } else {
                          setNotification({ 
                            show: true, 
                            message: 'No approval ID available. Send for approval first.', 
                            type: 'info' 
                          });
                        }
                      } catch (error) {
                        setNotification({ 
                          show: true, 
                          message: 'Failed to check approval status', 
                          type: 'error' 
                        });
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    <Activity className="w-4 h-4" />
                    Check Approval Status
                  </button>
                  <p className="text-sm text-gray-600 mt-2">
                    After sending for approval, you can check the status here to see if Azure DevOps work items were created.
                  </p>
                  {results.approval_id && (
                    <p className="text-xs text-gray-500 mt-1">
                      Approval ID: {results.approval_id}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}


        </div>
      </div>
    );
  };

  // Notification component
  const Notification = () => (
    notification.show && (
      <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg border ${
        notification.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
        notification.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
        'bg-blue-50 border-blue-200 text-blue-800'
      }`}>
        <div className="flex items-center gap-2">
          {notification.type === 'success' && <CheckCircle className="w-5 h-5" />}
          {notification.type === 'error' && <XCircle className="w-5 h-5" />}
          <span className="font-medium">{notification.message}</span>
        </div>
        <button
          onClick={() => setNotification({ show: false, message: '', type: 'info' })}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
        >
          ×
        </button>
      </div>
    )
  );

  return (
    <div className="min-h-screen">
      <Notification />
      
      {/* Enhanced Header */}
      <header className="header">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex justify-between items-center py-3">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
                <Target className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">BA Agent Pro</h1>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-2 py-1 text-gray-600 hover:text-gray-900">
                <Bell className="w-4 h-4" />
                <span className="text-xs">Notifications</span>
              </button>
              <button className="flex items-center gap-2 px-2 py-1 text-gray-600 hover:text-gray-900">
                <User className="w-4 h-4" />
                <span className="text-xs">Profile</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex relative pt-6">
        {/* Mobile overlay for sidebar */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Enhanced Sidebar */}
        <Sidebar
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          documents={documents}
          pastAnalyses={pastAnalyses}
          selectedDocument={selectedDocument}
          setSelectedDocument={setSelectedDocument}
          selectedAnalysis={selectedAnalysis}
          setSelectedAnalysis={setSelectedAnalysis}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          onLogout={handleLogout}
          selectedLOB={selectedLOB}
          setSelectedLOB={setSelectedLOB}
          projectTags={projectTags}
          setProjectTags={setProjectTags}
          availableTags={availableTags}
          setAvailableTags={setAvailableTags}
          showTagInput={showTagInput}
          setShowTagInput={setShowTagInput}
          newTag={newTag}
          setNewTag={setNewTag}
          addTag={addTag}
          removeTag={removeTag}
          addNewTag={addNewTag}
          lobCategories={lobCategories}
          filteredDocuments={filteredDocuments}
          filteredAnalyses={filteredAnalyses}
        />

        {/* Main Content Area */}
        <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'lg:ml-6' : 'lg:ml-6'}`}>
          <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 py-6">
            {/* Breadcrumb Navigation */}
            <BreadcrumbNavigation 
              activeSection={activeSection}
              selectedLOB={selectedLOB}
              projectTags={projectTags}
              lobCategories={lobCategories}
            />
            
            {/* Quick Stats */}
            <QuickStats 
              documents={filteredDocuments}
              analyses={filteredAnalyses}
              selectedLOB={selectedLOB}
              projectTags={projectTags}
              lobCategories={lobCategories}
              setActiveSection={setActiveSection}
            />

            {/* Enhanced Search and Filter Bar */}
            <AdvancedSearch 
              documents={documents}
              analyses={pastAnalyses}
              onSearchResults={(results) => {
                // Update filtered results based on search
                const docResults = results.filter(r => r.type === 'document');
                const analysisResults = results.filter(r => r.type === 'analysis');
                setFilteredDocuments(docResults);
                setFilteredAnalyses(analysisResults);
              }}
              placeholder="Search documents, analyses, and content..."
              showFilters={true}
              showSorting={true}
              enableSavedSearches={true}
            />
            {activeSection === 'upload' && (
              <div className="space-y-4">
                {/* Upload Container - Hidden after analysis completion */}
                {(!results || showUploadContainer) && (
                  <div className="glass-card rounded-lg shadow-lg border p-4 animate-scale-in">
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <UploadCloud className="w-5 h-5" />
                        Upload Requirements Document
                      </h2>
                      {results && (
                        <button
                          onClick={() => setShowUploadContainer(false)}
                          className="text-gray-500 hover:text-gray-700 transition-colors"
                          title="Hide upload section"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  <p className="text-gray-600 mb-4 text-sm">
                    Upload your business requirements document (PDF or DOCX) to generate comprehensive analysis including technical requirements, diagrams, and project backlog.
                  </p>


                  {isProcessing && <ProgressStepper />}

                  <form onSubmit={handleSubmit} className="space-y-3">
                    <div
                      className={`border-2 border-dashed rounded-lg p-6 text-center transition-all duration-300 ${
                        dragActive
                          ? 'border-blue-400 bg-blue-50 scale-105 shadow-lg'
                          : 'border-gray-300 hover:border-gray-400 hover:scale-102'
                      }`}
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                    >
                      <UploadCloud className="mx-auto h-10 w-10 text-gray-400" />
                      <div className="mt-3">
                        <label htmlFor="file-upload" className="cursor-pointer">
                          <span className="mt-2 block text-sm font-medium text-gray-900">
                            Drop your file here, or{' '}
                            <span className="text-blue-600 hover:text-blue-500">browse</span>
                          </span>
                          <span className="mt-1 block text-xs text-gray-500">
                            PDF or DOCX up to 10MB
                          </span>
                        </label>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          className="sr-only"
                          accept=".pdf,.docx"
                          onChange={handleFileChange}
                        />
                      </div>
                    </div>

                    <div className="flex justify-center">
                      <button
                        type="submit"
                        disabled={isProcessing}
                        className="btn-primary flex items-center gap-2 px-6 py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isProcessing ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Processing...
                          </>
                        ) : (
                          <>
                            <SendIcon className="w-5 h-5" />
                            Analyze Document
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
                )}

                {/* Show Upload Again Button - Only visible when upload is hidden and results exist */}
                {results && !showUploadContainer && (
                  <div className="text-center">
                    <button
                      onClick={() => setShowUploadContainer(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-700 border border-blue-300 hover:border-blue-400 rounded-lg transition-colors"
                    >
                      <UploadCloud className="w-4 h-4" />
                      Show Upload Section
                    </button>
                  </div>
                )}

                {results && (
                  <div className="space-y-4 animate-fade-in-up">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-gray-900">Analysis Results</h3>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <span>Completion:</span>
                          <span className="font-medium">
                            {[
                              results?.trd ? 1 : 0,
                              (results?.hld || results?.lld) ? 1 : 0,
                              results?.backlog ? 1 : 0,
                              results?.approval_status ? 1 : 0
                            ].reduce((a, b) => a + b, 0)}/4
                          </span>
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleDownloadAll}
                          className="btn-primary flex items-center gap-2 px-3 py-1 rounded-lg text-sm"
                        >
                          <Download className="w-4 h-4" />
                          Download All
                        </button>
                        <button
                          onClick={handleSendForApproval}
                          disabled={!approvalReady}
                          className={`flex items-center gap-2 px-3 py-1 rounded-lg transition-all text-sm ${
                            approvalReady 
                              ? 'btn-primary' 
                              : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                          }`}
                        >
                          <SendIcon className="w-4 h-4" />
                          {approvalReady ? 'Send for Approval' : 'Approval Pending'}
                        </button>
                      </div>
                    </div>
                    <ResultsTabs key={`results-${results?.analysis_id || 'default'}`} />
                  </div>
                )}
              </div>
            )}

            {activeSection === 'documents' && (
              <div className="space-y-4">
                <EnhancedDocumentViewer 
                  documents={filteredDocuments} 
                  title="Uploaded Documents"
                  showThumbnails={true}
                  enableFullscreen={true}
                  enableAnnotations={false}
                  onDownload={(document) => {
                    // Handle document download
                    const link = document.createElement('a');
                    link.href = document.url || `data:text/plain;charset=utf-8,${encodeURIComponent(document.content || '')}`;
                    link.download = document.filename || document.name;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                />
              </div>
            )}

            {activeSection === 'analyses' && (
              <div className="space-y-4">
                <PastAnalysesSection 
                  pastAnalyses={filteredAnalyses} 
                  selectedAnalysis={selectedAnalysis}
                  setSelectedAnalysis={setSelectedAnalysis}
                  selectedLOB={selectedLOB}
                  projectTags={projectTags}
                  lobCategories={lobCategories}
                />
              </div>
            )}

            {activeSection === 'capabilities' && (
              <div className="space-y-4">
                <Capabilities />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Collaboration Panel */}
      <CollaborationPanel notifications={notifications} />

      {/* Enhanced Image Modal */}
      {imageModal.open && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setImageModal({ open: false, src: '', alt: '' });
            }
          }}
        >
          <div className="max-w-4xl max-h-full overflow-auto bg-white rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">{imageModal.alt}</h3>
              <button
                onClick={() => setImageModal({ open: false, src: '', alt: '' })}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close modal"
              >
                ×
              </button>
            </div>
            <img 
              src={imageModal.src} 
              alt={imageModal.alt} 
              className="max-w-full" 
              onError={(e) => {
                console.warn('Image failed to load:', imageModal.src);
                e.target.style.display = 'none';
              }}
            />
          </div>
        </div>
      )}

      {/* OneDrive Picker Modal */}
      <OneDrivePicker
        isVisible={showOneDrivePicker}
        onFileSelect={handleOneDriveFileSelect}
        onClose={closeOneDrivePicker}
        title="Select Document from OneDrive"
      />
    </div>
  );
}

// Wrap the App component with ErrorBoundary
function AppWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <MainApp />
    </ErrorBoundary>
  );
}

export default AppWithErrorBoundary;

