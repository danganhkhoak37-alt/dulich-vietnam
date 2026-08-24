import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
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

import ChatDrawer from './ChatDrawer';

const createAvatarIcon = (avaUrl) => {
  return L.divIcon({
    className: 'custom-avatar-marker bg-transparent border-0',
    html: `
      <div style="position: relative; width: 44px; height: 44px;">
        <div style="width: 40px; height: 40px; border-radius: 50%; border: 2.5px solid #D4AF37; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.5); background: #112418; position: absolute; bottom: 0; left: 0;">
          <img src="${avaUrl?.startsWith('/') ? API_URL+avaUrl : (avaUrl || 'https://i.pravatar.cc/150')}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='https://i.pravatar.cc/150'"/>
        </div>
        <div style="position: absolute; bottom: 0; right: 0; width: 12px; height: 12px; background-color: #22c55e; border-radius: 50%; border: 2px solid #0A241A; box-shadow: 0 0 8px rgba(34,197,94,0.6); animation: markerPulse 2s infinite;"></div>
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -22]
  });
};

// Icon cho vị trí đang chọn (preview)
const createPinPreviewIcon = () => {
  return L.divIcon({
    className: 'pin-preview-marker bg-transparent border-0',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
        <div style="width: 36px; height: 36px; background: linear-gradient(135deg, #D4AF37 0%, #F5D76E 100%); border-radius: 50% 50% 50% 0; transform: rotate(-45deg); box-shadow: 0 6px 20px rgba(212,175,55,0.5); animation: pinBounce 0.6s ease-out;">
          <div style="width: 16px; height: 16px; background: #0A241A; border-radius: 50%; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);"></div>
        </div>
        <div style="width: 8px; height: 8px; background: rgba(212,175,55,0.3); border-radius: 50%; margin-top: 4px; animation: pinShadow 0.6s ease-out;"></div>
      </div>
    `,
    iconSize: [36, 50],
    iconAnchor: [18, 50],
    popupAnchor: [0, -50]
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
  voyager: { name: 'Bản Đồ', icon: '🗺️', url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', subdomains: 'abcd' },
  satellite: { name: 'Vệ Tinh', icon: '🛰️', url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', subdomains: '' }
};

function MapStyleUpdater({ styleKey }) {
  const currentStyle = MAP_STYLES[styleKey] || MAP_STYLES.voyager;
  return (
    <TileLayer
      key={styleKey}
      attribution='&copy; <a href="https://carto.com/">CartoDB</a> / <a href="https://www.openstreetmap.org/copyright">OSM</a>'
      url={currentStyle.url}
      subdomains={currentStyle.subdomains || 'abcd'}
      maxZoom={19}
    />
  );
}

// Tự động điều chỉnh kích thước bản đồ khi mount / animation xong
function AutoInvalidateSize() {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    const t1 = setTimeout(() => map.invalidateSize(), 150);
    const t2 = setTimeout(() => map.invalidateSize(), 400);
    const t3 = setTimeout(() => map.invalidateSize(), 800);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [map]);
  return null;
}

function getLoggedInUser() {
  try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
}

// Component xử lý click trên bản đồ
function MapClickHandler({ onMapClick, isPinning }) {
  useMapEvents({
    click(e) {
      if (isPinning) {
        onMapClick(e.latlng);
      }
    }
  });
  return null;
}

// Component fly to vị trí
function FlyToLocation({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, 12, { duration: 1.5 });
    }
  }, [position, map]);
  return null;
}

function CommunityMap() {
  const [toast, setToast] = useState('');
  const [mapStyleKey, setMapStyleKey] = useState('voyager');
  const [users, setUsers] = useState([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatFriendId, setChatFriendId] = useState(null);
  
  // Pin state
  const [isPinning, setIsPinning] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [pinPosition, setPinPosition] = useState(null);
  const [myStatus, setMyStatus] = useState('');
  const [myTags, setMyTags] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [locationName, setLocationName] = useState('');
  const [flyTarget, setFlyTarget] = useState(null);

  // Existing pin
  const [myExistingPin, setMyExistingPin] = useState(null);

  // Connection statuses: { [userId]: 'none' | 'pending' | 'accepted' | 'sending' }
  const [connectionStatuses, setConnectionStatuses] = useState({});

  const loggedInUser = getLoggedInUser();

  const fetchMapUsers = async () => {
    try {
      const res = await fetch(`${API_URL}/api/map/users`);
      const data = await res.json();
      if (data.status === 'success' && Array.isArray(data.data)) {
        const activeRealUsers = data.data.filter(u => u.lat && u.lng);
        setUsers(activeRealUsers);
        
        // Check if current user already has a pin
        if (loggedInUser) {
          const myPin = activeRealUsers.find(u => u.id === loggedInUser.id);
          if (myPin) setMyExistingPin(myPin);
        }
      } else {
        setUsers([]);
      }
    } catch (e) {
      console.error('Lỗi fetch map users', e);
      setUsers([]);
    }
  };

  useEffect(() => {
    fetchMapUsers();
  }, []);

  // Gửi lời mời kết nối thật qua API
  const handleConnect = async (user) => {
    if (!loggedInUser) {
      alert('Vui lòng đăng nhập để kết nối!');
      return;
    }
    if (user.id === loggedInUser.id) {
      setToast('Không thể kết nối với chính mình!');
      setTimeout(() => setToast(''), 3000);
      return;
    }
    setConnectionStatuses(prev => ({ ...prev, [user.id]: 'sending' }));
    try {
      const res = await fetch(`${API_URL}/api/connections/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({ to_user_id: user.id })
      });
      const data = await res.json();
      if (data.status === 'success' || data.status === 'already_sent') {
        setConnectionStatuses(prev => ({ ...prev, [user.id]: 'pending' }));
        setToast(data.message);
      } else if (data.status === 'already_friends') {
        setConnectionStatuses(prev => ({ ...prev, [user.id]: 'accepted' }));
        setToast(data.message);
      } else {
        setConnectionStatuses(prev => ({ ...prev, [user.id]: 'none' }));
        setToast('❌ ' + (data.message || 'Lỗi khi gửi lời mời'));
      }
    } catch (err) {
      console.error(err);
      setConnectionStatuses(prev => ({ ...prev, [user.id]: 'none' }));
      setToast('❌ Lỗi kết nối máy chủ');
    }
    setTimeout(() => setToast(''), 3000);
  };

  // Fetch connection status for a specific user when popup opens
  const fetchConnectionStatus = async (userId) => {
    if (!loggedInUser || userId === loggedInUser.id) return;
    if (connectionStatuses[userId]) return; // already fetched
    try {
      const res = await fetch(`${API_URL}/api/connections/status/${userId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` }
      });
      const data = await res.json();
      if (data.status === 'success') {
        setConnectionStatuses(prev => ({ ...prev, [userId]: data.connection_status }));
      }
    } catch (e) { console.error(e); }
  };

  // Reverse geocode to get location name
  const reverseGeocode = async (lat, lng) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1&accept-language=vi`);
      const data = await res.json();
      if (data && data.address) {
        const parts = [];
        if (data.address.city || data.address.town || data.address.village) {
          parts.push(data.address.city || data.address.town || data.address.village);
        }
        if (data.address.state || data.address.county) {
          parts.push(data.address.state || data.address.county);
        }
        return parts.length > 0 ? parts.join(', ') : (data.display_name || '');
      }
      return '';
    } catch {
      return '';
    }
  };

  // Bắt đầu chế độ ghim (click trên map)
  const startPinMode = () => {
    if (!loggedInUser) {
      alert('Vui lòng đăng nhập để ghim vị trí!');
      return;
    }
    setIsPinning(true);
    setPinPosition(null);
    setToast('👆 Click vào bản đồ để chọn vị trí ghim!');
    setTimeout(() => setToast(''), 4000);
  };

  // Xử lý click trên map
  const handleMapClick = useCallback(async (latlng) => {
    setPinPosition([latlng.lat, latlng.lng]);
    setFlyTarget([latlng.lat, latlng.lng]);
    setIsPinning(false);
    
    // Reverse geocode
    const name = await reverseGeocode(latlng.lat, latlng.lng);
    setLocationName(name);
    setShowLocationModal(true);
  }, []);

  // Ghim bằng GPS
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
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setPinPosition([lat, lng]);
        setFlyTarget([lat, lng]);
        setIsLocating(false);
        
        const name = await reverseGeocode(lat, lng);
        setLocationName(name);
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

  // Lưu vị trí
  const handleSaveLocation = async () => {
    if (!loggedInUser || !pinPosition) return;
    setIsSaving(true);
    try {
      const tagsArray = myTags.split(',').map(t => t.trim()).filter(t => t);
      const res = await fetch(`${API_URL}/api/map/location`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({
          lat: pinPosition[0],
          lng: pinPosition[1],
          status: myStatus,
          tags: tagsArray
        })
      });
      const data = await res.json();
      if (data.status === 'success') {
        setShowLocationModal(false);
        setPinPosition(null);
        setMyStatus('');
        setMyTags('');
        setLocationName('');
        setToast('✅ Đã ghim vị trí thành công!');
        setTimeout(() => setToast(''), 3000);
        fetchMapUsers();
      } else {
        alert(data.message || 'Lỗi khi lưu vị trí');
      }
    } catch (e) {
      console.error(e);
      alert('Lỗi kết nối máy chủ');
    } finally {
      setIsSaving(false);
    }
  };

  // Xóa ghim
  const handleRemovePin = async () => {
    if (!loggedInUser) return;
    if (!window.confirm('Bạn có chắc muốn xóa ghim vị trí?')) return;
    try {
      const res = await fetch(`${API_URL}/api/map/location`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });
      const data = await res.json();
      if (data.status === 'success') {
        setMyExistingPin(null);
        setToast('🗑️ Đã xóa ghim vị trí');
        setTimeout(() => setToast(''), 3000);
        fetchMapUsers();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCancelPin = () => {
    setShowLocationModal(false);
    setPinPosition(null);
    setIsPinning(false);
    setMyStatus('');
    setMyTags('');
    setLocationName('');
  };

  return (
    <div className={`w-full h-[600px] rounded-[1.5rem] overflow-hidden border ${isPinning ? 'border-[#D4AF37]/60 shadow-[0_0_30px_rgba(212,175,55,0.15)]' : 'border-white/5'} relative bg-[#112418] transition-all duration-500`}>
      
      {/* Pin Mode Banner */}
      {isPinning && (
        <div className="absolute top-0 left-0 right-0 z-[450] bg-gradient-to-r from-[#D4AF37] via-[#F5D76E] to-[#D4AF37] text-black text-center py-2.5 px-4 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg" style={{ animation: 'slideDown 0.3s ease-out' }}>
          <span className="animate-bounce text-base">📍</span>
          <span>Click vào bản đồ để chọn vị trí ghim</span>
          <button 
            onClick={() => { setIsPinning(false); setToast(''); }}
            className="ml-4 bg-black/20 hover:bg-black/40 px-3 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer"
          >
            ✕ Hủy
          </button>
        </div>
      )}

      {/* Map Controls: Styles & Pinning */}
      <div className="absolute top-4 right-4 z-[400] flex flex-col gap-2 items-end">
        {/* Style Switcher Pill */}
        <div className="flex bg-[#0A241A]/90 backdrop-blur-md p-1 rounded-xl border border-white/10 shadow-lg gap-1">
          {Object.entries(MAP_STYLES).map(([key, item]) => (
            <button
              key={key}
              type="button"
              onClick={() => setMapStyleKey(key)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                mapStyleKey === key
                  ? 'bg-[#D4AF37] text-black shadow-md'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
              title={item.name}
            >
              <span>{item.icon}</span>
              <span className="hidden sm:inline">{item.name}</span>
            </button>
          ))}
        </div>

        {/* Pin Buttons Group */}
        <div className="flex flex-col gap-1.5">
          {/* GPS Pin */}
          <button 
            onClick={requestGPS}
            disabled={isLocating || isPinning}
            className="bg-[#D4AF37] text-black px-4 py-2 rounded-xl text-xs font-black shadow-lg hover:bg-white transition-all uppercase tracking-widest flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isLocating ? (
              <>
                <span className="animate-spin">⏳</span> Đang định vị...
              </>
            ) : (
              <>📍 Ghim bằng GPS</>
            )}
          </button>

          {/* Click Pin */}
          <button 
            onClick={startPinMode}
            disabled={isLocating || isPinning}
            className={`px-4 py-2 rounded-xl text-xs font-black shadow-lg transition-all uppercase tracking-widest flex items-center gap-2 cursor-pointer ${
              isPinning 
                ? 'bg-white text-black ring-2 ring-[#D4AF37]' 
                : 'bg-[#0A241A]/90 backdrop-blur-md text-[#D4AF37] border border-[#D4AF37]/40 hover:bg-[#D4AF37] hover:text-black'
            } disabled:opacity-50`}
          >
            👆 Click trên bản đồ
          </button>

          {/* Remove pin (if exists) */}
          {myExistingPin && (
            <button 
              onClick={handleRemovePin}
              className="bg-red-500/20 text-red-400 border border-red-500/30 px-4 py-2 rounded-xl text-xs font-black shadow-lg hover:bg-red-500/40 transition-all uppercase tracking-widest flex items-center gap-2 cursor-pointer"
            >
              🗑️ Xóa ghim
            </button>
          )}
        </div>

      </div>

      {/* User count badge */}
      <div className="absolute top-4 left-4 z-[400] bg-[#0A241A]/90 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10 flex items-center gap-2 shadow-lg">
        <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse"></span>
        <span className="text-xs text-white/80 font-bold">{users.length} phượt thủ trên bản đồ</span>
      </div>

      <MapContainer 
        center={[16.0, 108.0]} 
        zoom={6} 
        scrollWheelZoom={true}
        className={`w-full h-full z-0 ${isPinning ? 'cursor-crosshair' : ''}`}
      >
        <AutoInvalidateSize />
        <MapStyleUpdater styleKey={mapStyleKey} />
        <MapClickHandler onMapClick={handleMapClick} isPinning={isPinning} />
        {flyTarget && <FlyToLocation position={flyTarget} />}

        {/* Hoàng Sa & Trường Sa Labels */}
        <Marker position={[16.5, 112.0]} icon={HoangSaIcon} interactive={false} />
        <Marker position={[9.5, 113.0]} icon={TruongSaIcon} interactive={false} />

        {/* Preview pin (khi đang chọn vị trí) */}
        {pinPosition && (
          <Marker 
            position={pinPosition} 
            icon={createPinPreviewIcon()}
            draggable={true}
            eventHandlers={{
              dragend: async (e) => {
                const marker = e.target;
                const pos = marker.getLatLng();
                setPinPosition([pos.lat, pos.lng]);
                const name = await reverseGeocode(pos.lat, pos.lng);
                setLocationName(name);
              }
            }}
          >
            <Popup className="custom-popup">
              <div className="p-1 text-center">
                <p className="text-sm font-bold text-[#D4AF37] mb-1">📍 Vị trí bạn chọn</p>
                {locationName && <p className="text-xs text-white/60">{locationName}</p>}
                <p className="text-[10px] text-white/40 mt-1 italic">Kéo để điều chỉnh</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Users */}
        {users.map(user => {
          const connStatus = connectionStatuses[user.id] || 'none';
          const isSelf = loggedInUser && user.id === loggedInUser.id;
          return (
          <Marker 
            key={user.id} 
            position={[user.lat, user.lng]} 
            icon={createAvatarIcon(user.ava)}
            eventHandlers={{ popupopen: () => fetchConnectionStatus(user.id) }}
          >
            <Popup className="custom-popup">
              <div className="p-1 min-w-[220px]">
                <div className="flex items-center gap-3 mb-3">
                  <img src={user.ava?.startsWith('/') ? API_URL+user.ava : (user.ava || 'https://i.pravatar.cc/150')} className="w-11 h-11 rounded-full object-cover border-2 border-[#D4AF37]/50" alt="ava" onError={(e) => e.target.src='https://i.pravatar.cc/150'}/>
                  <div>
                    <h4 className="text-sm font-bold text-[#F5F2EB] m-0 leading-tight">{user.name}</h4>
                    <span className="text-[10px] text-green-400 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span> Online
                    </span>
                  </div>
                </div>
                
                {user.status && (
                  <p className="text-xs text-white/80 mb-3 leading-relaxed italic bg-white/5 rounded-lg p-2">
                    "{user.status}"
                  </p>
                )}
                
                {user.tags && user.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {user.tags.map((tag, idx) => (
                      <span key={idx} className="text-[9px] px-2 py-0.5 rounded-full bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/20 font-bold">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                
                {isSelf ? (
                  <div className="w-full text-center text-[10px] text-white/40 py-2 bg-white/5 rounded-full font-bold">
                    📍 Đây là bạn
                  </div>
                ) : connStatus === 'accepted' ? (
                  <div className="flex gap-2 w-full">
                    <button 
                      onClick={() => { setChatFriendId(user.id); setChatOpen(true); }}
                      className="flex-1 bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20 text-xs font-black py-2 rounded-full hover:bg-[#D4AF37]/20 transition-all text-center tracking-wider"
                    >
                      💬 Nhắn tin
                    </button>
                    <div className="flex-1 text-center text-xs text-green-400 py-2 bg-green-500/10 rounded-full font-black border border-green-500/20">
                      🤝 Đã kết nối
                    </div>
                  </div>
                ) : connStatus === 'pending' ? (
                  <div className="w-full text-center text-xs text-[#D4AF37] py-2 bg-[#D4AF37]/10 rounded-full font-bold border border-[#D4AF37]/20">
                    ⏳ Đã gửi lời mời
                  </div>
                ) : connStatus === 'sending' ? (
                  <div className="w-full text-center text-xs text-white/50 py-2 bg-white/5 rounded-full font-bold">
                    <span className="animate-pulse">⏳ Đang gửi...</span>
                  </div>
                ) : (
                  <button 
                    onClick={() => handleConnect(user)}
                    className="w-full bg-gradient-to-r from-[#D4AF37] to-[#F5D76E] text-black text-xs font-black py-2 rounded-full hover:shadow-lg hover:shadow-[#D4AF37]/20 transition-all uppercase tracking-wider"
                  >
                    🤝 Kết nối ngay
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
          );
        })}
      </MapContainer>

      {/* Location Modal */}
      {showLocationModal && (
        <div className="absolute inset-0 z-[500] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" style={{ animation: 'fadeIn 0.3s ease-out' }}>
          <div className="bg-[#0A241A] w-full max-w-sm rounded-[1.5rem] border border-[#D4AF37]/30 shadow-2xl shadow-black/50 overflow-hidden" style={{ animation: 'modalSlide 0.4s ease-out' }}>
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#D4AF37]/20 via-[#D4AF37]/10 to-transparent p-6 pb-4 border-b border-white/5">
              <h3 className="text-[#D4AF37] font-bold text-lg flex items-center gap-2">
                📍 Ghim vị trí của bạn
              </h3>
              {locationName && (
                <p className="text-xs text-white/50 mt-1 flex items-center gap-1">
                  <span>🗺️</span> {locationName}
                </p>
              )}
              {pinPosition && (
                <p className="text-[10px] text-white/30 mt-1 font-mono">
                  {pinPosition[0].toFixed(4)}°N, {pinPosition[1].toFixed(4)}°E
                </p>
              )}
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs text-white/60 font-bold block mb-1.5 flex items-center gap-1">
                  💬 Trạng thái hiện tại
                </label>
                <input 
                  type="text" 
                  value={myStatus} 
                  onChange={e => setMyStatus(e.target.value)} 
                  placeholder="VD: Đang ở Đà Nẵng tìm bạn đi ăn..."
                  className="w-full bg-[#112418] border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#D4AF37]/50 focus:ring-1 focus:ring-[#D4AF37]/20 transition-all placeholder-white/20"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs text-white/60 font-bold block mb-1.5 flex items-center gap-1">
                  🏷️ Hashtag sở thích
                </label>
                <input 
                  type="text" 
                  value={myTags} 
                  onChange={e => setMyTags(e.target.value)} 
                  placeholder="VD: #Phượt, #Cafe, #Biển (cách bởi dấu phẩy)"
                  className="w-full bg-[#112418] border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#D4AF37]/50 focus:ring-1 focus:ring-[#D4AF37]/20 transition-all placeholder-white/20"
                />
                {myTags && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {myTags.split(',').map((t, i) => t.trim() && (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/20">
                        {t.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Drag hint */}
              <div className="bg-white/5 rounded-xl p-3 flex items-start gap-2">
                <span className="text-base">💡</span>
                <p className="text-[11px] text-white/40 leading-relaxed">
                  Bạn có thể <strong className="text-white/60">kéo thả</strong> ghim trên bản đồ để điều chỉnh chính xác vị trí trước khi lưu.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={handleCancelPin}
                  className="flex-1 py-3 rounded-xl border border-white/15 text-white/50 text-xs font-bold hover:bg-white/5 hover:text-white/70 transition-all"
                >
                  Hủy
                </button>
                <button 
                  onClick={handleSaveLocation}
                  disabled={!myStatus.trim() || isSaving}
                  className="flex-1 bg-gradient-to-r from-[#D4AF37] to-[#F5D76E] text-black py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:shadow-lg hover:shadow-[#D4AF37]/20 disabled:opacity-40 transition-all flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <span className="animate-spin">⏳</span> Đang lưu...
                    </>
                  ) : (
                    <>🚀 Lưu & Lên sóng</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div 
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[600] bg-[#0D2D1F] border border-[#D4AF37]/50 text-[#D4AF37] px-5 py-2.5 rounded-full text-xs font-bold shadow-2xl flex items-center gap-2"
          style={{ animation: 'toastSlide 0.4s ease-out' }}
        >
          {toast}
        </div>
      )}

      {/* CSS Overrides */}
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
        .cursor-crosshair .leaflet-container {
          cursor: crosshair !important;
        }
        .leaflet-grab {
          cursor: inherit;
        }
        @keyframes markerPulse {
          0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
          70% { box-shadow: 0 0 0 6px rgba(34, 197, 94, 0); }
          100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
        }
        @keyframes pinBounce {
          0% { transform: rotate(-45deg) scale(0) translateY(-20px); }
          60% { transform: rotate(-45deg) scale(1.15); }
          100% { transform: rotate(-45deg) scale(1); }
        }
        @keyframes pinShadow {
          0% { transform: scale(0); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalSlide {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-100%); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes toastSlide {
          from { opacity: 0; transform: translate(-50%, 20px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
      `}} />
      {/* Chat Drawer */}
      <ChatDrawer
        isOpen={chatOpen}
        onClose={() => { setChatOpen(false); setChatFriendId(null); }}
        initialFriendId={chatFriendId}
      />
    </div>
  );
}

export default CommunityMap;
