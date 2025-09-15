// src/components/Modal.jsx
import React, { useEffect, useRef } from 'react';

/**
 * A reusable and accessible modal component with a modern design.
 *
 * @param {object} props - The component props.
 * @param {boolean} props.isOpen - Controls if the modal is visible.
 * @param {function} props.onClose - Function to call when the modal should close.
 * @param {React.ReactNode} props.children - The content to display inside the modal.
 * @param {string} [props.size='md'] - The size of the modal ('sm', 'md', 'lg', 'xl', '2xl', ..., '6xl').
 */
const Modal = ({ isOpen, onClose, children, size = 'md' }) => {
  const modalRef = useRef(null);

  // Effect to handle the 'Escape' key press for closing the modal
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
      window.addEventListener('keydown', handleKeyDown);
    }

    // Cleanup function
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Handler to close the modal when clicking on the backdrop
  const handleBackdropClick = (event) => {
    if (modalRef.current && !modalRef.current.contains(event.target)) {
      onClose();
    }
  };
  
  // Map the size prop to corresponding Tailwind CSS max-width classes
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
  };

  return (
    // The Modal Portal wrapper with transitions
    <div
      className={`fixed inset-0 z-50 overflow-y-auto transition-opacity duration-300 ease-in-out ${
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      onClick={handleBackdropClick}
      aria-modal="true"
      role="dialog"
    >
      {/* Modal Overlay */}
      <div className="fixed inset-0 bg-gray-900 bg-opacity-75"></div>

      {/* Modal Content Panel */}
      <div className="flex min-h-full items-center justify-center p-4 text-center">
        <div
          ref={modalRef}
          className={`relative w-full transform rounded-xl bg-white text-left shadow-xl transition-all duration-300 ease-in-out ${
            sizeClasses[size] || sizeClasses.md
          } ${isOpen ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-4 scale-95 opacity-0'}`}
        >
          {/* Close Button: Placed inside for better context but styled for easy access */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close modal"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Modal Body with padding */}
          <div className="p-6">{children}</div>
        </div>
      </div>
    </div>
  );
};

export default Modal;