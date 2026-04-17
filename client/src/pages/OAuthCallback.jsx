import { useContext, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { Bot, Loader2 } from "lucide-react";

const getErrorMessage = (errorCode) => {
  switch (errorCode) {
    case "google_auth_failed":
      return "Google authentication failed. Please try again.";
    default:
      return "Unable to complete Google sign-in. Please try again.";
  }
};

export default function OAuthCallback() {
  const handledRef = useRef(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const token = searchParams.get("token");
  const errorCode = searchParams.get("error");

  useEffect(() => {
    if (handledRef.current) {
      return;
    }
    handledRef.current = true;

    if (errorCode || !token) {
      return;
    }

    login({ token });
    navigate("/dashboard", { replace: true });
  }, [errorCode, login, navigate, token]);

  const hasError = Boolean(errorCode || !token);
  const errorMessage = getErrorMessage(errorCode);

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-slate-900/50 p-8 rounded-3xl border border-slate-800 shadow-2xl backdrop-blur-xl text-center">
        <div className="flex flex-col items-center mb-6">
          <div className="p-3 bg-indigo-500/20 rounded-2xl border border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.2)] mb-4">
            <Bot className="w-8 h-8 text-indigo-400" />
          </div>
          <h2 className="text-2xl font-bold text-white">
            {hasError ? "Google Sign-in Failed" : "Completing Sign-in"}
          </h2>
        </div>

        {hasError ? (
          <>
            <p className="text-slate-300 mb-6">{errorMessage}</p>
            <Link
              to="/login"
              className="inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-5 py-3 rounded-xl transition-colors"
            >
              Back to Login
            </Link>
          </>
        ) : (
          <div className="flex items-center justify-center gap-2 text-slate-300">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
            Redirecting to dashboard...
          </div>
        )}
      </div>
    </div>
  );
}
