import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import Breathe from './pages/Breathe';
import MoodTracker from './pages/MoodTracker';
import AISupport from './pages/AISupport';
import Journal from './pages/Journal';
import Resources from './pages/Resources';
import Appointment from './pages/Appointment';
import MentalHome from './pages/MentalHome';
import MentalReport from './pages/MentalReport';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import About from './pages/About';
import FAQ from './pages/FAQ';
import Policy from './pages/Policy';
import Terms from './pages/Terms';
import AuthPage from './pages/AuthPage';
import GlobalAuthModal from './components/GlobalAuthModal';
import './App.css';

function App() {
  return (
    <Router>
      {/* Global Glassmorphic Login/Register popup triggers automatically if unauthorized */}
      <GlobalAuthModal />
      
      <Routes>
        <Route path="/" element={<LandingPage />} />
        
        {/* Dedicated Auth Routes */}
        <Route path="/login" element={<AuthPage />} />
        <Route path="/signup" element={<AuthPage />} />
        <Route path="/forgot-password" element={<AuthPage />} />
        <Route path="/auth" element={<AuthPage />} />

        {/* Dashboard & Workspace Routes */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/breathe" element={<Breathe />} />
        <Route path="/mood" element={<MoodTracker />} />
        <Route path="/ai-support" element={<AISupport />} />
        <Route path="/journal" element={<Journal />} />
        <Route path="/resources" element={<Resources />} />
        <Route path="/appointment" element={<Appointment />} />
        <Route path="/mental-home" element={<MentalHome />} />
        <Route path="/mental-report" element={<MentalReport />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
        
        {/* Information Routes */}
        <Route path="/about" element={<About />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/policy" element={<Policy />} />
        <Route path="/terms" element={<Terms />} />
        
        {/* Wildcard Fallback */}
        <Route path="*" element={<div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',color:'#fff',fontFamily:"'DM Sans',sans-serif",flexDirection:'column',gap:'16px'}}><div style={{fontSize:'48px'}}>🌿</div><h2>Page not found</h2><a href="/" style={{color:'var(--sage2)'}}>Go home</a></div>} />
      </Routes>
    </Router>
  );
}

export default App;
