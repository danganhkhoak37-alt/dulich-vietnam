import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, MapPin, Phone } from 'lucide-react';

function Footer() {
  return (
    <footer className="bg-[#111] text-gray-300 py-20 border-t border-gray-800 font-sans mt-auto">
      <div className="max-w-[1200px] mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
        {/* Cột 1: About */}
        <div className="space-y-6">
          <Link to="/" className="text-3xl font-heading font-black text-white flex items-center tracking-tight">
            Wanderly<span className="text-gold ml-1">VietNam</span>
          </Link>
          <p className="text-sm leading-relaxed opacity-70">
            Khám phá vẻ đẹp tráng lệ của Việt Nam qua những góc nhìn chân thực và điện ảnh nhất. Chúng tôi mang đến trải nghiệm du lịch cao cấp.
          </p>
          <div className="flex space-x-4">
            <a href="#" className="w-10 h-10 rounded-full border border-gray-700 flex items-center justify-center hover:bg-gold hover:border-gold hover:text-black transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
            </a>
            <a href="#" className="w-10 h-10 rounded-full border border-gray-700 flex items-center justify-center hover:bg-gold hover:border-gold hover:text-black transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
            </a>
            <a href="#" className="w-10 h-10 rounded-full border border-gray-700 flex items-center justify-center hover:bg-gold hover:border-gold hover:text-black transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
            </a>
          </div>
        </div>

        {/* Cột 2: Quick Links */}
        <div>
          <h4 className="text-white font-heading font-bold text-lg mb-6 tracking-wide">Liên Kết Nhanh</h4>
          <ul className="space-y-4 text-sm opacity-70">
            <li><Link to="/" className="hover:text-gold transition-colors">Về chúng tôi</Link></li>
            <li><Link to="/suggestions" className="hover:text-gold transition-colors">Gợi ý lộ trình</Link></li>
            <li><Link to="/guide" className="hover:text-gold transition-colors">Cẩm nang du lịch</Link></li>
            <li><Link to="/community" className="hover:text-gold transition-colors">Cộng đồng</Link></li>
          </ul>
        </div>

        {/* Cột 3: Trải nghiệm */}
        <div>
          <h4 className="text-white font-heading font-bold text-lg mb-6 tracking-wide">Trải Nghiệm</h4>
          <ul className="space-y-4 text-sm opacity-70">
            <li><a href="#" className="hover:text-gold transition-colors">Trekking & Hiking</a></li>
            <li><a href="#" className="hover:text-gold transition-colors">Food Tour Bản Địa</a></li>
            <li><a href="#" className="hover:text-gold transition-colors">Nghỉ Dưỡng Cao Cấp</a></li>
            <li><a href="#" className="hover:text-gold transition-colors">Khám Phá Di Sản</a></li>
          </ul>
        </div>

        {/* Cột 4: Contact */}
        <div>
          <h4 className="text-white font-heading font-bold text-lg mb-6 tracking-wide">Liên Hệ</h4>
          <ul className="space-y-4 text-sm opacity-70">
            <li className="flex items-start gap-3">
              <MapPin size={18} className="text-gold shrink-0 mt-1" />
              <span>470 Trần Đại Nghĩa, Ngũ Hành Sơn, Đà Nẵng</span>
            </li>
            <li className="flex items-center gap-3">
              <Phone size={18} className="text-gold shrink-0" />
              <span>0979805422</span>
            </li>
            <li className="flex items-center gap-3">
              <Mail size={18} className="text-gold shrink-0" />
              <span>contact@wanderlyvietnam.com</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-6 mt-16 pt-8 border-t border-gray-800 text-xs opacity-50 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-center md:text-left">Tác giả: Đặng Anh Khoa <br/>Ngô Quang Huy <br/>Trần Hoàng <br/>Tào Trần Duy Phúc</p>
        <div className="space-x-6 text-center md:text-right">
          <a href="#" className="hover:text-white transition-colors">Điều khoản dịch vụ</a>
          <a href="#" className="hover:text-white transition-colors">Chính sách bảo mật</a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
