import { motion } from "motion/react";
import { HelpCircle, Shield, Zap, FileText, Globe, DollarSign, Wand2 } from "lucide-react";

const faqs = [
  {
    icon: <HelpCircle className="h-5 w-5" />,
    question: "What is OMNI?",
    answer: "OMNI is a simple, private workspace for editing documents and images that runs entirely on your own device. It allows you to edit, convert, and organize multiple student files and documents at once, right inside your web browser, without ever uploading them to the internet."
  },
  {
    icon: <Shield className="h-5 w-5" />,
    question: "Is my data safe?",
    answer: "Absolutely. OMNI does all of its work directly on your own device. This means your documents, images, and edits never leave your computer, tablet, or phone. We do not use outside servers, so we can never see, collect, or store your files."
  },
  {
    icon: <FileText className="h-5 w-5" />,
    question: "What file formats are supported?",
    answer: "OMNI supports common image types like JPG, PNG, and WEBP, as well as PDFs. When you add a PDF document, it is automatically converted into high-quality images so you can easily edit and save it."
  },
  {
    icon: <Zap className="h-5 w-5" />,
    question: "How do batch edits work?",
    answer: "You can select multiple files at once in the sidebar and apply changes like filters, crops, or resizing to all of them at the same time. This is perfect for quickly processing large sets of student work or class projects."
  },
  {
    icon: <Globe className="h-5 w-5" />,
    question: "Can I use OMNI offline?",
    answer: "Yes. Once you open the OMNI website, all core editing tools work completely offline because everything runs directly on your device. The Magic Background Remover also works without an internet connection after its smart AI tool is saved to your browser's built-in memory on its first use."
  },
  {
    icon: <Wand2 className="h-5 w-5" />,
    question: "How does the Magic Background Remover work?",
    answer: "The Background Remover uses a smart AI tool that runs entirely inside your web browser. Your images never leave your device. The first time you use it, a small tool file (~40MB) is downloaded once and saved to your browser's built-in memory. After that, it works instantly and completely offline."
  },
  {
    icon: <Shield className="h-5 w-5" />,
    question: "Does background removal upload my images anywhere?",
    answer: "Never. The background removal happens entirely on your own device, working quietly so your browser stays fast and responsive. No images, document information, or final results are ever sent to any website or server."
  },
  {
    icon: <DollarSign className="h-5 w-5" />,
    question: "Is OMNI free to use?",
    answer: "Yes, OMNI is completely free for personal, classroom, and professional use. We focus on providing a powerful, easy-to-use tool for students, teachers, and creators worldwide."
  }
];

export function FAQ() {
  return (
    <div className="container mx-auto max-w-4xl px-6 py-20 md:py-32 flex-1">
      <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-brand font-black tracking-tighter uppercase mb-6">
            Frequently Asked Questions
          </h1>
          <p className="text-muted text-sm md:text-base max-w-xl mx-auto uppercase tracking-widest font-bold">
            Everything you need to know about the OMNI workspace.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {faqs.map((faq, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + idx * 0.1, duration: 0.4 }}
              className="p-8 rounded-3xl bg-surface border border-border hover:border-accent/30 transition-colors duration-300 group"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-surface-hover text-accent group-hover:bg-accent group-hover:text-bg transition-colors shrink-0">
                  {faq.icon}
                </div>
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tight mb-3">
                    {faq.question}
                  </h3>
                  <p className="text-muted text-sm leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="mt-20 p-8 rounded-[2.5rem] bg-surface border border-border text-center relative overflow-hidden"
        >
          <div className="relative z-10">
            <h2 className="text-2xl font-black uppercase tracking-tight mb-4">Still have questions?</h2>
            <p className="text-muted text-sm mb-8 max-w-md mx-auto">
              If you couldn't find the answer you're looking for, feel free to reach out to our community or check the documentation.
            </p>
            <a 
              href="mailto:support@omni.local?subject=Question about OMNI"
              className="inline-flex px-8 py-4 rounded-2xl bg-fg text-bg text-[10px] font-black uppercase tracking-[0.2em] hover:scale-105 transition-all"
            >
              Contact Support
            </a>
          </div>
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
        </motion.div>
    </div>
  );
}
