import { SpinnerCircularFixed } from "spinners-react";

// I use the following React spinner element as developed by the following author:
// https://adexin.github.io/spinners/
// https://adexin.github.io/spinners/
export const LoadingSpinner = ({ style }: Partial<{ style: React.CSSProperties }>) => {
  const bodyElement = document.body;
  const accentColor = bodyElement.style.getPropertyValue('--accent');
  const primaryColor = bodyElement.style.getPropertyValue('--primary');

  return (
    <SpinnerCircularFixed
      style={style}
      size={100}
      thickness={150}
      speed={100}
      color={accentColor}
      secondaryColor={primaryColor}
    />
  );
}