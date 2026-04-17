import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Pause, RotateCcw, SkipForward, Terminal, 
  Database, ChevronRight, Activity, Box, AlertCircle, Code, Camera, RefreshCw 
} from 'lucide-react';
import './CodeVisualizerPage.css';

// ==================== TRANSPILER ====================

const transpileToJS = (rawCode, language) => {
  if (language === 'javascript') return rawCode;
  
  // PRE-PURGE: Aggressively comment out boilerplate that crashes Babel
  let lines = rawCode.split('\n').map(line => {
    const s = line.trim();
    if (s.match(/^(#include|using\s+namespace|namespace\s|package\s|import\s|#define)/)) {
      return '// ' + line;
    }
    return line;
  });
  
  let newLines = [];
  
  if (language === 'python') {
    let indentStack = [];
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        let stripped = line.trim();
        if (!stripped) {
            newLines.push(line);
            continue;
        }
        
        // Convert Python comments to JS comments
        if (stripped.startsWith('#')) {
            newLines.push(line.replace('#', '//'));
            continue;
        }
        
        let indent = line.search(/\S/);
        let closeBraces = '';
        
        while (indentStack.length > 0 && indent <= indentStack[indentStack.length - 1]) {
            if (indent === indentStack[indentStack.length - 1] && stripped.match(/^(elif|else)\b/)) {
                indentStack.pop();
                closeBraces += '} ';
                break;
            }
            if (indent === indentStack[indentStack.length - 1]) {
                break;
            }
            indentStack.pop();
            closeBraces += '} ';
        }

        let jsLine = line;
        // Handle inline comments
        if (jsLine.includes('#')) {
            jsLine = jsLine.split('#')[0] + '//' + jsLine.split('#').slice(1).join('#');
        }
        
        jsLine = jsLine.replace(/\bprint\((.*)\)/, 'console.log($1)');
        // Double fix for orphaned quotes that often happen in print calls
        jsLine = jsLine.replace(/console\.log\(""(.*?)"\)/g, 'console.log("$1")');
        jsLine = jsLine.replace(/console\.log\("(.*?)"\)/g, 'console.log("$1")');
        
        jsLine = jsLine.replace(/\bdef\s+(\w+)\s*\((.*?)\)\s*:/, 'function $1($2) {');
        jsLine = jsLine.replace(/\bfor\s+(\w+)\s+in\s+range\(\s*len\(\s*(\w+)\s*\)\s*\)\s*:/, 'for(let $1=0; $1<$2.length; $1++) {');
        jsLine = jsLine.replace(/\bfor\s+(\w+)\s+in\s+range\(\s*(.*?)\s*\)\s*:/, 'for(let $1=0; $1<$2; $1++) {');
        jsLine = jsLine.replace(/\bfor\s+(\w+)\s+in\s+(\w+)\s*:/, 'for(let __i=0; __i<$2.length; __i++) { let $1 = $2[__i]; ');
        jsLine = jsLine.replace(/\bwhile\s+(.*?)\s*:/, 'while($1) {');
        jsLine = jsLine.replace(/\bif\s+(.*?)\s*:/, 'if($1) {');
        jsLine = jsLine.replace(/\belif\s+(.*?)\s*:/, 'else if($1) {');
        jsLine = jsLine.replace(/\belse\s*:/, 'else {');
        jsLine = jsLine.replace(/\bTrue\b/g, 'true').replace(/\bFalse\b/g, 'false');
        
        // Python List Methods to JS
        jsLine = jsLine.replace(/\.\s*append\s*\(/g, '.push(');
        jsLine = jsLine.replace(/\.\s*pop\s*\(\s*0\s*\)/g, '.shift()');
        jsLine = jsLine.replace(/\.\s*pop\s*\(\s*\)/g, '.pop()');
        jsLine = jsLine.replace(/\.\s*insert\s*\(\s*0\s*,\s*(.*?)\)/g, '.unshift($1)');
        
        if (jsLine.trim().endsWith('{')) {
            indentStack.push(indent);
        }
        
        newLines.push(closeBraces + jsLine);
    }
    let remainingBraces = '';
    while (indentStack.length > 0) {
        indentStack.pop();
        remainingBraces += '} ';
    }
    if (newLines.length > 0) newLines[(newLines.length - 1)] += remainingBraces;
    return newLines.join('\n');
  }

  if (language === 'java' || language === 'cpp') {
      for (let i = 0; i < lines.length; i++) {
          let jsLine = lines[i];
          let stripped = jsLine.trim();
          
          if (stripped.match(/^(#include|using\s+namespace|package\s|import\s|namespace\s|#define)/)) {
              newLines.push('// ' + jsLine);
              continue;
          }

          if (jsLine.includes('cout')) {
              let parts = jsLine.split('<<').map(p => p.replace('cout', '').replace(/endl/g, '').replace(';', '').trim()).filter(p => p !== '');
              if (parts.length > 0) {
                  const prefix = jsLine.substring(0, jsLine.indexOf('cout'));
                  jsLine = prefix + `console.log(${parts.join(', ')});`;
              }
          }

          jsLine = jsLine.replace(/\b(?:std::)?vector<\w+>\s+(\w+)\s*=\s*\{(.*?)\}\s*;/g, 'let $1 = [$2];');
          jsLine = jsLine.replace(/\b(?:std::)?vector<\w+>\s+(\w+)\s*;/g, 'let $1 = [];');
          jsLine = jsLine.replace(/\b(?:ArrayList|List)<\w+>\s+(\w+)\s*=\s*new\s+(?:ArrayList|List)<.*?>\(\)\s*;/g, 'let $1 = [];');
          
          jsLine = jsLine.replace(/\b(?:int|float|double|boolean|bool|long|short|char|String)\s+(?:\[\]\s*)?(\w+)(?:\s*\[\])?\s*=\s*\{(.*?)\}\s*;/g, 'let $1 = [$2];');
          
          jsLine = jsLine.replace(/\b(?:int|float|double|bool|boolean|char|long|short)\s+(\w+)\s*\[.*?\]\s*;/g, 'let $1 = [];');

          jsLine = jsLine.replace(/\b(?:int|float|double|boolean|bool|long|short|char|String|auto)\s+(\w+)\s*=/g, 'let $1 =');
          jsLine = jsLine.replace(/\b(?:int|float|double|boolean|bool|long|short|char|String|auto)\s+(\w+)\s*;/g, 'let $1;');
          
          jsLine = jsLine.replace(/\b(?:int|float|double|boolean|bool|long|short|char|String)\s+(\w+)(?=[,\)])/g, '$1'); 
          
          jsLine = jsLine.replace(/\bSystem\.out\.print(?:ln)?\((.*?)\)\s*;/g, 'console.log($1);');

          jsLine = jsLine.replace(/\.(push_back|add)\(/g, '.push(');
          jsLine = jsLine.replace(/\.(size|length)\(\)/g, '.length');
          jsLine = jsLine.replace(/\.(at|get)\((.*?)\)/g, '[$1]');

          jsLine = jsLine.replace(/\bpublic\s+class\s+\w+\s*\{/g, '/* class wrapper */ {');
          jsLine = jsLine.replace(/\b(?:public\s+)?(?:static\s+)?(?:void|int)\s+main\s*\(.*?\)\s*\{/g, 'function main() {');

          jsLine = jsLine.replace(/=\s*new\s+\w+\[\]\s*\{(.*?)\}/g, '= [$1]');
          
          newLines.push(jsLine);
      }
      let finalCode = newLines.join('\n');
      if (finalCode.includes('function main()')) {
          finalCode += '\nmain();';
      }
      return finalCode;
  }
  
  return rawCode;
};

// ==================== EXECUTION ENGINE (BABEL) ====================

const __clone = (val) => {
  if (val === undefined) return undefined;
  try {
    return JSON.parse(JSON.stringify(val));
  } catch (e) {
    // Fallback for non-serializable objects (like circular refs)
    if (Array.isArray(val)) return [...val];
    if (typeof val === 'object' && val !== null) return { ...val };
    return val;
  }
};

const sanitizeCode = (text) => {
  if (!text) return "";
  return text
    .replace(/‘|’|`|´|''/g, "'") 
    .replace(/“|”|«|»/g, '"')
    // Safe quote deduplication: OCR often doubles quotes at the start of strings
    .replace(/""(\w)/g, '"$1')
    .replace(/(\w)""/g, '$1"')
    .replace(/\]\]/g, '}')
    .replace(/\[\[/g, '{')
    .replace(/—|–/g, '-')
    .replace(/\blnt\b/g, 'int')
    .replace(/\bf0r\b/g, 'for')
    .replace(/\b1et\b/g, 'let')
    .replace(/\bc0nst\b/g, 'const')
    .replace(/\bpri nt\b|\bprnt\b|\bprlnt\b/g, 'print')
    .replace(/\s@(?=\s|;|,|$)/g, ' 0'); // OCR artifact: @ for 0
};

const compileAndRun = (rawCode, language) => {
  const sanitized = sanitizeCode(rawCode);
  const code = transpileToJS(sanitized, language);
  const history = [];
  let variablesSet = new Set();
  
  if (!window.Babel) {
    throw new Error("Babel standalone is not loaded. Please wait a moment.");
  }

  const extractVarsPlugin = function() {
    return {
      visitor: {
        Identifier(path) {
          if (path.parentPath.isVariableDeclarator({ id: path.node }) || 
              path.parentPath.isFunctionDeclaration({ id: path.node }) ||
              path.parentPath.isAssignmentExpression({ left: path.node })) {
                variablesSet.add(path.node.name);
          }
        }
      }
    };
  };

  try {
    window.Babel.transform(code, { plugins: [extractVarsPlugin], filename: 'extract.js' });
  } catch (e) {
    throw new Error("Syntax error: " + e.message);
  }

  const reserved = new Set(['console', 'Math', 'Array', 'Object', 'String', 'Number', 'JSON', 'window', 'document', '__trace', '__clone', 'history', 'variablesSet', 'let']);
  const vars = [...variablesSet].filter(v => !reserved.has(v));
  
  const varsObjString = "({ " + vars.map(v => `"${v}": (() => { try { return __clone(${v}); } catch(e) { return undefined; } })()`).join(", ") + " })";

  const instrumentPlugin = function({ types: t }) {
    return {
      visitor: {
        Statement(path) {
          if (path.isBlockStatement()) return;
          if (!path.node.loc) return;
          if (path.node.__injected) return;
          if (path.parentPath.isFunctionDeclaration()) return;

          const line = path.node.loc.start.line;
          
          try {
            const traceStmt = t.expressionStatement(
              t.callExpression(
                t.identifier('__trace'),
                [
                  t.numericLiteral(line),
                  t.callExpression(
                    t.identifier('eval'),
                    [t.stringLiteral(varsObjString)]
                  )
                ]
              )
            );
            traceStmt.__injected = true;
            // Insert AFTER the statement so we see the result of the line
            path.insertAfter(traceStmt);
          } catch(e) {
            console.error(e);
          }
        }
      }
    };
  };

  let instrumentedCode = "";
  try {
    const result = window.Babel.transform(code, { plugins: [instrumentPlugin], filename: 'visualizer.js' });
    instrumentedCode = result.code;
  } catch(e) {
    throw new Error("Failed to instrument code: " + e.message);
  }

  let currentOutput = [];
  let stepCount = 0;
  
  const __trace = (line, scope) => {
    if (stepCount++ > 2000) throw new Error("Infinite loop detected or too many steps");
    
    const variables = {};
    const arrays = {};
    
    for (let key in scope) {
      if (Array.isArray(scope[key])) {
         arrays[key] = scope[key];
      } else if (scope[key] !== undefined) {
         variables[key] = scope[key];
      }
    }

    const codeLine = rawCode.split('\n')[line - 1] || '';

    history.push({
      line: line,
      code: codeLine.trim(),
      explanation: `Executing line ${line}`,
      variables: variables,
      arrays: arrays,
      output: [...currentOutput],
    });
  };

  const fakeConsole = {
    log: (...args) => {
      const formatted = args.map(arg => {
        if (typeof arg === 'object' && arg !== null) {
          try {
            // Format with spaces for Python-like appearance: [10, 20, 30]
            return JSON.stringify(arg).replace(/,/g, ', ');
          } catch(e) { return String(arg); }
        }
        return String(arg);
      }).join(' ');
      currentOutput.push(formatted);
    }
  };

  try {
    // eslint-disable-next-line no-new-func
    const fn = new Function('__trace', '__clone', 'console', instrumentedCode);
    fn(__trace, __clone, fakeConsole);
  } catch (e) {
    if (history.length === 0) {
      throw e;
    }
  }

  return history;
};

// ==================== REACT COMPONENT ====================

const defaultCodeBlock = {
  javascript: `let arr = [10, 20, 30];\nlet sum = 0;\nfor (let i = 0; i < arr.length; i++) {\n  sum = sum + arr[i];\n}\nconsole.log(sum);`,
  python: `arr = [10, 20, 30]\nsum = 0\nfor i in range(len(arr)):\n  sum = sum + arr[i]\nprint(sum)`,
  java: `int[] arr = {10, 20, 30};\nint sum = 0;\nfor (int i = 0; i < arr.length; i++) {\n  sum = sum + arr[i];\n}\nSystem.out.println(sum);`,
  cpp: `vector<int> arr = {10, 20, 30};\nint sum = 0;\nfor (int i = 0; i < arr.size(); i++) {\n  sum = sum + arr[i];\n}\ncout << sum << endl;`
};

const CodeVisualizer = () => {
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState(defaultCodeBlock['javascript']);

  const [tokens, setTokens] = useState([]);
  const [currentStep, setCurrentStep] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1000);
  const [currentState, setCurrentState] = useState(null);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  
  // OCR Scanner States
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(null);
  
  const timerRef = useRef(null);
  const currentStepRef = useRef(-1);
  const fileInputRef = useRef(null);
  const consoleEndRef = useRef(null);

  const scrollToBottom = () => {
    consoleEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentState?.output]);

  const performCompilation = useCallback(() => {
    try {
      const steps = compileAndRun(code, language);
      setTokens(steps);
      setError(null);
      return steps;
    } catch(e) {
      setError(e.message);
      setTokens([]);
      return [];
    }
  }, [code, language]);

  const reset = useCallback(() => {
    currentStepRef.current = -1;
    setCurrentStep(-1);
    setIsPlaying(false);
    setCurrentState(null);
    setHistory([]);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    if (error && error.includes('Babel standalone is not loaded')) {
      const interval = setInterval(() => {
         if (window.Babel) {
           performCompilation();
           reset();
           clearInterval(interval);
         }
      }, 500);
      return () => clearInterval(interval);
    }
  }, [error, performCompilation, reset]);

  useEffect(() => {
    if (isScanning) return; // Do not auto-compile mid-scan
    const timeoutId = setTimeout(() => {
      performCompilation();
      reset();
    }, 500); // Debounce compilation slightly
    return () => clearTimeout(timeoutId);
  }, [code, language, isScanning, performCompilation, reset]);

  const executeNextStep = useCallback(() => {
    const nextIndex = currentStepRef.current + 1;
    if (nextIndex >= tokens.length) {
      setIsPlaying(false);
      return;
    }
    
    const stepInfo = tokens[nextIndex];
    currentStepRef.current = nextIndex;
    setCurrentStep(nextIndex);
    setCurrentState(stepInfo);
    
    setHistory(prev => [...prev, stepInfo]);
  }, [tokens]);

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(executeNextStep, speed);
      return () => clearInterval(timerRef.current);
    }
  }, [isPlaying, speed, executeNextStep]);

  const handlePlay = () => {
    if (currentStepRef.current >= tokens.length - 1) {
      reset();
      const steps = performCompilation();
      if (steps.length > 0) {
        setTimeout(() => setIsPlaying(true), 50);
      }
    } else {
      setIsPlaying(true);
    }
  };
  
  const handlePause = () => setIsPlaying(false);
  
  const handleStep = () => {
    setIsPlaying(false);
    executeNextStep();
  };

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    setCode(defaultCodeBlock[newLang]);
  };

  const handleScanImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setIsScanning(true);
    setError(null);
    setScanProgress('Initializing Tesseract OCR Engine...');
    
    try {
      const worker = window.Tesseract;
      if (!worker) throw new Error("Optical scanner engine failed to load. Please check internet connection.");
      
      const { data: { text } } = await worker.recognize(file, 'eng', {
        logger: m => {
          if (m.status === 'recognizing text') {
             setScanProgress(`Scanning Code Base: ${Math.round(m.progress * 100)}%`);
          } else {
             setScanProgress(`Loading Vision Map: ${m.status}...`);
          }
        }
      });
      
      let cleaned = sanitizeCode(text);
        
      // Simple language detection
      let detectedLang = 'javascript';
      if (cleaned.includes('public static void main') || cleaned.includes('System.out.println')) {
          detectedLang = 'java';
      } else if (cleaned.includes('#include') || cleaned.includes('cout <<') || cleaned.includes('std::')) {
          detectedLang = 'cpp';
      } else if (cleaned.includes('def ') || cleaned.includes('print(') || cleaned.includes(':\n') || (cleaned.includes('#') && !cleaned.includes('#include'))) {
          detectedLang = 'python';
      }
      
      setLanguage(detectedLang);
      setCode(cleaned);
      
    } catch (err) {
      setError('Code-Scan completely failed: ' + err.message);
    } finally {
      setIsScanning(false);
      setScanProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    if (isPlaying && currentStep === 0) {
      const stats = JSON.parse(localStorage.getItem('userStats')) || { visualizations: 0, quizzesTaken: 0, avgScore: 0 };
      stats.visualizations += 1;
      localStorage.setItem('userStats', JSON.stringify(stats));
    }
  }, [isPlaying, currentStep]);

  return (
    <div className="cv-container">
      <div className="cv-inner">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="cv-header"
        >
          <Terminal className="cv-icon-terminal" size={32} />
          <div>
            <h1>Code Execution Visualizer</h1>
            <p>Step through algorithm execution in real-time</p>
          </div>
        </motion.div>

        <div className="cv-grid">
          {/* Left Panel */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
          >
            {/* Code Editor */}
            <div className="cv-panel">
              <div className="cv-panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="cv-panel-title">
                  <Code size={16} color="#60a5fa" />
                  <span>Source Code</span>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <input type="file" ref={fileInputRef} onChange={handleScanImage} accept="image/*" style={{ display: 'none' }} />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="cv-btn-icon highlight-camera"
                    title="Scan Code from Image (OCR)"
                    disabled={isScanning}
                  >
                    {isScanning ? (
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                         <RefreshCw size={20} />
                      </motion.div>
                    ) : (
                      <>
                        <Camera size={20} />
                        <span style={{marginLeft: '6px', fontSize: '0.9rem', fontWeight: 'bold'}}>SCAN IMAGE</span>
                      </>
                    )}
                  </button>
                  <select 
                    value={language} 
                    onChange={handleLanguageChange}
                    disabled={isScanning}
                    className="cv-language-select"
                  >
                    <option value="javascript">JavaScript</option>
                    <option value="python">Python</option>
                    <option value="java">Java</option>
                    <option value="cpp">C++</option>
                  </select>
                  <button 
                    onClick={reset}
                    className="cv-btn-icon reset-btn"
                    title="Reset Execution"
                    disabled={isScanning}
                  >
                    <RotateCcw size={18} />
                  </button>
                </div>
              </div>
              <div style={{ position: 'relative' }}>
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="cv-textarea"
                  spellCheck={false}
                  disabled={isScanning}
                  style={{ opacity: isScanning ? 0.3 : 1 }}
                />
                <AnimatePresence>
                  {isScanning && (
                    <motion.div 
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      style={{ 
                        position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', 
                        display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: '1rem', borderRadius: '8px' 
                      }}
                    >
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}>
                        <Camera size={48} color="#60a5fa" />
                      </motion.div>
                      <span style={{ color: '#60a5fa', fontWeight: 'bold', fontSize: '1.1rem' }}>{scanProgress || 'Processing Image...'}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Controls */}
            <div className="cv-panel">
              <div className="cv-controls">
                {!isPlaying ? (
                  <button
                    onClick={handlePlay}
                    disabled={tokens.length === 0 || isScanning}
                    className="cv-btn cv-btn-primary"
                  >
                    <Play size={16} /> {currentStep >= tokens.length - 1 ? 'Restart' : 'Play'}
                  </button>
                ) : (
                  <button
                    onClick={handlePause}
                    className="cv-btn cv-btn-warning"
                    disabled={isScanning}
                  >
                    <Pause size={16} /> Pause
                  </button>
                )}
                
                <button
                  onClick={handleStep}
                  disabled={isPlaying || currentStep >= tokens.length - 1 || tokens.length === 0 || isScanning}
                  className="cv-btn cv-btn-secondary"
                >
                  <SkipForward size={16} /> Step
                </button>

                <div className="cv-speed-slider">
                  <Activity size={16} color="#94a3b8" />
                  <input
                    type="range"
                    min="200"
                    max="2000"
                    step="100"
                    value={speed}
                    onChange={(e) => setSpeed(Number(e.target.value))}
                    className="cv-slider"
                    disabled={isScanning}
                  />
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', width: '3rem' }}>{speed}ms</span>
                </div>
              </div>

              {error && (
                <div style={{ marginTop: '0.75rem' }}>
                  <div className="cv-error">
                    <AlertCircle size={16} />
                    {error}
                  </div>
                </div>
              )}

              {/* Progress */}
              <div className="cv-progress-container">
                <div className="cv-progress-text">
                  <span>Step {Math.min(currentStep + 1, tokens.length)} of {tokens.length}</span>
                  <span>{tokens.length > 0 ? Math.round(((currentStep + 1) / tokens.length) * 100) : 0}%</span>
                </div>
                <div className="cv-progress-bar">
                  <div 
                    className="cv-progress-fill"
                    style={{ width: `${tokens.length > 0 ? ((currentStep + 1) / tokens.length) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Panel */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
          >
            {/* Current Operation */}
            {history.length > 0 && (
              <div className="cv-panel">
                <div className="cv-panel-title" style={{ marginBottom: '0.5rem' }}>
                  <ChevronRight size={20} color="#34d399" />
                  <span>Current Operation</span>
                </div>
                <div className="cv-code-block">
                  <div style={{ color: '#60a5fa', marginBottom: '0.25rem' }}>
                    Line {history[history.length - 1].line}:
                  </div>
                  <code>{history[history.length - 1].code}</code>
                </div>
              </div>
            )}

            {/* Variables */}
            {currentState && Object.keys(currentState.variables).length > 0 && (
              <div className="cv-panel">
                <div className="cv-panel-title" style={{ marginBottom: '0.75rem' }}>
                  <Box size={16} color="#c084fc" />
                  <span>Variables</span>
                </div>
                <div className="cv-vars-grid">
                  {Object.entries(currentState.variables).map(([name, value]) => (
                    <motion.div
                      key={name}
                      layout
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="cv-var-card"
                    >
                      <div className="cv-var-name">{name}</div>
                      <div className="cv-var-val">
                        {typeof value === 'string' ? `"${value}"` : String(value)}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Arrays */}
            {currentState && Object.keys(currentState.arrays).length > 0 && (
              <div className="cv-panel">
                <div className="cv-panel-title" style={{ marginBottom: '0.75rem' }}>
                  <Database size={16} color="#22d3ee" />
                  <span>Arrays</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {Object.entries(currentState.arrays).map(([name, arr]) => (
                    <div key={name} className="cv-var-card" style={{ padding: '0.75rem' }}>
                      <div className="cv-var-name" style={{ marginBottom: '0.5rem' }}>{name}</div>
                      <div className="cv-array-items">
                        {arr.map((item, idx) => {
                          const isHighlighted = false; // logic kept pure
                          return (
                            <motion.div
                              key={`${name}-${idx}-${item}`}
                              layout
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className={`cv-array-item ${isHighlighted ? 'highlighted' : ''}`}
                            >
                              {typeof item === 'string' ? `"${item}"` : item}
                            </motion.div>
                          );
                        })}
                      </div>
                      <div className="cv-array-indexes">
                        {arr.map((_, idx) => (
                          <div key={idx} className="cv-array-index">
                            {idx}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Console Output */}
            {currentState && currentState.output.length > 0 && (
              <div className="cv-panel">
                <div className="cv-panel-title" style={{ marginBottom: '0.75rem' }}>
                  <Terminal size={16} color="#94a3b8" />
                  <span>Console Output</span>
                </div>
                <div className="cv-console">
                  {currentState.output.map((line, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="cv-console-line"
                    >
                      <span className="cv-console-prompt">$</span>
                      <span className="cv-console-text">{line}</span>
                    </motion.div>
                  ))}
                  {currentStep >= tokens.length - 1 && tokens.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      className="cv-console-finish"
                    >
                      Process finished with exit code 0
                    </motion.div>
                  )}
                  <div ref={consoleEndRef} />
                </div>
              </div>
            )}

            {/* Empty State */}
            {(!currentState || (Object.keys(currentState.variables).length === 0 && Object.keys(currentState.arrays).length === 0 && currentState.output.length === 0)) && history.length === 0 && (
              <div className="cv-empty-state">
                <Activity className="cv-empty-icon" />
                <p className="cv-empty-text">Click Play or Scan to start execution</p>
              </div>
             )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default CodeVisualizer;