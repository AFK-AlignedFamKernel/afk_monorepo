import React from 'react';
import { StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { colors } from '../../styles/native';
import { StyledView } from './StyledView';

interface CanvasProps {
  width: number;
  height: number;
  pixels: Array<{ x: number; y: number; color: string }>;
  onPixelClick?: (x: number, y: number) => void;
}

const CANVAS_HTML = `
<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <style>
      canvas {
        image-rendering: pixelated;
        image-rendering: crisp-edges;
        width: 100%;
        height: 100%;
      }
      body {
        margin: 0;
        overflow: hidden;
        touch-action: none;
      }
    </style>
  </head>
  <body>
    <canvas id="pixelCanvas"></canvas>
    <script>
      const canvas = document.getElementById('pixelCanvas');
      const ctx = canvas.getContext('2d');
      
      function setupCanvas(width, height, pixels) {
        canvas.width = width;
        canvas.height = height;
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Draw pixels
        pixels.forEach(pixel => {
          ctx.fillStyle = pixel.color;
          ctx.fillRect(pixel.x, pixel.y, 1, 1);
        });
      }

      function handleTouch(event) {
        event.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const x = Math.floor((event.touches[0].clientX - rect.left) * (canvas.width / rect.width));
        const y = Math.floor((event.touches[0].clientY - rect.top) * (canvas.height / rect.height));
        window.ReactNativeWebView.postMessage(JSON.stringify({ x, y }));
      }

      canvas.addEventListener('touchstart', handleTouch);
      
      // Listen for messages from React Native
      window.addEventListener('message', (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'setup') {
          setupCanvas(data.width, data.height, data.pixels);
        }
      });
    </script>
  </body>
</html>
`;

export const PixelCanvas: React.FC<CanvasProps> = ({ width, height, pixels, onPixelClick }) => {
  const webViewRef = React.useRef<WebView>(null);

  React.useEffect(() => {
    const setupData = {
      type: 'setup',
      width,
      height,
      pixels,
    };
    webViewRef.current?.injectJavaScript(`
      window.postMessage('${JSON.stringify(setupData)}', '*');
      true;
    `);
  }, [width, height, pixels]);

  const handleMessage = (event: { nativeEvent: { data: string } }) => {
    const { x, y } = JSON.parse(event.nativeEvent.data);
    onPixelClick?.(x, y);
  };

  return (
    <StyledView className="w-full aspect-square bg-white">
      <WebView
        ref={webViewRef}
        source={{ html: CANVAS_HTML }}
        style={styles.webview}
        onMessage={handleMessage}
        scrollEnabled={false}
        bounces={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
      />
    </StyledView>
  );
};

const styles = StyleSheet.create({
  webview: {
    backgroundColor: 'transparent',
    flex: 1,
  },
}); 