import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { AdminRoute, TesterRoute, DeveloperRoute, ProtectedRoute } from "./components/Routes.jsx";
import { ProjectViewWrapper, TesterProjectViewWrapper, BugReportWrapper } from "./components/ProjectViewWrapper.jsx";
import LandingPage from "./LandingPage.jsx";
import Login from "./Login.jsx";
import Dashboard from "./Dashboard.jsx";
import TesterDashboard from "./TesterDashboard.jsx";
import DeveloperDashboard from "./DeveloperDashboard.jsx";
import Post from "./Post.jsx";
import Profile from "./Profile.jsx";
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
        navigate(`/developer/project/${project._id}`);
      }
    } else if (user.accountType === 'tester') {
      // For testers, navigate to project view with projectId in URL
      const projectId = typeof project === 'string' ? project : project._id;
      navigate(`/tester/project/${projectId}`);
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

      {/* Tester Dashboard Routes */}
      <Route
        path="/tester/dashboard"
        element={
          <TesterRoute>
            <TesterDashboard
              onProjectClick={handleProjectClick}
              onCategorize={handleCategorize}
              onProfile={() => navigate('/tester/profile')}
              onLeaderboards={handleLeaderboards}
            />
          </TesterRoute>
        }
      />

      {/* Developer Dashboard Routes */}
      <Route
        path="/developer/dashboard"
        element={
          <DeveloperRoute>
            <DeveloperDashboard
              onPost={handlePostProject}
              onProjectClick={handleProjectClick}
              onProfile={() => navigate('/developer/profile')}
              onLeaderboards={handleLeaderboards}
            />
          </DeveloperRoute>
        }
      />

      {/* Developer Post Project */}
      <Route
        path="/developer/post"
        element={
          <DeveloperRoute>
            <Post onBack={handleBackToDashboard} onProfile={handleProfile} />
          </DeveloperRoute>
        }
      />

      {/* Profile Routes */}
      <Route
        path="/developer/profile"
        element={
          <DeveloperRoute>
            <Profile
              onBack={handleBackToDashboard}
              onLogout={handleLogout}
              onLeaderboards={handleLeaderboards}
              onModeratorExam={() => navigate('/moderator/exam')}
              onModeratorSetup={() => navigate('/moderator/setup')}
            />
          </DeveloperRoute>
        }
      />
      <Route
        path="/tester/profile"
        element={
          <TesterRoute>
            <Profile
              onBack={() => navigate('/tester/dashboard')}
              onLogout={handleLogout}
              onLeaderboards={handleLeaderboards}
              onModeratorExam={() => navigate('/moderator/exam')}
              onModeratorSetup={() => navigate('/moderator/setup')}
            />
          </TesterRoute>
        }
      />

      {/* Project View Routes */}
      <Route
        path="/developer/project/:projectId"
        element={
          <DeveloperRoute>
            <ProjectViewWrapper
              onBack={() => navigate('/developer/dashboard')}
            />
          </DeveloperRoute>
        }
      />
      <Route
        path="/tester/project/:projectId"
        element={
          <TesterRoute>
            <TesterProjectViewWrapper
              onBack={() => navigate('/tester/dashboard')}
              onLeaderboards={handleLeaderboards}
              onProfile={() => navigate('/tester/profile')}
              onBugReport={(projectId) => navigate(`/tester/bug-report/${projectId}`)}
            />
          </TesterRoute>
        }
      />

      {/* Bug Report Route */}
      <Route
        path="/tester/bug-report/:projectId"
        element={
          <TesterRoute>
            <BugReportWrapper
              onBack={() => navigate(-1)}
              onProfile={() => navigate('/tester/profile')}
              onLeaderboards={handleLeaderboards}
            />
          </TesterRoute>
        }
      />

      {/* Leaderboards Route */}
      <Route
        path="/leaderboards"
        element={
          <ProtectedRoute>
            <Leaderboards
              onBack={handleLeaderboardsBack}
              onProfile={() => {
                try {
                  const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
                  if (user.accountType === 'tester') {
                    navigate('/tester/profile');
                  } else {
                    navigate('/developer/profile');
                  }
                } catch (error) {
                  navigate('/developer/profile');
                }
              }}
            />
          </ProtectedRoute>
        }
      />

      {/* Logs Route */}
      <Route
        path="/logs"
        element={
          <ProtectedRoute>
            <Logs onBack={handleBackToDashboard} />
          </ProtectedRoute>
        }
      />

      {/* Moderator Routes */}
      <Route
        path="/moderator/exam"
        element={
          <ProtectedRoute>
            <ModeratorExam
              onBack={() => {
                const userData = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
                if (userData.accountType === 'tester') {
                  navigate('/tester/profile');
                } else {
                  navigate('/developer/profile');
                }
              }}
              onComplete={(score) => {
                const userData = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
                if (userData.accountType === 'tester') {
                  navigate('/tester/profile');
                } else {
                  navigate('/developer/profile');
                }
              }}
            />
          </ProtectedRoute>
        }
      />
      <Route
        path="/moderator/setup"
        element={
          <ProtectedRoute>
            <ModeratorSetup
              onBack={() => {
                const userData = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
                if (userData.accountType === 'tester') {
                  navigate('/tester/profile');
                } else {
                  navigate('/developer/profile');
                }
              }}
              onComplete={() => navigate('/moderator')}
            />
          </ProtectedRoute>
        }
      />
      <Route
        path="/moderator"
        element={
          <ModeratorRoute>
            <ModeratorApp />
          </ModeratorRoute>
        }
      />

      {/* Fallback - redirect to landing */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;