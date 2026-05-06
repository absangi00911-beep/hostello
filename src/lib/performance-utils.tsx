'use client';

import React, { useState, useEffect, useRef } from 'react';

// ===== LAZY IMAGE COMPONENT =====
interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  placeholder?: string;
  width?: number | string;
  height?: number | string;
}

export const LazyImage = React.forwardRef<HTMLImageElement, LazyImageProps>(
  ({ src, alt, placeholder, className, width, height, ...props }, ref) => {
    const [imageSrc, setImageSrc] = useState<string>(placeholder || '');
    const [imageRef, setImageRef] = useState<HTMLImageElement | null>(null);

    useEffect(() => {
      let observer: IntersectionObserver;

      if (imageRef) {
        observer = new IntersectionObserver(([entry]) => {
          if (entry.isIntersecting) {
            setImageSrc(src);
            observer.unobserve(imageRef);
          }
        });
        observer.observe(imageRef);
      }

      return () => {
        if (observer && imageRef) {
          observer.unobserve(imageRef);
        }
      };
    }, [imageRef, src]);

    return (
      <img
        ref={(node) => {
          setImageRef(node);
          if (ref) {
            if (typeof ref === 'function') {
              ref(node);
            } else {
              ref.current = node;
            }
          }
        }}
        src={imageSrc}
        alt={alt}
        width={width}
        height={height}
        className={`${className || ''} transition-opacity duration-300`}
        {...props}
      />
    );
  }
);
LazyImage.displayName = 'LazyImage';

// ===== INTERSECTION OBSERVER HOOK =====
export const useIntersectionObserver = (options?: IntersectionObserverInit) => {
  const ref = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.unobserve(entry.target);
      }
    }, options);

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [options]);

  return { ref, isVisible };
};

// ===== DEBOUNCE HOOK =====
export const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

// ===== MEMOIZED LIST ITEM COMPONENT =====
interface ListItemProps<T> {
  item: T;
  renderItem: (item: T) => React.ReactNode;
}

export const MemoizedListItem = React.memo(
  function MemoizedListItem<T>({ item, renderItem }: ListItemProps<T>) {
    return <>{renderItem(item)}</>;
  },
  (prevProps, nextProps) => {
    // Custom comparison: only re-render if item reference changes
    return prevProps.item === nextProps.item;
  }
);

// ===== VIRTUALIZED LIST COMPONENT (for long lists) =====
interface VirtualizedListProps<T> {
  items: T[];
  itemHeight: number;
  visibleCount: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
}

export const VirtualizedList = React.forwardRef<
  HTMLDivElement,
  VirtualizedListProps<any>
>(
  (
    { items, itemHeight, visibleCount, renderItem, className },
    ref
  ) => {
    const [scrollOffset, setScrollOffset] = React.useState(0);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
      setScrollOffset((e.target as HTMLDivElement).scrollTop);
    };

    const startIndex = Math.floor(scrollOffset / itemHeight);
    const endIndex = Math.min(startIndex + visibleCount + 1, items.length);
    const visibleItems = items.slice(startIndex, endIndex);

    return (
      <div
        ref={ref}
        className={`overflow-y-auto ${className || ''}`}
        onScroll={handleScroll}
        style={{ height: `${visibleCount * itemHeight}px` }}
      >
        <div style={{ height: `${startIndex * itemHeight}px` }} />
        {visibleItems.map((item, index) => renderItem(item, startIndex + index))}
        <div style={{ height: `${(items.length - endIndex) * itemHeight}px` }} />
      </div>
    );
  }
);
VirtualizedList.displayName = 'VirtualizedList';

// ===== PRELOAD IMAGE UTILITY =====
export const usePreloadImage = (src: string): void => {
  const img = new Image();
  img.src = src;
};

export default {
  LazyImage,
  useIntersectionObserver,
  useDebounce,
  MemoizedListItem,
  VirtualizedList,
  usePreloadImage,
};
