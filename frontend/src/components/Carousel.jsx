import React from 'react';
import { Spinner } from './Loader';
import { toast } from 'react-toastify';

const AUTOPLAY_MS = 5000; // 5 seconds auto-slide
const SLIDE_ANIMATION_MS = 800; // Smooth transition duration

export default function Carousel({ className = '' }) {
  const [images, setImages] = React.useState([]);
  const [idx, setIdx] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [paused, setPaused] = React.useState(false);
  const [autoplayActive, setAutoplayActive] = React.useState(true);

  // Load carousel images
  React.useEffect(() => {
    let mounted = true;
    fetch('/images/slider/index.json')
      .then(r => r.json())
      .then(data => {
        if (!mounted) return;
        const imageList = data.images || [];
        if (imageList.length === 0) {
          setImages(['/images/slider/sample1.svg']);
        } else {
          setImages(imageList);
        }
      })
      .catch((err) => {
        console.warn('Slider images not found:', err);
        setImages(['/images/slider/sample1.svg']);
      })
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  // Auto-play animation
  React.useEffect(() => {
    if (paused || !autoplayActive || images.length <= 1) return;
    const id = setInterval(() => {
      setIdx(i => (i + 1) % images.length);
    }, AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [images, paused, autoplayActive]);

  // Navigation handlers
  const goToSlide = (newIdx) => {
    setIdx(newIdx);
    setAutoplayActive(true);
  };

  const nextSlide = () => {
    setIdx(i => (i + 1) % images.length);
    setAutoplayActive(true);
  };

  const prevSlide = () => {
    setIdx(i => (i - 1 + images.length) % images.length);
    setAutoplayActive(true);
  };

  if (loading) {
    return (
      <div className={`w-full h-64 sm:h-80 md:h-96 lg:h-[500px] flex items-center justify-center bg-gray-200 ${className}`}>
        <Spinner />
      </div>
    );
  }

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className={`relative w-full h-64 sm:h-80 md:h-96 lg:h-[500px] overflow-hidden bg-gray-900 group ${className}`}
    >
      {/* Slides */}
      <div className="relative w-full h-full">
        {images.map((src, i) => (
          <img
            key={`${src}-${i}`}
            src={src}
            alt={`slide-${i}`}
            loading={i === idx ? 'eager' : 'lazy'}
            className={`w-full h-full object-cover absolute top-0 left-0 transition-opacity duration-${SLIDE_ANIMATION_MS} ${
              i === idx ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          />
        ))}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40 z-5" />
      </div>

      {/* Content Overlay */}
      <div className="absolute inset-0 flex flex-col justify-between p-4 sm:p-6 md:p-8 z-20">
        {/* Top Content */}
        <div className="flex flex-col justify-start">
          <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-2 sm:mb-3 md:mb-4 drop-shadow-lg leading-tight">
            EHUT – Smart Transport Booking
          </h1>
          <div className="space-y-1 sm:space-y-2 max-w-2xl">
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-semibold text-white drop-shadow-md">
              Fast. Secure. Reliable.
            </p>
            <p className="text-sm sm:text-base md:text-lg text-white/90 drop-shadow-md">
              Book Your Trip Anytime, Anywhere
            </p>
          </div>
        </div>

        {/* CTA Button */}
        <div className="flex justify-end">
          <a
            href="/book-request"
            className="bg-white text-primary px-4 sm:px-6 py-2 sm:py-3 rounded-lg shadow-lg font-bold hover:bg-gray-100 transition-colors duration-300 transform hover:scale-105"
          >
            Book Now
          </a>
        </div>
      </div>

      {/* Previous Button */}
      <button
        onClick={prevSlide}
        className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-30 bg-white/20 hover:bg-white/40 text-white p-2 sm:p-3 rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100"
        aria-label="Previous slide"
      >
        <svg className="w-5 sm:w-6 h-5 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Next Button */}
      <button
        onClick={nextSlide}
        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-30 bg-white/20 hover:bg-white/40 text-white p-2 sm:p-3 rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100"
        aria-label="Next slide"
      >
        <svg className="w-5 sm:w-6 h-5 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Dot Navigation */}
      {images.length > 1 && (
        <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-30 flex gap-2">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => goToSlide(i)}
              className={`w-2 sm:w-3 h-2 sm:h-3 rounded-full transition-all duration-300 ${
                i === idx
                  ? 'bg-white w-6 sm:w-8'
                  : 'bg-white/50 hover:bg-white/75'
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}

      {/* Slide Counter */}
      {images.length > 1 && (
        <div className="absolute top-4 right-4 z-30 bg-black/40 text-white px-3 py-1 rounded-full text-sm">
          {idx + 1} / {images.length}
        </div>
      )}
    </div>
  );
}
