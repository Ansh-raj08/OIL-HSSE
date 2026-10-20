'use client';

import React from 'react';
import Link from 'next/link';
import { HoverBorderGradient } from '@/components/ui/hover-border-gradient';

interface HoverBorderGradientDemoProps {
  href?: string;
  onClick?: () => void;
}

export default function HoverBorderGradientDemo({
  href = '/login',
  onClick,
}: HoverBorderGradientDemoProps) {
  const content = (
    <HoverBorderGradient
      containerClassName="rounded-full cursor-pointer select-none"
      as="span"
      className="flex items-center gap-2 bg-white px-5 py-2.5 text-black transition-colors dark:bg-black dark:text-white"
    >
      <AceternityLogo />
      <span className="text-sm font-medium tracking-wide">Get Started</span>
    </HoverBorderGradient>
  );

  return (
    <div className="mt-8 flex justify-center text-center">
      {href ? (
        <Link
          href={href}
          onClick={onClick}
          className="inline-block rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          id="get-started-cta"
        >
          {content}
        </Link>
      ) : (
        <button
          type="button"
          onClick={onClick}
          className="inline-block rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          id="get-started-cta"
        >
          {content}
        </button>
      )}
    </div>
  );
}

const AceternityLogo = () => (
  <svg
    width="66"
    height="65"
    viewBox="0 0 66 65"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="h-3 w-3 text-black dark:text-white"
    aria-hidden="true"
  >
    <path
      d="M8 8.05571C8 8.05571 54.9009 18.1782 57.8687 30.062C60.8365 41.9458 9.05432 57.4696 9.05432 57.4696"
      stroke="currentColor"
      strokeWidth="15"
      strokeMiterlimit="3.86874"
      strokeLinecap="round"
    />
  </svg>
);
