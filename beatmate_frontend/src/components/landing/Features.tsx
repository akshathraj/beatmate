const Features = () => {
  const features = [
    {
      icon: "🎤",
      title: "Smart Song Generator",
      description: "Advanced AI creates complete songs from your ideas in seconds"
    },
    {
      icon: "🎬",
      title: "Lyric Video Creator", 
      description: "Generate stunning lyric videos with custom visuals and animations"
    },
    {
      icon: "🎵",
      title: "Remix Studio",
      description: "Blend multiple songs together to create unique AI-powered mashups"
    },
    {
      icon: "📂",
      title: "Save & Download",
      description: "Keep your creations forever with high-quality downloads"
    },
    {
      icon: "🎧",
      title: "Built-in Player",
      description: "Listen and share your music with our seamless audio player"
    },
    {
      icon: "⚡",
      title: "Lightning Fast",
      description: "Generate songs instantly with our optimized BeatMate engine"
    }
  ];

  return (
    <section id="features" className="py-24 bg-muted/20">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Powerful <span className="text-gradient">Features</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need to create, collaborate, and share amazing music powered by BeatMate.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="feature-card group"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="text-4xl mb-4 group-hover:animate-bounce">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold mb-3 text-gradient">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;

