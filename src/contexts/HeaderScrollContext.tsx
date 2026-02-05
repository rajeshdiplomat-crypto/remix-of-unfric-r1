import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface HeaderScrollContextType {
  isScrolled: boolean;
  setIsScrolled: (value: boolean) => void;
}

const HeaderScrollContext = createContext<HeaderScrollContextType | undefined>(undefined);

export function HeaderScrollProvider({ children }: { children: ReactNode }) {
  const [isScrolled, setIsScrolled] = useState(false);

  return (
    <HeaderScrollContext.Provider value={{ isScrolled, setIsScrolled }}>
      {children}
    </HeaderScrollContext.Provider>
  );
}

export function useHeaderScroll() {
  const context = useContext(HeaderScrollContext);
  if (!context) {
    throw new Error("useHeaderScroll must be used within a HeaderScrollProvider");
  }
  return context;
}

// Hook for scroll containers to report their scroll position
export function useScrollReporter(threshold = 50) {
  const { setIsScrolled } = useHeaderScroll();

  const handleScroll = useCallback((e: React.UIEvent<HTMLElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    setIsScrolled(scrollTop > threshold);
  }, [setIsScrolled, threshold]);

  return { onScroll: handleScroll };
}
