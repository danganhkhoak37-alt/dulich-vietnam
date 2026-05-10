import React from 'react';

const LocationCard = ({ loc, month }) => {
  const isBestSeason = month >= loc.best_month_start && month <= loc.best_month_end;

  // Ước tính thời gian di chuyển (dựa trên khoảng cách)
  const estimateTravelTime = (distance) => {
    if (!distance) return null;
    const byBike = Math.round(distance / 35 * 60); // xe máy ~35km/h
    const byCar = Math.round(distance / 60 * 60);  // ô tô ~60km/h
    return { byBike, byCar };
  };

  const travel = estimateTravelTime(loc.distance);

  return (
    <div className="group bg-[#112418] rounded-[2rem] overflow-hidden border border-white/5 hover:border-[#D4AF37]/40 hover:shadow-[0_15px_40px_rgba(212,175,55,0.15)] transition-all duration-500 relative">

      {/* Badge mùa đẹp */}
      {isBestSeason && (
        <div className="absolute top-4 right-4 z-20 bg-[#D4AF37] text-black px-4 py-1.5 rounded-full text-[10px] font-black tracking-tight shadow-lg animate-pulse">
          ✨ ĐANG VÀO MÙA ĐẸP
        </div>
      )}

      {/* Hình ảnh */}
      <div className="aspect-[4/3] overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-t from-[#112418]/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10" />
        <img
          src={loc.image_url || 'https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=800'}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          alt={loc.name}
        />
        {/* Tag label */}
        <div className="absolute bottom-4 left-4 z-20 translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500">
          <span className="text-[10px] bg-black/50 backdrop-blur-md text-white px-3 py-1 rounded-full font-bold border border-white/20 uppercase tracking-widest">
            {loc.tag || 'Khám phá'}
          </span>
        </div>
      </div>

      {/* Nội dung */}
      <div className="p-6 space-y-4">
        <h4 className="font-bold text-[#F5F2EB] text-xl group-hover:text-[#D4AF37] transition-colors font-heading">
          {loc.name}
        </h4>

        {/* Vị trí & khoảng cách */}
        <div className="flex items-center justify-between text-white/50 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-[#D4AF37]">📍</span>
            <span className="font-medium">{loc.location || 'Vị trí xác định'}</span>
          </div>
          {loc.distance !== undefined && (
            <span className="text-[#D4AF37] text-xs font-bold bg-[#D4AF37]/10 px-2 py-1 rounded-full border border-[#D4AF37]/20">
              Cách {Math.round(loc.distance)} km
            </span>
          )}
        </div>

        {/* Ước tính thời gian di chuyển */}
        {travel && (
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white/5 rounded-xl px-3 py-2 text-center border border-white/5">
              <div className="text-base">🏍️</div>
              <div className="text-white/80 text-xs font-bold mt-0.5">
                {travel.byBike >= 60 ? `${Math.floor(travel.byBike / 60)}h ${travel.byBike % 60}m` : `${travel.byBike} phút`}
              </div>
              <div className="text-white/30 text-[10px]">xe máy</div>
            </div>
            <div className="bg-white/5 rounded-xl px-3 py-2 text-center border border-white/5">
              <div className="text-base">🚗</div>
              <div className="text-white/80 text-xs font-bold mt-0.5">
                {travel.byCar >= 60 ? `${Math.floor(travel.byCar / 60)}h ${travel.byCar % 60}m` : `${travel.byCar} phút`}
              </div>
              <div className="text-white/30 text-[10px]">ô tô</div>
            </div>
          </div>
        )}

        {/* Footer với nút xem thêm */}
        <div className="flex justify-between items-center pt-3 border-t border-white/5">
          <span className="text-white/30 text-xs uppercase tracking-widest font-bold">
            Mùa đẹp: T{loc.best_month_start}–T{loc.best_month_end}
          </span>
          <button className="p-2.5 rounded-xl bg-white/5 text-white/60 hover:bg-[#D4AF37] hover:text-black transition-all duration-300 border border-white/5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LocationCard;