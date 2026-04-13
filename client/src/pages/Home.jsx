import { Link, Navigate } from "react-router-dom";
import { ArrowRight, Play, Zap, Shield, Code2, Sparkles, Bot } from "lucide-react";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export default function Home() {
  const { user } = useContext(AuthContext);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="relative min-h-[calc(100vh-76px)] flex flex-col items-center justify-center overflow-hidden bg-[#020617] text-white">
      {/* Background Gradients */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/30 rounded-full blur-[128px] -z-10 mix-blend-screen pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-600/20 rounded-full blur-[128px] -z-10 mix-blend-screen pointer-events-none"></div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative z-10 py-12 md:py-20 lg:py-24">
        
        {/* Trust Badges */}
        <div className="flex flex-wrap justify-center gap-3 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/50 border border-slate-800 text-xs sm:text-sm font-medium text-slate-300 backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            AI Powered
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/50 border border-slate-800 text-xs sm:text-sm font-medium text-slate-300 backdrop-blur-sm">
            <Code2 className="w-4 h-4 text-indigo-400" />
            Built for Developers
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/50 border border-slate-800 text-xs sm:text-sm font-medium text-slate-300 backdrop-blur-sm">
            <Zap className="w-4 h-4 text-amber-400" />
            Fast & Accurate
          </div>
        </div>

        {/* Hero Content */}
        <div className="text-center max-w-4xl mx-auto space-y-8 flex flex-col items-center">
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight text-white mb-2 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
            Ship Perfect Code <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-500">
              10x Faster with AI
            </span>
          </h1>
          
          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
            Automate your code reviews with human-like precision. Catch bugs, optimize performance, and enforce best practices instantly before you merge.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300 w-full sm:w-auto">
            <Link 
              to="/signup" 
              className="w-full sm:w-auto px-8 py-3.5 sm:py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-semibold text-lg shadow-[0_0_30px_rgba(79,70,229,0.4)] hover:shadow-[0_0_40px_rgba(79,70,229,0.6)] transition-all flex items-center justify-center gap-2 group"
            >
              Try Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <button className="w-full sm:w-auto px-8 py-3.5 sm:py-4 rounded-xl bg-slate-800/50 hover:bg-slate-800 text-white border border-slate-700 font-semibold text-lg transition-all flex items-center justify-center gap-2 backdrop-blur-sm group">
              <Play className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" fill="currentColor" />
              View Demo
            </button>
          </div>
        </div>

        {/* UI Preview Graphic */}
        <div className="mt-16 sm:mt-24 relative max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500">
          <div className="absolute inset-x-0 bottom-0 top-1/2 bg-gradient-to-t from-[#020617] via-[#020617]/50 to-transparent z-20 pointer-events-none"></div>
          <div className="bg-slate-900/40 border border-slate-700/50 rounded-2xl shadow-2xl relative overflow-hidden backdrop-blur-xl">
            
            {/* Browser/Editor Header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800/50 bg-slate-950/50">
              <div className="flex gap-1.5 flex-shrink-0">
                <div className="w-3 h-3 rounded-full bg-rose-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
              </div>
              <div className="mx-auto flex items-center gap-2 bg-slate-900/80 rounded-md px-3 py-1 font-mono text-xs text-slate-400 border border-slate-800/50">
                <Shield className="w-3 h-3 text-indigo-400" />
                review-pull-request.ts
              </div>
            </div>

            {/* Editor Body */}
            <div className="grid grid-cols-1 md:grid-cols-2 min-h-[300px] sm:min-h-[400px] font-mono text-sm">
              <div className="p-4 sm:p-6 border-b md:border-b-0 md:border-r border-slate-800/50 text-slate-300">
                <div className="flex items-center gap-4 text-slate-500 mb-2 select-none">
                  <span className="w-4 text-right">1</span>
                  <span className="text-pink-400">function</span> <span className="text-cyan-300">calculateTotal</span>(items) {'{'}
                </div>
                <div className="flex items-center gap-4 text-slate-500 mb-2 select-none">
                  <span className="w-4 text-right">2</span>
                  <span className="ml-4 text-slate-400"><span className="text-pink-400">let</span> total = <span className="text-amber-400">0</span>;</span>
                </div>
                <div className="flex items-center gap-4 text-slate-500 mb-2 select-none bg-rose-500/10 border-l-2 border-rose-500 -ml-4 sm:-ml-6 pl-4 sm:pl-6 pr-2">
                  <span className="w-4 text-right">3</span>
                  <span className="ml-4 text-slate-300">items.<span className="text-cyan-300">forEach</span>(i =&gt; total += i.price);</span>
                </div>
                <div className="flex items-center gap-4 text-slate-500 mb-2 select-none">
                  <span className="w-4 text-right">4</span>
                  <span className="ml-4 text-pink-400">return</span> <span className="text-slate-400">total;</span>
                </div>
                <div className="flex items-center gap-4 text-slate-500 select-none">
                  <span className="w-4 text-right">5</span>
                  <span className="text-slate-400">{'}'}</span>
                </div>
              </div>
              
              <div className="p-4 sm:p-6 bg-[#0B1120]/50 flex flex-col gap-4">
                 <div className="flex items-start gap-3 bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-xl shadow-lg relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-2">
                      <Sparkles className="w-4 h-4 text-indigo-400/30" />
                   </div>
                   <div className="mt-0.5 flex-shrink-0 bg-indigo-500/20 p-1.5 rounded-lg border border-indigo-500/20">
                     <Bot className="w-4 h-4 text-indigo-400" />
                   </div>
                   <div>
                     <p className="text-indigo-200 font-sans text-sm mb-1.5 font-semibold">Performance Optimization</p>
                     <p className="text-slate-400 text-xs font-sans leading-relaxed pr-4">
                       Using <code className="bg-slate-900/80 border border-slate-800 px-1 py-0.5 rounded text-indigo-300 font-mono text-[11px]">.reduce()</code> is more idiomatic and performant for aggregating array values in JavaScript instead of mutating a variable with <code className="bg-slate-900/80 border border-slate-800 px-1 py-0.5 rounded text-indigo-300 font-mono text-[11px]">forEach</code>.
                     </p>
                     <div className="mt-3 bg-[#020617] border border-slate-700/50 rounded-lg p-3 text-xs shadow-inner">
                        <p className="text-emerald-400"><span className="text-pink-400">return</span> items.<span className="text-cyan-300">reduce</span>((sum, i) =&gt; sum + i.price, <span className="text-amber-400">0</span>);</p>
                     </div>
                   </div>
                 </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
