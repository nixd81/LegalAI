import { createContext, useContext } from 'react';

// Create context for wizard state
const WizardContext = createContext();

export const useWizard = () => {
  const context = useContext(WizardContext);
  if (!context) {
    throw new Error('useWizard must be used within a WizardStepper');
  }
  return context;
};

export { WizardContext };
