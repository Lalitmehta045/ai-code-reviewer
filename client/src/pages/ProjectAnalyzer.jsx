import { useState, useRef, useCallback } from "react";
import axios from "axios";
import Markdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";
import "highlight.js/styles/atom-one-dark.css";
import {
  Upload, Sparkles, Loader2, Bot, Copy, Check, Download,
  FileArchive, X, FolderTree, FileCode2, AlertCircle
} from "lucide-react";
import * as htmlToImage from "html-to-image";
import { jsPDF } from "jspdf";

export default function ProjectAnalyzer() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedResponse, setCopiedResponse] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [fileTree, setFileTree] = useState("");
  const [fileCount, setFileCount] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const reportRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith(".zip")) {
        setFile(droppedFile);
        setErrorMsg("");
      } else {
        setErrorMsg("Only ZIP files are allowed. Please zip your project folder first.");
      }
    }
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setErrorMsg("");
    }
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
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
      element.style.backgroundColor = "#0B1120";
      element.style.padding = "20px";

      const canvas = await htmlToImage.toCanvas(element, {
        backgroundColor: "#0B1120",
        pixelRatio: 2,
      });

      element.style.backgroundColor = originalBg;
      element.style.padding = "";

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      const pageHeight = pdf.internal.pageSize.getHeight();

      let heightLeft = pdfHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }

      pdf.save("Project-Interview-Guide.pdf");
    } catch (error) {
      console.error("Error generating PDF:", error);
      setErrorMsg("Failed to generate PDF. Please try again.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const downloadMarkdown = () => {
    const blob = new Blob([result], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Project-Interview-Guide.md";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleAnalyze = async () => {
    if (!file) return;
    try {
      setLoading(true);
      setErrorMsg("");
      setResult("");
      setFileTree("");
      setFileCount(0);

      const formData = new FormData();
      formData.append("projectFile", file);

      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/project/analyze`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          timeout: 120000,
        }
      );

      setResult(res.data.data);
      setFileTree(res.data.fileTree || "");
      setFileCount(res.data.fileCount || 0);
    } catch (error) {
      console.error("Analysis error:", error);
      setResult("");
      if (error.response?.status === 429) {
        setErrorMsg("Daily limit reached. Please come back tomorrow!");
      } else if (error.code === "ECONNABORTED") {
        setErrorMsg("Analysis timed out. Try a smaller project or fewer files.");
      } else {
        setErrorMsg(
          error.response?.data?.message || "Error analyzing project. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className="flex-1 p-3 sm:p-4 md:p-8 flex flex-col gap-4 sm:gap-6 max-w-[1400px] w-full mx-auto">
      {/* Upload Section */}
      <div className="rounded-3xl bg-slate-900/50 border border-slate-800 shadow-2xl backdrop-blur-sm overflow-hidden">
        <div className="px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-2 sm:gap-3 text-sm font-semibold text-slate-300">
            <div className="p-1.5 bg-violet-500/20 rounded-lg border border-violet-500/30">
              <FolderTree className="w-4 h-4 text-violet-400" />
            </div>
            <span>Project Analyzer</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <FileArchive className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Upload ZIP file (max 20MB)</span>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {/* Drag & Drop Zone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => !file && fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-2xl p-6 sm:p-10 text-center transition-all duration-300 cursor-pointer ${
              dragActive
                ? "border-violet-400 bg-violet-500/10 scale-[1.01]"
                : file
                ? "border-emerald-500/50 bg-emerald-500/5"
                : "border-slate-700 bg-slate-800/30 hover:border-violet-500/50 hover:bg-violet-500/5"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".zip"
              onChange={handleFileChange}
              className="hidden"
            />

            {file ? (
              <div className="flex flex-col items-center gap-3">
                <div className="p-3 bg-emerald-500/20 rounded-2xl border border-emerald-500/30">
                  <FileCode2 className="w-8 h-8 text-emerald-400" />
                </div>
                <div>
                  <p className="text-white font-medium text-base">{file.name}</p>
                  <p className="text-slate-400 text-sm mt-1">{formatFileSize(file.size)}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); removeFile(); }}
                  className="mt-1 text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 bg-rose-500/10 px-3 py-1.5 rounded-lg border border-rose-500/20 transition-colors"
                >
                  <X className="w-3.5 h-3.5" /> Remove
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                  <Upload className="w-8 h-8 text-violet-400" />
                </div>
                <div>
                  <p className="text-slate-300 font-medium">
                    Drag & drop your project ZIP file here
                  </p>
                  <p className="text-slate-500 text-sm mt-1">
                    or click to browse files
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2 mt-2">
                  {["React", "Node.js", "Python", "Java", "Any Project"].map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] px-2 py-1 bg-slate-800/80 text-slate-500 rounded-md border border-slate-700/50"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Analyze Button */}
          <button
            disabled={loading || !file}
            onClick={handleAnalyze}
            className={`w-full mt-4 relative overflow-hidden font-medium py-3.5 px-6 rounded-2xl transition-all duration-500 flex items-center justify-center gap-2 ${
              loading
                ? "bg-slate-800 text-violet-300 border border-violet-500/50 shadow-[0_0_30px_rgba(139,92,246,0.3)]"
                : "bg-violet-600 hover:bg-violet-500 text-white shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] active:scale-[0.98]"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading && (
              <div className="absolute inset-0 overflow-hidden rounded-2xl">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-violet-500/20 to-transparent -translate-x-[100%] animate-[shimmer_2s_infinite]"></div>
              </div>
            )}
            <div className="relative z-10 flex items-center gap-2">
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing Project... (this may take a minute)
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Analyze Project & Generate Interview Guide
                </>
              )}
            </div>
          </button>
        </div>
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 px-4 py-3 rounded-xl shadow-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="font-medium text-sm">{errorMsg}</span>
        </div>
      )}

      {/* Result Section */}
      {(loading || result) && (
        <div className="flex flex-col rounded-2xl sm:rounded-3xl bg-[#0B1120] border border-slate-800 shadow-2xl backdrop-blur-sm overflow-hidden">
          {/* Header */}
          <div className="px-4 sm:px-6 py-4 flex items-center justify-between border-b border-slate-800 bg-slate-900/80 sticky top-0 z-10 shadow-sm gap-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-300">
              <Bot className="w-4 h-4 text-violet-400" />
              <span className="hidden sm:inline">AI Project Analysis</span>
              {fileCount > 0 && (
                <span className="text-xs text-slate-500 ml-2">
                  ({fileCount} files analyzed)
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              {result && !loading && (
                <>
                  <button
                    onClick={downloadMarkdown}
                    title="Download Markdown"
                    className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 bg-slate-800/50 hover:bg-slate-700/50 px-2 sm:px-2.5 py-1.5 rounded-md border border-slate-700/50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">.md</span>
                  </button>
                  <button
                    onClick={downloadPDF}
                    disabled={isGeneratingPDF}
                    title="Download PDF"
                    className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 bg-slate-800/50 hover:bg-slate-700/50 px-2 sm:px-2.5 py-1.5 rounded-md border border-slate-700/50 disabled:opacity-50"
                  >
                    {isGeneratingPDF ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-400" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                    <span className="hidden sm:inline">
                      {isGeneratingPDF ? "Generating..." : "PDF"}
                    </span>
                  </button>
                  <button
                    onClick={copyResponse}
                    title="Copy Response"
                    className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 bg-slate-800/50 hover:bg-slate-700/50 px-2 sm:px-2.5 py-1.5 rounded-md border border-slate-700/50"
                  >
                    {copiedResponse ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span className="hidden sm:inline">
                      {copiedResponse ? "Copied!" : "Copy"}
                    </span>
                  </button>
                </>
              )}
              {loading && (
                <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse"></div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6 overflow-y-auto prose prose-invert prose-violet max-w-none text-slate-300 prose-pre:bg-[#0E1526] prose-pre:border prose-pre:border-slate-800 prose-pre:shadow-xl max-h-[70vh]">
            {loading ? (
              <div className="h-[400px] flex flex-col items-center justify-center space-y-8 animate-in fade-in duration-700">
                <div className="relative flex items-center justify-center w-32 h-32">
                  <div className="absolute inset-0 bg-violet-500/20 rounded-full blur-2xl animate-pulse"></div>
                  <div className="absolute inset-0 border-t-2 border-l-2 border-violet-400 rounded-full animate-spin"></div>
                  <div className="absolute inset-2 border-b-2 border-r-2 border-cyan-400 rounded-full animate-[spin_3s_linear_infinite_reverse]"></div>
                  <div className="absolute inset-4 border-t-2 border-violet-500 rounded-full animate-[spin_1.5s_linear_infinite]"></div>
                  <FolderTree className="w-8 h-8 text-violet-400 animate-pulse relative z-10" />
                </div>
                <div className="flex flex-col items-center gap-2">
                  <p className="font-medium text-lg text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400 animate-pulse">
                    Analyzing Your Project...
                  </p>
                  <p className="text-sm text-slate-500 animate-pulse text-center max-w-sm">
                    AI is scanning files, detecting technologies, generating interview Q&A
                  </p>
                </div>
              </div>
            ) : (
              <div
                ref={reportRef}
                className="animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out mt-2 text-slate-300"
              >
                <Markdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                  components={{
                    table({ children }) {
                      return (
                        <div className="overflow-x-auto my-4 rounded-xl border border-slate-700/60 shadow-lg">
                          <table className="w-full text-sm text-left">
                            {children}
                          </table>
                        </div>
                      );
                    },
                    thead({ children }) {
                      return (
                        <thead className="bg-violet-500/10 text-violet-300 text-xs uppercase tracking-wider border-b border-slate-700/60">
                          {children}
                        </thead>
                      );
                    },
                    th({ children }) {
                      return (
                        <th className="px-4 py-3 font-semibold whitespace-nowrap">
                          {children}
                        </th>
                      );
                    },
                    td({ children }) {
                      return (
                        <td className="px-4 py-3 border-t border-slate-800/60 text-slate-300">
                          {children}
                        </td>
                      );
                    },
                    blockquote({ children }) {
                      return (
                        <blockquote className="border-l-4 border-violet-500/50 bg-violet-500/5 rounded-r-xl px-5 py-4 my-4 text-slate-300 not-italic">
                          {children}
                        </blockquote>
                      );
                    },
                    hr() {
                      return (
                        <hr className="border-slate-700/40 my-8" />
                      );
                    },
                    h1({ children }) {
                      return (
                        <h1 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400 mt-6 mb-4 pb-2 border-b border-slate-700/40">
                          {children}
                        </h1>
                      );
                    },
                    h2({ children }) {
                      return (
                        <h2 className="text-xl sm:text-2xl font-bold text-white mt-8 mb-3 pb-2 border-b border-slate-800/60">
                          {children}
                        </h2>
                      );
                    },
                    h3({ children }) {
                      return (
                        <h3 className="text-lg font-semibold text-violet-300 mt-6 mb-2">
                          {children}
                        </h3>
                      );
                    },
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
                          className="bg-slate-800/60 text-violet-300 px-1.5 py-0.5 rounded-md text-sm font-mono border border-slate-700/50"
                        >
                          {children}
                        </code>
                      );
                    },
                    pre({ children }) {
                      return (
                        <pre className="!bg-[#0B1120] !p-4 !m-0 overflow-x-auto rounded-xl">
                          {children}
                        </pre>
                      );
                    },
                    li({ children }) {
                      return (
                        <li className="text-slate-300 leading-relaxed">
                          {children}
                        </li>
                      );
                    },
                    strong({ children }) {
                      return (
                        <strong className="text-white font-semibold">
                          {children}
                        </strong>
                      );
                    },
                  }}
                >
                  {result}
                </Markdown>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
