"use client";

import { useEffect, useRef, useState, ReactNode } from "react";

interface ScrollAnimateProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export default function ScrollAnimate({ children, className = "", delay = 0 }: ScrollAnimateProps) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          if (ref.current) observer.unobserve(ref.current);
        }
      },
      {
        rootMargin: "0px 0px -50px 0px",
        threshold: 0.05,
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      data-visible={isIntersecting}
      style={{
        transitionDelay: `${delay}ms`,
        willChange: "opacity, transform",
        opacity: isIntersecting ? 1 : 0,
        transform: isIntersecting ? "translateY(0)" : "translateY(15px)",
        transition: "opacity 1s cubic-bezier(0.25, 1, 0.5, 1), transform 1s cubic-bezier(0.25, 1, 0.5, 1)",
        // 👇 KHẮC PHỤC LỖI KẸT CHUỘT: 
        // Khi chưa xuất hiện, không cho phép chặn sự kiện cuộn chuột chuột
        pointerEvents: isIntersecting ? "auto" : "none",
        visibility: isIntersecting ? "visible" : "hidden",
      }}
    >
      {children}
    </div>
  );
}