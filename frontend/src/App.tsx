import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import About from "./pages/About";
import Puzzle from "./pages/Puzzle";

const App: React.FC = () => (
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/about" element={<About />} />
    <Route path="/puzzle" element={<Puzzle />} />
  </Routes>
);

export default App;
