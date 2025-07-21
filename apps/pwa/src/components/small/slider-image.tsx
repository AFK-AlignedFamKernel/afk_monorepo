
import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import React from 'react';

export type PostProps = {
  imgUrls?: string[];
};

export const SliderImages: React.FC<PostProps> = ({
  imgUrls
}) => {
//   const isDesktop = useIsDesktop();
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const nextImage = () => {
    if (!imgUrls || currentIndex >= imgUrls.length - 1) return;
    setCurrentIndex(prev => prev + 1);
  };

  const prevImage = () => {
    if (currentIndex <= 0) return;
    setCurrentIndex(prev => prev - 1);
  };

  if (!imgUrls?.length) return null;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        minHeight: 300,
        // maxHeight: isDesktop ? 750 : 550,
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          maxHeight: '350px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'row',
          flex: 1,
          transition: 'transform 0.3s ease-in-out'
        }}
      >
        <Image
          unoptimized
          src={imgUrls[currentIndex]}
          width={200}
          height={200}
          style={{
            width: '100%',
            height: '100%',
            maxHeight: '350px',
            objectFit: 'cover'
          }}
          alt={`Slide ${currentIndex + 1}`}
        />
      </div>

      {currentIndex > 0 && (
        <button
          onClick={prevImage}
          style={{
            position: 'absolute',
            left: 10,
            top: '50%',
            transform: 'translateY(-50%)',
            padding: 10,
            backgroundColor: 'rgba(0,0,0,0.5)',
            border: 'none',
            borderRadius: 20,
            color: '#fff',
            cursor: 'pointer'
          }}
        >
          ←
        </button>
      )}

      {imgUrls && currentIndex < imgUrls.length - 1 && (
        <button
          onClick={nextImage}
          style={{
            position: 'absolute',
            right: 10,
            top: '50%',
            transform: 'translateY(-50%)',
            padding: 10,
            backgroundColor: 'rgba(0,0,0,0.5)',
            border: 'none',
            borderRadius: 20,
            color: '#fff',
            cursor: 'pointer'
          }}
        >
          →
        </button>
      )}

      <div
        style={{
          position: 'absolute',
          bottom: 10,
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          gap: 5
        }}
      >
        {imgUrls.map((_, index) => (
          <div
            key={index}
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: index === currentIndex ? '#fff' : 'rgba(255,255,255,0.5)',
              cursor: 'pointer'
            }}
            onClick={() => setCurrentIndex(index)}
          />
        ))}
      </div>
    </div>
  );
};
