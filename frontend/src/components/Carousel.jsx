import React from 'react';
import { Spinner } from './Loader';
import { toast } from 'react-toastify';

const AUTOPLAY_MS = 4500;

export default function Carousel({ className = '' }) {
  const [images, setImages] = React.useState([]);
  const [idx, setIdx] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [paused, setPaused] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    fetch('/images/slider/index.json')
      .then(r => r.json())
      .then(data => {
        if (!mounted) return;
        setImages(data.images || []);
      })
      .catch(() => {
        // fallback to a single sample
        toast.info('Slider images not found; showing fallback.');
        setImages(['/images/slider/sample1.svg']);
      })
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  React.useEffect(() => {
    if (paused || images.length <= 1) return;
    const id = setInterval(() => setIdx(i => (i + 1) % images.length), AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [images, paused]);

  if (loading) return <div className={`w-full h-64 flex items-center justify-center ${className}`}><Spinner /></div>;

  const current = images[idx];

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className={`relative w-full overflow-hidden ${className}`}
    >
      {images.map((src, i) => (
        <img
          key={src}
          src={src}
          alt={`slide-${i}`}
          loading="lazy"
          className={`w-full h-64 md:h-96 object-cover absolute top-0 left-0 transition-opacity duration-700 ${i === idx ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
        />
      ))}

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {/* overlay gradient */}
        <div className="absolute inset-0 bg-black bg-opacity-25" />
      </div>

      <div className="absolute bottom-6 left-6 text-white z-20">
        <h2 className="text-3xl md:text-4xl font-bold">HuteFast — Book your trip</h2>
        <p className="mt-2 max-w-xl">Reliable transport across Rwanda — safe, affordable, and on time.</p>
      </div>

      <div className="absolute bottom-6 right-6 z-20">
        <a href="/register" className="bg-white text-primary px-4 py-2 rounded shadow-lg">Book Now</a>
      </div>
    </div>
  );
}
