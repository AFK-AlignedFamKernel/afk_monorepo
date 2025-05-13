'use client';

import dynamic from 'next/dynamic';

const CreateAll = dynamic(() => import("@/components/Form/CreateAll"), {
  ssr: false
});

export default function CreatePage() {
  return (
    <div className="container mx-auto p-4">
      <CreateAll />
    </div>
  );
}