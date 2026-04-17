import { useState } from "react";
import { Loader2 } from "lucide-react";

const getGoogleAuthUrl = () => {
  const apiBaseUrl = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");
  return `${apiBaseUrl}/auth/google`;
};

export default function GoogleOAuthButton({ disabled = false, label = "Continue with Google" }) {
  const [redirecting, setRedirecting] = useState(false);

  const handleGoogleLogin = () => {
    setRedirecting(true);
    window.location.assign(getGoogleAuthUrl());
  };

  return (
    <button
      type="button"
      disabled={disabled || redirecting}
      onClick={handleGoogleLogin}
      className="w-full bg-white text-slate-900 hover:bg-slate-100 font-medium py-3.5 rounded-xl transition-colors border border-white/80 shadow-lg flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {redirecting ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          Redirecting...
        </>
      ) : (
        <>
          <span aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12 10.2v3.9h5.4c-.2 1.3-1.6 3.9-5.4 3.9-3.2 0-5.9-2.7-5.9-6s2.7-6 5.9-6c1.8 0 3 .8 3.7 1.5l2.6-2.5C16.7 3.5 14.6 2.6 12 2.6 6.9 2.6 2.8 6.8 2.8 12s4.1 9.4 9.2 9.4c5.3 0 8.8-3.7 8.8-8.9 0-.6-.1-1.1-.2-1.6z" />
              <path fill="#34A853" d="M3.9 7.7l3.2 2.4c.9-1.8 2.7-3 4.9-3 1.8 0 3 .8 3.7 1.5l2.6-2.5C16.7 3.5 14.6 2.6 12 2.6 8.4 2.6 5.2 4.7 3.9 7.7z" />
              <path fill="#4A90E2" d="M12 21.4c2.5 0 4.7-.8 6.3-2.3l-2.9-2.4c-.8.5-1.9.9-3.4.9-3.7 0-5.1-2.5-5.4-3.8l-3.3 2.5c1.3 3 4.5 5.1 8.7 5.1z" />
              <path fill="#FBBC05" d="M6.6 13.8c-.1-.5-.2-1.1-.2-1.8s.1-1.2.2-1.8L3.3 7.7C2.8 8.9 2.6 10.4 2.6 12s.2 3.1.7 4.3z" />
            </svg>
          </span>
          {label}
        </>
      )}
    </button>
  );
}
