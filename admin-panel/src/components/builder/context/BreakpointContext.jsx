import React, { createContext, useContext } from 'react';

const BreakpointContext = createContext({
  breakpoint: 'desktop',
  setBreakpoint: () => {},
});

export const useBreakpoint = () => {
  const context = useContext(BreakpointContext);
  if (!context) {
    throw new Error('useBreakpoint must be used within a BreakpointProvider');
  }
  return context;
};

export const BreakpointProvider = ({ children, breakpoint, setBreakpoint }) => {
  return (
    <BreakpointContext.Provider value={{ breakpoint, setBreakpoint }}>
      {children}
    </BreakpointContext.Provider>
  );
};

export default BreakpointContext;
