import styles from '../styles/card.module.css';

interface ServerValidationIndicatorProps {
  isValid: boolean | null;
  isVisible: boolean;
}

export default function ServerValidationIndicator({ isValid, isVisible }: ServerValidationIndicatorProps) {
  if (!isVisible) return null;

  return (
    <div className={`${styles.validationIndicator} ${isValid ? 'text-green-500' : 'text-red-500'}`}>
      {isValid ? '✓' : '✕'}
    </div>
  );
} 