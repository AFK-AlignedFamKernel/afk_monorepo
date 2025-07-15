import classNames from 'classnames';
import styles from '../../styles/components/button.module.scss';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export const ButtonPrimary: React.FC<ButtonProps> = ({ children, onClick, className, disabled, type='button' }) => {
  return (
    <div className={classNames(styles['btn'], styles['btn-primary'], className)}>
      <button onClick={onClick} disabled={disabled} type={type}>{children}</button>
    </div>
  );
};

export const ButtonSecondary: React.FC<ButtonProps> = ({ children, onClick, className, disabled, type='button' }) => {
  return (
    <div className={classNames(styles['btn'], styles['btn-secondary'], className)}>
      <button onClick={onClick} disabled={disabled} type={type}>{children}</button>
    </div>
  );
};

export const ButtonTertiary: React.FC<ButtonProps> = ({ children, onClick, className, disabled, type='button' }) => {
  return (
    <div className={classNames(styles['btn'], styles['btn-tertiary'], className)}>
      <button onClick={onClick} disabled={disabled} type={type}>{children}</button>
    </div>
  );
};

export const BasicButton: React.FC<ButtonProps> = ({ children, onClick, className, disabled, type='button' }) => {
  return (
    <div className={classNames(styles['btn'], styles['btn-basic'], className)}>
      <button onClick={onClick} disabled={disabled} type={type}>{children}</button>
    </div>
  );
};
    