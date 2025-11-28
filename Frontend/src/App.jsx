import React, { useState, useEffect } from "react";
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
  const [currentScreen, setCurrentScreen] = useState('landing');
  const [dashboardRefresh, setDashboardRefresh] = useState(0);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [isModeratorMode, setIsModeratorMode] = useState(false);


  useEffect(() => {
    const urlPath = window.location.pathname;
    const urlParams = new URLSearchParams(window.location.search);

    // Check if accessing admin routes
    if (urlPath === '/admin' || urlParams.get('admin') === 'true') {
      setIsAdminMode(true);
      setCurrentScreen('adminLogin');
      return;
    }

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
          setCurrentScreen('testerDashboard');
        } else if (user.accountType === 'developer') {
          setCurrentScreen('developerDashboard');
        } else {
          // Default to tester dashboard if account type is missing
          setCurrentScreen('testerDashboard');
        }
        return;
      } catch (error) {
        console.error('OAuth login failed:', error);
        setCurrentScreen('login');
        return;
      }
    }

    // Check for moderator session FIRST (before regular user)
    const moderatorToken = localStorage.getItem('moderatorToken');
    const moderatorInfo = localStorage.getItem('moderatorInfo');
    const inModeratorMode = sessionStorage.getItem('inModeratorMode') === 'true';

    // Only stay in moderator mode if BOTH the flag is set AND we have valid moderator credentials
    if (inModeratorMode && moderatorToken && moderatorInfo) {
      setIsModeratorMode(true);
      setCurrentScreen('moderator');
      return;
    }

    // If inModeratorMode is set but no valid moderator credentials, clear the flag
    if (inModeratorMode && (!moderatorToken || !moderatorInfo)) {
      sessionStorage.removeItem('inModeratorMode');
    }

    // Check if user is already authenticated
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const user = localStorage.getItem('user') || sessionStorage.getItem('user');

    if (token && user) {
      try {
        const userData = JSON.parse(user);
        setIsModeratorMode(false);

        if (userData.accountType === 'developer') {
          setCurrentScreen('developerDashboard');
        } else if (userData.accountType === 'tester') {
          setCurrentScreen('testerDashboard');
        } else {
          setCurrentScreen('login');
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
        setCurrentScreen('login');
      }
    } else {
      setCurrentScreen('landing');
    }
  }, []);

  const handleLoginAsTester = () => {
    sessionStorage.removeItem('inModeratorMode');
    setIsModeratorMode(false);
    setCurrentScreen('testerDashboard');
  };

  const handleLoginAsDeveloper = () => {
    sessionStorage.removeItem('inModeratorMode');
    setIsModeratorMode(false);
    setCurrentScreen('developerDashboard');
  };

  const handlePostProject = () => {
    setCurrentScreen('post');
  };

  const handleBackToDashboard = () => {
    // Clear moderator mode when going back to regular dashboard
    sessionStorage.removeItem('inModeratorMode');
    setIsModeratorMode(false);

    // Check user account type to determine which dashboard to return to
    try {
      const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
      if (user.accountType === 'developer') {
        setCurrentScreen('developerDashboard');
      } else if (user.accountType === 'tester') {
        setCurrentScreen('testerDashboard');
      } else {
        // If account type is unclear, redirect to login for security
        setCurrentScreen('login');
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
      // If account type is unclear, redirect to login for security
      setCurrentScreen('login');
    }
    setDashboardRefresh(prev => prev + 1); // Trigger refresh
  };

  const handleProfile = () => {
    setCurrentScreen('profile');
  };

  const handleLogout = () => {
    // Clear all session data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    
    setCurrentScreen('login');
  };

  const handleAdminLogin = () => {
    setCurrentScreen('adminDashboard');
  };

  const handleAdminLogout = () => {
    setIsAdminMode(false);
    setCurrentScreen('login');
    // Clear URL parameters
    window.history.replaceState({}, document.title, '/');
  };

  const handleProjectClick = (project) => {
    // Check user type to determine which project view to show
    const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');

    if (user.accountType === 'developer') {
      // If project is an object (from developer dashboard), show project view
      if (typeof project === 'object' && project._id) {
        setSelectedProject(project);
        setCurrentScreen('projectView');
      }
    } else if (user.accountType === 'tester') {
      // For testers, we need to fetch the full project data and show tester project view
      if (typeof project === 'string') {
        // If it's just an ID, set it for the tester project view
        setSelectedProjectId(project);
        setCurrentScreen('testerProjectView');
      } else if (typeof project === 'object' && project._id) {
        setSelectedProject(project);
        setCurrentScreen('testerProjectView');
      }
    }
  };

  const handleCategorize = () => {
    // Handle categorize button click
    console.log('Categorize clicked');
    // setCurrentScreen('categorize'); // When you create this screen
};

  const handleLogs = () => {
  setCurrentScreen('logs');
};

  const handleLeaderboards = () => {
    setCurrentScreen('leaderboards');
  };

  const handleLeaderboardsBack = () => {
    // Navigate back to the appropriate dashboard based on user type
    try {
      const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
      if (user.accountType === 'developer') {
        setCurrentScreen('developerDashboard');
      } else if (user.accountType === 'tester') {
        setCurrentScreen('testerDashboard');
      } else {
        setCurrentScreen('login');
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
      setCurrentScreen('login');
    }
  };

  const handleModeratorAccess = () => {
    sessionStorage.setItem('inModeratorMode', 'true');
    setIsModeratorMode(true);
    setCurrentScreen('moderator');
  };

  // Admin routes
  if (currentScreen === 'adminLogin') {
    return <AdminLogin onAdminLogin={handleAdminLogin} />;
  }

  if (currentScreen === 'adminDashboard') {
    return <AdminDashboard onLogout={handleAdminLogout} />;
  }

  // Moderator Exam route - CHECK THIS FIRST!
  if (currentScreen === 'moderatorExam') {
    console.log('Rendering ModeratorExam');

    return <ModeratorExam
      onBack={() => {
        // Determine which profile screen to return to based on current user
        const userData = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
        if (userData.accountType === 'tester') {
          setCurrentScreen('testerProfile');
        } else {
          setCurrentScreen('profile');
        }
      }}
      onComplete={(score) => {
        // Return to profile after application submission
        const userData = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
        if (userData.accountType === 'tester') {
          setCurrentScreen('testerProfile');
        } else {
          setCurrentScreen('profile');
        }
      }}
    />;
  }

  // Moderator Setup route
  if (currentScreen === 'moderatorSetup') {
    return <ModeratorSetup
      onBack={() => {
        const userData = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
        if (userData.accountType === 'tester') {
          setCurrentScreen('testerProfile');
        } else {
          setCurrentScreen('profile');
        }
      }}
      onComplete={() => {
        // Redirect to moderator portal after setup
        setCurrentScreen('moderator');
      }}
    />;
  }

  // Moderator routes - AFTER exam route
  if (currentScreen === 'moderator') {
    console.log('Rendering ModeratorApp');
    return <ModeratorApp />;
  }

  // Landing page
  if (currentScreen === 'landing') {
    return <LandingPage onGetStarted={() => setCurrentScreen('login')} />;
  }

  // Regular user routes
  if (currentScreen === 'login') {
    return <Login
      onLoginAsTester={handleLoginAsTester}
      onLoginAsDeveloper={handleLoginAsDeveloper}
      onModeratorAccess={handleModeratorAccess}
    />;
  }

  if (currentScreen === 'testerDashboard') {
  return <TesterDashboard 
    onProjectClick={handleProjectClick} 
    onCategorize={handleCategorize}
    onProfile={() => setCurrentScreen('testerProfile')}
    onLeaderboards={handleLeaderboards}
  />;
}

  if (currentScreen === 'developerDashboard') {
    return <DeveloperDashboard 
      onPost={handlePostProject}
      onProjectClick={handleProjectClick}
      onProfile={() => setCurrentScreen('profile')}
      onLeaderboards={handleLeaderboards}
    />;
  }

  if (currentScreen === 'projectView') {
    return <ProjectView
      project={selectedProject}
      onBack={() => setCurrentScreen('developerDashboard')}
    />;
  }

  if (currentScreen === 'testerProjectView') {
    return <TesterProjectView
      project={selectedProject}
      projectId={selectedProjectId}
      onBack={() => setCurrentScreen('testerDashboard')}
      onLeaderboards={handleLeaderboards}
      onProfile={() => setCurrentScreen('testerProfile')}
      onBugReport={(projectId) => {
        setSelectedProjectId(projectId);
        setCurrentScreen('bugReport');
      }}
    />;
  }

  if (currentScreen === 'post') {
    return <Post onBack={handleBackToDashboard} onProfile={handleProfile} />;
  }

  if (currentScreen === 'profile') {
  return <Profile onBack={handleBackToDashboard} onLogout={handleLogout} onLeaderboards={handleLeaderboards} onModeratorExam={() => {
    console.log('Setting screen to moderatorExam');
    setCurrentScreen('moderatorExam');
  }} onModeratorSetup={() => setCurrentScreen('moderatorSetup')} />;
}

  if (currentScreen === 'testerProfile') {
  return <Profile onBack={() => setCurrentScreen('testerDashboard')} onLogout={handleLogout} onLeaderboards={handleLeaderboards} onModeratorExam={() => {
    console.log('Setting screen to moderatorExam');
    setCurrentScreen('moderatorExam');
  }} onModeratorSetup={() => setCurrentScreen('moderatorSetup')} />;
}

  if (currentScreen === 'bugReport') {
    return <BugReport
      projectId={selectedProjectId}
      onBack={() => setCurrentScreen('testerProjectView')}
      onProfile={() => setCurrentScreen('testerProfile')}
      onLeaderboards={handleLeaderboards}
    />;
  } 

if (currentScreen === 'logs') {
  return <Logs onBack={handleBackToDashboard} />;
}

  if (currentScreen === 'leaderboards') {
    return <Leaderboards 
      onBack={handleLeaderboardsBack} 
      onProfile={() => {
        try {
          const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
          if (user.accountType === 'tester') {
            setCurrentScreen('testerProfile');
          } else {
            setCurrentScreen('profile');
          }
        } catch (error) {
          setCurrentScreen('profile');
        }
      }}
    />;
  }

  // Default fallback should never happen with proper authentication
  // If we reach here, redirect to login for security
  return <Login onLoginAsTester={handleLoginAsTester} onLoginAsDeveloper={handleLoginAsDeveloper} />;
}

export default App;