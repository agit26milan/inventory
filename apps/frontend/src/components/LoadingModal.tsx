import './LoadingModal.css';

interface LoadingModalProps {
  isLoading: boolean;
}

export const LoadingModal = ({ isLoading }: LoadingModalProps) => {
  if (!isLoading) return null;

  return (
    <div className="loading-modal-overlay">
      <div className="loading-modal-content">
        <div className="spinner"></div>
        <p>Memuat...</p>
      </div>
    </div>
  );
};
