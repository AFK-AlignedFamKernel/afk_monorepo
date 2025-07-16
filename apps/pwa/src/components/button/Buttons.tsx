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
    <div className={classNames(styles['btn'], styles['btn-primary'], className, isActive && activeClassName)}>
      <button onClick={onClick} disabled={disabled} type={type}>{children}</button>
    </div>
  );
};

export const ButtonSecondary: React.FC<ButtonProps> = ({ children, onClick, className, disabled, type='button', isActive=false, activeClassName }) => {
  return (
    <div className={classNames(styles['btn'], styles['btn-secondary'], className, isActive && activeClassName)}>
      <button onClick={onClick} disabled={disabled} type={type}>{children}</button>
    </div>
  );
};

export const ButtonTertiary: React.FC<ButtonProps> = ({ children, onClick, className, disabled, type='button', isActive=false, activeClassName }) => {
  return (
    <div className={classNames(styles['btn'], styles['btn-tertiary'], className, isActive && activeClassName)}>
      <button onClick={onClick} disabled={disabled} type={type}>{children}</button>
    </div>
  );
};

export const BasicButton: React.FC<ButtonProps> = ({ children, onClick, className, disabled, type='button', isActive=false, activeClassName }) => {
  return (
    <div className={classNames(styles['btn'], styles['btn-basic'], className, isActive && activeClassName)}>
      <button onClick={onClick} disabled={disabled} type={type}>{children}</button>
    </div>
  );
};
    