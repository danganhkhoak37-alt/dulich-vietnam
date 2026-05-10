/** @type {import('tailwindcss').Config} */
export default {
  // Đảm bảo quét đúng tất cả các file trong thư mục src
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Định nghĩa bảng màu theo đúng yêu cầu của bạn
        'deep-green': '#163333',    // Xanh đậm sang trọng
        'gold-premium': '#c7a73d',  // Vàng Gold cao cấp
        'soft-bg': '#F4F4F2',       // Nền be xám dịu mắt
        'moss-green': '#83a58e',    // Giữ lại xanh rêu làm màu phụ nếu cần
      },
      fontFamily: {
        // Khai báo font để bạn dùng class font-allura hoặc font-dancing dễ dàng
        'allura': ['Allura', 'cursive'],
        'dancing': ['Dancing Script', 'cursive'],
        'sans': ['Montserrat', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 1.5s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}