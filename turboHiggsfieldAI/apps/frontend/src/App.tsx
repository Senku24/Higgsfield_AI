import "./index.css";
import { BrowserRouter, Route, Routes, Navigate } from "react-router";
import { Appbar } from "./components/Appbar";
import { Signin } from "./pages/Signin";
import { Signup } from "./pages/Signup";
import { Dashboard } from "./pages/Dashboard";
import { VideoCreator } from "./pages/VideoCreator";
import { LandingPage } from "./pages/Landing";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem("accessToken");
  if (!token) {
    return <Navigate to="/signin" replace />;
  }
  return <>{children}</>;
}

export function App() {
  return (
    <div className="min-h-screen bg-slate-950">
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Appbar />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/signin" element={<Signin />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/video-creator"
              element={
                <ProtectedRoute>
                  <VideoCreator />
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </div>
  );
}

export default App;
