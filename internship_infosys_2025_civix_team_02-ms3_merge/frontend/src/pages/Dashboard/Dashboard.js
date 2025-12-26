// frontend/src/pages/Dashboard/Dashboard.js
import React from 'react';
import { getUser } from '../../utils/auth';
import CitizenDashboard from './CitizenDashboard';
import OfficialDashboard from './OfficialDashboard';

const Dashboard = () => {
  const user = getUser();
  
  // Check user type and render appropriate dashboard
  if (user?.userType === 'Official') {
    return <OfficialDashboard />;
  }
  
  return <CitizenDashboard />;
};

export default Dashboard;