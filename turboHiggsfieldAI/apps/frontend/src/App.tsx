import "./index.css";
import { BrowserRouter, Route, Routes } from "react-router";
import { Appbar } from "./components/Appbar";
import { Signin } from "./pages/Signin";
import { Signup } from "./pages/Signup";
import { Dashboard } from "./pages/Dashboard";
import { VideoCreator } from "./pages/VideoCreator";
import { LandingPage } from "./pages/Landing";

export function App() {
  return (
    <div>
      <Appbar />
      <BrowserRouter>
        <Routes>
          <Route path= "/" element= {<LandingPage />}/>
          <Route path= "/signup" element= {<Signup />}/>
          <Route path= "/signin" element= {<Signin />}/>
          <Route path= "/dashboard" element= {<Dashboard />}/>
          <Route path= "/video-creator" element= {<VideoCreator />}/>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;


