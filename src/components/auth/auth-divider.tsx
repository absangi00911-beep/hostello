'use client';

export function AuthDivider() {
  return (
    <div className="mt-space-6 mb-space-6 flex items-center justify-center">
      <div className="w-full h-px bg-border-default" />
      <span className="px-3 font-label text-label text-text-muted bg-bg-card">or</span>
      <div className="w-full h-px bg-border-default" />
    </div>
  );
}
