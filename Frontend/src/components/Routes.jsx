import { Navigate } from 'react-router-dom';

// Protected route wrapper for authenticated users
export const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const user = localStorage.getItem('user') || sessionStorage.getItem('user');

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Protected route for admin users only
export const AdminRoute = ({ children }) => {
  const adminToken = localStorage.getItem('adminToken');

  if (!adminToken) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};

// Protected route for moderator users only
export const ModeratorRoute = ({ children }) => {
  const moderatorToken = localStorage.getItem('moderatorToken');
  const moderatorInfo = localStorage.getItem('moderatorInfo');
  const inModeratorMode = sessionStorage.getItem('inModeratorMode') === 'true';

  if (!moderatorToken || !moderatorInfo || !inModeratorMode) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Protected route for developers only
export const DeveloperRoute = ({ children }) => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const user = localStorage.getItem('user') || sessionStorage.getItem('user');

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  try {
    const userData = JSON.parse(user);
    if (userData.accountType !== 'developer') {
      return <Navigate to="/tester/dashboard" replace />;
    }
  } catch (error) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Protected route for testers only
export const TesterRoute = ({ children }) => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const user = localStorage.getItem('user') || sessionStorage.getItem('user');

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  try {
    const userData = JSON.parse(user);
    if (userData.accountType !== 'tester') {
      return <Navigate to="/developer/dashboard" replace />;
    }
  } catch (error) {
    return <Navigate to="/login" replace />;
  }

  return children;
};
