import { motion } from "motion/react";

export function Terms() {
  return (
    <div className="container mx-auto max-w-3xl px-6 py-20 flex-1">
      <h1 className="text-4xl font-brand font-black tracking-tighter uppercase mb-8">Terms of Service</h1>
      <div className="prose prose-sm dark:prose-invert max-w-none text-muted">
        <p className="mb-4">Last updated: May 26, 2026</p>
        <h2 className="text-lg font-bold text-fg mt-8 mb-4 uppercase tracking-widest">1. Terms</h2>
        <p className="mb-4">
          By using OMNI, you agree to these Terms of Service. If you do not agree with any part of these terms, please do not use the site.
        </p>
        
        <h2 className="text-lg font-bold text-fg mt-8 mb-4 uppercase tracking-widest">2. Use License</h2>
        <p className="mb-4">
          OMNI is a web tool that runs entirely on your own computer or device. Everything is processed directly in your web browser, without sending files to the cloud. You are granted a free license to use OMNI for personal, classroom, and professional projects.
        </p>
        <ul className="list-disc pl-6 mb-4 space-y-2">
          <li>You may not use the site for any illegal purpose.</li>
          <li>You must not attempt to copy, modify, or disassemble the website's code.</li>
        </ul>

        <h2 className="text-lg font-bold text-fg mt-8 mb-4 uppercase tracking-widest">3. Your Files & Work</h2>
        <p className="mb-4">
          Because OMNI runs entirely inside your browser, we do not store, view, or send your documents, student work, or images to any outside servers. Your files, including photos edited with our built-in AI Background Remover, remain on your device at all times.
        </p>

        <h2 className="text-lg font-bold text-fg mt-8 mb-4 uppercase tracking-widest">4. Disclaimer</h2>
        <p className="mb-4">
          OMNI is provided "as is" without any guarantees. We make no promises that the tool will meet every specific requirement or work perfectly on every device, though we strive to make it as reliable as possible.
        </p>
      </div>
    </div>
  );
}
