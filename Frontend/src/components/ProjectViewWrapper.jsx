import React from 'react';
import { useParams } from 'react-router-dom';
import ProjectView from '../ProjectView.jsx';
import TesterProjectView from '../TesterProjectView.jsx';
import BugReport from '../BugReport.jsx';

// Wrapper to extract projectId from URL params for ProjectView
export function ProjectViewWrapper({ onBack }) {
  const { projectId } = useParams();

  return <ProjectView project={null} projectId={projectId} onBack={onBack} />;
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
