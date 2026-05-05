'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Heart, Share2 } from 'lucide-react';

export function HeroGallery() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const images = [
    {
      src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCPaahJW1fHejJhjFSNbXAAuwWh5tY95jPLQnjSJUoixbwvyVJOEW2CJxfY6o41LGLkbVx6Fwntrk86rt-1IzFWrJ_bXhA1fainwynnTZ5JtoRcTE_aMooe6GXcFBq2k4I1aJp-Z5pN6qioJKQ5vwIWZ4KUqc-mQlMGSeM7TM_3UY6OuK5L20OiKmIHTKpDM29HNUZQYt1kbRHZeu22Or4V6vf7qkJ2hYRYfy1qwp8j9sY-LV3kD23_0qdWJd5W-PI4Uf8UfxNS8_oR',
      alt: 'Common area view 1',
    },
    {
      src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCPaahJW1fHejJhjFSNbXAAuwWh5tY95jPLQnjSJUoixbwvyVJOEW2CJxfY6o41LGLkbVx6Fwntrk86rt-1IzFWrJ_bXhA1fainwynnTZ5JtoRcTE_aMooe6GXcFBq2k4I1aJp-Z5pN6qioJKQ5vwIWZ4KUqc-mQlMGSeM7TM_3UY6OuK5L20OiKmIHTKpDM29HNUZQYt1kbRHZeu22Or4V6vf7qkJ2hYRYfy1qwp8j9sY-LV3kD23_0qdWJd5W-PI4Uf8UfxNS8_oR',
      alt: 'Common area view 2',
    },
    {
      src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCPaahJW1fHejJhjFSNbXAAuwWh5tY95jPLQnjSJUoixbwvyVJOEW2CJxfY6o41LGLkbVx6Fwntrk86rt-1IzFWrJ_bXhA1fainwynnTZ5JtoRcTE_aMooe6GXcFBq2k4I1aJp-Z5pN6qioJKQ5vwIWZ4KUqc-mQlMGSeM7TM_3UY6OuK5L20OiKmIHTKpDM29HNUZQYt1kbRHZeu22Or4V6vf7qkJ2hYRYfy1qwp8j9sY-LV3kD23_0qdWJd5W-PI4Uf8UfxNS8_oR',
      alt: 'Common area view 3',
    },
    {
      src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCPaahJW1fHejJhjFSNbXAAuwWh5tY95jPLQnjSJUoixbwvyVJOEW2CJxfY6o41LGLkbVx6Fwntrk86rt-1IzFWrJ_bXhA1fainwynnTZ5JtoRcTE_aMooe6GXcFBq2k4I1aJp-Z5pN6qioJKQ5vwIWZ4KUqc-mQlMGSeM7TM_3UY6OuK5L20OiKmIHTKpDM29HNUZQYt1kbRHZeu22Or4V6vf7qkJ2hYRYfy1qwp8j9sY-LV3kD23_0qdWJd5W-PI4Uf8UfxNS8_oR',
      alt: 'Common area view 4',
    },
  ];

  return (
    <div className="w-full h-[573px] relative group overflow-hidden bg-stone-200">
      <div className="relative w-full h-full">
        <Image
          src={images[currentImageIndex].src}
          alt={images[currentImageIndex].alt}
          fill
          priority
          className="object-cover group-hover:scale-105 transition-transform duration-700"
        />
      </div>

      {/* Gallery Dots */}
      <div className="absolute bottom-space-6 left-1/2 -translate-x-1/2 flex gap-space-2">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentImageIndex(index)}
            className={`w-2 h-2 rounded-full transition-opacity ${
              index === currentImageIndex ? 'bg-white opacity-100' : 'bg-white opacity-50 hover:opacity-100'
            }`}
            aria-label={`Go to image ${index + 1}`}
          />
        ))}
      </div>

      {/* Floating Actions */}
      <div className="absolute top-space-6 right-space-6 flex gap-space-3">
        <button className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-text-heading hover:text-action transition-colors shadow-sm">
          <Heart className="w-5 h-5" fill="currentColor" />
        </button>
        <button className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-text-heading hover:text-action transition-colors shadow-sm">
          <Share2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
