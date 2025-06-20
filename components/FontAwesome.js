import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect, useState } from 'react';

const Icon = ({ icon, ...props }) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Show a simple placeholder during SSR
  if (!isMounted) {
    return <span style={{ display: 'inline-block', width: '1em', height: '1em' }}></span>;
  }

  return <FontAwesomeIcon icon={icon} {...props} />;
};

export default Icon;