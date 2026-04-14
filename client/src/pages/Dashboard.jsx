import { useState, useRef } from "react";
import axios from "axios";
import Markdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/atom-one-dark.css";
import { Code2, Sparkles, Loader2, Bot, Copy, Check, ChevronDown, Download, Wand2 } from "lucide-react";
import Editor from "@monaco-editor/react";
import * as htmlToImage from "html-to-image";
import { jsPDF } from "jspdf";

export default function Dashboard() {
  const [code, setCode] = useState("// Paste your code here...\n\n");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState("javascript");
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedResponse, setCopiedResponse] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const reportRef = useRef(null);

  const loadDemoCode = () => {
    setCode(`function calculateTotal(items) {
  let total = 0;
  for (let i = 0; i <= items.length; i++) { // Bug: i <= items.length
    total += items[i].price; // Will throw error when i == items.length
  }
  return total;
}

const shoppingCart = [
  { name: 'Apple', price: 1.5 },
  { name: 'Banana', price: 2.0 },
  { name: 'Orange', price: 1.2 }
];

console.log(calculateTotal(shoppingCart));`);
    setLanguage("javascript");
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const copyResponse = () => {
    navigator.clipboard.writeText(result);
    setCopiedResponse(true);
    setTimeout(() => setCopiedResponse(false), 2000);
  };

  const downloadPDF = async () => {
    if (!reportRef.current) return;
    try {
      setIsGeneratingPDF(true);
      const element = reportRef.current;
      
      const originalBg = element.style.backgroundColor;
      element.style.backgroundColor = '#0B1120';
      element.style.padding = '20px';

      const canvas = await htmlToImage.toCanvas(element, {
        backgroundColor: '#0B1120',
        pixelRatio: 2,
      });

      element.style.backgroundColor = originalBg;
      element.style.padding = '';

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      let heightLeft = pdfHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }

      pdf.save('AI-Code-Review.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
      setErrorMsg("Failed to generate PDF. Please try again.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleEditorBeforeMount = (monaco) => {
    monaco.editor.defineTheme('custom-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#0f172a',
      }
    });
  };

  const handleReview = async () => {
    if (!code.trim()) return;
    try {
      setLoading(true);
      setErrorMsg("");

      const res = await axios.post(`${import.meta.env.VITE_API_URL}/reviews`, {
        code,
        language,
      });

      setResult(res.data.data);
      setErrorMsg("");
    } catch (error) {
      console.error("Review error:", error);
      setResult("");
      if (error.response?.status === 429) {
        setErrorMsg("Daily limit of 5 reviews reached. Please come back tomorrow!");
      } else {
        setErrorMsg(error.response?.data?.message || "Error reviewing code. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 p-3 sm:p-4 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 max-w-[1800px] w-full mx-auto">
      {/* Left Panel - Editor */}
      <div className="flex flex-col rounded-3xl bg-slate-900/50 border border-slate-800 shadow-2xl backdrop-blur-sm overflow-hidden flex-1 group focus-within:ring-1 focus-within:ring-indigo-500/50 transition-all duration-300">
        <div className="px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between border-b border-slate-800 bg-slate-900/80 overflow-x-auto gap-2">
          <div className="flex items-center gap-2 sm:gap-4 text-sm font-semibold text-slate-300">
            <div className="flex items-center gap-1 sm:gap-2">
              <Code2 className="w-4 h-4 text-cyan-400" />
              <span className="hidden sm:inline whitespace-nowrap">Source Code</span>
            </div>
            <div className="relative">
              <select 
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-slate-800/50 border border-slate-700/50 text-slate-300 text-xs rounded-md pl-2 sm:pl-3 pr-7 sm:pr-8 py-1.5 outline-none focus:ring-1 focus:ring-indigo-500 appearance-none cursor-pointer transition-colors hover:bg-slate-700/50"
              >
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
                <option value="csharp">C#</option>
                <option value="go">Go</option>
                <option value="rust">Rust</option>
                <option value="php">PHP</option>
                <option value="ruby">Ruby</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1.5 sm:px-2 text-slate-400">
                <ChevronDown className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            <button
              onClick={loadDemoCode}
              title="Load Demo Code"
              className="text-xs text-indigo-300 hover:text-white transition-colors flex items-center gap-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 px-2 sm:px-2.5 py-1.5 rounded-md border border-indigo-500/30"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline whitespace-nowrap">Demo Code</span>
            </button>
            <button
              onClick={copyCode}
              title="Copy Code"
              className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 bg-slate-800/50 hover:bg-slate-700/50 px-2 sm:px-2.5 py-1.5 rounded-md border border-slate-700/50"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline whitespace-nowrap">{copiedCode ? "Copied!" : "Copy Code"}</span>
            </button>
            <div className="hidden sm:flex gap-1.5 opacity-50">
              <div className="w-3 h-3 rounded-full bg-rose-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
            </div>
          </div>
        </div>

        <div className="flex-1 relative min-h-[250px] sm:min-h-[400px]">
          <Editor
            height="100%"
            language={language}
            theme="custom-dark"
            value={code}
            onChange={(value) => setCode(value || "")}
            beforeMount={handleEditorBeforeMount}
            loading={<div className="flex items-center justify-center h-full text-slate-400">Loading editor...</div>}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              wordWrap: "on",
              lineNumbers: "on",
              scrollBeyondLastLine: false,
              padding: { top: 24, bottom: 24 },
              fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace"
            }}
          />
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-900/80">
          <button
            disabled={loading || !code.trim()}
            onClick={handleReview}
            className={`w-full relative overflow-hidden font-medium py-3.5 px-6 rounded-2xl transition-all duration-500 flex items-center justify-center gap-2 ${
              loading
                ? "bg-slate-800 text-indigo-300 border border-indigo-500/50 shadow-[0_0_30px_rgba(99,102,241,0.3)]"
                : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] active:scale-[0.98]"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading && (
              <div className="absolute inset-0 top-0 left-0 w-full h-full overflow-hidden rounded-2xl">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent -translate-x-[100%] animate-[shimmer_2s_infinite]"></div>
              </div>
            )}
            <div className="relative z-10 flex items-center gap-2">
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing Code...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Review Code
                </>
              )}
            </div>
          </button>
        </div>
      </div>

      {/* Right Panel - Result */}
      <div className="flex flex-col rounded-2xl sm:rounded-3xl bg-[#0B1120] border border-slate-800 shadow-2xl backdrop-blur-sm overflow-hidden flex-1 relative min-h-[300px] sm:min-h-[500px]">
        <div className="px-4 sm:px-6 py-4 flex items-center justify-between border-b border-slate-800 bg-slate-900/80 sticky top-0 z-10 shadow-sm gap-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-300">
            <Bot className="w-4 h-4 text-indigo-400" />
            <span className="hidden sm:inline whitespace-nowrap">AI Feedback</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            {result && !loading && (
              <>
                <button
                  onClick={downloadPDF}
                  disabled={isGeneratingPDF}
                  title="Download PDF Report"
                  className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 bg-slate-800/50 hover:bg-slate-700/50 px-2 sm:px-2.5 py-1.5 rounded-md border border-slate-700/50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGeneratingPDF ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  <span className="hidden sm:inline whitespace-nowrap">
                    {isGeneratingPDF ? "Generating..." : "Download PDF"}
                  </span>
                </button>
                <button
                  onClick={copyResponse}
                  title="Copy Response"
                  className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 bg-slate-800/50 hover:bg-slate-700/50 px-2 sm:px-2.5 py-1.5 rounded-md border border-slate-700/50"
                >
                  {copiedResponse ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline whitespace-nowrap">{copiedResponse ? "Copied!" : "Copy Response"}</span>
                </button>
              </>
            )}
            {loading && (
              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
            )}
          </div>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto flex-1 prose prose-invert prose-indigo max-w-none text-slate-300 prose-pre:bg-[#0E1526] prose-pre:border prose-pre:border-slate-800 prose-pre:shadow-xl relative">
          
          {errorMsg && (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 px-3 sm:px-4 py-3 rounded-xl shadow-lg z-20 flex items-center gap-3 mb-4">
               <span className="font-bold flex-1 text-sm sm:text-base">{errorMsg}</span>
            </div>
          )}

          {loading ? (
            <div className="h-full flex flex-col items-center justify-center space-y-8 animate-in fade-in duration-700">
              <div className="relative flex items-center justify-center w-32 h-32">
                <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-2xl animate-pulse"></div>
                <div className="absolute inset-0 border-t-2 border-l-2 border-indigo-400 rounded-full animate-spin"></div>
                <div className="absolute inset-2 border-b-2 border-r-2 border-cyan-400 rounded-full animate-[spin_3s_linear_infinite_reverse]"></div>
                <div className="absolute inset-4 border-t-2 border-indigo-500 rounded-full animate-[spin_1.5s_linear_infinite]"></div>
                <Bot className="w-8 h-8 text-indigo-400 animate-pulse relative z-10" />
              </div>
              <div className="flex flex-col items-center gap-2">
                <p className="font-medium text-lg text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400 animate-pulse">
                  Analyzing Codebase...
                </p>
                <p className="text-sm text-slate-500 animate-pulse">
                  AI is reviewing logic, bugs, and optimizations
                </p>
              </div>
            </div>
          ) : result ? (
            <div ref={reportRef} className="animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out mt-4 text-slate-300">
              <Markdown
                rehypePlugins={[rehypeHighlight]}
                components={{
                  code({ node, inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || "");
                    return !inline && match ? (
                      <div className="rounded-xl overflow-hidden my-4 border border-slate-800 shadow-lg bg-[#0E1526]">
                        <code className={className} {...props}>
                          {children}
                        </code>
                      </div>
                    ) : (
                      <code
                        {...props}
                        className="bg-slate-800/60 text-indigo-300 px-1.5 py-0.5 rounded-md text-sm font-mono border border-slate-700/50"
                      >
                        {children}
                      </code>
                    );
                  },
                  pre({ children }) {
                    return (
                      <pre className="!bg-[#0B1120] !p-4 !m-0 overflow-x-auto">
                        {children}
                      </pre>
                    );
                  }
                }}
              >
                {result}
              </Markdown>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-4 p-8">
              <div className="relative">
                <div className="absolute inset-0 bg-cyan-500 blur-2xl opacity-10 rounded-full"></div>
                <div className="w-20 h-20 rounded-3xl bg-slate-800/50 flex items-center justify-center border border-slate-700/50 relative z-10 shadow-2xl">
                  <Sparkles className="w-10 h-10 text-cyan-500/50" />
                </div>
              </div>
              <p className="text-center max-w-sm mt-4 text-slate-500 text-sm sm:text-lg px-2">
                Enter your code and click{" "}
                <span className="text-indigo-400 font-medium">
                  Review Code
                </span>{" "}
                to get AI-powered insights, bug fixes, and optimization
                suggestions.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
