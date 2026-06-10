import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, BookOpen, Compass } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import locationDetails from '../data/locationDetails.json';

// Tọa độ Street View thực tế cho TẤT CẢ địa điểm trong hệ thống
const STREET_VIEW_COORDS = {
  // ═══ 15 Địa điểm trang chủ ═══
  'vịnh hạ long':         { lat: 20.9101,  lng: 107.1839, heading: 180, pitch: 10 },
  'sapa':                 { lat: 22.3363,  lng: 103.8438, heading: 90,  pitch: 5 },
  'sa pa':                { lat: 22.3363,  lng: 103.8438, heading: 90,  pitch: 5 },
  'tràng an':             { lat: 20.2506,  lng: 105.8990, heading: 200, pitch: 10 },
  'phố cổ hội an':        { lat: 15.8801,  lng: 108.3380, heading: 120, pitch: 5 },
  'hội an':               { lat: 15.8801,  lng: 108.3380, heading: 120, pitch: 5 },
  'phú quốc':             { lat: 10.2899,  lng: 103.9840, heading: 270, pitch: 5 },
  'phong nha - kẻ bàng':  { lat: 17.5900,  lng: 106.2834, heading: 30,  pitch: 10 },
  'phong nha':            { lat: 17.5900,  lng: 106.2834, heading: 30,  pitch: 10 },
  'phong nha – kẻ bàng':  { lat: 17.5900,  lng: 106.2834, heading: 30,  pitch: 10 },
  'đà nẵng':              { lat: 16.0544,  lng: 108.2022, heading: 90,  pitch: 5 },
  'đà lạt':               { lat: 11.9404,  lng: 108.4583, heading: 180, pitch: 5 },
  'cố đô huế':            { lat: 16.4698,  lng: 107.5790, heading: 0,   pitch: 5 },
  'huế':                  { lat: 16.4698,  lng: 107.5790, heading: 0,   pitch: 5 },
  'tà xùa - hà giang':   { lat: 23.2781,  lng: 105.3620, heading: 60,  pitch: 10 },
  'tà xùa':               { lat: 21.2207,  lng: 104.6737, heading: 60,  pitch: 10 },
  'hà giang':             { lat: 23.2781,  lng: 105.3620, heading: 60,  pitch: 10 },
  'mũi né':               { lat: 10.9330,  lng: 108.2872, heading: 120, pitch: 5 },
  'cát bà':               { lat: 20.7254,  lng: 106.9958, heading: 200, pitch: 5 },
  'thánh địa mỹ sơn':    { lat: 15.7634,  lng: 108.1222, heading: 150, pitch: 10 },
  'mỹ sơn':               { lat: 15.7634,  lng: 108.1222, heading: 150, pitch: 10 },
  'gành đá đĩa':         { lat: 13.6714,  lng: 109.3788, heading: 90,  pitch: 5 },
  'cù lao chàm':         { lat: 15.9500,  lng: 108.5167, heading: 180, pitch: 5 },

  // ═══ Điểm đến theo mùa (Home.jsx) ═══
  'nha trang':            { lat: 12.2388,  lng: 109.1967, heading: 90,  pitch: 5 },
  'vịnh nha trang':       { lat: 12.2388,  lng: 109.1967, heading: 90,  pitch: 5 },
  'phú yên':              { lat: 13.0882,  lng: 109.0929, heading: 120, pitch: 5 },
  'đảo cô tô':           { lat: 20.9802,  lng: 107.7683, heading: 180, pitch: 5 },
  'cô tô':                { lat: 20.9802,  lng: 107.7683, heading: 180, pitch: 5 },
  'hà nội':               { lat: 21.0285,  lng: 105.8542, heading: 0,   pitch: 5 },
  'mù cang chải':        { lat: 21.7842,  lng: 104.0879, heading: 90,  pitch: 10 },
  'an giang':             { lat: 10.3863,  lng: 105.4381, heading: 180, pitch: 5 },
  'mộc châu':             { lat: 20.8295,  lng: 104.6392, heading: 90,  pitch: 5 },

  // ═══ Suggestions / Trending ═══
  'bà nà hills':          { lat: 15.9977,  lng: 107.9942, heading: 150, pitch: 10 },
  'hạ long':              { lat: 20.9101,  lng: 107.1839, heading: 180, pitch: 10 },

  // ═══ Danh mục: Chữa Lành & Thiên Nhiên ═══
  'hang sơn đoòng':      { lat: 17.5440,  lng: 106.1443, heading: 30,  pitch: 15 },
  'fansipan':             { lat: 22.3033,  lng: 103.7750, heading: 180, pitch: 20 },
  'mã pí lèng':          { lat: 23.2333,  lng: 105.4000, heading: 90,  pitch: 10 },
  'đèo ô quy hồ':       { lat: 22.3500,  lng: 103.7667, heading: 270, pitch: 10 },
  'sìn hồ':               { lat: 22.3667,  lng: 103.2333, heading: 90,  pitch: 5 },
  'na hang':              { lat: 22.3547,  lng: 105.3872, heading: 120, pitch: 5 },
  'bản giốc':             { lat: 22.8548,  lng: 106.7244, heading: 0,   pitch: 10 },
  'ngườm ngao':           { lat: 22.8100,  lng: 106.6400, heading: 30,  pitch: 10 },
  'hồ ba bể':            { lat: 22.4167,  lng: 105.6167, heading: 180, pitch: 5 },
  'rừng tràm trà sư':    { lat: 10.6833,  lng: 105.0667, heading: 90,  pitch: 5 },
  'núi cấm':              { lat: 10.5167,  lng: 105.0000, heading: 180, pitch: 10 },

  // ═══ Danh mục: Biển Đảo Mùa Hè ═══
  'biển mỹ khê':         { lat: 16.0328,  lng: 108.2468, heading: 90,  pitch: 5 },
  'biển sầm sơn':        { lat: 19.7400,  lng: 105.9000, heading: 90,  pitch: 5 },
  'biển cửa lò':         { lat: 18.7928,  lng: 105.7203, heading: 90,  pitch: 5 },
  'biển thiên cầm':      { lat: 18.4833,  lng: 105.9500, heading: 90,  pitch: 5 },
  'đồ sơn':               { lat: 20.7128,  lng: 106.7903, heading: 180, pitch: 5 },
  'biển đồng châu':      { lat: 20.4500,  lng: 106.5833, heading: 90,  pitch: 5 },
  'hang rái':             { lat: 11.5833,  lng: 109.0167, heading: 90,  pitch: 10 },
  'bàu trắng':           { lat: 10.9500,  lng: 108.3333, heading: 120, pitch: 5 },
  'đảo phú quý':         { lat: 10.5333,  lng: 108.9500, heading: 180, pitch: 5 },

  // ═══ Danh mục: Văn Hoá & Lịch Sử ═══
  'đại nội huế':         { lat: 16.4698,  lng: 107.5790, heading: 0,   pitch: 5 },
  'thành nhà hồ':        { lat: 20.0667,  lng: 105.6000, heading: 90,  pitch: 5 },
  'văn miếu':             { lat: 21.0286,  lng: 105.8355, heading: 180, pitch: 5 },
  'chùa thiên mụ':       { lat: 16.4533,  lng: 107.5414, heading: 90,  pitch: 10 },
  'chùa hương tích':     { lat: 20.6192,  lng: 105.7444, heading: 180, pitch: 10 },
  'làng sen quê bác':    { lat: 18.6833,  lng: 105.4833, heading: 90,  pitch: 5 },
  'thành cổ quảng trị':  { lat: 16.7333,  lng: 107.1833, heading: 0,   pitch: 5 },
  'cầu hiền lương':      { lat: 16.8833,  lng: 107.0833, heading: 90,  pitch: 5 },
  'lăng chủ tịch hồ chí minh': { lat: 21.0368, lng: 105.8344, heading: 180, pitch: 5 },
  'đền hùng':             { lat: 21.3500,  lng: 105.3333, heading: 90,  pitch: 10 },
  'chùa dâu':             { lat: 21.0833,  lng: 106.0667, heading: 180, pitch: 5 },
  'chùa bút tháp':       { lat: 21.0833,  lng: 106.0500, heading: 90,  pitch: 5 },
  'đền trần':             { lat: 20.4167,  lng: 106.1667, heading: 0,   pitch: 5 },
  'tam chúc':             { lat: 20.4500,  lng: 105.7667, heading: 180, pitch: 10 },
  'tân trào':             { lat: 21.8833,  lng: 105.5167, heading: 90,  pitch: 5 },
  'tháp bà ponagar':     { lat: 12.2653,  lng: 109.1949, heading: 120, pitch: 10 },
  'nhà cổ bình thủy':    { lat: 10.0667,  lng: 105.7333, heading: 180, pitch: 5 },
  'miếu bà chúa xứ':    { lat: 10.7167,  lng: 105.0000, heading: 90,  pitch: 5 },
  'chùa vĩnh tràng':    { lat: 10.3500,  lng: 106.3667, heading: 180, pitch: 5 },
  'nhà công tử bạc liêu': { lat: 9.2833,  lng: 105.7167, heading: 0,   pitch: 5 },

  // ═══ Danh mục: Phượt & Khám Phá ═══
  'mai châu':             { lat: 20.6539,  lng: 105.0847, heading: 120, pitch: 5 },
  'tam đảo':              { lat: 21.4583,  lng: 105.6417, heading: 180, pitch: 10 },
  'chợ bến thành':       { lat: 10.7725,  lng: 106.6980, heading: 90,  pitch: 5 },
  'phố đi bộ nguyễn huệ': { lat: 10.7741, lng: 106.7037, heading: 0,   pitch: 5 },
  'đồng văn':             { lat: 23.2743,  lng: 105.3588, heading: 60,  pitch: 10 },
  'lũng cú':              { lat: 23.3633,  lng: 105.3193, heading: 0,   pitch: 10 },
  'cát cát':              { lat: 22.3267,  lng: 103.8350, heading: 120, pitch: 10 },
  'tam cốc':              { lat: 20.2147,  lng: 105.9236, heading: 180, pitch: 5 },
  'hang múa':             { lat: 20.2169,  lng: 105.9136, heading: 90,  pitch: 15 },
  'hồ gươm':             { lat: 21.0288,  lng: 105.8524, heading: 0,   pitch: 5 },
  'hồ hoàn kiếm':        { lat: 21.0288,  lng: 105.8524, heading: 0,   pitch: 5 },
  'sông hương':           { lat: 16.4637,  lng: 107.5909, heading: 90,  pitch: 5 },
  'đồi chè':             { lat: 20.8300,  lng: 104.6400, heading: 90,  pitch: 5 },
  'thác dải yếm':        { lat: 20.8833,  lng: 104.6333, heading: 180, pitch: 10 },
  'đèo khau phạ':        { lat: 21.7000,  lng: 104.1333, heading: 90,  pitch: 10 },
  'đồi a1':               { lat: 21.3833,  lng: 103.0167, heading: 0,   pitch: 5 },
  'hồ hòa bình':         { lat: 20.8167,  lng: 105.0500, heading: 180, pitch: 5 },
  'thanh thủy':           { lat: 20.9333,  lng: 105.2500, heading: 90,  pitch: 5 },
  'tây thiên':            { lat: 21.4500,  lng: 105.6333, heading: 180, pitch: 10 },
  'hồ núi cốc':          { lat: 21.5667,  lng: 105.7833, heading: 90,  pitch: 5 },
  'mẫu sơn':              { lat: 21.8667,  lng: 106.8833, heading: 60,  pitch: 10 },
  'bán đảo sơn trà':     { lat: 16.1131,  lng: 108.2761, heading: 180, pitch: 5 },
  'eo gió':               { lat: 13.7500,  lng: 109.2833, heading: 90,  pitch: 5 },
  'kỳ co':                { lat: 13.7333,  lng: 109.3000, heading: 90,  pitch: 5 },
  'bãi xép':              { lat: 13.1333,  lng: 109.3000, heading: 90,  pitch: 5 },
  'nhà thờ đức bà':      { lat: 10.7798,  lng: 106.6990, heading: 0,   pitch: 10 },
  'landmark 81':          { lat: 10.7952,  lng: 106.7219, heading: 180, pitch: 15 },
  'chợ nổi cái răng':    { lat: 10.0186,  lng: 105.7428, heading: 90,  pitch: 5 },
  'bến ninh kiều':       { lat: 10.0333,  lng: 105.7833, heading: 180, pitch: 5 },
  'cù lao thới sơn':    { lat: 10.3500,  lng: 106.3167, heading: 90,  pitch: 5 },

  // ═══ Các thành phố / tỉnh lớn (fallback) ═══
  'quảng ninh':           { lat: 20.9101,  lng: 107.1839, heading: 180, pitch: 10 },
  'lào cai':              { lat: 22.3363,  lng: 103.8438, heading: 90,  pitch: 5 },
  'ninh bình':            { lat: 20.2506,  lng: 105.8990, heading: 200, pitch: 10 },
  'quảng nam':            { lat: 15.8801,  lng: 108.3380, heading: 120, pitch: 5 },
  'kiên giang':           { lat: 10.2899,  lng: 103.9840, heading: 270, pitch: 5 },
  'quảng bình':           { lat: 17.5900,  lng: 106.2834, heading: 30,  pitch: 10 },
  'lâm đồng':            { lat: 11.9404,  lng: 108.4583, heading: 180, pitch: 5 },
  'thừa thiên huế':      { lat: 16.4698,  lng: 107.5790, heading: 0,   pitch: 5 },
  'bình thuận':           { lat: 10.9330,  lng: 108.2872, heading: 120, pitch: 5 },
  'hải phòng':            { lat: 20.7254,  lng: 106.9958, heading: 200, pitch: 5 },
  'phú yên':              { lat: 13.0882,  lng: 109.0929, heading: 120, pitch: 5 },
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

function getStreetViewEmbedUrl(title, province) {
  const key = title.toLowerCase().trim();
  let coords = STREET_VIEW_COORDS[key];
  
  // Nếu không tìm thấy chính xác, thử tìm theo substring
  if (!coords) {
    const keys = Object.keys(STREET_VIEW_COORDS);
    const match = keys.find(k => key.includes(k) || k.includes(key));
    if (match) coords = STREET_VIEW_COORDS[match];
  }
  
  // Thử match theo tỉnh/thành phố
  if (!coords && province) {
    const provKey = province.toLowerCase().trim();
    coords = STREET_VIEW_COORDS[provKey];
  }

  if (coords) {
    return `https://maps.google.com/maps?q=&layer=c&cbll=${coords.lat},${coords.lng}&cbp=11,${coords.heading},0,0,${coords.pitch}&ie=UTF8&source=embed&output=svembed`;
  }
  
  // Fallback cuối cùng: dùng tên địa điểm để Google tự tìm Street View
  return `https://maps.google.com/maps?q=${encodeURIComponent(title + ', ' + (province || '') + ', Vietnam')}&layer=c&ie=UTF8&source=embed&output=svembed`;
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

  const streetViewEmbedUrl = getStreetViewEmbedUrl(title, province);
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
                  <iframe
                    title="street-view-3d"
                    src={streetViewEmbedUrl}
                    className="absolute inset-0 w-full h-full"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                  />
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
