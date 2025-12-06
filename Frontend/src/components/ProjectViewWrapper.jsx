import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ProjectView from '../ProjectView.jsx';
import TesterProjectView from '../TesterProjectView.jsx';
import BugReport from '../BugReport.jsx';
import { getDeveloperTheme } from '../themeConfig';

// Wrapper to extract projectId from URL params for ProjectView
export function ProjectViewWrapper({ onBack, onLeaderboards, onPost, onProfile }) {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLightMode] = useState(localStorage.getItem('developerLightMode') === 'true');
  const theme = getDeveloperTheme(isLightMode);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const response = await fetch(
          `${import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '')}/api/projects?id=${projectId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        const data = await response.json();
        setProject(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching project:', error);
        setLoading(false);
      }
    };

    if (projectId) {
      fetchProject();
    }
  }, [projectId]);

  if (loading) {
    return (
      <div style={{
        padding: '20px',
        textAlign: 'center',
        backgroundColor: theme.background,
        minHeight: '100vh',
        color: theme.textPrimary,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        Loading project...
      </div>
    );
  }

  if (!project) {
    return (
      <div style={{
        padding: '20px',
        textAlign: 'center',
        backgroundColor: theme.background,
        minHeight: '100vh',
        color: theme.textPrimary,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        Project not found
      </div>
    );
  }

  return <ProjectView project={project} onBack={onBack} onLeaderboards={onLeaderboards} onPost={onPost} onProfile={onProfile} />;
}

// Wrapper to extract projectId from URL params for TesterProjectView
export function TesterProjectViewWrapper({ onBack, onLeaderboards, onProfile, onBugReport }) {
  const { projectId } = useParams();

  return (
    <TesterProjectView
      project={null}
      projectId={projectId}
      onBack={onBack}
      onLeaderboards={onLeaderboards}
      onProfile={onProfile}
      onBugReport={onBugReport}
    />
  );
}

// Wrapper to extract projectId from URL params for BugReport
export function BugReportWrapper({ onBack, onProfile, onLeaderboards }) {
  const { projectId } = useParams();

  return (
    <BugReport
      projectId={projectId}
      onBack={onBack}
      onProfile={onProfile}
      onLeaderboards={onLeaderboards}
    />
  );
}
