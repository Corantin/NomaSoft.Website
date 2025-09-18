'use client';

import Link from 'next/link';
import {ComponentProps, MouseEventHandler} from 'react';

type Props = ComponentProps<typeof Link> & {
  event?: string;
};

declare global {
  interface Window {
    plausible?: (event: string, options?: {props?: Record<string, string>}) => void;
  }
}

export function OutboundLink({event = 'Portfolio Click', onClick, ...props}: Props) {
  const handleClick: MouseEventHandler<HTMLAnchorElement> = (eventNative) => {
    if (typeof window !== 'undefined' && typeof window.plausible === 'function') {
      const href = typeof props.href === 'string' ? props.href : undefined;
      window.plausible(event, {
        props: {
          href: href ?? 'unknown'
        }
      });
    }

    onClick?.(eventNative);
  };

  return <Link {...props} onClick={handleClick} target="_blank" rel="noopener noreferrer" />;
}
