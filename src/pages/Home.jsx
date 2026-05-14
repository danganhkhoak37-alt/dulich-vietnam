import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Star, ChevronRight, User, Mail, Send, Mountain, Utensils, Tent, Eye, X, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LocationDetailModal from '../components/LocationDetailModal';

function Home() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [showAllDestinations, setShowAllDestinations] = useState(false);
  const [selectedLandscape, setSelectedLandscape] = useState(null);

  const landscapes = [
    {
      img: 'https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=2070&auto=format&fit=crop',
      title: 'Vịnh Hạ Long',
      location: 'Quảng Ninh',
      rating: 4.9,
      time: 'Tháng 9 - 11',
      desc: 'Di sản thiên nhiên thế giới được UNESCO công nhận. Vịnh Hạ Long nổi tiếng với hàng ngàn hòn đảo đá vôi kỳ vĩ vươn lên từ mặt nước xanh ngọc lục bảo, cùng những hang động thạch nhũ tuyệt đẹp như Động Thiên Cung, Hang Sửng Sốt. Trải nghiệm du thuyền ngắm hoàng hôn trên vịnh là hoạt động không thể bỏ lỡ.'
    },
    {
      img: 'https://media.vietravel.com/images/Content/dia-diem-du-lich-sapa-1.png',
      title: 'Sapa',
      location: 'Lào Cai',
      rating: 4.8,
      time: 'Tháng 9 - 11',
      desc: 'Thị trấn mờ sương Sapa làm say đắm du khách bởi những thửa ruộng bậc thang chín vàng uốn lượn quanh sườn đồi, nét văn hóa độc đáo của các bản làng dân tộc thiểu số như Cát Cát, Tả Van. Đặc biệt, bạn có cơ hội chinh phục đỉnh Fansipan - Nóc nhà Đông Dương hùng vĩ.'
    },
    {
      img: 'https://images.vietnamtourism.gov.vn/vn/images/2021/trang_an.jpg',
      title: 'Tràng An',
      location: 'Ninh Bình',
      rating: 4.8,
      time: 'Tháng 1 - 3',
      desc: 'Được mệnh danh là "Vịnh Hạ Long trên cạn", quần thể danh thắng Tràng An mê hoặc lòng người với hệ thống núi đá vôi trùng điệp, các thung lũng ngập nước và những hang động xuyên thủy nguyên sơ. Ngồi đò chèo tay mộc mạc xuôi theo dòng sào khê là trải nghiệm yên bình tuyệt đối.'
    },
    {
      img: 'https://hoiancreativecity.com/uploads/images/thang%202-2023/hoi-an-gd659f3b8f_1920-1280x853.jpg',
      title: 'Phố Cổ Hội An',
      location: 'Quảng Nam',
      rating: 4.8,
      time: 'Tháng 2 - 4',
      desc: 'Di sản văn hóa thế giới với những ngôi nhà tường vàng mái ngói rêu phong, con hẻm nhỏ lung linh dưới ánh đèn lồng lụa đỏ mỗi đêm rằm. Hội An không chỉ đẹp về kiến trúc cổ kính mà còn níu chân du khách bởi nền ẩm thực đường phố xuất sắc với Cao Lầu, Mì Quảng, Nước Mót.'
    },
    {
      img: 'https://mtcs.1cdn.vn/2023/03/23/quan-dao-an-thoi-phu-quoc.jpg',
      title: 'Phú Quốc',
      location: 'Kiên Giang',
      rating: 4.9,
      time: 'Tháng 11 - 4',
      desc: 'Đảo ngọc Phú Quốc là thiên đường nghỉ dưỡng biển hàng đầu Việt Nam. Nơi đây sở hữu những bãi biển cát trắng mịn màng như Bãi Sao, Bãi Khem, hệ sinh thái rạn san hô đa dạng rực rỡ và những khu vui chơi giải trí mang tầm cỡ quốc tế. Đặc sản hải sản và nước mắm truyền thống cũng là điểm nhấn khó quên.'
    },
    {
      img: 'https://ecotour.com.vn/wp-content/uploads/2025/05/du-lich-dong-phong-nha-ke-bang-quang-binh.jpeg',
      title: 'Phong Nha - Kẻ Bàng',
      location: 'Quảng Bình',
      rating: 4.9,
      time: 'Tháng 3 - 8',
      desc: 'Vương quốc hang động Phong Nha - Kẻ Bàng là Di sản thiên nhiên thế giới với hệ thống hang động kiến tạo kỳ bí và tráng lệ nhất toàn cầu. Thám hiểm Động Phong Nha, Động Thiên Đường hùng vĩ hay thử thách bản thân với hang Sơn Đoòng lớn nhất thế giới sẽ là trải nghiệm nhớ đời.'
    },
    {
      img: 'https://luxurytravel.vn/wp-content/uploads/2023/05/Da-Nang-1.jpg',
      title: 'Đà Nẵng',
      location: 'Đà Nẵng',
      rating: 4.8,
      time: 'Tháng 3 - 8',
      desc: 'Thành phố đáng sống nhất Việt Nam sở hữu bãi biển Mỹ Khê lọt top đẹp nhất hành tinh, những cây cầu biểu tượng như Cầu Rồng, Cầu Sông Hàn, và khu du lịch Bà Nà Hills bồng bềnh tiên cảnh. Sự thân thiện của con người và nhịp sống văn minh, sạch sẽ nơi đây luôn làm nức lòng du khách.'
    },
    {
      img: 'https://bizweb.dktcdn.net/thumb/1024x1024/100/093/257/products/thung-lung-ngan-hoa.jpg?v=1731570795333',
      title: 'Đà Lạt',
      location: 'Lâm Đồng',
      rating: 4.8,
      time: 'Tháng 11 - 3',
      desc: 'Thành phố ngàn hoa với không khí se lạnh mờ sương, những đồi thông reo trong gió và vô số homestay có gu. Đà Lạt lãng mạn, nên thơ là chốn trốn lý tưởng để thưởng thức một ly cà phê ấm nóng ven hồ Xuân Hương và đắm chìm trong vẻ cổ kính của kiến trúc Pháp để lại.'
    },
    {
      img: 'https://kinhtevadubao.vn/stores/news_dataimages/kinhtevadubaovn/092018/18/14/1537170510-news-1243820210326195207.3736490.jpg?randTime=1777256014',
      title: 'Cố đô Huế',
      location: 'Thừa Thiên Huế',
      rating: 4.8,
      time: 'Tháng 2 - 4',
      desc: 'Mang trong mình vẻ đẹp trầm mặc, cổ kính của kinh thành xưa, Huế gây ấn tượng với hệ thống Lăng Tẩm vua chúa triều Nguyễn, chùa Thiên Mụ linh thiêng và dòng Sông Hương thơ mộng lững lờ trôi. Đừng quên thưởng thức nhã nhạc cung đình và ẩm thực cung đình Huế tinh tế, tỉ mỉ.'
    },
    {
      img: 'https://datviettour.com.vn/uploads/images/mien-bac/ha-giang/hinh-danh-thang/cot-co-lung-cu.jpg',
      title: 'Tà Xùa - Hà Giang',
      location: 'Hà Giang',
      rating: 4.7,
      time: 'Tháng 9 - 11',
      desc: 'Mảnh đất địa đầu tổ quốc mang vẻ đẹp hoang sơ, tráng lệ với cao nguyên đá Đồng Văn ngoạn mục, đèo Mã Pí Lèng hiểm trở sương mù bao phủ và dòng sông Nho Quế xanh ngắt uốn lượn dưới hẻm vực. Đặc biệt vào mùa hoa tam giác mạch, đá nở hoa tô điểm thêm nét tình cho non cao rợn ngợp.'
    },
    {
      img: 'https://lalago.vn/wp-content/uploads/2025/05/image7-5.jpg',
      title: 'Mũi Né',
      location: 'Bình Thuận',
      rating: 4.7,
      time: 'Tháng 12 - 4',
      desc: 'Được ưu ái gọi tên là "Thủ phủ Resort", Mũi Né nổi bật với những đồi cát bay vàng rực đổi màu theo nắng, dòng Suối Tiên đỏ ối kỳ lạ và bờ biển dài trong xanh thích hợp cho môn thể thao lướt ván diều. Một vùng đất đầy nắng và gió với nét quyến rũ không thể cưỡng lại.'
    },
    {
      img: 'https://pystravel.vn/_next/image?url=https%3A%2F%2Fbooking.pystravel.vn%2Fuploads%2Fposts%2Falbums%2F6274%2Fe073a7e3cd255785f32421c891f3c02f.jpg&w=1920&q=75',
      title: 'Cát Bà',
      location: 'Hải Phòng',
      rating: 4.7,
      time: 'Tháng 4 - 8',
      desc: 'Đảo Ngọc lớn nhất của Vịnh Bắc Bộ, ôm trọn trong mình những bãi tắm tự nhiên trong vắt tĩnh lặng và vườn quốc gia sinh thái đa dạng. Vịnh Lan Hạ liền kề Cát Bà với vẻ đẹp hoang sơ tĩnh mịch, không ồn ào mang đến trải nghiệm nghỉ dưỡng thực sự thư thái giữa lòng thiên nhiên.'
    },
    {
      img: 'https://ik.imagekit.io/tvlk/blog/2023/09/thanh-dia-my-son-32.jpg?tr=q-70,c-at_max,w-1000,h-600',
      title: 'Thánh địa Mỹ Sơn',
      location: 'Quảng Nam',
      rating: 4.6,
      time: 'Tháng 2 - 4',
      desc: 'Ẩn mình trong một thung lũng kín đáo bao quanh bởi núi non, Mỹ Sơn là di sản kiến trúc đền tháp Chăm Pa cổ kính mang đậm yếu tố tôn giáo tâm linh. Các bức phù điêu chạm trổ tinh xảo trên gạch nung sống sót qua ngàn năm lịch sử luôn là dấu hỏi thu hút sự tò mò của những tâm hồn yêu khảo cổ học.'
    },
    {
      img: 'https://statics.vinpearl.com/ganh-da-dia-phu-yen_1751078702.jpg',
      title: 'Gành Đá Đĩa',
      location: 'Phú Yên',
      rating: 4.8,
      time: 'Tháng 3 - 8',
      desc: 'Một trong những kiệt tác địa chất hiếm hoi bậc nhất trên thế giới. Gành Đá Đĩa được tạo nên bởi hàng vạn cột đá bazan hình lục giác xếp chồng lên nhau ngay ngắn như có bàn tay tạo hóa can thiệp, vươn mình ra biển lớn đón những con sóng bạc đầu tung bọt trắng xóa.'
    },
    {
      img: 'https://drt.danang.vn/content/images/2024/06/cu-lao-cham-o-dau-1.jpg',
      title: 'Cù Lao Chàm',
      location: 'Quảng Nam',
      rating: 4.7,
      time: 'Tháng 3 - 8',
      desc: 'Hòn đảo yên bình được vinh danh là Khu dự trữ sinh quyển thế giới. Cù Lao Chàm có hệ sinh thái dưới nước tuyệt vời với rạn san hô đa sắc màu, cùng nét mộc mạc không khói bụi nhựa ni lông của cuộc sống làng chài. Một điểm lặn ngắm san hô và thưởng thức hải sản tươi rói không thể bỏ qua.'
    }
  ];

  const visibleLandscapes = showAllDestinations ? landscapes : landscapes.slice(0, 3);

  const cultures = [
    {
      icon: <Utensils size={32} className="text-gold mb-4" />,
      title: 'Hương Vị Bản Địa',
      desc: 'Từ phở Hà Nội thanh tao đến bánh mì Sài Gòn đậm đà, ẩm thực Việt là bản giao hưởng của vị giác.'
    },
    {
      icon: <Mountain size={32} className="text-gold mb-4" />,
      title: 'Di Sản Văn Hoá',
      desc: 'Những đền tháp rêu phong và phố cổ mang đậm dấu ấn lịch sử hàng nghìn năm.'
    },
    {
      icon: <Tent size={32} className="text-gold mb-4" />,
      title: 'Đời Sống Thường Nhật',
      desc: 'Sự bình dị của người dân vùng cao hay nhịp sống trôi nổi của miệt vườn sông nước.'
    }
  ];

  // ─── Xử lý Điểm Đến Theo Mùa (Chuẩn theo tháng hiện tại) ───
  const currentMonth = new Date().getMonth() + 1;
  const getSeasonalTitle = () => {
    if (currentMonth >= 1 && currentMonth <= 3) return { label: 'Mùa Xuân Rực Rỡ', color: 'text-pink-400' };
    if (currentMonth >= 4 && currentMonth <= 6) return { label: 'Mùa Hè Rực Nắng', color: 'text-gold' };
    if (currentMonth >= 7 && currentMonth <= 9) return { label: 'Mùa Thu Lãng Mạn', color: 'text-orange-400' };
    return { label: 'Mùa Đông Ấm Áp', color: 'text-blue-400' };
  };

  const seasonalData = [
    // XUÂN (T1 - T3)
    { title: 'Tràng An', monthStart: 1, monthEnd: 3, theme: 'Lễ Hội Đầu Năm', subtitle: 'Hành hương chiêm bái và ngắm nhìn non nước Ninh Bình vào xuân.', img: 'https://images.vietnamtourism.gov.vn/vn/images/2021/trang_an.jpg', rating: 4.9 },
    { title: 'Sapa', monthStart: 1, monthEnd: 3, theme: 'Săn Mây & Tuyết', subtitle: 'Trải nghiệm cái lạnh vùng cao và vẻ đẹp thơ mộng của thị trấn mờ sương.', img: 'https://media.vietravel.com/images/Content/dia-diem-du-lich-sapa-1.png', rating: 4.8 },
    { title: 'Mộc Châu', monthStart: 1, monthEnd: 2, theme: 'Mùa Hoa Cải Trắng', subtitle: 'Ngắm nhìn những cánh đồng hoa cải trắng muốt trải dài khắp thung lũng.', img: 'https://i1-e.pinimg.com/1200x/64/09/ed/6409ed2aeb6462336d7bce3e6fd71deb.jpg', rating: 4.7 },

    // HÈ (T4 - T6)
    { title: 'Nha Trang', monthStart: 3, monthEnd: 8, theme: 'Biển Xanh Cát Trắng', subtitle: 'Vịnh biển đẹp nhất hành tinh bước vào mùa biển lặng, xanh ngắt.', img: 'https://ik.imagekit.io/tvlk/blog/2023/09/bien-my-khe-18.jpg?tr=q-70,c-at_max,w-1000,h-600', rating: 4.9 },
    { title: 'Phú Yên', monthStart: 4, monthEnd: 7, theme: 'Xứ Sở Hoa Vàng', subtitle: 'Khám phá Gành Đá Đĩa kỳ vĩ và những bãi biển hoang sơ nắng vàng.', img: 'https://statics.vinpearl.com/ganh-da-dia-phu-yen_1751078702.jpg', rating: 4.8 },
    { title: 'Đà Nẵng', monthStart: 3, monthEnd: 8, theme: 'Thành Phố Sự Kiện', subtitle: 'Chiêm ngưỡng pháo hoa quốc tế và tắm biển Mỹ Khê rực nắng.', img: 'https://luxurytravel.vn/wp-content/uploads/2023/05/Da-Nang-1.jpg', rating: 4.9 },
    { title: 'Đảo Cô Tô', monthStart: 4, monthEnd: 6, theme: 'Đảo Ngọc Miền Bắc', subtitle: 'Tận hưởng làn nước trong xanh và không gian yên bình tại vùng biển phía Bắc.', img: 'https://upload.wikimedia.org/wikipedia/commons/1/16/%C3%82u_c%E1%BA%A3ng.jpg', rating: 4.7 },

    // THU (T7 - T9)
    { title: 'Vịnh Hạ Long', monthStart: 9, monthEnd: 11, theme: 'Di Sản Mùa Thu', subtitle: 'Ngắm nhìn kỳ quan thiên nhiên trong làn sương mờ ảo của tiết trời thu.', img: 'https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=2070&auto=format&fit=crop', rating: 4.9 },
    { title: 'Hà Nội', monthStart: 8, monthEnd: 10, theme: 'Hà Nội 12 Mùa Hoa', subtitle: 'Tiết trời se lạnh, mùi hoa sữa nồng nàn và vẻ đẹp hoài cổ của thủ đô.', img: 'https://vcdn1-du-lich.vnecdn.net/2022/09/14/pho-phan-dinh-phung-4-1663145453.jpg?w=1200&h=0&q=100&dpr=1&fit=crop&s=Zl0-W8IeXUv9l2R6vK6n7A', rating: 4.8 },
    { title: 'Mù Cang Chải', monthStart: 9, monthEnd: 10, theme: 'Mùa Vàng Ruộng Bậc Thang', subtitle: 'Chiêm ngưỡng những thửa ruộng bậc thang chín vàng óng ả dưới nắng thu.', img: 'https://i1-e.pinimg.com/1200x/b0/94/af/b094af6ec04ffb62f90ea6e01b1dd9d1.jpg', rating: 4.9 },

    // ĐÔNG (T10 - T12)
    { title: 'Phú Quốc', monthStart: 11, monthEnd: 4, theme: 'Thiên Đường Nghỉ Dưỡng', subtitle: 'Trốn lạnh phương Bắc để tận hưởng nắng ấm tại đảo ngọc Phú Quốc.', img: 'https://mtcs.1cdn.vn/2023/03/23/quan-dao-an-thoi-phu-quoc.jpg', rating: 4.9 },
    { title: 'Đà Lạt', monthStart: 11, monthEnd: 3, theme: 'Thành Phố Ngàn Hoa', subtitle: 'Mùa của sương mù, hoa dã quỳ và những tách cà phê nóng ấm.', img: 'https://bizweb.dktcdn.net/thumb/1024x1024/100/093/257/products/thung-lung-ngan-hoa.jpg?v=1731570795333', rating: 4.8 },
    { title: 'An Giang', monthStart: 10, monthEnd: 12, theme: 'Mùa Nước Nổi', subtitle: 'Trải nghiệm cuộc sống sông nước và rừng tràm Trà Sư xanh mướt.', img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR76z9rv6sMhGBL18WL3XlzRC1M_KH1k7Ae8Q&s', rating: 4.7 }
  ];

  const currentSeasonal = seasonalData
    .filter(item => {
      if (item.monthStart <= item.monthEnd) return currentMonth >= item.monthStart && currentMonth <= item.monthEnd;
      return currentMonth >= item.monthStart || currentMonth <= item.monthEnd;
    })
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 3);

  const seasonalHeader = getSeasonalTitle();

  const fadeUp = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
  };

  return (
    <div className="w-full bg-[#0A241A]">
      {/* 1. HERO SECTION */}
      <section className="relative h-screen flex items-center justify-center text-center text-white overflow-hidden">
        <video
          className="absolute top-0 left-0 w-full h-full object-cover z-0"
          autoPlay loop muted playsInline
          poster="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1920"
          onError={(e) => { e.target.style.display = 'none'; }}
        >
          <source src="/hero-video.mp4" type="video/mp4" />
        </video>
        <div className="absolute top-0 left-0 w-full h-full bg-cover bg-center z-[-1]" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1920')" }} />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/30 to-[#111] z-10" />

        <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="relative z-20 px-5 max-w-5xl">
          <motion.h1 variants={fadeUp} className="font-heading text-5xl md:text-7xl lg:text-[6rem] mb-6 font-bold leading-tight tracking-tight">
            Cảnh Sắc Tráng Lệ Của <br /> <span className="text-gold italic font-light">Việt Nam</span>
          </motion.h1>
          <motion.p variants={fadeUp} className="text-lg md:text-xl mb-12 font-light opacity-90 max-w-2xl mx-auto tracking-wide">
            Các bạn đang muốn đi đâu, vậy thì cùng đi khám phá với chúng mình nhé.
          </motion.p>
          <motion.a variants={fadeUp} href="#destinations" className="inline-flex items-center gap-2 bg-transparent text-white px-10 py-4 rounded-full font-bold border border-white/30 hover:border-gold hover:bg-gold hover:text-black transition-all duration-500 uppercase tracking-[0.2em] text-xs backdrop-blur-md">
            Khám phá ngay <ChevronRight size={16} />
          </motion.a>
        </motion.div>
      </section>

      {/* 2. CẢNH QUAN NỔI BẬT */}
      <section id="destinations" className="relative py-32 bg-[#0A241A] text-white overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gold opacity-[0.03] rounded-full blur-[120px] pointer-events-none"></div>
        <div className="max-w-[1200px] mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeUp} className="flex flex-col md:flex-row justify-between items-end mb-16">
            <div>
              <p className="text-gold font-bold uppercase tracking-[0.3em] text-xs mb-4">Điểm đến nổi bật</p>
              <h2 className="text-5xl md:text-6xl font-heading font-bold">Khám Phá <br /><span className="text-gray-500 font-light italic">Tự Nhiên</span></h2>
            </div>
            <button onClick={() => setShowAllDestinations(!showAllDestinations)} className="flex items-center gap-2 px-6 py-3 rounded-full border border-gold/50 text-gold text-xs font-bold uppercase tracking-widest hover:bg-gold hover:text-black transition-all mt-6 md:mt-0 shadow-[0_0_15px_rgba(212,175,55,0.2)] hover:shadow-[0_0_25px_rgba(212,175,55,0.6)] backdrop-blur-sm">
              {showAllDestinations ? 'Thu gọn' : 'Xem tất cả'}
              <ChevronRight size={16} className={`transition-transform duration-500 ${showAllDestinations ? "-rotate-90" : "rotate-90"}`} />
            </button>
          </motion.div>

          <motion.div layout className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <AnimatePresence>
              {visibleLandscapes.map((item, idx) => (
                <motion.div layout key={item.title} initial={{ opacity: 0, y: 50, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -30, scale: 0.9 }} transition={{ duration: 0.6, delay: showAllDestinations && idx >= 3 ? (idx % 3) * 0.15 : 0, ease: "easeOut" }} className="group relative h-[450px] rounded-2xl overflow-hidden cursor-pointer border border-white/5 bg-[#112418] shadow-2xl hover:border-gold/50 hover:shadow-[0_10px_30px_rgba(212,175,55,0.2)] transition-all duration-500" onClick={() => setSelectedLandscape(item)}>
                  <img src={item.img} alt={item.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-80 group-hover:opacity-100" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity duration-500" />
                  <div className="absolute bottom-0 left-0 w-full p-8 flex flex-col justify-end h-full text-white">
                    <div className="flex justify-between items-center mb-3">
                      <span className="flex items-center gap-1 text-xs font-bold bg-white/10 backdrop-blur-md px-3 py-1 rounded-full"><Eye size={12} className="text-gold" /> {item.rating}k</span>
                      <span className="text-[10px] uppercase tracking-[0.3em] font-semibold text-white/90 bg-black/40 px-3 py-1 rounded-full border border-white/10 shadow-sm">{item.time}</span>
                    </div>
                    <div className="flex items-center justify-between mt-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 delay-200">
                      <p className="flex items-center gap-1 text-sm text-gray-300">
                        <MapPin size={14} className="text-gold" /> {item.location}
                      </p>
                      <button onClick={(e) => { e.stopPropagation(); navigate('/guide', { state: { locationName: item.title, province: item.location } }); }} className="p-2 rounded-lg bg-gold/20 text-gold hover:bg-gold hover:text-black transition-all border border-gold/30 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                        <BookOpen size={12} /> Cẩm Nang
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </div>
      </section>

      {/* 3. ĐIỂM ĐẾN THEO MÙA (Chuẩn) */}
      <section className="py-32 bg-[#0A241A] border-t border-white/5 relative overflow-hidden">
        <div className="absolute top-1/2 left-0 w-[800px] h-[800px] bg-primary-green opacity-[0.04] rounded-full blur-[150px] pointer-events-none -translate-y-1/2"></div>
        <div className="max-w-[1200px] mx-auto px-6 relative z-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="flex flex-col md:flex-row justify-between items-end mb-20">
            <div>
              <p className="text-gold font-bold uppercase tracking-[0.3em] text-xs mb-4">Góc nhìn lý tưởng</p>
              <h2 className="text-5xl md:text-6xl font-heading font-bold text-white">Điểm Đến <br /><span className={`${seasonalHeader.color} font-light italic`}>{seasonalHeader.label}</span></h2>
            </div>
            <p className="text-gray-400 max-w-sm mt-6 md:mt-0 text-sm leading-relaxed border-l border-gold/30 pl-6">
              Khám phá những gợi ý du lịch lý tưởng dựa trên thời tiết, mùa lễ hội và đặc trưng thiên nhiên của tháng {currentMonth}.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {currentSeasonal.map((exp, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={{ hidden: { opacity: 0, y: 50 }, visible: { opacity: 1, y: 0, transition: { delay: i * 0.2, duration: 0.6, ease: "easeOut" } } }} className="group flex flex-col bg-[#112418] rounded-[2rem] overflow-hidden border border-white/5 shadow-2xl hover:border-gold/30 hover:shadow-[0_15px_40px_rgba(212,175,55,0.2)] transition-all duration-500 cursor-pointer" onClick={() => navigate('/guide', { state: { locationName: exp.title } })}>
                <div className="relative h-[280px] overflow-hidden">
                  <img src={exp.img} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-90 group-hover:opacity-100" alt={exp.title} />
                  <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white text-[10px] uppercase tracking-widest font-bold px-4 py-2 rounded-full border border-white/10">
                    Tháng {exp.monthStart} - {exp.monthEnd}
                  </div>
                </div>
                <div className="p-8 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-5">
                      <span className="text-gold text-lg font-bold tracking-wide">{exp.theme}</span>
                      <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium bg-white/5 px-3 py-1.5 rounded-full border border-white/10 whitespace-nowrap">
                        <Star size={12} className="text-gold fill-gold" /> {exp.rating}
                      </div>
                    </div>
                    <h3 className="text-2xl font-heading font-bold text-white mb-3 group-hover:text-gold transition-colors duration-300">{exp.title}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed mb-8 line-clamp-2">{exp.subtitle}</p>
                  </div>
                  <div className="flex items-center justify-between w-full pt-6 border-t border-white/10 text-xs text-gray-400 group-hover:text-white transition-colors uppercase tracking-[0.2em] font-bold">
                    <span>Xem cẩm nang</span>
                    <span className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-gold group-hover:text-white transition-all duration-300">
                      <ChevronRight size={16} />
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. VĂN HOÁ BẢN ĐỊA */}
      <section className="py-32 bg-[#0A241A] relative overflow-hidden">
        <div className="absolute top-1/2 -translate-y-1/2 left-0 w-[500px] h-[500px] bg-primary-green opacity-5 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="max-w-[1200px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center relative z-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <p className="text-earth font-bold uppercase tracking-[0.3em] text-xs mb-4">Linh hồn Việt</p>
            <h2 className="text-5xl font-heading font-bold text-white mb-8 leading-tight">Bản Hoà Ca <br /> Của <span className="text-gold italic font-light">Vùng Đất</span></h2>
            <p className="text-gray-400 leading-relaxed mb-12 text-sm">Mỗi miền đất đi qua không chỉ là cảnh sắc, mà là cả một chiều dài văn hoá, lịch sử và những nếp sống bình dị khắc sâu vào tâm khảm.</p>
            <div className="space-y-10">
              {cultures.map((c, i) => (
                <div key={i} className="flex gap-6 items-start group">
                  <div className="w-16 h-16 rounded-2xl bg-earth/10 flex items-center justify-center shrink-0 group-hover:bg-earth transition-colors duration-500 shadow-[0_0_20px_rgba(194,122,91,0.1)] border border-earth/20">
                    {React.cloneElement(c.icon, { className: 'text-earth group-hover:text-white transition-colors duration-500' })}
                  </div>
                  <div>
                    <h4 className="text-xl font-bold mb-2 font-heading text-white group-hover:text-gold transition-colors">{c.title}</h4>
                    <p className="text-sm text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors">{c.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={{ hidden: { opacity: 0, x: 50 }, visible: { opacity: 1, x: 0, transition: { duration: 1 } } }} className="relative h-[700px] rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl">
            <img src="/vietnam_hero_bg.png" className="absolute inset-0 w-full h-full object-cover opacity-80 grayscale-[30%] group-hover:grayscale-0 hover:opacity-100 hover:scale-105 transition-all duration-1000" alt="culture" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A241A] via-transparent to-transparent opacity-80"></div>
          </motion.div>
        </div>
      </section>

      {/* 5. CONTACT */}
      <section className="py-32 bg-[#0A241A] text-white relative overflow-hidden">
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-primary-green opacity-10 rounded-full blur-[150px] pointer-events-none"></div>
        <div className="max-w-[1200px] mx-auto px-6 relative z-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-2 gap-0 rounded-[2rem] overflow-hidden cinematic-shadow">
            <div className="h-[400px] lg:h-auto">
              <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3834.1104354030064!2d108.25809801485834!3d15.976820588937961!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3142108997dc971f%3A0x1295cb3d313469c9!2sVietnam%20-%20Korea%20University%20of%20Information%20and%20Communication%20Technology.!5e0!3m2!1sen!2s!4v1683451234567!5m2!1sen!2s" width="100%" height="100%" style={{ border: 0, filter: 'grayscale(100%) invert(90%) contrast(80%)' }} allowFullScreen="" loading="lazy"></iframe>
            </div>
            <div className="bg-[#112418] p-12 lg:p-20 flex flex-col justify-center border-l border-white/5">
              <h3 className="text-4xl font-heading font-bold mb-4">Gửi Lời Nhắn</h3>
              <p className="text-gray-400 text-sm mb-10">Bạn cần tư vấn lộ trình? Hãy để lại thông tin, đội ngũ WanderlyVietNam sẽ liên hệ lại ngay.</p>
              <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); alert('Cảm ơn bạn đã liên hệ!'); }}>
                <div className="relative">
                  <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input type="text" required placeholder="Tên của bạn" className="w-full bg-[#0A241A] text-white p-4 pl-12 rounded-xl outline-none focus:ring-2 focus:ring-gold border border-white/10 transition-all font-sans text-sm" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                </div>
                <div className="relative">
                  <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input type="email" required placeholder="Email liên hệ" className="w-full bg-[#0A241A] text-white p-4 pl-12 rounded-xl outline-none focus:ring-2 focus:ring-gold border border-white/10 transition-all font-sans text-sm" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                </div>
                <div className="relative">
                  <textarea required placeholder="Nội dung lời nhắn..." rows="4" className="w-full bg-[#0A241A] text-white p-4 rounded-xl outline-none focus:ring-2 focus:ring-gold border border-white/10 transition-all font-sans text-sm resize-none" value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })}></textarea>
                </div>
                <button type="submit" className="w-full bg-gold text-black font-bold p-4 rounded-xl flex items-center justify-center gap-2 hover:bg-white transition-all duration-300 uppercase tracking-widest text-sm glow-effect">
                  Gửi Yêu Cầu <Send size={16} />
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      </section>

      <LocationDetailModal isOpen={!!selectedLandscape} onClose={() => setSelectedLandscape(null)} location={selectedLandscape} />
    </div>
  );
}

export default Home;