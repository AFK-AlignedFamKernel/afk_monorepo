import * as React from 'react';
import {Pressable} from 'react-native';

import {useStyles} from '../../hooks';
import stylesheet from './styles';
interface PiPProps {
  stream: MediaStream;
}

export function PictureInPicture({stream}: PiPProps) {
  const styles = useStyles(stylesheet);
  const [isMinimized, setIsMinimized] = React.useState(false);
  const [position, setPosition] = React.useState({x: 10, y: 5});

  const handleTap = () => {
    setIsMinimized(!isMinimized);
  };

  return (
    <Pressable
      style={[
        styles.pipContainer,
        {
          transform: [
            {translateX: position.x},
            {translateY: position.y},
            {scale: isMinimized ? 0.2 : 1},
          ],
          opacity: isMinimized ? 0.7 : 1,
        },
      ]}
      onPress={handleTap}
    >
      <video
        ref={(video) => {
          if (video) video.srcObject = stream;
        }}
        autoPlay
        playsInline
        muted
        style={styles.pipVideo}
      />
    </Pressable>
  );
}
