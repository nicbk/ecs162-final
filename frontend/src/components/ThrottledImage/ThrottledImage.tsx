import { useState } from "react";
import { LoadingSpinner } from "../LoadingSpinner/LoadingSpinner";

const BACKOFF_DURATION = 500;

export const ThrottledImage = (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
  const [imgAttempt, setImgAttempt] = useState('INVALID');
  const [didLoad, setDidLoad] = useState(false);

  const imgStyle: React.CSSProperties = {
    display: didLoad ? 'initial' : 'none'
  };

  const spinnerStyle: React.CSSProperties = {
    display: didLoad ? 'none' : 'initial'
  };

  const onError: React.ReactEventHandler<HTMLImageElement> = (_event) => {
    setTimeout(() => {
      let cacheBustStr = '?';
      if (props.src?.includes('?')) {
        cacheBustStr = '&';
      }

      cacheBustStr += `local-cache-bust${crypto.randomUUID()}=${crypto.randomUUID()}`

      const newImgSrc = props.src + cacheBustStr;
      setImgAttempt(newImgSrc);
    // Generate random backoff time between BACKOFF_DURATION and twice that amount
    }, BACKOFF_DURATION + 8 * BACKOFF_DURATION * Math.random());
  };

  const onLoad = () => {
    setDidLoad(true);
  };

  return (
    <>
      <img
        style={imgStyle}
        src={imgAttempt}
        onError={onError /*https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/img*/}
        onLoad={onLoad}
        {...props}
      />
      <LoadingSpinner
        style={spinnerStyle}
      />
    </>
  )
};