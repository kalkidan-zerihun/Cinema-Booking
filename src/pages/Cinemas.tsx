import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Film, Sparkles, ArrowRight, Tv, Armchair, ShieldCheck } from 'lucide-react';
import { Cinema } from '../types';
import { getCinemas } from '../services/cinemas';

export const Cinemas: React.FC = () => {
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCinemas().then((list) => {
      setCinemas(list);
      setLoading(false);
    });
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-amber-400">
          <MapPin className="w-4 h-4" />
          <span>Cinema Venues</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Destinations & Lounges
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
          Discover our luxurious cinema complexes in Addis Ababa featuring cutting-edge laser projection, Dolby Atmos spatial audio, and gourmet concession bars.
        </p>
      </div>

      {/* Cinema Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-80 rounded-2xl bg-white/[0.03] animate-pulse border border-white/[0.06]"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cinemas.map((cinema) => (
            <div
              key={cinema.id}
              className="bg-[#0c101a] border border-white/[0.08] hover:border-amber-400/50 rounded-2xl overflow-hidden shadow-xl transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                {/* Photo Banner */}
                <div className="relative aspect-[16/9] bg-slate-900 overflow-hidden">
                  <img
                    src={cinema.imageUrl}
                    alt={cinema.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0c101a] via-transparent to-black/40" />
                  <div className="absolute top-3 left-3">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-black/70 backdrop-blur-md text-amber-400 border border-amber-400/30">
                      {cinema.location}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 space-y-3">
                  <h3 className="text-lg sm:text-xl font-bold text-white group-hover:text-amber-400 transition-colors">
                    {cinema.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    {cinema.description}
                  </p>

                  <div className="space-y-1.5 pt-2 text-xs text-slate-400 border-t border-white/[0.06]">
                    {cinema.address && (
                      <div className="flex items-start space-x-2">
                        <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <span>{cinema.address}</span>
                      </div>
                    )}
                    {cinema.phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>{cinema.phone}</span>
                      </div>
                    )}
                  </div>

                  {cinema.amenities && (
                    <div className="pt-1">
                      <div className="flex flex-wrap gap-1.5">
                        {cinema.amenities.map((amenity, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-white/[0.04] text-slate-300 border border-white/[0.06]"
                          >
                            {amenity}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <div className="p-5 pt-0">
                <Link
                  to={`/cinemas/${cinema.id}`}
                  className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider bg-amber-400 text-slate-950 hover:bg-amber-300 transition-colors shadow-md shadow-amber-400/20"
                >
                  <Film className="w-3.5 h-3.5" />
                  <span>View Halls & Showtimes</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
