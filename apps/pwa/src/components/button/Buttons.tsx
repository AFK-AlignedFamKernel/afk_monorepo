import classNames from 'classnames';
import styles from '../../styles/components/button.module.scss';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  isActive?: boolean;
  activeClassName?: string;
}

export const ButtonPrimary: React.FC<ButtonProps> = ({ children, onClick, className, disabled, type='button', isActive=false, activeClassName }) => {
  return (
      <button 
       className={classNames(styles['btn'], styles['btn-primary'], className, isActive && activeClassName)}
      onClick={onClick} disabled={disabled} type={type}>{children}</button>
    );
};

export const ButtonSecondary: React.FC<ButtonProps> = ({ children, onClick, className, disabled, type='button', isActive=false, activeClassName }) => {
    return (
      <button 
        className={classNames(styles['btn'], styles['btn-secondary'], className, isActive && activeClassName)}
        onClick={onClick} disabled={disabled} type={type}>{children}</button>
  );
};

export const ButtonTertiary: React.FC<ButtonProps> = ({ children, onClick, className, disabled, type='button', isActive=false, activeClassName }) => {
  return (
    <button 
      className={classNames(styles['btn'], styles['btn-tertiary'], className, isActive && activeClassName)}
      onClick={onClick} disabled={disabled} type={type}>{children}</button>
  );
};

export const BasicButton: React.FC<ButtonProps> = ({ children, onClick, className, disabled, type='button', isActive=false, activeClassName }) => {
  return (
    <button 
      className={classNames(styles['btn'], styles['btn-basic'], className, isActive && activeClassName)}
      onClick={onClick} disabled={disabled} type={type}>{children}</button>
  );
};
    