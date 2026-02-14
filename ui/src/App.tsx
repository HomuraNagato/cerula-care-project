import { Route, Routes, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import PatientListPage from './routes/patients/PatientListPage';
import PatientDetailPage from './routes/patients/PatientDetailPage';

const App = () => (
  <Layout>
    <Routes>
      <Route index element={<Navigate to="/patients" replace />} />
      <Route path="patients" element={<PatientListPage />} />
      <Route path="patients/:patientId" element={<PatientDetailPage />} />
      <Route path="*" element={<Navigate to="/patients" replace />} />
    </Routes>
  </Layout>
);

export default App;
