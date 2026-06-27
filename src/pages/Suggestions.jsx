import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Search, Navigation, Calendar, ChevronRight, BookOpen, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import LocationCard from '../components/LocationCard';
import AuthModal from '../components/AuthModal';
import LocationDetailModal from '../components/LocationDetailModal';
import API_URL from '../config/api';

// Haversine formula to calculate distance between two coordinates in km
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// ============================================================
// MOCK DATA - Dùng cho UI khi Backend chưa sẵn sàng
// ============================================================
const MOCK_GPS_RESULTS = [
  { id: 1, name: 'Hội An', location: 'Quảng Nam', distance: 30, travel_time: 45, tag: 'Văn Hoá', best_month_start: 2, best_month_end: 4, image_url: 'https://hoiancreativecity.com/uploads/images/thang%202-2023/hoi-an-gd659f3b8f_1920-1280x853.jpg' },
  { id: 2, name: 'Bà Nà Hills', location: 'Đà Nẵng', distance: 40, travel_time: 60, tag: 'Check-in', best_month_start: 3, best_month_end: 8, image_url: 'https://luxurytravel.vn/wp-content/uploads/2023/05/Da-Nang-1.jpg' },
  { id: 3, name: 'Mỹ Sơn', location: 'Quảng Nam', distance: 70, travel_time: 90, tag: 'Lịch Sử', best_month_start: 2, best_month_end: 5, image_url: 'https://ik.imagekit.io/tvlk/blog/2023/09/thanh-dia-my-son-32.jpg?tr=q-70,c-at_max,w-1000,h-600' },
];

const TRENDING = [
  { id: 1, name: 'Vịnh Hạ Long', location: 'Quảng Ninh', views: '14.2k', badge: '🔥 Đang Hot', season: 'T9 - T11', description: 'Di sản thiên nhiên thế giới được UNESCO công nhận. Nổi tiếng với hàng ngàn hòn đảo đá vôi kỳ vĩ vươn lên từ mặt nước xanh ngọc lục bảo.', image_url: 'https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=2070&auto=format&fit=crop' },
  { id: 2, name: 'Sapa', location: 'Lào Cai', views: '13.5k', badge: '⭐ Nổi Bật', season: 'T9 - T11', description: 'Thị trấn mờ sương Sapa làm say đắm du khách bởi những thửa ruộng bậc thang chín vàng uốn lượn quanh sườn đồi.', image_url: 'https://media.vietravel.com/images/Content/dia-diem-du-lich-sapa-1.png' },
  { id: 3, name: 'Tràng An', location: 'Ninh Bình', views: '12.8k', badge: '🔥 Đang Hot', season: 'T1 - T3', description: 'Quần thể danh thắng Tràng An mê hoặc lòng người với hệ thống núi đá vôi trùng điệp, các thung lũng ngập nước và hang động nguyên sơ.', image_url: 'https://images.vietnamtourism.gov.vn/vn/images/2021/trang_an.jpg' },
  { id: 4, name: 'Phố Cổ Hội An', location: 'Quảng Nam', views: '15.1k', badge: '⭐ Nổi Bật', season: 'T2 - T4', description: 'Di sản văn hóa thế giới với những ngôi nhà tường vàng mái ngói rêu phong, con hẻm nhỏ lung linh dưới ánh đèn lồng.', image_url: 'https://i1-e.pinimg.com/736x/f3/42/23/f34223ed6dfb6b61b306696f08333475.jpg' },
  { id: 5, name: 'Phú Quốc', location: 'Kiên Giang', views: '14.9k', badge: '🔥 Đang Hot', season: 'T11 - T4', description: 'Đảo ngọc Phú Quốc là thiên đường nghỉ dưỡng biển hàng đầu Việt Nam. Sở hữu những bãi biển cát trắng mịn màng.', image_url: 'https://mtcs.1cdn.vn/2023/03/23/quan-dao-an-thoi-phu-quoc.jpg' },
  { id: 6, name: 'Phong Nha', location: 'Quảng Bình', views: '10.5k', badge: '⭐ Nổi Bật', season: 'T3 - T8', description: 'Vương quốc hang động Phong Nha - Kẻ Bàng là Di sản thiên nhiên thế giới với hệ thống hang động kiến tạo kỳ bí và tráng lệ nhất.', image_url: 'https://ecotour.com.vn/wp-content/uploads/2025/05/du-lich-dong-phong-nha-ke-bang-quang-binh.jpeg' },
  { id: 7, name: 'Đà Nẵng', location: 'Đà Nẵng', views: '16.2k', badge: '🔥 Đang Hot', season: 'T3 - T8', description: 'Sở hữu bãi biển Mỹ Khê lọt top đẹp nhất hành tinh, những cây cầu biểu tượng như Cầu Rồng, Cầu Sông Hàn, và Bà Nà Hills bồng bềnh.', image_url: 'https://ik.imagekit.io/tvlk/blog/2023/09/bien-my-khe-18.jpg?tr=q-70,c-at_max,w-1000,h-600' },
  { id: 8, name: 'Đà Lạt', location: 'Lâm Đồng', views: '18.4k', badge: '🔥 Đang Hot', season: 'T11 - T3', description: 'Thành phố ngàn hoa với không khí se lạnh mờ sương, những đồi thông reo trong gió và vô số homestay có gu.', image_url: 'https://bizweb.dktcdn.net/thumb/1024x1024/100/093/257/products/thung-lung-ngan-hoa.jpg?v=1731570795333' },
  { id: 9, name: 'Cố đô Huế', location: 'Thừa Thiên Huế', views: '9.8k', badge: '⭐ Nổi Bật', season: 'T2 - T4', description: 'Mang trong mình vẻ đẹp trầm mặc, cổ kính của kinh thành xưa, Huế gây ấn tượng với hệ thống Lăng Tẩm, chùa Thiên Mụ.', image_url: 'https://ik.imagekit.io/tvlk/blog/2025/03/quan-the-di-tich-co-do-hue-cover.png' },
  { id: 10, name: 'Tà Xùa', location: 'Hà Giang', views: '11.3k', badge: '⭐ Nổi Bật', season: 'T9 - T11', description: 'Mảnh đất địa đầu tổ quốc mang vẻ đẹp hoang sơ, tráng lệ với cao nguyên đá Đồng Văn ngoạn mục, đèo Mã Pí Lèng hiểm trở.', image_url: 'https://i1-e.pinimg.com/1200x/74/8d/2e/748d2ee4c771a02fff08cd57512c26d0.jpg' },
  { id: 11, name: 'Mũi Né', location: 'Bình Thuận', views: '10.1k', badge: '🔥 Đang Hot', season: 'T12 - T4', description: 'Nổi bật với những đồi cát bay vàng rực đổi màu theo nắng, dòng Suối Tiên đỏ ối kỳ lạ và bờ biển dài trong xanh.', image_url: 'https://lalago.vn/wp-content/uploads/2025/05/image7-5.jpg' },
  { id: 12, name: 'Cát Bà', location: 'Hải Phòng', views: '8.9k', badge: '⭐ Nổi Bật', season: 'T4 - T8', description: 'Đảo Ngọc lớn nhất của Vịnh Bắc Bộ, ôm trọn trong mình những bãi tắm tự nhiên trong vắt tĩnh lặng và vườn quốc gia.', image_url: 'https://pystravel.vn/_next/image?url=https%3A%2F%2Fbooking.pystravel.vn%2Fuploads%2Fposts%2Falbums%2F6274%2Fe073a7e3cd255785f32421c891f3c02f.jpg&w=1920&q=75' },
  { id: 13, name: 'Thánh địa Mỹ Sơn', location: 'Quảng Nam', views: '7.5k', badge: '⭐ Nổi Bật', season: 'T2 - T4', description: 'Ẩn mình trong một thung lũng kín đáo bao quanh bởi núi non, Mỹ Sơn là di sản kiến trúc đền tháp Chăm Pa cổ kính.', image_url: 'https://ik.imagekit.io/tvlk/blog/2023/09/thanh-dia-my-son-32.jpg?tr=q-70,c-at_max,w-1000,h-600' },
  { id: 14, name: 'Gành Đá Đĩa', location: 'Phú Yên', views: '9.2k', badge: '🔥 Đang Hot', season: 'T3 - T8', description: 'Một trong những kiệt tác địa chất hiếm hoi bậc nhất. Được tạo nên bởi hàng vạn cột đá bazan hình lục giác xếp chồng lên nhau.', image_url: 'https://statics.vinpearl.com/ganh-da-dia-phu-yen_1751078702.jpg' },
  { id: 15, name: 'Cù Lao Chàm', location: 'Quảng Nam', views: '8.4k', badge: '⭐ Nổi Bật', season: 'T3 - T8', description: 'Hòn đảo yên bình có hệ sinh thái dưới nước tuyệt vời với rạn san hô đa sắc màu, cùng nét mộc mạc của cuộc sống làng chài.', image_url: 'https://drt.danang.vn/content/images/2024/06/cu-lao-cham-o-dau-1.jpg' }
];


const REVIEWS = [
  { id: 1, user: 'Minh Tuấn', avatar: 'https://i.pravatar.cc/150?img=11', location: 'Hội An', rating: 5, content: 'Không gian tuyệt vời, ánh đèn lồng lung linh vào buổi tối. Thực sự là một trải nghiệm không thể quên!', date: '5/2026' },
  { id: 2, user: 'Thu Hương', avatar: 'https://i.pravatar.cc/150?img=5', location: 'Phú Quốc', rating: 5, content: 'Biển xanh, cát trắng, nước trong vắt. Mình đã chụp được những bức ảnh đẹp nhất cuộc đời ở đây.', date: '4/2026' },
  { id: 3, user: 'Việt Anh', avatar: 'https://i.pravatar.cc/150?img=15', location: 'Sapa', rating: 4, content: 'Ruộng bậc thang mùa lúa chín vàng rực rỡ. Đường lên đỉnh Fansipan cũng rất đáng thử!', date: '10/2025' },
];

const CATEGORIES = [
  {
    id: 'nature',
    label: 'Chữa Lành & Rừng Núi',
    icon: '🌿',
    desc: 'Rừng, hang động, cắm trại',
    color: 'from-green-900 to-green-700',
    exactLocations: ['Hang Sơn Đoòng', 'Phong Nha – Kẻ Bàng', 'Fansipan', 'Mã Pí Lèng', 'Mù Cang Chải', 'Đèo Ô Quy Hồ', 'Sìn Hồ', 'Na Hang', 'Bản Giốc', 'Ngườm Ngao', 'Hồ Ba Bể', 'Rừng tràm Trà Sư', 'Núi Cấm']
  },
  {
    id: 'beach',
    label: 'Biển Đảo Mùa Hè',
    icon: '🌊',
    desc: 'Resort, lặn san hô, hoàng hôn',
    color: 'from-blue-900 to-blue-700',
    exactLocations: ['Vịnh Hạ Long', 'Phú Quốc', 'Biển Mỹ Khê', 'Biển Sầm Sơn', 'Biển Cửa Lò', 'Biển Thiên Cầm', 'Vịnh Nha Trang', 'Cát Bà', 'Cô Tô', 'Đồ Sơn', 'Biển Đồng Châu', 'Hang Rái', 'Bàu Trắng', 'Đảo Phú Quý']
  },
  {
    id: 'culture',
    label: 'Văn Hoá & Lịch Sử',
    icon: '🏛️',
    desc: 'Phố cổ, di tích, bảo tàng',
    color: 'from-amber-900 to-amber-700',
    exactLocations: ['Phố cổ Hội An', 'Đại Nội Huế', 'Thánh địa Mỹ Sơn', 'Thành Nhà Hồ', 'Văn Miếu', 'Chùa Thiên Mụ', 'Chùa Hương Tích', 'Làng Sen quê Bác', 'Thành cổ Quảng Trị', 'Cầu Hiền Lương', 'Lăng Chủ tịch Hồ Chí Minh', 'Phố cổ', 'Đền Hùng', 'Chùa Dâu', 'Chùa Bút Tháp', 'Đền Trần', 'Tam Chúc', 'Tân Trào', 'Tràng An', 'Tháp Bà Ponagar', 'Nhà cổ Bình Thủy', 'Miếu Bà Chúa Xứ', 'Chùa Vĩnh Tràng', 'Nhà công tử Bạc Liêu']
  },
  {
    id: 'chill',
    label: 'Phượt & Khám Phá',
    icon: '🧭',
    desc: 'Đèo, trekking, cung đường đẹp',
    color: 'from-rose-900 to-rose-700',
    exactLocations: ['Sa Pa', 'Đà Lạt', 'Mộc Châu', 'Mai Châu', 'Tam Đảo', 'Chợ Bến Thành', 'Phố đi bộ Nguyễn Huệ', 'Đồng Văn', 'Lũng Cú', 'Cát Cát', 'Tam Cốc', 'Hang Múa', 'Hồ Gươm', 'Sông Hương', 'Mộc Châu', 'Đồi chè', 'Thác Dải Yếm', 'Đèo Khau Phạ', 'Đồi A1', 'Hầm Đờ Cát', 'Hồ Pá Khoang', 'Hồ Hòa Bình', 'Thanh Thủy', 'Tam Đảo', 'Tây Thiên', 'Hồ Cấm Sơn', 'Tây Yên Tử', 'Phố Hiến', 'Văn Miếu Xích Đằng', 'Hồ Núi Cốc', 'Mẫu Sơn', 'Bà Nà Hills', 'Bán đảo Sơn Trà', 'Eo Gió', 'Kỳ Co', 'Gành Đá Đĩa', 'Bãi Xép', 'Vườn nho Thái An', 'Nhà thờ Đức Bà', 'Landmark 81', 'Chợ nổi Cái Răng', 'Bến Ninh Kiều', 'Cù lao Thới Sơn', 'Làng nổi Tân Lập', 'Cánh đồng điện gió']
  },
];

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut' } } };

// ============================================================

function Suggestions() {
  const navigate = useNavigate();
  const [startLocation, setStartLocation] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [gpsCoords, setGpsCoords] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [savedLocations, setSavedLocations] = useState([]);

  // Fetch saved locations
  const fetchSavedLocations = async () => {
    if (!user) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/saved-locations`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.status === 'success') {
        setSavedLocations(data.data.map(l => l.location_name));
      }
    } catch (err) {
      console.error('Lỗi tải địa điểm yêu thích:', err);
    }
  };

  useEffect(() => {
    fetchSavedLocations();
  }, [user]);

  const handleToggleSave = async (loc) => {
    if (!user) {
      alert('Vui lòng đăng nhập để lưu địa điểm!');
      setIsAuthOpen(true);
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/saved-locations/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          location_name: loc.name,
          province: loc.location,
          image_url: loc.image_url || loc.img
        })
      });
      const data = await res.json();
      if (data.status === 'success') {
        if (data.message === 'added') {
          setSavedLocations(prev => [...prev, loc.name]);
        } else {
          setSavedLocations(prev => prev.filter(name => name !== loc.name));
        }
      }
    } catch (err) {
      console.error('Lỗi lưu địa điểm:', err);
    }
  };

  // ==== CHẾ ĐỘ 1: DANH MỤC ====
  // allSuggestions = toàn bộ địa điểm từ backend (tính từ Hà Nội)
  const [allSuggestions, setAllSuggestions] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null); // category object đang chọn

  // ==== CHẾ ĐỘ 2: TÌM KIẾM THEO TỈNH/TP ====
  // locationResults = kết quả từ API theo tọa độ người dùng nhập, đã lọc < 350km
  const [locationResults, setLocationResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);

  const catResultsRef = useRef(null);
  const locResultsRef = useRef(null);

  // ─── Kết quả danh mục (computed từ allSuggestions) ───
  const categoryResults = useMemo(() => {
    if (!activeCategory) return [];
    const month = parseInt(selectedMonth);
    let filtered = allSuggestions.filter(item =>
      activeCategory.exactLocations.some(loc =>
        item.name.toLowerCase().includes(loc.toLowerCase()) ||
        loc.toLowerCase().includes(item.name.toLowerCase())
      )
    );
    // Tính isBestMonth cho từng item
    filtered = filtered.map(item => ({
      ...item,
      isBestMonth: (
        item.best_month_start <= item.best_month_end
          ? (month >= item.best_month_start && month <= item.best_month_end)
          : (month >= item.best_month_start || month <= item.best_month_end)
      ) ? 1 : 0
    }));
    // Ưu tiên mùa đẹp → gần nhất
    return filtered.sort((a, b) => {
      if (b.isBestMonth !== a.isBestMonth) return b.isBestMonth - a.isBestMonth;
      return (a.distance || 9999) - (b.distance || 9999);
    });
  }, [allSuggestions, activeCategory, selectedMonth]);

  // ─── Tải toàn bộ địa điểm từ backend dùng Hà Nội làm gốc ───
  const loadAllSuggestions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/travel-suggestions?userLat=21.0278&userLng=105.8342&currentMonth=${selectedMonth}`);
      const result = await res.json();
      setAllSuggestions(result.data || []);
    } catch (err) {
      console.error('Lỗi tải danh mục:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllSuggestions();
  }, []);

  // ─── Nhấn chọn danh mục ───
  const handleCategoryClick = (cat) => {
    setActiveCategory(cat);
    setHasSearched(false); // ẩn phần tìm kiếm khi đang xem danh mục
    setTimeout(() => {
      catResultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  // ─── GPS ───
  const handleGetGPS = () => {
    setSearchLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setGpsCoords({ lat: latitude, lon: longitude });
        setStartLocation('📍 Vị trí hiện tại của tôi');
        doLocationSearch(latitude, longitude);
      },
      (err) => {
        console.error('Lỗi GPS:', err);
        setSearchLoading(false);
        const wantsToEnable = window.confirm(
          'Không thể lấy vị trí GPS (Lỗi: ' + err.message + ').\n\n' +
          'Bạn có muốn xem hướng dẫn bật Định vị không?'
        );
        if (wantsToEnable) window.open('https://support.google.com/chrome/answer/142065?hl=vi', '_blank');
      },
      { timeout: 15000, maximumAge: 60000 }
    );
  };

  // ─── Tìm kiếm theo tọa độ (< 350km, ưu tiên mùa đẹp) ───
  const doLocationSearch = async (lat, lon) => {
    setSearchLoading(true);
    setActiveCategory(null); // thoát chế độ danh mục
    try {
      const month = parseInt(selectedMonth);
      const res = await fetch(`${API_URL}/api/travel-suggestions?userLat=${lat}&userLng=${lon}&currentMonth=${month}`);
      const result = await res.json();
      let data = (result.data || [])
        .filter(item => item.distance < 350)
        .map(item => ({
          ...item,
          isBestMonth: (
            item.best_month_start <= item.best_month_end
              ? (month >= item.best_month_start && month <= item.best_month_end)
              : (month >= item.best_month_start || month <= item.best_month_end)
          ) ? 1 : 0
        }))
        .sort((a, b) => {
          if (b.isBestMonth !== a.isBestMonth) return b.isBestMonth - a.isBestMonth;
          return a.distance - b.distance;
        });

      // Bổ sung Wikipedia trong bán kính 50km
      try {
        const wikiRes = await fetch(`https://vi.wikipedia.org/w/api.php?action=query&prop=coordinates|pageimages|description&generator=geosearch&ggscoord=${lat}|${lon}&ggsradius=50000&ggslimit=20&format=json&piprop=thumbnail&pithumbsize=800&origin=*`);
        const wikiData = await wikiRes.json();
        if (wikiData.query?.pages) {
          const includeRegex = /\b(biển|bãi biển|quảng trường|danh lam|thắng cảnh|suối|hang|động|vườn|bảo tàng|đền|chùa|di tích|lăng|tháp|cung|nhà thờ|thác|hồ|vịnh|đảo|du lịch|công viên|chợ|làng|phố cổ|thiền viện|tu viện|thánh địa|đỉnh|núi|rừng|cầu|đèo|di sản|thành cổ|hoàng thành|địa đạo|khu sinh thái|resort|kỳ quan)\b/i;
          const excludeRegex = /\b(ủy ban|ubnd|trường|đại học|học viện|bệnh viện|trung tâm y tế|công ty|nhà máy|khu công nghiệp|cơ quan|ngân hàng|chung cư|sân bay|bến xe)\b/i;
          const existingNames = new Set(data.map(item => item.name.toLowerCase()));
          const wikiItems = Object.values(wikiData.query.pages)
            .map(page => {
              const plat = page.coordinates?.[0]?.lat;
              const plon = page.coordinates?.[0]?.lon;
              const dist = (plat && plon) ? calculateDistance(lat, lon, plat, plon) : null;
              return { id: `wiki_${page.pageid}`, name: page.title, location: page.description || 'Điểm lân cận', distance: dist, travel_time: dist ? Math.round(dist / 60 * 60) : null, tag: 'Khám Phá', best_month_start: 1, best_month_end: 12, isBestMonth: 0, image_url: page.thumbnail?.source || 'https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=800' };
            })
            .filter(item => item.distance !== null && item.distance < 350 && !existingNames.has(item.name.toLowerCase()) && includeRegex.test(item.name + ' ' + item.location) && !excludeRegex.test(item.name + ' ' + item.location));
          data = [...data, ...wikiItems].sort((a, b) => {
            if (b.isBestMonth !== a.isBestMonth) return b.isBestMonth - a.isBestMonth;
            return a.distance - b.distance;
          });
        }
      } catch { }

      setLocationResults(data);
      setHasSearched(true);
      setTimeout(() => {
        locResultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    } catch (err) {
      console.error('Lỗi tìm kiếm:', err);
    } finally {
      setSearchLoading(false);
    }
  };

  // ─── Tìm kiếm theo địa điểm nhập ───
  const handleLocationSearch = async () => {
    if (!startLocation.trim()) return;
    if (startLocation === '📍 Vị trí hiện tại của tôi' && gpsCoords) {
      return doLocationSearch(gpsCoords.lat, gpsCoords.lon);
    }
    setSearchLoading(true);
    try {
      const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(startLocation + ', Vietnam')}`);
      const geoData = await geoRes.json();
      if (geoData.length > 0) {
        await doLocationSearch(parseFloat(geoData[0].lat), parseFloat(geoData[0].lon));
      } else {
        alert('Không tìm thấy tỉnh/thành phố này. Hãy thử lại với tên khác!');
        setSearchLoading(false);
      }
    } catch (err) {
      console.error('Lỗi geocode:', err);
      setSearchLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-[#0A241A]">
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} onAuthSuccess={(userData) => setUser(userData)} />

      {/* ===== 1. HERO SEARCH BANNER ===== */}
      <section className="relative h-[65vh] flex flex-col justify-center items-center px-4 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/vietnam_hero_bg.png')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-[#0A241A]" />

        <div className="relative z-10 w-full max-w-5xl text-center space-y-8">
          <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="text-[#D4AF37] font-bold uppercase tracking-[0.35em] text-xs"
          >
            WanderlyVietNam · Gợi Ý Du Lịch
          </motion.p>

          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1 }}
            className="text-5xl md:text-6xl lg:text-7xl font-heading font-bold text-white drop-shadow-2xl leading-tight"
          >
            Khởi Đầu <span className="text-[#D4AF37] italic font-light">Hành Trình</span>
          </motion.h1>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}
            className="bg-[#112418]/80 backdrop-blur-2xl rounded-[1.5rem] shadow-[0_4px_20px_rgba(0,0,0,0.4)] border border-white/10 flex flex-col md:flex-row items-center gap-0 w-full overflow-hidden"
          >
            <div className="flex-[3] relative flex items-center w-full">
              <span className="absolute left-5 text-xl text-[#D4AF37]">📍</span>
              <input
                className="w-full py-5 pl-14 pr-12 bg-transparent outline-none font-semibold text-white placeholder-white/40 text-base border-b md:border-b-0 md:border-r border-white/10"
                placeholder="Xuất phát từ đâu?"
                value={startLocation}
                onChange={(e) => { setStartLocation(e.target.value); if (e.target.value !== '📍 Vị trí hiện tại của tôi') setGpsCoords(null); }}
                onKeyDown={(e) => e.key === 'Enter' && handleLocationSearch()}
              />
              <button
                onClick={handleGetGPS}
                title="Lấy vị trí của tôi"
                className="absolute right-4 text-white/50 hover:text-[#D4AF37] transition-colors"
              >
                🧭
              </button>
            </div>
            <div className="flex-1 relative flex items-center justify-center w-full">
              <span className="absolute left-5 text-xl">🗓️</span>
              <select
                className="w-full py-5 pl-14 pr-5 bg-transparent outline-none font-semibold text-white/80 text-base cursor-pointer appearance-none border-b md:border-b-0 md:border-r border-white/10"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              >
                {[...Array(12)].map((_, i) => <option key={i + 1} value={i + 1} className="bg-[#0A241A]">Tháng {i + 1}</option>)}
              </select>
            </div>
            <button
              onClick={handleLocationSearch}
              className="flex-shrink-0 w-full md:w-auto bg-[#D4AF37] text-black px-10 py-5 font-black hover:bg-white transition-all duration-300 uppercase tracking-widest text-sm"
            >
              {searchLoading ? '⏳ Đang tìm...' : '🔍 Tìm Kiếm'}
            </button>
          </motion.div>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.5 }} className="text-white/60 text-sm italic font-light pt-2">
            💡 Mẹo: Nhấn vào <span className="text-[#D4AF37] font-bold">la bàn (🧭)</span> để tự động định vị và tìm nhanh các điểm đến quanh bạn!
          </motion.p>
        </div>
      </section>

      {/* ===== 2. CATEGORIES ===== */}
      <section className="max-w-[1200px] mx-auto px-5 py-16">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-10">
          <p className="text-[#D4AF37] font-bold uppercase tracking-[0.3em] text-xs mb-3">Phong Cách Du Lịch</p>
          <h2 className="text-4xl font-heading font-bold text-white">Bạn Đang Tìm Kiếm <span className="text-[#C27A5B] italic font-light">Điều Gì?</span></h2>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {CATEGORIES.map((cat, i) => (
            <motion.div
              key={cat.id}
              initial="hidden" whileInView="visible" viewport={{ once: true }}
              variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.6 } } }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleCategoryClick(cat)}
              className={`group relative rounded-[1.5rem] p-6 cursor-pointer overflow-hidden border border-white/10 hover:border-[#D4AF37]/50 transition-all duration-500 bg-gradient-to-br ${cat.color} hover:shadow-[0_10px_30px_rgba(212,175,55,0.15)]`}
            >
              <div className="text-4xl mb-4">{cat.icon}</div>
              <h3 className="font-bold text-white text-base mb-1 leading-tight">{cat.label}</h3>
              <p className="text-white/60 text-xs">{cat.desc}</p>
              <div className="absolute bottom-3 right-4 text-white/20 group-hover:text-[#D4AF37]/60 transition-colors text-xl">→</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ===== 3A. KẾT QUẢ DANH MỤC ===== */}
      {activeCategory && (
        <section ref={catResultsRef} className="max-w-[1200px] mx-auto px-5 py-10 scroll-mt-20">
          <div className="bg-[#112418] p-10 rounded-[2rem] border border-white/10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10">
              <div>
                <p className="text-[#D4AF37] font-bold uppercase tracking-widest text-xs mb-2">Đề xuất danh mục</p>
                <h3 className="text-3xl font-heading font-bold text-[#F5F2EB]">
                  {activeCategory.icon} {activeCategory.label}
                </h3>
              </div>
              <button
                onClick={() => setActiveCategory(null)}
                className="text-xs text-white/40 hover:text-[#D4AF37] border border-white/10 px-4 py-2 rounded-full transition-all flex items-center gap-2"
              >
                Ẩn kết quả ✕
              </button>
            </div>
            {loading ? (
              <div className="text-center py-16">
                <div className="text-4xl mb-3 animate-pulse">⏳</div>
                <p className="text-white/30 text-xs uppercase tracking-widest">Đang tải dữ liệu...</p>
              </div>
            ) : categoryResults.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {categoryResults.map((loc, idx) => (
                  <div key={loc.id || idx}>
                    <LocationCard
                      loc={loc}
                      month={selectedMonth}
                      onClick={() => setSelectedLocation(loc)}
                      isSaved={savedLocations.includes(loc.name)}
                      onToggleSave={handleToggleSave}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-black/20 rounded-[1.5rem] border border-dashed border-white/5">
                <div className="text-4xl mb-3 opacity-30">🌏</div>
                <p className="text-white/40 text-xs uppercase tracking-widest font-bold">Chưa có dữ liệu cho danh mục này</p>
                <p className="text-white/20 text-xs mt-2">Hệ thống đang cập nhật thêm địa điểm mới</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ===== 3B. KẾT QUẢ TÌM KIẾM THEO TỈNH/TP ===== */}

      {hasSearched && (
        <section ref={locResultsRef} className="max-w-[1200px] mx-auto px-5 py-10 scroll-mt-20">
          <div className="bg-[#112418] p-10 rounded-[2rem] border border-white/10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10">
              <div>
                <p className="text-[#D4AF37] font-bold uppercase tracking-widest text-xs mb-2">Gợi ý theo vị trí · Dưới 350km</p>
                <h3 className="text-3xl font-heading font-bold text-[#F5F2EB]">
                  Địa Điểm <span className="text-[#D4AF37] italic font-light">Gần Bạn Nhất</span>
                </h3>
              </div>
              <button
                onClick={() => { setHasSearched(false); setLocationResults([]); setStartLocation(''); }}
                className="text-xs text-white/40 hover:text-[#D4AF37] border border-white/10 px-4 py-2 rounded-full transition-all"
              >
                Xóa tìm kiếm ✕
              </button>
            </div>
            {searchLoading ? (
              <div className="text-center py-16">
                <div className="text-4xl mb-3 animate-pulse">⏳</div>
                <p className="text-white/30 text-xs uppercase tracking-widest">Đang tìm kiếm các địa điểm...</p>
              </div>
            ) : locationResults.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {locationResults.map((loc, idx) => (
                  <div key={loc.id || idx}>
                    <LocationCard
                      loc={loc}
                      month={selectedMonth}
                      onClick={() => setSelectedLocation(loc)}
                      isSaved={savedLocations.includes(loc.name)}
                      onToggleSave={handleToggleSave}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-black/20 rounded-[1.5rem] border border-dashed border-white/5">
                <div className="text-4xl mb-3 opacity-30">🔍</div>
                <p className="text-white/40 text-xs uppercase tracking-widest font-bold">Không có địa điểm nào trong 350km</p>
                <p className="text-white/20 text-xs mt-2">Hãy thử nhập tỉnh/thành phố khác</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ===== 4. TRENDING - ĐIỂM ĐẾN ĐANG THỊNH HÀNH ===== */}
      <section className="max-w-[1200px] mx-auto px-5 py-16">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="flex flex-col md:flex-row justify-between items-end mb-10">
          <div>
            <p className="text-[#D4AF37] font-bold uppercase tracking-[0.3em] text-xs mb-3">Xu Hướng Tháng {selectedMonth}</p>
            <h2 className="text-4xl font-heading font-bold text-[#F5F2EB]">Điểm Đến <span className="text-[#D4AF37] italic font-light">Đang Thịnh Hành</span></h2>
          </div>
          <p className="text-white/50 text-sm mt-4 md:mt-0">Dựa trên tìm kiếm của cộng đồng WanderlyVietNam</p>
        </motion.div>

        <div className="relative overflow-hidden w-full py-4 -mx-5 px-5">
          <div className="flex gap-6 w-max animate-marquee">
            {[...TRENDING, ...TRENDING].map((dest, i) => (
              <div
                key={`${dest.id}-${i}`}
                onClick={() => setSelectedLocation(dest)}
                className="w-[280px] sm:w-[320px] flex-shrink-0 group relative h-[360px] rounded-[1.5rem] overflow-hidden cursor-pointer border border-white/5 hover:border-[#D4AF37]/40 hover:shadow-[0_10px_30px_rgba(212,175,55,0.2)] transition-all duration-500"
              >
                <img src={dest.image_url} alt={dest.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                {/* Badge */}
                <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-white text-[10px] font-black px-3 py-1.5 rounded-full border border-white/10 uppercase tracking-wider">
                  {dest.badge}
                </div>
                {/* Favorite Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleSave(dest);
                  }}
                  className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 hover:bg-black/60 transition-all group/heart hover:scale-110"
                >
                  <Heart
                    size={16}
                    className={`transition-colors ${savedLocations.includes(dest.name) ? 'text-red-500 fill-red-500' : 'text-white group-hover/heart:text-red-400'}`}
                  />
                </button>
                {/* Content */}
                <div className="absolute bottom-0 left-0 p-5 w-full">
                  <div className="flex justify-between items-end mb-2">
                    <div>
                      <h3 className="text-xl font-heading font-bold text-white mb-1">{dest.name}</h3>
                      <p className="text-white/60 text-xs flex items-center gap-1">📍 {dest.location}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('/guide', { state: { locationName: dest.name, province: dest.location } });
                      }}
                      className="p-2 rounded-lg bg-gold/20 text-gold hover:bg-gold hover:text-black transition-all border border-gold/30 flex items-center gap-1 text-[9px] font-black uppercase tracking-widest"
                    >
                      <BookOpen size={10} /> Cẩm Nang
                    </button>
                  </div>
                  <p className="text-white/80 text-[12px] leading-relaxed mb-3 line-clamp-2">
                    {dest.description}
                  </p>
                  <div className="mt-2 pt-3 border-t border-white/10 text-white/50 text-[10px] uppercase tracking-widest flex justify-between items-center">
                    <span>Mùa đẹp: {dest.season}</span>
                    <p className="text-[#D4AF37] text-xs font-bold flex items-center gap-1">👁 {dest.views}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 5. GẦN BẠN NHẤT (GPS) ĐÃ BỊ LOẠI BỎ (GỘP VÀO KẾT QUẢ TÌM KIẾM) ===== */}

      {/* ===== 6. ĐÁNH GIÁ TỪ CỘNG ĐỒNG ===== */}
      <section className="max-w-[1200px] mx-auto px-5 py-16 border-t border-white/5">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-12">
          <p className="text-[#C27A5B] font-bold uppercase tracking-[0.3em] text-xs mb-3">Cộng Đồng WanderlyVietNam</p>
          <h2 className="text-4xl font-heading font-bold text-[#F5F2EB]">Góc <span className="text-[#D4AF37] italic font-light">Chia Sẻ</span></h2>
          <p className="text-white/50 text-sm mt-3">Trải nghiệm thực tế từ những người đã đi</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {REVIEWS.map((review, i) => (
            <motion.div
              key={review.id}
              initial="hidden" whileInView="visible" viewport={{ once: true }}
              variants={{ hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0, transition: { delay: i * 0.15, duration: 0.6 } } }}
              className="bg-[#112418] rounded-[1.5rem] p-8 border border-white/5 hover:border-[#D4AF37]/30 hover:shadow-[0_8px_30px_rgba(212,175,55,0.1)] transition-all duration-500 flex flex-col gap-5"
            >
              {/* Stars */}
              <div className="flex gap-1">
                {[...Array(review.rating)].map((_, s) => <span key={s} className="text-[#D4AF37] text-sm">★</span>)}
                {[...Array(5 - review.rating)].map((_, s) => <span key={s} className="text-white/20 text-sm">★</span>)}
              </div>
              {/* Quote */}
              <p className="text-white/70 text-sm leading-relaxed italic flex-1">"{review.content}"</p>
              {/* Location tag */}
              <div className="text-[10px] text-[#D4AF37] font-bold uppercase tracking-widest">📍 {review.location}</div>
              {/* User info */}
              <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                <img src={review.avatar} alt={review.user} className="w-10 h-10 rounded-full object-cover border-2 border-[#D4AF37]/30" />
                <div>
                  <p className="text-white font-bold text-sm">{review.user}</p>
                  <p className="text-white/40 text-xs">{review.date}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Tích hợp Location Detail Modal */}
      <LocationDetailModal
        isOpen={!!selectedLocation}
        onClose={() => setSelectedLocation(null)}
        location={selectedLocation}
      />
    </div>
  );
}

export default Suggestions;