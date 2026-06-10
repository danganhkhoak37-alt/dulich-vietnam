import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import API_URL from '../config/api';

// Fix cho icon mặc định
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MOCK_USERS = [
  { id: 'mock_1', name: 'Phượt Thủ 9x', ava: 'https://i.pravatar.cc/150?img=11', lat: 16.0544, lng: 108.2022, status: 'Đang ở Đà Nẵng tìm bạn đi đèo Hải Vân', tags: ['#Phượt_xe_máy', '#Khám_phá'] },
  { id: 'mock_2', name: 'Yêu Bếp & Đi', ava: 'https://i.pravatar.cc/150?img=5', lat: 21.0285, lng: 105.8542, status: 'Food tour Hà Nội, ai đi chung không?', tags: ['#Du_lịch_ẩm_thực', '#Hà_Nội'] },
  { id: 'mock_3', name: 'Lang Thang VN', ava: 'https://i.pravatar.cc/150?img=33', lat: 11.9404, lng: 108.4583, status: 'Đà Lạt lạnh quá, cần bạn cafe', tags: ['#Chụp_ảnh', '#Chill'] },
  { id: 'mock_4', name: 'Biển Xanh', ava: 'https://i.pravatar.cc/150?img=12', lat: 10.2899, lng: 103.9840, status: 'Phú Quốc vẫy gọi, lặn ngắm san hô!', tags: ['#Biển_đảo', '#Mùa_hè'] },
  { id: 'mock_5', name: 'Núi Rừng', ava: 'https://i.pravatar.cc/150?img=68', lat: 22.3363, lng: 103.8438, status: 'Sapa mờ sương, săn mây Fanxipan', tags: ['#Săn_mây', '#Trekking'] },
  { id: 'mock_6', name: 'Gió Biển', ava: 'https://i.pravatar.cc/150?img=47', lat: 15.8801, lng: 108.3380, status: 'Thả đèn lồng ở Hội An', tags: ['#Phố_cổ', '#Văn_hoá'] },
  { id: 'mock_7', name: 'Đảo Xa', ava: 'https://i.pravatar.cc/150?img=18', lat: 8.6833, lng: 106.6000, status: 'Đang ở Côn Đảo, biển xanh cát trắng', tags: ['#Côn_Đảo', '#Bình_yên'] },
];

const createAvatarIcon = (avaUrl) => {
  return L.divIcon({
    className: 'custom-avatar-marker bg-transparent border-0',
    html: `
      <div style="position: relative; width: 40px; height: 40px;">
        <div style="width: 36px; height: 36px; border-radius: 50%; border: 2px solid #D4AF37; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.5); background: #112418; position: absolute; bottom: 0; left: 0;">
          <img src="${avaUrl?.startsWith('/') ? API_URL+avaUrl : (avaUrl || 'https://i.pravatar.cc/150')}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='https://i.pravatar.cc/150'"/>
        </div>
        <!-- Chấm xanh báo online -->
        <div style="position: absolute; bottom: 0; right: 0; width: 12px; height: 12px; background-color: #22c55e; border-radius: 50%; border: 2px solid #fff; box-shadow: 0 0 5px rgba(0,0,0,0.5); animation: pulse 2s infinite;"></div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20]
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

const MAP_STYLES = {
  dark: { name: 'Đêm (Dark Premium)', url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' },
  street: { name: 'Ngày (Street Green)', url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' }
};

// Component để update tilelayer mượt mà
function MapStyleUpdater({ styleUrl }) {
  return <TileLayer attribution='&copy; <a href="https://carto.com/">CartoDB</a> / OSM' url={styleUrl} />;
}

// Hàm lấy User Login
function getLoggedInUser() {
  try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
}

function CommunityMap() {
  const [toast, setToast] = useState('');
  const [mapStyleKey, setMapStyleKey] = useState('dark');
  const [users, setUsers] = useState(MOCK_USERS);
  
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [myLat, setMyLat] = useState(null);
  const [myLng, setMyLng] = useState(null);
  const [myStatus, setMyStatus] = useState('');
  const [myTags, setMyTags] = useState('');
  const [isLocating, setIsLocating] = useState(false);

  const loggedInUser = getLoggedInUser();

  const fetchMapUsers = async () => {
    try {
      const res = await fetch(`${API_URL}/api/map/users`);
      const data = await res.json();
      if (data.status === 'success') {
        const activeRealUsers = data.data.filter(u => u.lat && u.lng);
        setUsers([...MOCK_USERS, ...activeRealUsers]);
      }
    } catch (e) { console.error('Lỗi fetch map users', e); }
  };

  useEffect(() => {
    fetchMapUsers();
  }, []);

  const handleConnect = (name) => {
    setToast(`Đã gửi lời mời kết nối đến ${name}!`);
    setTimeout(() => setToast(''), 3000);
  };

  const requestGPS = () => {
    if (!loggedInUser) {
      alert('Vui lòng đăng nhập để ghim vị trí!');
      return;
    }
    if (!navigator.geolocation) {
      alert('Trình duyệt của bạn không hỗ trợ định vị GPS.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setMyLat(position.coords.latitude);
        setMyLng(position.coords.longitude);
        setIsLocating(false);
        setShowLocationModal(true);
      },
      (error) => {
        setIsLocating(false);
        console.error('Lỗi GPS:', error);
        alert('Không thể lấy vị trí. Vui lòng cấp quyền vị trí cho trình duyệt.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSaveLocation = async () => {
    if (!loggedInUser) return;
    try {
      const tagsArray = myTags.split(',').map(t => t.trim()).filter(t => t);
      const res = await fetch(`${API_URL}/api/map/location`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({
          lat: myLat,
          lng: myLng,
          status: myStatus,
          tags: tagsArray
        })
      });
      const data = await res.json();
      if (data.status === 'success') {
        setShowLocationModal(false);
        setToast('Đã ghim vị trí thành công!');
        setTimeout(() => setToast(''), 3000);
        fetchMapUsers();
      } else {
        alert(data.message || 'Lỗi khi lưu vị trí');
      }
    } catch (e) {
      console.error(e);
      alert('Lỗi kết nối máy chủ');
    }
  };

  return (
    <div className="w-full h-[600px] rounded-[1.5rem] overflow-hidden border border-white/5 relative bg-[#112418]">
      
      {/* Map Header Overlay */}
      <div className="absolute top-4 right-4 z-[400] flex flex-col gap-2 items-end">
        
        {/* Style Selector */}
        <div className="bg-[#0A241A]/90 backdrop-blur-md p-1.5 rounded-xl border border-[#D4AF37]/30 flex items-center shadow-lg">
          <select 
            value={mapStyleKey} 
            onChange={(e) => setMapStyleKey(e.target.value)}
            className="bg-transparent text-[#F5F2EB] text-xs font-bold outline-none cursor-pointer px-2"
          >
            {Object.entries(MAP_STYLES).map(([key, style]) => (
              <option key={key} value={key} className="bg-[#0D2D1F] text-white">{style.name}</option>
            ))}
          </select>
        </div>

        {/* Pin Location Button */}
        <button 
          onClick={requestGPS}
          disabled={isLocating}
          className="bg-[#D4AF37] text-black px-4 py-2 rounded-xl text-xs font-black shadow-lg hover:bg-white transition-all uppercase tracking-widest flex items-center gap-2"
        >
          {isLocating ? '⏳ Đang định vị...' : '📍 Ghim vị trí của tôi'}
        </button>

      </div>

      <MapContainer 
        center={[16.0, 108.0]} 
        zoom={6} 
        scrollWheelZoom={true}
        className="w-full h-full z-0"
      >
        <MapStyleUpdater styleUrl={MAP_STYLES[mapStyleKey].url} />

        {/* Hoàng Sa & Trường Sa Labels */}
        <Marker position={[16.5, 112.0]} icon={HoangSaIcon} interactive={false} />
        <Marker position={[9.5, 113.0]} icon={TruongSaIcon} interactive={false} />

        {/* Users */}
        {users.map(user => (
          <Marker 
            key={user.id} 
            position={[user.lat, user.lng]} 
            icon={createAvatarIcon(user.ava)}
          >
            <Popup className="custom-popup">
              <div className="p-1 min-w-[200px]">
                <div className="flex items-center gap-3 mb-2">
                  <img src={user.ava?.startsWith('/') ? API_URL+user.ava : (user.ava || 'https://i.pravatar.cc/150')} className="w-10 h-10 rounded-full object-cover border border-[#D4AF37]/50" alt="ava" onError={(e) => e.target.src='https://i.pravatar.cc/150'}/>
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

      {/* Location Modal */}
      {showLocationModal && (
        <div className="absolute inset-0 z-[500] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0A241A] w-full max-w-sm rounded-[1.5rem] border border-[#D4AF37]/30 p-6 shadow-2xl">
            <h3 className="text-[#D4AF37] font-heading font-bold text-xl mb-4 text-center">📍 Cập nhật vị trí</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-white/60 font-bold block mb-1">Trạng thái hiện tại</label>
                <input 
                  type="text" 
                  value={myStatus} 
                  onChange={e => setMyStatus(e.target.value)} 
                  placeholder="VD: Đang ở Đà Nẵng tìm bạn..."
                  className="w-full bg-[#112418] border border-white/10 rounded-xl px-4 py-2.5 text-white text-xs outline-none focus:border-[#D4AF37]/50"
                />
              </div>
              <div>
                <label className="text-xs text-white/60 font-bold block mb-1">Hashtag sở thích</label>
                <input 
                  type="text" 
                  value={myTags} 
                  onChange={e => setMyTags(e.target.value)} 
                  placeholder="VD: #Phượt, #Cafe (cách nhau bởi dấu phẩy)"
                  className="w-full bg-[#112418] border border-white/10 rounded-xl px-4 py-2.5 text-white text-xs outline-none focus:border-[#D4AF37]/50"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setShowLocationModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-white/20 text-white/60 text-xs font-bold hover:bg-white/5 transition-all"
                >
                  Hủy
                </button>
                <button 
                  onClick={handleSaveLocation}
                  disabled={!myStatus.trim()}
                  className="flex-1 bg-[#D4AF37] text-black py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white disabled:opacity-50 transition-all"
                >
                  Lưu & Lên sóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[600] bg-[#0D2D1F] border border-[#D4AF37]/50 text-[#D4AF37] px-4 py-2 rounded-full text-xs font-bold shadow-2xl flex items-center gap-2 animate-bounce">
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
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
          70% { box-shadow: 0 0 0 6px rgba(34, 197, 94, 0); }
          100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
        }
      `}} />
    </div>
  );
}

export default CommunityMap;
