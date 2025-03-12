import React from 'react';
import styles from '../styles/components/Button.module.css';

/**
 * 共通のボタンコンポーネント
 * @param {Object} props
 * @param {string} [props.variant='primary'] - ボタンのバリアント（'primary' | 'small'）
 * @param {Function} props.onClick - クリックハンドラ
 * @param {React.ReactNode} props.children - ボタンの内容
 * @param {string} [props.className] - 追加のクラス名
 */
export const Button = ({ 
  variant = 'primary',
  onClick,
  children,
  className,
  ...props 
}) => {
  const buttonClasses = [
    styles.button,
    styles[`button--${variant}`],
    className
  ].filter(Boolean).join(' ');

  return (
    <button 
      className={buttonClasses}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

/**
 * ボタンコンテナコンポーネント
 * @param {Object} props
 * @param {React.ReactNode} props.children - 子要素
 * @param {string} [props.className] - 追加のクラス名
 */
export const ButtonContainer = ({ children, className }) => {
  const containerClasses = [
    styles.buttonContainer,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses}>
      {children}
    </div>
  );
};

/**
 * ボタングリッドコンポーネント
 * @param {Object} props
 * @param {React.ReactNode} props.children - 子要素
 * @param {string} [props.className] - 追加のクラス名
 */
export const ButtonGrid = ({ children, className }) => {
  const gridClasses = [
    styles.buttonGrid,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={gridClasses}>
      {children}
    </div>
  );
};

/**
 * ボタンカラムコンポーネント
 * @param {Object} props
 * @param {React.ReactNode} props.children - 子要素
 * @param {string} [props.className] - 追加のクラス名
 */
export const ButtonColumn = ({ children, className }) => {
  const columnClasses = [
    styles.buttonColumn,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={columnClasses}>
      {children}
    </div>
  );
}; 