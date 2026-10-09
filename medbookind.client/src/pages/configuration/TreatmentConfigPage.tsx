import React from 'react';
import ConfigurationShell from '@/components/config/ConfigurationShell';
import TreatmentConfig from '@/pages/configuration/treatmentconfig';

const TreatmentConfigPage: React.FC = () => (
  <ConfigurationShell
    title="Treatment configuration"
    description="Categories, treatment plans, add-ons, and duration for your practice."
  >
    {(practiceId) => <TreatmentConfig practiceId={practiceId} />}
  </ConfigurationShell>
);

export default TreatmentConfigPage;
