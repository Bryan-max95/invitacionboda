import React from 'react';
import WeddingInvitationClient from '../components/WeddingInvitationClient';
import { readWeddingConfig } from '../lib/wedding';

export const dynamic = 'force-dynamic';

export default async function Page(): Promise<React.JSX.Element> {
  return (
    <main>
      <WeddingInvitationClient config={await readWeddingConfig()} />
    </main>
  );
}
