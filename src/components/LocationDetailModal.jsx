import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import locationDetails from '../data/locationDetails.json';

function LocationDetailModal({ isOpen, onClose, location }) {
  const navigate = useNavigate();

  if (!isOpen || !location) return null;

  // Chuẩn hóa dữ liệu từ Home và Suggestions
  const title = location.title || location.name;
  const image = location.img || location.image_url || 'https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=800&auto=format&fit=crop';
  const province = location.location;

  // Lấy chi tiết từ file JSON (được parse từ docx)
  const detailData = locationDetails.find(item => item.name.toLowerCase() === title.toLowerCase());
  const description = detailData ? detailData.description : (location.description || location.desc || 'Đang cập nhật thông tin chi tiết cho địa điểm này.');

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm cursor-pointer"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-5xl bg-[#0D2D1F] rounded-[2rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 z-10 flex flex-col max-h-[90vh]"
          >
            {/* Close Button */}
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-black/50 text-white/70 hover:bg-[#D4AF37] hover:text-black hover:scale-110 transition-all border border-white/10"
            >
              <X size={20} />
            </button>

            <div className="flex flex-col lg:flex-row h-full overflow-y-auto custom-scrollbar">
              {/* Left Column: Image & Details */}
              <div className="w-full lg:w-1/2 p-8 md:p-12 flex flex-col">
                <div className="h-64 rounded-2xl overflow-hidden mb-6 relative shrink-0">
                  <img src={image} alt={title} className="w-full h-full object-cover" />
                </div>
                
                <h3 className="text-3xl md:text-4xl font-heading font-bold text-white mb-2">{title}</h3>
                <p className="flex items-center gap-2 text-sm text-gray-400 mb-4 font-bold tracking-widest uppercase">
                  <MapPin size={16} className="text-[#D4AF37]" /> {province}
                </p>

                {/* Thẻ thông tin bổ sung: Badge, Mùa Đẹp, Lượt xem */}
                {(location.badge || location.season || location.views || location.time || location.rating) && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {location.badge && (
                      <span className="bg-[#D4AF37]/20 text-[#D4AF37] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-[#D4AF37]/30">
                        {location.badge}
                      </span>
                    )}
                    {(location.season || location.time) && (
                      <span className="bg-white/5 text-white/70 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-white/10">
                        Mùa Đẹp: {location.season || location.time}
                      </span>
                    )}
                    {location.views && (
                      <span className="bg-white/5 text-white/70 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-white/10 flex items-center gap-1">
                        👁 {location.views}
                      </span>
                    )}
                    {location.rating && !location.views && (
                      <span className="bg-white/5 text-white/70 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-white/10 flex items-center gap-1">
                        👁 {location.rating}k
                      </span>
                    )}
                  </div>
                )}

                <div className="text-gray-300 text-sm leading-relaxed mb-8 flex-1">
                  <h4 className="text-[#D4AF37] text-xs font-bold uppercase tracking-widest mb-3">Giới thiệu chi tiết</h4>
                  <p className="text-justify">{description}</p>
                </div>

                <div className="flex gap-4 mt-auto shrink-0">
                  <button 
                    onClick={() => {
                      onClose();
                      navigate('/guide', { state: { locationName: title, province: province } });
                    }}
                    className="flex-1 bg-[#D4AF37] text-black py-4 rounded-xl font-bold uppercase tracking-widest text-[11px] hover:bg-white transition-all shadow-[0_0_15px_rgba(212,175,55,0.3)] hover:shadow-[0_0_25px_rgba(212,175,55,0.6)] flex items-center justify-center gap-2"
                  >
                    <BookOpen size={16} /> Xem Cẩm Nang
                  </button>
                </div>
              </div>

              {/* Right Column: Map */}
              <div className="w-full lg:w-1/2 bg-[#0A241A] border-t lg:border-t-0 lg:border-l border-white/10 relative min-h-[300px] lg:min-h-full">
                <div className="absolute inset-0 p-4">
                  <div className="w-full h-full rounded-2xl overflow-hidden border border-white/10">
                    <iframe 
                      title="map"
                      src={`https://maps.google.com/maps?q=${encodeURIComponent(title + ', ' + province + ', Vietnam')}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
                      width="100%" 
                      height="100%" 
                      style={{ border: 0, filter: 'grayscale(80%) invert(90%) contrast(80%)' }} 
                      allowFullScreen="" 
                      loading="lazy"
                    ></iframe>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default LocationDetailModal;
