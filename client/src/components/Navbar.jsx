import { Link } from "react-router-dom";
import { Bot, LogOut, History, Code2 } from "lucide-react";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);

  return (
    <header className="px-4 sm:px-8 py-4 sm:py-6 border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50 flex items-center justify-between gap-2">
      <Link to="/" className="flex items-center gap-2 sm:gap-3 group flex-shrink-0">
        <div className="p-1.5 sm:p-2 bg-indigo-500/20 rounded-xl border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)] group-hover:scale-105 transition-transform">
          <Bot className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400 group-hover:text-indigo-300" />
        </div>
        <div>
          <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            AI Code Reviewer
          </h1>
          <p className="hidden sm:block text-[10px] uppercase font-bold tracking-widest text-indigo-300/50 mt-0.5">
            SaaS Edition
          </p>
        </div>
      </Link>

      <div className="flex items-center gap-3 sm:gap-6 text-sm font-medium flex-shrink-0">
        {user ? (
          <>
            <span className="text-slate-400 mr-2 hidden md:inline">Welcome, <span className="text-white">{user.name}</span></span>
            <Link to="/dashboard" className="text-slate-300 hover:text-white transition flex items-center gap-2" title="Dashboard">
              <Code2 className="w-4 h-4 text-cyan-400" /> <span className="hidden sm:inline">Dashboard</span>
            </Link>
            <Link to="/history" className="text-slate-300 hover:text-white transition flex items-center gap-2" title="History">
              <History className="w-4 h-4 text-emerald-400" /> <span className="hidden sm:inline">History</span>
            </Link>
            <button 
               onClick={logout} 
               className="bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 px-3 sm:px-4 py-2 rounded-lg transition-colors flex items-center gap-2 border border-rose-500/20 ml-1 sm:ml-2"
               title="Logout"
            >
              <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">Logout</span>
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="text-slate-300 hover:text-white transition hidden sm:block">Login</Link>
            <Link to="/login" className="text-slate-300 hover:text-white transition sm:hidden" title="Login"><LogOut className="w-4 h-4"/></Link>
            <Link to="/signup" className="flex-shrink-0 bg-indigo-600 hover:bg-indigo-500 text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg transition-colors shadow-lg shadow-indigo-500/30 whitespace-nowrap">
              Sign Up
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
