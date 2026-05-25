import { motion } from "motion/react";

export function Privacy() {
  return (
    <div className="container mx-auto max-w-3xl px-6 py-20 flex-1">
      <h1 className="text-4xl font-brand font-black tracking-tighter uppercase mb-8">Privacy Policy</h1>
      <div className="prose prose-sm dark:prose-invert max-w-none text-muted">
        <p className="mb-4">Last updated: May 25, 2026</p>
        <h2 className="text-lg font-bold text-fg mt-8 mb-4 uppercase tracking-widest">1. Local Processing</h2>
        <p className="mb-4">
          OMNI is built from the ground up to protect your privacy. Everything you do—like editing images, removing backgrounds with AI, and converting file formats—happens entirely inside your web browser. 
          We never upload your documents, images, edits, or files to any external server. Your work stays entirely on your own device.
        </p>
        
        <h2 className="text-lg font-bold text-fg mt-8 mb-4 uppercase tracking-widest">2. Information Collection</h2>
        <p className="mb-4">
          We do not collect any personal information. You do not need to create an account, share your email address, or log in to use OMNI.
        </p>

        <h2 className="text-lg font-bold text-fg mt-8 mb-4 uppercase tracking-widest">3. Device Storage</h2>
        <p className="mb-4">
          OMNI may use your browser's built-in memory (local storage) to remember your settings, such as your choice of light or dark mode. This information is saved only on your device and is never sent to us.
        </p>

        <h2 className="text-lg font-bold text-fg mt-8 mb-4 uppercase tracking-widest">4. No Tracking</h2>
        <p className="mb-4">
          We do not use tracking tools, cookies, or analytics services that monitor your behavior or collect data on how you use OMNI.
        </p>
        
        <h2 className="text-lg font-bold text-fg mt-8 mb-4 uppercase tracking-widest">5. Contact</h2>
        <p className="mb-4">
          If you have any questions or concerns about this privacy policy, please reach out to us.
        </p>
      </div>
    </div>
  );
}
