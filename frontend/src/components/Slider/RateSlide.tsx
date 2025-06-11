import React from 'react';
import styles from './RateSlide.module.scss';

export interface RSlidePro {
  value: number | null;
  slideChange: (value: number) => void;
}

export const RateSlide: React.FC<RSlidePro> = ({ value, slideChange }) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const num = parseFloat(event.target.value);
    const rounded = Math.round(num * 10) / 10;
    slideChange(rounded);
  };

  return (
    <div className={styles.RslideCon}>
      <input type="range" min="0" max="10" step="0.1" value={value ?? 0} onChange={handleChange} className={styles.Rslider}/>
        {value !== null ? value.toFixed(1) : '_._'}
    </div>
  );
};
