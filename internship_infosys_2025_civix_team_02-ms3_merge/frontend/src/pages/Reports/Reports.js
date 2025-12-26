import React from 'react';
import { getUser } from '../../utils/auth';
import Layout from '../../components/Layout/Layout';
import OfficialReports from './OfficialReports';
import CitizenReports from './CitizenReports';

const Reports = () => {
  const user = getUser();
  const isOfficial = (user?.userType || '').toLowerCase() === 'official';

  return (
    <Layout>
      {isOfficial ? <OfficialReports /> : <CitizenReports />}
    </Layout>
  );
};

export default Reports;
