import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

export function Signup() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await api.post("/api/v1/signup", {
        username,
        email,
        password,
      });

      // Auto signin after signup
      const res = await api.post("/api/v1/signin", {
        username,
        password,
      });

      localStorage.setItem("accessToken", res.data.accessToken);
      localStorage.setItem("refreshToken", res.data.refreshToken);
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.message || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-60px)] flex items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-2xl">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-100">Create your account</h1>
          <p className="text-sm text-slate-400 mt-1">Get 50 free credits on signup</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <Label className="text-slate-300">Username</Label>
            <Input
              type="text"
              placeholder="johndoe"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="mt-1 bg-slate-950 border-slate-800 text-slate-100"
            />
          </div>

          <div>
            <Label className="text-slate-300">Email Address</Label>
            <Input
              type="email"
              placeholder="john@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 bg-slate-950 border-slate-800 text-slate-100"
            />
          </div>

          <div>
            <Label className="text-slate-300">Password</Label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 bg-slate-950 border-slate-800 text-slate-100"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold py-2 rounded-lg mt-2"
          >
            {loading ? "Creating account..." : "Sign Up & Get 50 Credits"}
          </Button>
        </form>

        <p className="text-xs text-center text-slate-400 mt-6">
          Already have an account?{" "}
          <Link to="/signup" className="text-amber-400 hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}