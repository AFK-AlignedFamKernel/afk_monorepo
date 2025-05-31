import React, { useState } from 'react';

const PLATFORMS = [
  { label: 'Twitter (OAuth or Proof)', value: 'twitter', oauth: true, proof: true },
  { label: 'GitHub (OAuth or Proof)', value: 'github', oauth: true, proof: true },
  { label: 'Nostr (Proof Only)', value: 'nostr', oauth: false, proof: true },
  { label: 'Farcaster (Proof Only)', value: 'farcaster', oauth: false, proof: true },
  // Add more as needed
];

export const SocialAccountLinker: React.FC = () => {
  const [platform, setPlatform] = useState('');
  const [handle, setHandle] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [status, setStatus] = useState<'idle' | 'verifying' | 'verified' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const selectedPlatform = PLATFORMS.find((p) => p.value === platform);

  const handleOAuth = async () => {
    setStatus('verifying');
    setError(null);
    // TODO: Integrate with Supabase OAuth for the selected platform
    // For MVP, just simulate success
    setTimeout(() => {
      setStatus('verified');
    }, 1200);
  };

  const handleProof = async () => {
    setStatus('verifying');
    setError(null);
    // TODO: Call backend API to verify proofUrl for the selected platform/handle
    // For MVP, just simulate success if proofUrl is not empty
    setTimeout(() => {
      if (proofUrl) {
        setStatus('verified');
      } else {
        setStatus('error');
        setError('Proof URL is required.');
      }
    }, 1200);
  };

  return (
    <div className="p-4 border rounded-lg bg-white dark:bg-contrast-100 shadow space-y-4">
      <h3 className="text-xl font-semibold mb-2">Link Social Account</h3>
      <div>
        <label className="block mb-1 font-medium">Platform</label>
        <select
          className="input input-bordered w-full"
          value={platform}
          onChange={(e) => {
            setPlatform(e.target.value);
            setStatus('idle');
            setError(null);
          }}
        >
          <option value="">Select platform...</option>
          {PLATFORMS.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      </div>
      {platform && (
        <div>
          <label className="block mb-1 font-medium">Handle</label>
          <input
            className="input input-bordered w-full"
            placeholder="@yourhandle or username"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
          />
        </div>
      )}
      {platform && selectedPlatform?.oauth && (
        <button
          className="btn btn-primary w-full mt-2"
          onClick={handleOAuth}
          disabled={status === 'verifying'}
        >
          {status === 'verifying' ? 'Verifying...' : `Link via OAuth`}
        </button>
      )}
      {platform && selectedPlatform?.proof && (
        <div className="mt-2">
          <label className="block mb-1 font-medium">Proof URL</label>
          <input
            className="input input-bordered w-full"
            placeholder="Paste proof link (tweet, gist, nostr note, etc.)"
            value={proofUrl}
            onChange={(e) => setProofUrl(e.target.value)}
          />
          <button
            className="btn btn-secondary w-full mt-2"
            onClick={handleProof}
            disabled={status === 'verifying'}
          >
            {status === 'verifying' ? 'Verifying...' : 'Verify via Proof'}
          </button>
        </div>
      )}
      {status === 'verified' && (
        <div className="alert alert-success mt-2">Account linked and verified!</div>
      )}
      {status === 'error' && error && (
        <div className="alert alert-error mt-2">{error}</div>
      )}
    </div>
  );
};

export default SocialAccountLinker; 