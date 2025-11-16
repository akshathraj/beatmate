import { useState, useEffect } from "react";

const Testimonials = () => {
  const testimonials = [
    {
      id: 1,
      name: "Mark Johnson",
      role: "Music Producer",
      avatar: "M",
      content: "It feels like magic. I wrote a mood, and 30 seconds later I had a full track! BeatMate has revolutionized my creative process.",
      rating: 5
    },
    {
      id: 2,
      name: "Supreet Dey", 
      role: "Singer-Songwriter",
      avatar: "M",
      content: "The collaboration features are incredible. My band can create music together even when we're in different cities. Game changer!",
      rating: 5
    },
    {
      id: 3,
      name: "Supreet Dey",
      role: "Content Creator",
      avatar: "M", 
      content: "As someone with zero musical background, BeatMate lets me create professional-sounding tracks for my videos. Absolutely amazing!",
      rating: 5
    },
    {
      id: 4,
      name: "Supreet Dey",
      role: "DJ & Producer",
      avatar: "M",
      content: "BeatMate understands musical styles incredibly well. I can generate variations of my tracks instantly. This is the future of music creation.",
      rating: 5
    }
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [testimonials.length]);

  return (
    <section id="testimonials" className="py-24">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            What Creators <span className="text-gradient">Say</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Join thousands of musicians, producers, and creators who are already making magic with BeatMate.
          </p>
        </div>

        {/* Carousel */}
        <div className="relative max-w-4xl mx-auto">
          <div className="overflow-hidden">
            <div 
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {testimonials.map((testimonial) => (
                <div key={testimonial.id} className="w-full flex-shrink-0 px-4">
                  <div className="testimonial-card mx-auto text-center">
                    {/* Stars */}
                    <div className="flex justify-center space-x-1 mb-6">
                      {Array.from({ length: testimonial.rating }).map((_, i) => (
                        <span key={i} className="text-primary text-xl">★</span>
                      ))}
                    </div>

                    {/* Content */}
                    <blockquote className="text-lg text-foreground mb-6 leading-relaxed">
                      "{testimonial.content}"
                    </blockquote>

                    {/* Author */}
                    <div className="flex items-center justify-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center">
                        <span className="text-primary-foreground font-bold">
                          {testimonial.avatar}
                        </span>
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-foreground">
                          {testimonial.name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {testimonial.role}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dots */}
          <div className="flex justify-center space-x-2 mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentIndex 
                    ? "bg-primary scale-125" 
                    : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 pt-16 border-t border-border">
          <div className="text-center">
            <div className="text-3xl font-bold text-gradient mb-2">10K+</div>
            <div className="text-muted-foreground">Songs Created</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gradient mb-2">5K+</div>
            <div className="text-muted-foreground">Active Users</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gradient mb-2">50+</div>
            <div className="text-muted-foreground">Music Genres</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gradient mb-2">99%</div>
            <div className="text-muted-foreground">User Satisfaction</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
