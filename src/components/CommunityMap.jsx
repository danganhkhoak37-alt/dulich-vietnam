import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix cho icon mặc định
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MOCK_USERS = [
  { id: 1, name: 'Phượt Thủ 9x', ava: 'https://i.pravatar.cc/150?img=11', lat: 16.0544, lng: 108.2022, status: 'Đang ở Đà Nẵng tìm bạn đi đèo Hải Vân', tags: ['#Phượt_xe_máy', '#Khám_phá'] },
  { id: 2, name: 'Yêu Bếp & Đi', ava: 'https://i.pravatar.cc/150?img=5', lat: 21.0285, lng: 105.8542, status: 'Food tour Hà Nội, ai đi chung không?', tags: ['#Du_lịch_ẩm_thực', '#Hà_Nội'] },
  { id: 3, name: 'Lang Thang VN', ava: 'https://i.pravatar.cc/150?img=33', lat: 11.9404, lng: 108.4583, status: 'Đà Lạt lạnh quá, cần bạn cafe', tags: ['#Chụp_ảnh', '#Chill'] },
  { id: 4, name: 'Biển Xanh', ava: 'https://i.pravatar.cc/150?img=12', lat: 10.2899, lng: 103.9840, status: 'Phú Quốc vẫy gọi, lặn ngắm san hô!', tags: ['#Biển_đảo', '#Mùa_hè'] },
  { id: 5, name: 'Núi Rừng', ava: 'https://i.pravatar.cc/150?img=68', lat: 22.3363, lng: 103.8438, status: 'Sapa mờ sương, săn mây Fanxipan', tags: ['#Săn_mây', '#Trekking'] },
  { id: 6, name: 'Gió Biển', ava: 'https://i.pravatar.cc/150?img=47', lat: 15.8801, lng: 108.3380, status: 'Thả đèn lồng ở Hội An', tags: ['#Phố_cổ', '#Văn_hoá'] },
  { id: 7, name: 'Đảo Xa', ava: 'https://i.pravatar.cc/150?img=18', lat: 8.6833, lng: 106.6000, status: 'Đang ở Côn Đảo, biển xanh cát trắng', tags: ['#Côn_Đảo', '#Bình_yên'] },
];

const createAvatarIcon = (avaUrl) => {
  return L.divIcon({
    className: 'custom-avatar-marker bg-transparent border-0',
    html: `<div style="width: 36px; height: 36px; border-radius: 50%; border: 2px solid #D4AF37; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.5); background: #112418;">
             <img src="${avaUrl}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='https://i.pravatar.cc/150'"/>
           </div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18]
  });
};

const HoangSaIcon = L.divIcon({
  className: 'island-label bg-transparent border-0',
  html: `<div style="color: #D4AF37; font-family: 'Poppins', sans-serif; font-weight: bold; text-shadow: 1px 1px 3px black; font-size: 13px; white-space: nowrap;">📍 Quần đảo Hoàng Sa (Việt Nam)</div>`,
  iconSize: [200, 20],
  iconAnchor: [100, 10]
});

const TruongSaIcon = L.divIcon({
  className: 'island-label bg-transparent border-0',
  html: `<div style="color: #D4AF37; font-family: 'Poppins', sans-serif; font-weight: bold; text-shadow: 1px 1px 3px black; font-size: 13px; white-space: nowrap;">📍 Quần đảo Trường Sa (Việt Nam)</div>`,
  iconSize: [200, 20],
  iconAnchor: [100, 10]
});

function CommunityMap() {
  const [toast, setToast] = useState('');

  const handleConnect = (name) => {
    setToast(`Đã gửi lời mời kết nối đến ${name}!`);
    setTimeout(() => setToast(''), 3000);
  };

  return (
    <div className="w-full h-[600px] rounded-[1.5rem] overflow-hidden border border-white/5 relative bg-[#112418]">
      <MapContainer 
        center={[16.0, 108.0]} 
        zoom={6} 
        scrollWheelZoom={true}
        className="w-full h-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* Hoàng Sa & Trường Sa Labels */}
        <Marker position={[16.5, 112.0]} icon={HoangSaIcon} interactive={false} />
        <Marker position={[9.5, 113.0]} icon={TruongSaIcon} interactive={false} />

        {/* Users */}
        {MOCK_USERS.map(user => (
          <Marker 
            key={user.id} 
            position={[user.lat, user.lng]} 
            icon={createAvatarIcon(user.ava)}
          >
            <Popup className="custom-popup">
              <div className="p-1 min-w-[200px]">
                <div className="flex items-center gap-3 mb-2">
                  <img src={user.ava} className="w-10 h-10 rounded-full object-cover border border-[#D4AF37]/50" alt="ava"/>
                  <div>
                    <h4 className="text-sm font-bold text-[#F5F2EB] m-0 leading-tight">{user.name}</h4>
                    <span className="text-[10px] text-green-400 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span> Online
                    </span>
                  </div>
                </div>
                
                <p className="text-xs text-white/80 mb-2 leading-relaxed italic">
                  "{user.status}"
                </p>
                
                <div className="flex flex-wrap gap-1 mb-3">
                  {user.tags.map((tag, idx) => (
                    <span key={idx} className="text-[9px] px-1.5 py-0.5 rounded-md bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30">
                      {tag}
                    </span>
                  ))}
                </div>
                
                <button 
                  onClick={() => handleConnect(user.name)}
                  className="w-full bg-[#D4AF37] text-black text-xs font-bold py-1.5 rounded-full hover:bg-white transition-colors"
                >
                  Kết nối ngay
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Toast Notification */}
      {toast && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 bg-[#0D2D1F] border border-[#D4AF37]/50 text-[#D4AF37] px-4 py-2 rounded-full text-xs font-bold shadow-2xl flex items-center gap-2 animate-bounce">
          <span>🤝</span> {toast}
        </div>
      )}

      {/* CSS Overrides for Leaflet Popup in Dark Mode */}
      <style dangerouslySetInnerHTML={{__html: `
        .leaflet-popup-content-wrapper {
          background: #0A241A !important;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 1rem;
          color: white;
          box-shadow: 0 10px 25px rgba(0,0,0,0.5);
        }
        .leaflet-popup-tip {
          background: #0A241A !important;
          border-left: 1px solid rgba(255,255,255,0.1);
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        .leaflet-container a.leaflet-popup-close-button {
          color: white !important;
          opacity: 0.5;
        }
        .leaflet-container a.leaflet-popup-close-button:hover {
          opacity: 1;
        }
      `}} />
    </div>
  );
}

export default CommunityMap;
