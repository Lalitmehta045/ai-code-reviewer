import { Link } from "react-router-dom";
import { Bot, Terminal, MessageCircle, Globe } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-800 bg-[#020617] pt-16 pb-8 relative overflow-hidden mt-auto">
      {/* Background Glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none -z-10"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-12">
          
          {/* Brand Column */}
          <div className="md:col-span-2 lg:col-span-1">
            <Link to="/" className="flex items-center gap-3 group mb-4">
              <div className="p-1.5 bg-indigo-500/20 rounded-xl border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                <Bot className="w-5 h-5 text-indigo-400 group-hover:text-indigo-300 transition-colors" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                AI Code Reviewer
              </span>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              Empowering developers with human-like AI code analysis. Catch bugs faster, optimize performance, and ship perfect code with confidence.
            </p>
            <div className="flex items-center gap-4">
              <a href="https://github.com" target="_blank" rel="noreferrer" className="text-slate-500 hover:text-indigo-400 transition-colors" aria-label="GitHub">
                <Terminal className="w-5 h-5" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noreferrer" className="text-slate-500 hover:text-cyan-400 transition-colors" aria-label="Twitter">
                <MessageCircle className="w-5 h-5" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="text-slate-500 hover:text-indigo-400 transition-colors" aria-label="LinkedIn">
                <Globe className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Product</h3>
            <ul className="space-y-3">
              <li><Link to="/#features" className="text-slate-400 hover:text-white transition-colors text-sm">Features</Link></li>
              <li><Link to="/#pricing" className="text-slate-400 hover:text-white transition-colors text-sm">Pricing</Link></li>
              <li><Link to="/dashboard" className="text-slate-400 hover:text-white transition-colors text-sm">Dashboard</Link></li>
              <li><Link to="/history" className="text-slate-400 hover:text-white transition-colors text-sm">Review History</Link></li>
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Resources</h3>
            <ul className="space-y-3">
              <li><a href="#" className="text-slate-400 hover:text-white transition-colors text-sm">Documentation</a></li>
              <li><a href="#" className="text-slate-400 hover:text-white transition-colors text-sm">API Reference</a></li>
              <li><a href="#" className="text-slate-400 hover:text-white transition-colors text-sm">Blog</a></li>
              <li><a href="#" className="text-slate-400 hover:text-white transition-colors text-sm">Community</a></li>
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Company</h3>
            <ul className="space-y-3">
              <li><a href="#" className="text-slate-400 hover:text-white transition-colors text-sm">About Us</a></li>
              <li><a href="#" className="text-slate-400 hover:text-white transition-colors text-sm">Careers</a></li>
              <li><a href="#" className="text-slate-400 hover:text-white transition-colors text-sm">Privacy Policy</a></li>
              <li><a href="#" className="text-slate-400 hover:text-white transition-colors text-sm">Terms of Service</a></li>
            </ul>
          </div>

        </div>

        {/* Bottom Banner */}
        <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-sm">
            &copy; {currentYear} AI Code Reviewer. All rights reserved.
          </p>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span>Built with <span className="text-rose-500">❤️</span> for developers</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
