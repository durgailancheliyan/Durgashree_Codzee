import React, { createContext, useContext, useState, ReactNode } from "react";

type ModalContent = ReactNode | null;

const ModalContext = createContext<{
  showModal: (content: ModalContent) => void;
  hideModal: () => void;
}>({
  showModal: () => {},
  hideModal: () => {},
});

export const useModal = () => useContext(ModalContext);

export const ModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [content, setContent] = useState<ModalContent>(null);

  const showModal = (modalContent: ModalContent) => setContent(modalContent);
  const hideModal = () => setContent(null);

  return (
    <ModalContext.Provider value={{ showModal, hideModal }}>
      {children}
      {content && (
        <div className="fixed inset-0 z-[9999] flex justify-end">
          <div className="bg-black/30 absolute inset-0" onClick={hideModal} />
          <div className="relative h-full w-full max-w-lg bg-white rounded-l-2xl shadow-lg p-8 flex flex-col overflow-y-auto">
            {content}
          </div>
        </div>
      )}
    </ModalContext.Provider>
  );
};