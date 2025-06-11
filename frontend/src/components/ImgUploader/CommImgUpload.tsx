import React, { useState, useEffect, useRef } from 'react';
import styles from './CommImgUpload.module.scss';

export interface CommImgUploadmyProp {
  onChange: (base64Images: string[]) => void;
  resetCounter?: number;
}
export const CommImgUpload: React.FC<CommImgUploadmyProp> = ({ onChange, resetCounter }) => {
  const MaxImg = 3;
  const [files, setFiles] = useState<File[]>([]);
  const [preview, setPreviews] = useState<string[]>([]);
  const [error, setError] = useState<string>('');

  const onChangeRef = useRef<(base64Images: string[]) => void>(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (resetCounter !== undefined) {
      setFiles([]);
      setError('');
    }
  }, [resetCounter]);

  useEffect(() => {
    if (files.length === 0) {
      setPreviews([]);
      onChangeRef.current([]);
      return;
    }
    const possURL = files.map(file => URL.createObjectURL(file));
    setPreviews(possURL);

    Promise.all(
      files.map(file =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(file);
        })
      )
    ).then(base64A => onChangeRef.current(base64A)).catch(error => console.error('There Error converting files:', error));

    return () => possURL.forEach(URL.revokeObjectURL);
  }, [files,]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) return;
    const picked = Array.from(event.target.files);
    if (files.length + picked.length > MaxImg) {
      setError(`You can MAX upload up to ${MaxImg} images. Please remove some images if you want them to be replaced.`);
      return;
    }
    setError('');
    setFiles(prev => [...prev, ...picked].slice(0, MaxImg));
    event.currentTarget.value = '';
  };

  const removeImage = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setError('');
  };

  return (
    <div className={styles.uploader}>
      <label className={styles.inputLabel}>
        Attach images (max {MaxImg})
        <input
          className={styles.inputFile}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
        />
      </label>
      {error && <p className={styles.error}>{error}</p>}
      {preview.length > 0 && (
        <div className={styles.previewList}>
          {preview.map((src, i) => (
            <div key={i} className={styles.previewItem}>
              <img src={src} alt={`preview ${i + 1}`} />
              <button
                type="button"
                className={styles.removeBtn}
                onClick={() => removeImage(i)}
              >
                X
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
