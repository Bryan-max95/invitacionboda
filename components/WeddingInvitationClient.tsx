'use client';

import React, { useEffect, useRef } from 'react';
import { WeddingInvitationApp } from '@/index';
import type { WeddingConfig } from '@/types';

export default function WeddingInvitationClient({ config }: { config: WeddingConfig }): React.JSX.Element {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = rootRef.current;
    if (!container) return;

    const app = new WeddingInvitationApp(config);
    app.init(container);

    return () => {
      app.dispose();
    };
  }, [config]);

  return <div id="root" ref={rootRef} />;
}
