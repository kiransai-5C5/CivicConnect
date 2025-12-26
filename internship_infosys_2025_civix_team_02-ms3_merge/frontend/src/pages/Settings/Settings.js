// frontend/src/pages/Settings/Settings.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { getUser } from '../../utils/auth';
import Layout from '../../components/Layout/Layout';
import CitizenSettings from './CitizenSettings';
import OfficialSettings from './OfficialSettings';
import './Settings.css';

const Settings = () => {
  const user = getUser();

  // Redirect if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const role = (user?.userType || '').toLowerCase();

  // Citizen Settings
  if (role === 'citizen') {
    return (
      <Layout>
        <CitizenSettings />
      </Layout>
    );
  }

  // Official / Officer Settings
  if (role === 'official' || role === 'officer') {
    return (
      <Layout>
        <OfficialSettings />
      </Layout>
    );
  }

  // Unknown role → go back
  return <Navigate to="/dashboard" replace />;
};

export default Settings;
