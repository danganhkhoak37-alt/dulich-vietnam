import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Suggestions from './pages/Suggestions';
import Guide from './pages/Guide';
import Community from './pages/Community';
import Profile from './pages/Profile';
import News from './pages/News';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-bg-cream flex flex-col font-sans">
        
        <Navbar />

        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/suggestions" element={<Suggestions />} />
            <Route path="/guide" element={<Guide />} />
            <Route path="/community" element={<Community />} />
            <Route path="/news" element={<News />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </Router>
  );
}

export default App;