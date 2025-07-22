import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

const Lottie = dynamic(() => import('lottie-react'), {
  ssr: false
});

interface LottieAnimationProps {
  animationData: any;
  style?: React.CSSProperties;
  className?: string;
}

const LottieAnimation: React.FC<LottieAnimationProps> = ({
  animationData, 
  style, 
  className 
}) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }

  return (
    <div style={{ ...style, position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }} className={className}>
      <Lottie
        animationData={animationData}
        loop={false}
        style={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          width: '100%', 
          height: '100%',
          objectFit: 'contain'
        }}
        rendererSettings={{
          preserveAspectRatio: 'xMidYMid meet'
        }}
      />
    </div>
  );
};

export default LottieAnimation; 