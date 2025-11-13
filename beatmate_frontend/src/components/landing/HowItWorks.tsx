const HowItWorks = () => {
  const steps = [
    {
      number: "01",
      icon: "✍️",
      title: "Write lyrics or a vibe",
      description: "Type your lyrics, describe a mood, or share your musical idea. BeatMate understands your creative vision."
    },
    {
      number: "02", 
      icon: "🎸",
      title: "Pick a genre & style",
      description: "Choose from dozens of genres and styles. From rock to lo-fi, jazz to EDM - we've got you covered."
    },
    {
      number: "03",
      icon: "🚀", 
      title: "Generate & share instantly",
      description: "Watch as BeatMate creates your song in seconds. Download, share, or collaborate with friends in real-time."
    }
  ];

  return (
    <section id="how-it-works" className="py-24 bg-muted/20">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            How It <span className="text-gradient">Works</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Creating music has never been this simple. Three steps to your perfect song.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((step, index) => (
            <div 
              key={index}
              className="relative text-center group"
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              {/* Step Number */}
              <div className="absolute -top-4 -left-4 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20">
                <span className="text-primary font-bold">{step.number}</span>
              </div>

              <div className="feature-card h-full">
                {/* Icon */}
                <div className="text-6xl mb-6 group-hover:animate-bounce">
                  {step.icon}
                </div>

                {/* Content */}
                <h3 className="text-2xl font-bold mb-4 text-gradient">
                  {step.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-6 lg:-right-12 w-12 lg:w-24 h-0.5 bg-gradient-to-r from-primary to-accent"></div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;



