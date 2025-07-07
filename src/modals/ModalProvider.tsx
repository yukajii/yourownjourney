import React, { createContext, useContext, useState } from 'react';

interface ModalCtx {
  show: (content: React.ReactNode) => void;
  hide: () => void;
}
const Ctx = createContext<ModalCtx | null>(null);

export const ModalProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [content, setContent] = useState<React.ReactNode>(null);
  const show  = (c: React.ReactNode) => setContent(c);
  const hide  = () => setContent(null);
  return (
    <Ctx.Provider value={{ show, hide }}>
      {children}
      {content && (
        <div className="fixed inset-0 bg-black/40 grid place-items-center z-50">
          <div className="bg-white p-6 rounded-xl max-w-md w-full shadow-lg">
            {content}
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
};
export const useModal = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useModal must be inside ModalProvider');
  return ctx;
};