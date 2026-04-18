import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Pause, RotateCcw, SkipForward, SkipBack, Terminal, 
  Database, ChevronRight, Activity, Box, AlertCircle, Code, Camera, RefreshCw, Layers, Eye, Ghost, Info
} from 'lucide-react';
import './CodeVisualizerPage.css';

// ==================== TRANSPILER ====================
const transpileToJS = (rawCode, language) => {
  if (language === 'javascript') return rawCode;
  
  let lines = rawCode.split('\n').map(line => {
    const s = line.trim();
    if (s.match(/^(#include|using\s+namespace|namespace\s|package\s|import\s|#define)/)) return '// ' + line;
    return line;
  });
  
  let newLines = [];
  
  if (language === 'python') {
    let indentStack = [];
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        let stripped = line.trim();
        if (!stripped) { newLines.push(line); continue; }
        if (stripped.startsWith('#')) { newLines.push(line.replace('#', '//')); continue; }
        
        let indent = line.search(/\S/);
        let closeBraces = '';
        while (indentStack.length > 0 && indent <= indentStack[indentStack.length - 1]) {
            if (indent === indentStack[indentStack.length - 1] && stripped.match(/^(elif|else)\b/)) {
                indentStack.pop(); closeBraces += '} '; break;
            }
            if (indent === indentStack[indentStack.length - 1]) break;
            indentStack.pop(); closeBraces += '} ';
        }
        let jsLine = line;
        if (jsLine.includes('#')) jsLine = jsLine.split('#')[0] + '//' + jsLine.split('#').slice(1).join('#');
        jsLine = jsLine.replace(/\bprint\((.*)\)/, 'console.log($1)');
        jsLine = jsLine.replace(/\bdef\s+(\w+)\s*\((.*?)\)\s*:/, 'function $1($2) {');
        jsLine = jsLine.replace(/\bclass\s+(\w+)(.*?)\s*:/, 'class $1 {');
        jsLine = jsLine.replace(/\bself\./g, 'this.');
        jsLine = jsLine.replace(/\b__init__\b/, 'constructor');
        jsLine = jsLine.replace(/\bfor\s+(\w+)\s+in\s+range\(\s*len\(\s*(\w+)\s*\)\s*\)\s*:/, 'for(let $1=0; $1<$2.length; $1++) {');
        jsLine = jsLine.replace(/\bfor\s+(\w+)\s+in\s+range\(\s*(.*?)\s*\)\s*:/, 'for(let $1=0; $1<$2; $1++) {');
        jsLine = jsLine.replace(/\bwhile\s+(.*?)\s*:/, 'while($1) {');
        jsLine = jsLine.replace(/\bif\s+(.*?)\s*:/, 'if($1) {');
        jsLine = jsLine.replace(/\belif\s+(.*?)\s*:/, 'else if($1) {');
        jsLine = jsLine.replace(/\belse\s*:/, 'else {');
        jsLine = jsLine.replace(/\bTrue\b/g, 'true').replace(/\bFalse\b/g, 'false').replace(/\bNone\b/g, 'null');
        jsLine = jsLine.replace(/\.\s*append\s*\(/g, '.push(');
        if (jsLine.trim().endsWith('{')) indentStack.push(indent);
        newLines.push(closeBraces + jsLine);
    }
    let remainingBraces = '';
    while (indentStack.length > 0) { indentStack.pop(); remainingBraces += '} '; }
    if (newLines.length > 0) newLines[(newLines.length - 1)] += remainingBraces;
    return newLines.join('\n');
  }

  if (language === 'java' || language === 'cpp') {
      for (let i = 0; i < lines.length; i++) {
          let jsLine = lines[i];
          let stripped = jsLine.trim();
          if (stripped.match(/^(#include|using\s+namespace|package\s|import\s|namespace\s|#define)/)) { newLines.push('// ' + jsLine); continue; }
          if (jsLine.includes('cout')) {
              let parts = jsLine.split('<<').map(p => p.replace('cout', '').replace(/endl/g, '').replace(';', '').trim()).filter(p => !!p);
              if (parts.length > 0) { jsLine = `console.log(${parts.join(', ')});`; }
          }
          jsLine = jsLine.replace(/\b(?:std::)?vector<\w+>\s+(\w+)\s*=\s*\{(.*?)\}\s*;/g, 'let $1 = [$2];');
          jsLine = jsLine.replace(/\b(?:int|float|double|boolean|bool|long|String)\s+(?:\[\]\s*)?(\w+)(?:\s*\[\])?\s*=\s*\{(.*?)\}\s*;/g, 'let $1 = [$2];');
          jsLine = jsLine.replace(/\b(?:int|float|double|boolean|bool|long|char|String|auto|Node|Tree)\s+(\w+)\s*=/g, 'let $1 =');
          jsLine = jsLine.replace(/\b(?:int|float|double|boolean|bool|long|char|String|auto)\s+(\w+)\s*;/g, 'let $1;');
          jsLine = jsLine.replace(/\bSystem\.out\.print(?:ln)?\((.*?)\)\s*;/g, 'console.log($1);');
          jsLine = jsLine.replace(/\.(push_back|add)\(/g, '.push(');
          jsLine = jsLine.replace(/\.(size|length)\(\)/g, '.length');
          jsLine = jsLine.replace(/\bpublic\s+class\s+\w+\s*\{/g, '/* class wrapper */ {');
          jsLine = jsLine.replace(/\b(?:public\s+)?(?:static\s+)?(?:void|int)\s+main\s*\(.*?\)\s*\{/g, 'function main() {');
          newLines.push(jsLine);
      }
      let finalCode = newLines.join('\n');
      if (finalCode.includes('function main()')) finalCode += '\nmain();';
      return finalCode;
  }
  return rawCode;
};

// ==================== EXECUTION ENGINE ====================
const __clone = (val, seen = new WeakMap()) => {
  if (val === null || typeof val !== 'object') return val;
  if (seen.has(val)) return `[Circular REF]`;
  seen.set(val, true);
  if (Array.isArray(val)) return val.map(item => __clone(item, seen));
  const clone = {};
  for (let key in val) {
    if (Object.prototype.hasOwnProperty.call(val, key)) { clone[key] = __clone(val[key], seen); }
  }
  return clone;
};

const compileAndRun = (rawCode, language) => {
  const code = transpileToJS(rawCode, language);
  const history = [];
  let variablesSet = new Set();
  
  if (!window.Babel) throw new Error("Babel standalone is not loaded.");

  const extractVarsPlugin = function() {
    return {
      visitor: {
        Identifier(path) {
          if (path.parentPath.isVariableDeclarator({ id: path.node }) || 
              path.parentPath.isFunctionDeclaration({ id: path.node }) ||
              path.parentPath.isAssignmentExpression({ left: path.node }) ||
              path.parentPath.isClassDeclaration({ id: path.node })) {
                variablesSet.add(path.node.name);
          }
        }
      }
    };
  };

  try {
    window.Babel.transform(code, { plugins: [extractVarsPlugin], filename: 'extract.js' });
  } catch (e) { throw new Error("Syntax error: " + e.message); }

  const reserved = new Set(['console', 'Math', 'Array', 'Object', 'String', 'Number', 'JSON', 'window', 'document', '__trace', '__clone', 'history', 'variablesSet', 'let']);
  const vars = [...variablesSet].filter(v => !reserved.has(v));
  const varsObjString = "({ " + vars.map(v => `"${v}": (() => { try { return __clone(${v}); } catch(e) { return undefined; } })()`).join(", ") + " })";

  const instrumentPlugin = function({ types: t }) {
    return {
      visitor: {
        Statement(path) {
          if (path.isBlockStatement() || path.isClassMethod() || path.isFunctionDeclaration()) return;
          if (!path.node.loc || path.node.__injected) return;
          if (!path.parentPath.isBlockStatement() && !path.parentPath.isProgram()) return;
          const line = path.node.loc.start.line;
          try {
            const traceStmt = t.expressionStatement(t.callExpression(t.identifier('__trace'), [t.numericLiteral(line), t.callExpression(t.identifier('eval'), [t.stringLiteral(varsObjString)])]));
            traceStmt.__injected = true;
            path.insertAfter(traceStmt);
          } catch(e) { console.error(e); }
        }
      }
    };
  };

  let instrumentedCode = "";
  try {
    instrumentedCode = window.Babel.transform(code, { plugins: [instrumentPlugin], filename: 'visualizer.js' }).code;
  } catch(e) { throw new Error("Instrumentation Error: " + e.message); }

  let currentOutput = [];
  let stepCount = 0;
  
  const __trace = (line, scope) => {
    if (stepCount++ > 3000) throw new Error("Infinite loop detected.");
    const variables = {};
    const memoryStructures = { arrays: {}, trees: {}, graphs: {}, stacks: {} };

    for (let key in scope) {
      const val = scope[key];
      if (val === undefined || typeof val === 'function') continue;
      if (Array.isArray(val)) { memoryStructures.arrays[key] = val; }
      else if (typeof val === 'object' && val !== null) {
         if ('left' in val || 'right' in val || 'value' in val || 'val' in val) memoryStructures.trees[key] = val;
         else if ('next' in val) memoryStructures.graphs[key] = val;
         else variables[key] = val;
      } else variables[key] = val;
    }

    const codeLine = rawCode.split('\n')[line - 1]?.trim() || '';
    let why = "Executing logical instruction.";
    if (codeLine.includes('root =') || codeLine.includes('Node(')) why = "Instantiating memory node block in heap space.";
    if (codeLine.includes('.left') || codeLine.includes('.right')) why = "Updating child reference pointers to re-balance or extend the tree topology.";
    if (codeLine.includes('arr.push') || codeLine.includes('.push')) why = "Dynamic memory allocation: Appending value to contiguous memory block.";
    if (codeLine.includes('for') || codeLine.includes('while')) why = "Looping structure: Re-evaluating condition for iterative execution.";

    history.push({
      line,
      code: codeLine,
      variables,
      memoryStructures,
      why,
      output: [...currentOutput]
    });
  };

  const fakeConsole = { log: (...args) => { currentOutput.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')); } };
  try {
    const fn = new Function('__trace', '__clone', 'console', instrumentedCode);
    fn(__trace, __clone, fakeConsole);
  } catch (e) { if (history.length === 0) throw e; }
  return history;
};

// ==================== LIQUID GLASS RENDERERS ====================

const GlassArray = ({ name, arr, isXRay }) => (
  <div className="iso-glass-container">
    <div className="iso-title">Array / Stack : <span>{name}</span> {isXRay && <span className="xray-addr-main">[ADDR: 0xFD40{name.length}]</span>}</div>
    <div className="iso-array">
      {arr.map((val, idx) => (
        <div key={idx} className="iso-array-cell">
           <div className="iso-cell-value">{typeof val === 'object' ? '{...}' : String(val)}</div>
           <div className="iso-cell-index">{idx}</div>
           {isXRay && (
             <div className="iso-xray-details">
                <div className="xray-hex">0x{ (1024 + idx * 8).toString(16).toUpperCase() }</div>
                <div className="xray-bin">{ Number(val).toString(2).padStart(8, '0').slice(-8) }</div>
             </div>
           )}
        </div>
      ))}
    </div>
  </div>
);

const GlassTree = ({ name, node, isXRay }) => {
  const renderNode = (n, addr = '0x10A') => {
    if (!n) return null;
    return (
      <div className="iso-tree-node-wrapper">
        <div className="iso-tree-node">
          {n.val !== undefined ? n.val : n.value}
          {isXRay && <div className="xray-node-addr">{addr}</div>}
        </div>
        <div className="iso-tree-children">
          {(n.left || n.right) && (
            <>
              <div className="iso-tree-child left">{renderNode(n.left, addr + 'L')}</div>
              <div className="iso-tree-child right">{renderNode(n.right, addr + 'R')}</div>
            </>
          )}
        </div>
      </div>
    );
  };
  return (
    <div className="iso-glass-container">
      <div className="iso-title">Binary Tree : <span>{name}</span></div>
      <div className="iso-tree-root">{renderNode(node)}</div>
    </div>
  );
};

// ==================== MAIN COMPONENT ====================

const CodeVisualizer = () => {
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState(`class Node {\n  constructor(val) {\n    this.val = val;\n    this.left = null;\n    this.right = null;\n  }\n}\nlet root = new Node(10);\nroot.left = new Node(5);\nroot.right = new Node(15);\nconsole.log(root);`);

  const [tokens, setTokens] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1000);
  const [error, setError] = useState(null);
  const [isXRay, setIsXRay] = useState(false);
  const [isGhosting, setIsGhosting] = useState(true);
  
  const [isScanning, setIsScanning] = useState(false);
  const [ocrWarning, setOcrWarning] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  
  const timerRef = useRef(null);
  const fileInputRef = useRef(null);

  const performCompilation = useCallback(() => {
    try {
      const steps = compileAndRun(code, language);
      setTokens(steps);
      setError(null);
      return steps;
    } catch(e) { setError(e.message); setTokens([]); return []; }
  }, [code, language]);

  const reset = useCallback(() => { setCurrentStep(0); setIsPlaying(false); if (timerRef.current) clearInterval(timerRef.current); }, []);

  useEffect(() => {
    const timeout = setTimeout(() => { performCompilation(); reset(); }, 800);
    return () => clearTimeout(timeout);
  }, [code, language, performCompilation, reset]);

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentStep(prev => {
          if (prev >= tokens.length - 1) { setIsPlaying(false); return prev; }
          return prev + 1;
        });
      }, speed);
      return () => clearInterval(timerRef.current);
    }
  }, [isPlaying, speed, tokens.length]);

  const currentState = tokens[currentStep];
  const ghostStep = (isGhosting && currentStep > 0) ? tokens[currentStep - 1] : null;

  const handleScanImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsScanning(true); setOcrWarning(null);
    try {
      const worker = window.Tesseract;
      if (!worker) throw new Error("Offline. OCR unavailable.");
      const { data } = await worker.recognize(file, 'eng');
      const lowConf = data.words.filter(w => w.confidence < 60);
      if (lowConf.length > 5) setOcrWarning(`OCR extraction confidence low. Verify ${lowConf.length} tokens.`);
      setCode(data.text.replace(/‘|’|`|´/g, "'").replace(/“|”/g, '"').replace(/\s@\s/g, ' 0 '));
    } catch (err) { setError('OCR Failed: ' + err.message); } finally {
      setIsScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // AUTO-LANGUAGE DETECTION
  useEffect(() => {
    const detectLanguage = (text) => {
      const lower = text.toLowerCase();
      if (lower.includes('#include') || lower.includes('std::') || lower.includes('cout <<')) return 'cpp';
      if (lower.includes('public static void main') || lower.includes('system.out.print')) return 'java';
      if (text.match(/\bdef\s+\w+\(/) || text.match(/\bimport\s+math\b/) || (lower.includes('print(') && !lower.includes('console.log'))) return 'python';
      if (lower.includes('let ') || lower.includes('const ') || lower.includes('console.log') || lower.includes('function ')) return 'javascript';
      return null;
    };

    const timeoutId = setTimeout(() => {
      const detected = detectLanguage(code);
      if (detected && detected !== language) {
        setLanguage(detected);
      }
    }, 1000); // 1s debounce
    return () => clearTimeout(timeoutId);
  }, [code, language]);

  return (
    <div className="cv-container">
      <div className="cv-inner">
        <motion.div initial={{opacity:0, y:-20}} animate={{opacity:1, y:0}} className="cv-header">
          <Terminal className="cv-icon-terminal" size={32} />
          <div>
            <h1>Mandate: Optical Execution Engine</h1>
            <p>ISO-26 Flawless AST Trace Mapping Visualization</p>
          </div>
        </motion.div>

        <div className="cv-grid">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="cv-panel">
              <div className="cv-panel-header">
                <div className="cv-panel-title"><Code size={16} /> Source Code</div>
                <div style={{display:'flex', gap:'10px'}}>
                  <input type="file" ref={fileInputRef} onChange={handleScanImage} accept="image/*" style={{display:'none'}} />
                  <button onClick={() => fileInputRef.current?.click()} className="cv-btn-icon highlight-camera" disabled={isScanning}>
                    {isScanning ? <RefreshCw className="spin" size={16} /> : <Camera size={16} />} <span style={{marginLeft:'5px'}}>Scan</span>
                  </button>
                  <select value={language} onChange={e => setLanguage(e.target.value)} className="cv-language-select">
                    <option value="javascript">JS</option><option value="python">Py</option><option value="java">Java</option><option value="cpp">C++</option>
                  </select>
                </div>
              </div>
              <div className="code-editor-wrapper">
                <div className="code-highlight-layer">
                  {code.split('\n').map((line, idx) => (
                    <div key={idx} className={`code-line ${currentState?.line === idx + 1 ? 'active-line' : ''}`}>
                      <span className="line-num">{idx + 1}</span> {line || ' '}
                    </div>
                  ))}
                </div>
                <textarea value={code} onChange={e => setCode(e.target.value)} className="code-input-layer" spellCheck="false" />
              </div>
              {ocrWarning && <div className="ocr-warning"><AlertCircle size={14}/> {ocrWarning}</div>}
              {error && <div className="cv-error"><AlertCircle size={16}/> {error}</div>}
            </div>

            <div className="cv-panel">
               <div className="cv-controls">
                  <button className="cv-btn cv-btn-secondary" onClick={() => setIsXRay(!isXRay)} style={{color: isXRay ? '#FCEE09' : '#0FF0FC'}}><Eye size={16}/> X-Ray</button>
                  <button className="cv-btn cv-btn-secondary" onClick={() => setIsGhosting(!isGhosting)} style={{color: isGhosting ? '#FF003C' : '#0FF0FC'}}><Ghost size={16}/> Ghost</button>
                  <button className="cv-btn cv-btn-secondary" onClick={reset}><RotateCcw size={16}/> Reset</button>
                  <button className="cv-btn cv-btn-warning" onClick={() => { setIsPlaying(false); setCurrentStep(Math.max(0, currentStep - 1)) }} disabled={currentStep === 0}><SkipBack size={16}/> Undo</button>
                  {isPlaying ? (
                    <button className="cv-btn cv-btn-warning" onClick={() => setIsPlaying(false)}><Pause size={16}/> Pause</button>
                  ) : (
                    <button className="cv-btn cv-btn-primary" onClick={() => setIsPlaying(true)} disabled={currentStep >= tokens.length - 1}><Play size={16}/> Play</button>
                  )}
                  <button className="cv-btn cv-btn-secondary" onClick={() => { setIsPlaying(false); setCurrentStep(Math.min(tokens.length - 1, currentStep + 1)) }} disabled={currentStep >= tokens.length - 1}><SkipForward size={16}/> Step</button>
               </div>
               <div className="cv-progress-container">
                  <div className="cv-progress-text">
                     <span>Trace Step {currentStep + 1} / {tokens.length || 1}</span>
                     <span>{tokens.length ? Math.round(((currentStep+1)/tokens.length)*100) : 0}%</span>
                  </div>
                  <div className="cv-progress-bar"><div className="cv-progress-fill" style={{width: `${tokens.length ? ((currentStep+1)/tokens.length)*100 : 0}%`}}></div></div>
               </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
             <div className="cv-panel execution-tracker">
                <div className="cv-panel-title" style={{justifyContent: 'space-between'}}>
                   <div style={{display:'flex', alignItems:'center', gap: '8px'}}><Activity size={16}/> Execution Trace</div>
                   <div className="why-indicator" onMouseEnter={() => setShowExplanation(true)} onMouseLeave={() => setShowExplanation(false)}>
                      <Info size={18} color="#FCEE09" style={{cursor:'help'}}/>
                      <AnimatePresence>
                        {showExplanation && (
                          <motion.div initial={{opacity:0, scale:0.8}} animate={{opacity:1, scale:1}} exit={{opacity:0}} className="why-popup">
                            <div className="why-title">ALGORITHMIC JUSTIFICATION</div>
                            <div className="why-text">{currentState?.why || "Processing logical compute."}</div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                   </div>
                </div>
                <div className="cv-code-block" style={{marginTop:'10px', fontSize:'14px'}}>
                   {currentState ? `[L${currentState.line}] :: ${currentState.code}` : "AWAITING COMPILATION..."}
                </div>
             </div>

             {currentState && (
               <>
                 <div className="cv-panel memory-mapper" style={{position:'relative'}}>
                    <div className="cv-panel-title"><Layers size={16}/> Memory Heap Topology</div>
                    <div className="render-canvas">
                        <div className="visual-layers-stack">
                           {/* Ghost Layer */}
                           <div className="layer ghost-layer" style={{ display: isGhosting && ghostStep ? 'block' : 'none' }}>
                              {ghostStep && (
                                <>
                                  {Object.entries(ghostStep.memoryStructures.arrays).map(([name, arr]) => <GlassArray key={name} name={name} arr={arr} isXRay={isXRay} />)}
                                  {Object.entries(ghostStep.memoryStructures.trees).map(([name, node]) => <GlassTree key={name} name={name} node={node} isXRay={isXRay} />)}
                                </>
                              )}
                           </div>
                           {/* Current Layer */}
                           <div className="layer current-layer">
                              {Object.entries(currentState.memoryStructures.arrays).map(([name, arr]) => <GlassArray key={name} name={name} arr={arr} isXRay={isXRay} />)}
                              {Object.entries(currentState.memoryStructures.trees).map(([name, node]) => <GlassTree key={name} name={name} node={node} isXRay={isXRay} />)}
                           </div>
                        </div>
                    </div>
                 </div>

                 {currentState.output.length > 0 && (
                   <div className="cv-panel"><div className="cv-panel-title"><Terminal size={16}/> Console Log</div>
                     <div className="cv-console">
                        {currentState.output.map((out, i) => (<div key={i} className="cv-console-line"><span className="cv-console-prompt">$</span> <span className="cv-console-text">{out}</span></div>))}
                     </div>
                   </div>
                 )}
               </>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeVisualizer;