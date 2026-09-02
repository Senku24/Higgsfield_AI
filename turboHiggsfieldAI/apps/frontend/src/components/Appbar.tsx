import { useNavigate, Link } from "react-router";
import { Button } from "./ui/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

export function Appbar() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

  const { data: user } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const currentToken = localStorage.getItem("accessToken");
      if (!currentToken) return null;
      const res = await api.get("/api/v1/me");
      return res.data;
    },
    enabled: !!token,
    staleTime: 5000,
  });

  const handleLogout = async () => {
    try {
      await api.post("/api/v1/logout", {
        refreshToken: localStorage.getItem("refreshToken"),
      });
    } catch {}
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    queryClient.clear();
    navigate("/signin");
  };

  const isLoggedIn = !!token && !!user;

  return (
    <div className="bg-slate-950 border-b border-slate-800 text-slate-100 flex justify-between items-center px-6 py-3">
      <div className="flex items-center gap-6">
        <Link to="/" className="font-bold text-xl tracking-tight text-amber-400">
          Higgsfield AI
        </Link>
        {isLoggedIn && (
          <nav className="flex gap-4 text-sm font-medium">
            <Link to="/dashboard" className="hover:text-amber-400 transition-colors">
              Avatars
            </Link>
            <Link to="/video-creator" className="hover:text-amber-400 transition-colors">
              Video Studio
            </Link>
          </nav>
        )}
      </div>

      <div className="flex items-center gap-3">
        {isLoggedIn ? (
          <>
            <div className="bg-amber-400/10 border border-amber-400/30 text-amber-400 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5">
              <span>⚡</span>
              <span>{user.creditBalance ?? 0} Credits</span>
            </div>
            <span className="text-xs text-slate-400 font-mono hidden sm:inline">
              {user.username}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="text-xs border-slate-700 hover:bg-slate-800 text-slate-300"
              onClick={handleLogout}
            >
              Log out
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-300 hover:text-white"
              onClick={() => navigate("/signin")}
            >
              Sign In
            </Button>
            <Button
              size="sm"
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-medium"
              onClick={() => navigate("/signup")}
            >
              Sign Up
            </Button>
          </>
        )}
      </div>
    </div>
  );
}