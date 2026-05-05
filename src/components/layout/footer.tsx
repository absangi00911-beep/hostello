'use client';

export function Footer() {
  return (
    <footer className="bg-bg-raised dark:bg-stone-950 text-stone-500 font-['Be_Vietnam_Pro'] text-xs py-12 border-t border-border-default dark:border-stone-800">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 max-w-7xl mx-auto px-6 gap-8">
        <div className="flex flex-col gap-4">
          <span className="text-stone-900 dark:text-white font-bold text-base">HostelPak</span>
          <p>© 2024 HostelPak. Secure & Verified Student Housing.</p>
        </div>

        <div className="flex flex-col gap-2">
          <a href="#" className="text-stone-500 hover:text-primary-container transition-colors">
            About
          </a>
          <a href="#" className="text-stone-500 hover:text-primary-container transition-colors">
            Privacy Policy
          </a>
          <a href="#" className="text-stone-500 hover:text-primary-container transition-colors">
            Terms of Service
          </a>
        </div>

        <div className="flex flex-col gap-2">
          <a href="#" className="text-stone-500 hover:text-primary-container transition-colors">
            Partner Support
          </a>
          <a href="#" className="text-stone-500 hover:text-primary-container transition-colors">
            Contact Us
          </a>
        </div>
      </div>
    </footer>
  );
}
