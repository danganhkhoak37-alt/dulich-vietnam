import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, BookOpen, Compass } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import locationDetails from '../data/locationDetails.json';

// Tọa độ Street View thực tế cho 15 địa điểm nổi bật
const STREET_VIEW_COORDS = {
  'vịnh hạ long':     { lat: 20.9101,  lng: 107.1839, heading: 180, pitch: 10 },
  'sapa':             { lat: 22.3363,  lng: 103.8438, heading: 90,  pitch: 5 },
  'tràng an':         { lat: 20.2506,  lng: 105.8990, heading: 200, pitch: 10 },
  'phố cổ hội an':    { lat: 15.8801,  lng: 108.3380, heading: 120, pitch: 5 },
  'phú quốc':         { lat: 10.2899,  lng: 103.9840, heading: 270, pitch: 5 },
  'phong nha - kẻ bàng': { lat: 17.5900, lng: 106.2834, heading: 30,  pitch: 10 },
  'đà nẵng':          { lat: 16.0544,  lng: 108.2022, heading: 90,  pitch: 5 },
  'đà lạt':           { lat: 11.9404,  lng: 108.4583, heading: 180, pitch: 5 },
  'cố đô huế':        { lat: 16.4698,  lng: 107.5790, heading: 0,   pitch: 5 },
  'tà xùa - hà giang': { lat: 23.2781, lng: 105.3620, heading: 60,  pitch: 10 },
  'mũi né':           { lat: 10.9330,  lng: 108.2872, heading: 120, pitch: 5 },
  'cát bà':           { lat: 20.7254,  lng: 106.9958, heading: 200, pitch: 5 },
  'thánh địa mỹ sơn': { lat: 15.7634,  lng: 108.1222, heading: 150, pitch: 10 },
  'gành đá đĩa':     { lat: 13.6714,  lng: 109.3788, heading: 90,  pitch: 5 },
  'cù lao chàm':     { lat: 15.9500,  lng: 108.5167, heading: 180, pitch: 5 },
};

function getStreetViewUrl(title, province) {
  const key = title.toLowerCase().trim();
  const coords = STREET_VIEW_COORDS[key];
  if (coords) {
    return `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${coords.lat},${coords.lng}&heading=${coords.heading}&pitch=${coords.pitch}&fov=90`;
  }
  // Fallback: tìm kiếm Street View theo tên
  return `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=&pano=&heading=0&pitch=0&fov=90&query=${encodeURIComponent(title + ', ' + province + ', Vietnam')}`;
}

function getStreetViewEmbedUrl(title) {
  const key = title.toLowerCase().trim();
  const coords = STREET_VIEW_COORDS[key];
  if (coords) {
    return `https://maps.google.com/maps?q=&layer=c&cbll=${coords.lat},${coords.lng}&cbp=11,${coords.heading},0,0,${coords.pitch}&ie=UTF8&source=embed&output=svembed`;
  }
  return null;
}

function LocationDetailModal({ isOpen, onClose, location }) {
  const navigate = useNavigate();
  const [show3D, setShow3D] = useState(false);

  if (!isOpen || !location) return null;

  // Chuẩn hóa dữ liệu từ Home và Suggestions
  const title = location.title || location.name;
  const image = location.img || location.image_url || 'https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=800&auto=format&fit=crop';
  const province = location.location;

  // Lấy chi tiết từ file JSON (được parse từ docx)
  const detailData = locationDetails.find(item => item.name.toLowerCase() === title.toLowerCase());
  const description = detailData ? detailData.description : (location.description || location.desc || 'Đang cập nhật thông tin chi tiết cho địa điểm này.');

  const streetViewEmbedUrl = getStreetViewEmbedUrl(title);
  const streetViewExternalUrl = getStreetViewUrl(title, province);

  const handleClose3D = () => setShow3D(false);
  const handleCloseAll = () => {
    setShow3D(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            onClick={handleCloseAll}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm cursor-pointer"
          />

          {/* ============ CHẾ ĐỘ 3D STREET VIEW ============ */}
          <AnimatePresence>
            {show3D && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="fixed inset-0 z-[200] bg-black flex flex-col"
              >
                {/* Header bar */}
                <div className="relative z-10 flex items-center justify-between px-6 py-4 bg-gradient-to-b from-black/90 via-black/60 to-transparent">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#D4AF37]/20 flex items-center justify-center border border-[#D4AF37]/40">
                      <Compass size={20} className="text-[#D4AF37] animate-spin" style={{ animationDuration: '8s' }} />
                    </div>
                    <div>
                      <h3 className="text-white font-heading font-bold text-lg leading-tight">{title}</h3>
                      <p className="flex items-center gap-1 text-gray-400 text-xs font-medium">
                        <MapPin size={12} className="text-[#D4AF37]" /> {province} · Không gian 3D
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <a
                      href={streetViewExternalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white text-xs font-bold uppercase tracking-widest hover:bg-[#D4AF37] hover:text-black transition-all border border-white/10"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                      Mở Google Maps
                    </a>
                    <button
                      onClick={handleClose3D}
                      className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-red-500 hover:text-white transition-all border border-white/10"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>

                {/* Street View iframe */}
                <div className="flex-1 relative">
                  {streetViewEmbedUrl ? (
                    <iframe
                      title="street-view-3d"
                      src={streetViewEmbedUrl}
                      className="absolute inset-0 w-full h-full"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                    />
                  ) : (
                    <iframe
                      title="street-view-3d-fallback"
                      src={`https://maps.google.com/maps?q=${encodeURIComponent(title + ', ' + province + ', Vietnam')}&layer=c&ie=UTF8&source=embed&output=svembed`}
                      className="absolute inset-0 w-full h-full"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                    />
                  )}
                  {/* Loading overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-[#0A241A] pointer-events-none animate-pulse" style={{ zIndex: -1 }}>
                    <div className="text-center">
                      <Compass size={48} className="text-[#D4AF37] mx-auto mb-4 animate-spin" style={{ animationDuration: '3s' }} />
                      <p className="text-white font-heading font-bold text-xl mb-2">Đang tải không gian 3D...</p>
                      <p className="text-gray-400 text-sm">Bạn có thể kéo chuột để khám phá xung quanh</p>
                    </div>
                  </div>
                </div>

                {/* Bottom hint */}
                <div className="bg-gradient-to-t from-black/90 via-black/60 to-transparent px-6 py-3 flex items-center justify-center gap-3">
                  <span className="text-gray-400 text-xs">🖱️ Kéo để xoay · 📌 Click mũi tên để di chuyển · 🔍 Scroll để zoom</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ============ MODAL CHI TIẾT CHÍNH ============ */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-5xl bg-[#0D2D1F] rounded-[2rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 z-10 flex flex-col max-h-[90vh]"
          >
            {/* Close Button */}
            <button 
              onClick={handleCloseAll}
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

                <div className="flex gap-3 mt-auto shrink-0">
                  <button 
                    onClick={() => setShow3D(true)}
                    className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-4 rounded-xl font-bold uppercase tracking-widest text-[11px] hover:from-cyan-400 hover:to-blue-500 transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] flex items-center justify-center gap-2 relative overflow-hidden group"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                    <Compass size={16} className="relative z-10" /> 
                    <span className="relative z-10">Khám Phá 3D</span>
                  </button>
                  <button 
                    onClick={() => {
                      handleCloseAll();
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
