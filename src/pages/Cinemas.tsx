import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Film, Sparkles, ArrowRight, Tv } from 'lucide-react';
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-widest text-red-500">
          <MapPin className="w-4 h-4" />
          <span>CINEMA VENUES & LOUNGES</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          Kali Cinema Destinations
        </h1>
        <p className="text-sm text-gray-400 max-w-2xl">
          Discover our luxurious cinema complexes in Addis Ababa featuring cutting-edge laser projection, Dolby Atmos spatial audio, and gourmet concession bars.
        </p>
      </div>

      {/* Cinema Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-96 rounded-3xl bg-[#141520] animate-pulse border border-[#222432]"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {cinemas.map((cinema) => (
            <div
              key={cinema.id}
              className="bg-[#12131d] border border-[#232535] hover:border-red-600/40 rounded-3xl overflow-hidden shadow-2xl transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                {/* Photo Banner */}
                <div className="relative aspect-[16/9] bg-[#1a1b28] overflow-hidden">
                  <img
                    src={cinema.imageUrl}
                    alt={cinema.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#12131d] via-transparent to-black/30" />
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-black/70 backdrop-blur-md text-red-400 border border-red-500/30">
                      {cinema.location}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                  <h3 className="text-2xl font-black text-white">{cinema.name}</h3>
                  <p className="text-sm text-gray-300 leading-relaxed">{cinema.description}</p>

                  <div className="space-y-2 pt-2 text-xs text-gray-400 border-t border-[#1e202e]">
                    {cinema.address && (
                      <div className="flex items-start space-x-2">
                        <MapPin className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                        <span>{cinema.address}</span>
                      </div>
                    )}
                    {cinema.phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-red-500 shrink-0" />
                        <span>{cinema.phone}</span>
                      </div>
                    )}
                  </div>

                  {cinema.amenities && (
                    <div className="pt-2">
                      <span className="text-[11px] font-bold uppercase text-gray-400 block mb-2">
                        Featured Amenities:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {cinema.amenities.map((amenity, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#181a26] text-gray-200 border border-[#292c3d]"
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
              <div className="p-6 pt-0">
                <Link
                  to={`/cinemas/${cinema.id}`}
                  className="w-full flex items-center justify-center space-x-2 py-3.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider bg-[#e50914] text-white hover:bg-red-600 transition-colors shadow-lg shadow-red-950/40"
                >
                  <Film className="w-4 h-4" />
                  <span>View Halls & Showtimes</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
