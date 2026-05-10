import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Star, ChevronRight, User, Mail, Send, Mountain, Utensils, Tent, Eye, X } from 'lucide-react';

function Home() {
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

  const experiences = [
    { 
      title: 'Vịnh Hạ Long', 
      subtitle: 'Kỳ quan thiên nhiên thế giới với hàng ngàn đảo đá vôi và hang động kỳ vĩ.',
      theme: 'Khám Phá Di Sản', 
      season: 'Mùa Thu (T9 - T11)',
      rating: 4.9,
      reviews: '1.2k',
      img: 'https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=2070&auto=format&fit=crop' 
    },
    { 
      title: 'Đảo Ngọc Phú Quốc', 
      subtitle: 'Tận hưởng vẻ đẹp nhiệt đới nguyên sơ với biển xanh, cát trắng và ánh hoàng hôn tuyệt mỹ.',
      theme: 'Biển Đảo Tự Nhiên', 
      season: 'Mùa Khô (T11 - T4)',
      rating: 4.8,
      reviews: '3.2k',
      img: 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?q=80&w=2068&auto=format&fit=crop' 
    },
    { 
      title: 'Bà Nà Hills - Cầu Vàng', 
      subtitle: 'Chạm tay vào mây trời trên tuyệt tác kiến trúc lưng chừng núi Chúa.',
      theme: 'Check-in & Nghỉ Dưỡng', 
      season: 'Mùa Hè (T3 - T8)',
      rating: 4.9,
      reviews: '2.4k',
      img: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?q=80&w=2128&auto=format&fit=crop' 
    },
  ];

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
      {/* 1. HERO SECTION (Cinematic Video) */}
      <section className="relative h-screen flex items-center justify-center text-center text-white overflow-hidden">
        <video
          className="absolute top-0 left-0 w-full h-full object-cover z-0"
          autoPlay loop muted playsInline
          poster="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1920"
          onError={(e) => { e.target.style.display = 'none'; }}
        >
          <source src="/hero-video.mp4" type="video/mp4" />
        </video>
        {/* Fallback background image khi video không load */}
        <div
          className="absolute top-0 left-0 w-full h-full bg-cover bg-center z-[-1]"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1920')" }}
        />
        {/* Cinematic Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/30 to-[#111] z-10" />
        
        <motion.div 
          initial="hidden" animate="visible" variants={staggerContainer}
          className="relative z-20 px-5 max-w-5xl"
        >
          <motion.h1 variants={fadeUp} className="font-heading text-5xl md:text-7xl lg:text-[6rem] mb-6 font-bold leading-tight tracking-tight">
            Cảnh Sắc Tráng Lệ Của <br/> <span className="text-gold italic font-light">Việt Nam</span>
          </motion.h1>
          <motion.p variants={fadeUp} className="text-lg md:text-xl mb-12 font-light opacity-90 max-w-2xl mx-auto tracking-wide">
            Các bạn đang muốn đi đâu, vậy thì cùng đi khám phá với chúng mình nhé.
          </motion.p>
          <motion.a 
            variants={fadeUp}
            href="#destinations" 
            className="inline-flex items-center gap-2 bg-transparent text-white px-10 py-4 rounded-full font-bold border border-white/30 hover:border-gold hover:bg-gold hover:text-black transition-all duration-500 uppercase tracking-[0.2em] text-xs backdrop-blur-md"
          >
            Khám phá ngay <ChevronRight size={16} />
          </motion.a>
        </motion.div>
      </section>

      {/* 2. CẢNH QUAN NỔI BẬT (Premium Cards) */}
      <section id="destinations" className="relative py-32 bg-[#0A241A] text-white overflow-hidden">
        {/* Subtle Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gold opacity-[0.03] rounded-full blur-[120px] pointer-events-none"></div>
        <div className="max-w-[1200px] mx-auto px-6">
          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeUp}
            className="flex flex-col md:flex-row justify-between items-end mb-16"
          >
            <div>
              <p className="text-gold font-bold uppercase tracking-[0.3em] text-xs mb-4">Điểm đến nổi bật</p>
              <h2 className="text-5xl md:text-6xl font-heading font-bold">Khám Phá <br/><span className="text-gray-500 font-light italic">Tự Nhiên</span></h2>
            </div>
            <button onClick={() => setShowAllDestinations(!showAllDestinations)} className="flex items-center gap-2 px-6 py-3 rounded-full border border-gold/50 text-gold text-xs font-bold uppercase tracking-widest hover:bg-gold hover:text-black transition-all mt-6 md:mt-0 shadow-[0_0_15px_rgba(212,175,55,0.2)] hover:shadow-[0_0_25px_rgba(212,175,55,0.6)] backdrop-blur-sm">
              {showAllDestinations ? 'Thu gọn' : 'Xem tất cả'}
              <ChevronRight size={16} className={`transition-transform duration-500 ${showAllDestinations ? "-rotate-90" : "rotate-90"}`} />
            </button>
          </motion.div>

          <motion.div layout className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <AnimatePresence>
            {visibleLandscapes.map((item, idx) => (
              <motion.div 
                layout
                key={item.title} 
                initial={{ opacity: 0, y: 50, scale: 0.95 }} 
                animate={{ opacity: 1, y: 0, scale: 1 }} 
                exit={{ opacity: 0, y: -30, scale: 0.9 }}
                transition={{ duration: 0.6, delay: showAllDestinations && idx >= 3 ? (idx % 3) * 0.15 : 0, ease: "easeOut" }}
                className="group relative h-[450px] rounded-2xl overflow-hidden cursor-pointer border border-white/5 bg-[#112418] shadow-2xl hover:border-gold/50 hover:shadow-[0_10px_30px_rgba(212,175,55,0.2)] transition-all duration-500"
                onClick={() => setSelectedLandscape(item)}
              >
                <img src={item.img} alt={item.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-80 group-hover:opacity-100" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity duration-500" />
                
                <div className="absolute bottom-0 left-0 w-full p-8 flex flex-col justify-end h-full text-white">
                  <div className="flex justify-between items-center mb-3">
                    <span className="flex items-center gap-1 text-xs font-bold bg-white/10 backdrop-blur-md px-3 py-1 rounded-full"><Eye size={12} className="text-gold"/> {item.rating}k</span>
                    <span className="text-[10px] uppercase tracking-[0.3em] font-semibold text-white/90 bg-black/40 px-3 py-1 rounded-full border border-white/10 shadow-sm">{item.time}</span>
                  </div>
                  <h3 className="text-3xl font-heading font-bold mb-2 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">{item.title}</h3>
                  <p className="flex items-center gap-1 text-sm text-gray-300 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 delay-100">
                    <MapPin size={14} className="text-gold" /> {item.location}
                  </p>
                </div>
              </motion.div>
            ))}
            </AnimatePresence>
          </motion.div>
        </div>
      </section>

      {/* 3. TRẢI NGHIỆM ĐỘC QUYỀN (Redesigned Detailed Cards) */}
      <section className="py-32 bg-[#0A241A] border-t border-white/5 relative overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute top-1/2 left-0 w-[800px] h-[800px] bg-primary-green opacity-[0.04] rounded-full blur-[150px] pointer-events-none -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-earth opacity-[0.03] rounded-full blur-[120px] pointer-events-none"></div>
        
        <div className="max-w-[1200px] mx-auto px-6 relative z-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="flex flex-col md:flex-row justify-between items-end mb-20">
            <div>
              <p className="text-gold font-bold uppercase tracking-[0.3em] text-xs mb-4">Góc nhìn lý tưởng</p>
              <h2 className="text-5xl md:text-6xl font-heading font-bold text-white">Điểm Đến <br/><span className="text-earth font-light italic">Theo Mùa</span></h2>
            </div>
            <p className="text-gray-400 max-w-sm mt-6 md:mt-0 text-sm leading-relaxed border-l border-gold/30 pl-6">
              Khám phá những gợi ý du lịch lý tưởng dựa trên thời tiết, mùa lễ hội và khoảng cách xuất phát của bạn.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {experiences.map((exp, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={{hidden: {opacity:0, y: 50}, visible: {opacity:1, y: 0, transition: {delay: i*0.2, duration: 0.6, ease: "easeOut"}}}} className="group flex flex-col bg-[#112418] rounded-[2rem] overflow-hidden border border-white/5 shadow-2xl hover:border-gold/30 hover:shadow-[0_15px_40px_rgba(212,175,55,0.2)] transition-all duration-500">
                
                {/* Image Section */}
                <div className="relative h-[280px] overflow-hidden">
                   <img src={exp.img} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-90 group-hover:opacity-100" alt={exp.title} />
                   <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white text-[10px] uppercase tracking-widest font-bold px-4 py-2 rounded-full border border-white/10">
                      {exp.season}
                   </div>
                </div>
                
                {/* Detailed Content Section */}
                <div className="p-8 flex-1 flex flex-col justify-between">
                   <div>
                     <div className="flex justify-between items-start mb-5">
                        <span className="text-gold text-lg font-bold tracking-wide">{exp.theme}</span>
                        <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium bg-white/5 px-3 py-1.5 rounded-full border border-white/10 whitespace-nowrap">
                          <Eye size={12} className="text-gold" /> {exp.reviews} <span className="opacity-80">lượt đọc</span>
                        </div>
                     </div>
                     <h3 className="text-2xl font-heading font-bold text-white mb-3 group-hover:text-gold transition-colors duration-300">{exp.title}</h3>
                     <p className="text-gray-400 text-sm leading-relaxed mb-8">{exp.subtitle}</p>
                   </div>
                   
                   <a href="#guide" className="flex items-center justify-between w-full pt-6 border-t border-white/10 text-xs text-gray-400 group-hover:text-white transition-colors uppercase tracking-[0.2em] font-bold">
                      <span>Đọc cẩm nang</span>
                      <span className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-gold group-hover:text-white transition-all duration-300">
                        <ChevronRight size={16} />
                      </span>
                   </a>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. VĂN HOÁ BẢN ĐỊA (Modern Grid) */}
      <section className="py-32 bg-[#0A241A] relative overflow-hidden">
        {/* Glows */}
        <div className="absolute top-1/2 -translate-y-1/2 left-0 w-[500px] h-[500px] bg-primary-green opacity-5 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute top-1/2 -translate-y-1/2 right-0 w-[500px] h-[500px] bg-earth opacity-10 rounded-full blur-[100px] pointer-events-none"></div>
        
        <div className="max-w-[1200px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center relative z-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <p className="text-earth font-bold uppercase tracking-[0.3em] text-xs mb-4">Linh hồn Việt</p>
            <h2 className="text-5xl font-heading font-bold text-white mb-8 leading-tight">Bản Hoà Ca <br/> Của <span className="text-gold italic font-light">Vùng Đất</span></h2>
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

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={{hidden: {opacity:0, x:50}, visible: {opacity:1, x:0, transition: {duration: 1}}}} className="relative h-[700px] rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl">
            <img src="https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=1000" className="absolute inset-0 w-full h-full object-cover opacity-80 grayscale-[30%] group-hover:grayscale-0 hover:opacity-100 hover:scale-105 transition-all duration-1000" alt="culture" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A241A] via-transparent to-transparent opacity-80"></div>
          </motion.div>
        </div>
      </section>

      {/* 5. CONTACT (Redesigned Form & Map) */}
      <section className="py-32 bg-[#0A241A] text-white relative overflow-hidden">
        {/* Subtle Background Glow */}
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-primary-green opacity-10 rounded-full blur-[150px] pointer-events-none"></div>
        <div className="max-w-[1200px] mx-auto px-6 relative z-10">
          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
            className="grid grid-cols-1 lg:grid-cols-2 gap-0 rounded-[2rem] overflow-hidden cinematic-shadow"
          >
            
            {/* Map */}
            <div className="h-[400px] lg:h-auto">
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3834.1104354030064!2d108.25809801485834!3d15.976820588937961!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3142108997dc971f%3A0x1295cb3d313469c9!2sVietnam%20-%20Korea%20University%20of%20Information%20and%20Communication%20Technology.!5e0!3m2!1sen!2s!4v1683451234567!5m2!1sen!2s" 
                width="100%" 
                height="100%" 
                style={{ border: 0, filter: 'grayscale(100%) invert(90%) contrast(80%)' }} // Cinematic map style
                allowFullScreen="" 
                loading="lazy">
              </iframe>
            </div>

            {/* Form */}
            <div className="bg-[#112418] p-12 lg:p-20 flex flex-col justify-center border-l border-white/5">
              <h3 className="text-4xl font-heading font-bold mb-4">Gửi Lời Nhắn</h3>
              <p className="text-gray-400 text-sm mb-10">Bạn cần tư vấn lộ trình? Hãy để lại thông tin, đội ngũ WanderlyVietNam sẽ liên hệ lại ngay.</p>
              
              <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); alert('Cảm ơn bạn đã liên hệ!'); }}>
                <div className="relative">
                  <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input 
                    type="text" 
                    required 
                    placeholder="Tên của bạn" 
                    className="w-full bg-[#0A241A] text-white p-4 pl-12 rounded-xl outline-none focus:ring-2 focus:ring-gold border border-white/10 transition-all font-sans text-sm"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="relative">
                  <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input 
                    type="email" 
                    required 
                    placeholder="Email liên hệ" 
                    className="w-full bg-[#0A241A] text-white p-4 pl-12 rounded-xl outline-none focus:ring-2 focus:ring-gold border border-white/10 transition-all font-sans text-sm"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <div className="relative">
                  <textarea 
                    required 
                    placeholder="Nội dung lời nhắn..." 
                    rows="4" 
                    className="w-full bg-[#0A241A] text-white p-4 rounded-xl outline-none focus:ring-2 focus:ring-gold border border-white/10 transition-all font-sans text-sm resize-none"
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                  ></textarea>
                </div>
                <button type="submit" className="w-full bg-gold text-black font-bold p-4 rounded-xl flex items-center justify-center gap-2 hover:bg-white transition-all duration-300 uppercase tracking-widest text-sm glow-effect">
                  Gửi Yêu Cầu <Send size={16} />
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Destination Detail Modal */}
      <AnimatePresence>
        {selectedLandscape && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setSelectedLandscape(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm cursor-pointer"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl bg-[#0D2D1F] rounded-[2rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 z-10 flex flex-col md:flex-row"
            >
              {/* Close Button */}
              <button 
                onClick={() => setSelectedLandscape(null)}
                className="absolute top-4 right-4 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-black/50 text-white/70 hover:bg-gold hover:text-black hover:scale-110 transition-all border border-white/10"
              >
                <X size={20} />
              </button>

              {/* Image */}
              <div className="w-full md:w-1/2 h-64 md:h-auto relative">
                <img src={selectedLandscape.img} alt={selectedLandscape.title} className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0D2D1F] via-transparent to-transparent opacity-90 md:hidden" />
              </div>

              {/* Content */}
              <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-gold font-bold uppercase tracking-widest text-[10px] border border-gold/30 px-4 py-1.5 rounded-full bg-gold/10">
                    {selectedLandscape.time}
                  </span>
                  <div className="flex items-center gap-1.5 text-white bg-white/10 px-4 py-1.5 rounded-full text-xs font-bold border border-white/5 backdrop-blur-md">
                    <Star size={14} className="text-gold fill-gold" /> {selectedLandscape.rating}
                  </div>
                </div>
                
                <h3 className="text-4xl md:text-5xl font-heading font-bold text-white mb-4 leading-tight">{selectedLandscape.title}</h3>
                
                <p className="flex items-center gap-2 text-sm text-gray-400 mb-8 font-bold tracking-widest uppercase">
                  <MapPin size={16} className="text-gold" /> {selectedLandscape.location}
                </p>

                <p className="text-gray-300 text-sm leading-relaxed mb-10 opacity-90">
                  {selectedLandscape.desc}
                </p>

                <div className="flex gap-4">
                  <button className="flex-1 bg-gold text-black py-3.5 rounded-xl font-bold uppercase tracking-widest text-[11px] hover:bg-white transition-all shadow-[0_0_15px_rgba(212,175,55,0.3)] hover:shadow-[0_0_25px_rgba(212,175,55,0.6)]">
                    Lên Kế Hoạch
                  </button>
                  <button 
                    onClick={() => setSelectedLandscape(null)}
                    className="flex items-center justify-center w-[52px] h-[52px] border border-white/20 rounded-xl text-white hover:border-white/50 hover:bg-white/5 transition-colors"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

export default Home;