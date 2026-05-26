import { ShieldCheck, Layers, Sliders, Maximize, FileOutput, Focus, Wand2 } from "lucide-react";

export function Features() {
  const features = [
    {
      title: "Format Converter",
      description: "Convert files easily between JPG, PNG, and WEBP formats, or combine a whole batch of photos into a single PDF.",
      icon: <FileOutput className="h-5 w-5" />,
    },
    {
      title: "Precise Crop & Resize",
      description: "Easy crop tools paired with precise resizing that keeps your images from stretching or distorting.",
      icon: <Maximize className="h-5 w-5" />,
    },
    {
      title: "Fast Batch Editing",
      description: "Load multiple files at once, edit one image, then apply those edits to every file in your batch — or reset them all in one tap.",
      icon: <Layers className="h-5 w-5" />,
    },
    {
      title: "Clear Document Enhancers",
      description: "Choose from 14 custom filters like Clean Scan, Mono Sharp, and Blueprint to make scanned pages look crisp and readable.",
      icon: <Focus className="h-5 w-5" />,
    },
    {
      title: "Magic Background Remover",
      description: "Instantly remove backgrounds using smart AI that runs safely and quietly right inside your web browser.",
      icon: <Wand2 className="h-5 w-5" />,
    },
    {
      title: "Absolute Privacy",
      description: "Your files never leave your device. All editing and processing happens directly on your computer or tablet.",
      icon: <ShieldCheck className="h-5 w-5" />,
    },
  ];

  return (
    <section id="features" className="py-24 md:py-32 bg-surface">
      <div className="container mx-auto max-w-[1400px] px-6">
         <div className="mb-16">
          <h2 className="font-brand text-4xl md:text-5xl font-black tracking-tighter text-fg uppercase">Pro-Grade Tools.</h2>
          <p className="mt-4 text-muted font-bold uppercase tracking-widest text-sm">A complete set of easy-to-use editing tools that run fast, clean, and entirely on your own device.</p>
        </div>

         <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
           {features.map((feature, idx) => (
             <div key={idx} className="group flex flex-col items-start transition-all">
                <div className="mb-6 inline-flex rounded-lg bg-surface-hover/50 p-4 text-fg ring-1 ring-border transition-all duration-300 group-hover:-translate-y-1 group-hover:bg-accent group-hover:text-accent-fg group-hover:ring-accent group-hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] dark:group-hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.05)]">
                   {feature.icon}
                </div>
                <h3 className="text-[14px] font-black uppercase tracking-[0.1em] text-fg mb-3 flex items-center gap-2">
                  {feature.title}
                </h3>
                <p className="text-[13px] text-muted leading-relaxed font-medium max-w-[90%]">
                  {feature.description}
                </p>
             </div>
           ))}
         </div>
      </div>
    </section>
  );
}
