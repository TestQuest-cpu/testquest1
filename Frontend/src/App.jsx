import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { AdminRoute } from "./components/Routes.jsx";
import LandingPage from "./LandingPage.jsx";
import Login from "./Login.jsx";
import Dashboard from "./Dashboard.jsx";
import TesterDashboard from "./TesterDashboard.jsx";
import DeveloperDashboard from "./DeveloperDashboard.jsx";
import Post from "./Post.jsx";
import Profile from "./Profile.jsx";
import BugReport from "./BugReport.jsx";
import ProjectView from "./ProjectView.jsx";
import TesterProjectView from "./TesterProjectView.jsx";
import Logs from "./Logs.jsx";
import AdminLogin from "./AdminLogin.jsx";
import AdminDashboard from "./AdminDashboard.jsx";
import ModeratorApp from "./ModeratorApp.jsx";
import ModeratorExam from "./ModeratorExam.jsx";
import ModeratorSetup from "./ModeratorSetup.jsx";
import Leaderboards from "./Leaderboards.jsx";
import './index.css';

function App() {
  const navigate = useNavigate();
  const [dashboardRefresh, setDashboardRefresh] = useState(0);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);

    // Check for OAuth callback parameters
    const urlToken = urlParams.get('token');
    const urlUserData = urlParams.get('user');

    if (urlToken && urlUserData) {
      try {
        const user = JSON.parse(decodeURIComponent(urlUserData));

        // Store token and user data
        localStorage.setItem('token', urlToken);
        localStorage.setItem('user', JSON.stringify(user));

        // Clear URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);

        // Navigate based on account type
        if (user.accountType === 'tester') {
          navigate('/tester/dashboard', { replace: true });
        } else if (user.accountType === 'developer') {
          navigate('/developer/dashboard', { replace: true });
        } else {
          // Default to tester dashboard if account type is missing
          navigate('/tester/dashboard', { replace: true });
        }
        return;
      } catch (error) {
        console.error('OAuth login failed:', error);
        navigate('/login', { replace: true });
        return;
      }
    }
  }, [navigate]);

  const handleLoginAsTester = () => {
    sessionStorage.removeItem('inModeratorMode');
    navigate('/tester/dashboard');
  };

  const handleLoginAsDeveloper = () => {
    sessionStorage.removeItem('inModeratorMode');
    navigate('/developer/dashboard');
  };

  const handlePostProject = () => {
    navigate('/developer/post');
  };

  const handleBackToDashboard = () => {
    // Clear moderator mode when going back to regular dashboard
    sessionStorage.removeItem('inModeratorMode');

    // Check user account type to determine which dashboard to return to
    try {
      const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
      if (user.accountType === 'developer') {
        navigate('/developer/dashboard');
      } else if (user.accountType === 'tester') {
        navigate('/tester/dashboard');
      } else {
        // If account type is unclear, redirect to login for security
        navigate('/login');
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
      // If account type is unclear, redirect to login for security
      navigate('/login');
    }
    setDashboardRefresh(prev => prev + 1); // Trigger refresh
  };

  const handleProfile = () => {
    navigate('/profile');
  };

  const handleLogout = () => {
    // Clear all session data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');

    navigate('/login');
  };

  const handleAdminLogin = () => {
    navigate('/admin/dashboard');
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/login');
  };

  const handleProjectClick = (project) => {
    // Check user type to determine which project view to show
    const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');

    if (user.accountType === 'developer') {
      // If project is an object (from developer dashboard), show project view
      if (typeof project === 'object' && project._id) {
        setSelectedProject(project);
        navigate(`/developer/project/${project._id}`);
      }
    } else if (user.accountType === 'tester') {
      // For testers, we need to fetch the full project data and show tester project view
      if (typeof project === 'string') {
        // If it's just an ID, set it for the tester project view
        setSelectedProjectId(project);
        navigate(`/tester/project/${project}`);
      } else if (typeof project === 'object' && project._id) {
        setSelectedProject(project);
        navigate(`/tester/project/${project._id}`);
      }
    }
  };

  const handleCategorize = () => {
    // Handle categorize button click
    console.log('Categorize clicked');
    // navigate('/categorize'); // When you create this screen
  };

  const handleLogs = () => {
    navigate('/logs');
  };

  const handleLeaderboards = () => {
    navigate('/leaderboards');
  };

  const handleLeaderboardsBack = () => {
    // Navigate back to the appropriate dashboard based on user type
    try {
      const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
      if (user.accountType === 'developer') {
        navigate('/developer/dashboard');
      } else if (user.accountType === 'tester') {
        navigate('/tester/dashboard');
      } else {
        navigate('/login');
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
      navigate('/login');
    }
  };

  const handleModeratorAccess = () => {
    sessionStorage.setItem('inModeratorMode', 'true');
    navigate('/moderator');
  };

  return (
    <Routes>
      {/* Landing Page */}
      <Route path="/" element={<LandingPage onGetStarted={() => navigate('/login')} />} />

      {/* Login */}
      <Route
        path="/login"
        element={
          <Login
            onLoginAsTester={handleLoginAsTester}
            onLoginAsDeveloper={handleLoginAsDeveloper}
            onModeratorAccess={handleModeratorAccess}
          />
        }
      />

      {/* Admin Routes */}
      <Route path="/admin/login" element={<AdminLogin onAdminLogin={handleAdminLogin} />} />
      <Route
        path="/admin/dashboard"
        element={
          <AdminRoute>
            <AdminDashboard onLogout={handleAdminLogout} />
          </AdminRoute>
        }
      />

      {/* Temporary: Other routes will be added in subsequent parts */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;