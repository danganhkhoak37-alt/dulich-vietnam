-- 1. Chuyển sang sử dụng database WEB
USE WEB;
GO

-- ======================================================
-- XÓA CÁC BẢNG CŨ (Nếu đã tồn tại) ĐỂ CHẠY LẠI KHÔNG LỖI
-- ======================================================
IF OBJECT_ID('yeu_thich', 'U') IS NOT NULL DROP TABLE yeu_thich;
IF OBJECT_ID('bai_dang_cong_dong', 'U') IS NOT NULL DROP TABLE bai_dang_cong_dong;
IF OBJECT_ID('am_thuc', 'U') IS NOT NULL DROP TABLE am_thuc;
IF OBJECT_ID('goi_y_thang', 'U') IS NOT NULL DROP TABLE goi_y_thang;
IF OBJECT_ID('bai_viet_cam_nang', 'U') IS NOT NULL DROP TABLE bai_viet_cam_nang;
IF OBJECT_ID('dia_diem', 'U') IS NOT NULL DROP TABLE dia_diem;
IF OBJECT_ID('nguoi_dung', 'U') IS NOT NULL DROP TABLE nguoi_dung;
IF OBJECT_ID('locations', 'U') IS NOT NULL DROP TABLE locations;
GO

-- ======================================================
-- 1. BẢNG LOCATIONS (Dữ liệu mẫu để bạn kiểm tra)
-- ======================================================
CREATE TABLE locations (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(100),
    region NVARCHAR(50), 
    month INT,           
    description NVARCHAR(255)
);

INSERT INTO locations (name, region, month, description) VALUES
(N'Đà Lạt', N'Nam', 1, N'Mùa hoa đẹp'),
(N'Phú Quốc', N'Nam', 2, N'Biển đẹp mùa khô'),
(N'Hà Nội', N'Bắc', 3, N'Mùa xuân mát mẻ'),
(N'Sapa', N'Bắc', 4, N'Ruộng bậc thang'),
(N'Huế', N'Trung', 5, N'Lễ hội'),
(N'Đà Nẵng', N'Trung', 6, N'Biển đẹp'),
(N'Nha Trang', N'Trung', 7, N'Du lịch biển'),
(N'Hội An', N'Trung', 8, N'Phố cổ đẹp'),
(N'Hà Giang', N'Bắc', 9, N'Mùa lúa chín'),
(N'Mộc Châu', N'Bắc', 10, N'Hoa cải'),
(N'Phan Thiết', N'Nam', 11, N'Biển đẹp'),
(N'Cần Thơ', N'Nam', 12, N'Miền Tây mùa nước nổi');

-- ======================================================
-- 2. QUẢN LÝ NGƯỜI DÙNG
-- ======================================================
CREATE TABLE nguoi_dung (
    id_user INT PRIMARY KEY IDENTITY(1,1),
    ho_ten NVARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    mat_khau VARCHAR(255) NOT NULL,
    anh_dai_dien VARCHAR(255),
    ngay_tham_gia DATETIME DEFAULT GETDATE()
);

-- ======================================================
-- 3. DỮ LIỆU ĐỊA ĐIỂM CHI TIẾT
-- ======================================================
CREATE TABLE dia_diem (
    id_dia_diem INT PRIMARY KEY IDENTITY(1,1),
    ten_dia_diem NVARCHAR(255) NOT NULL,
    tinh_thanh NVARCHAR(100),
    mo_ta_ngan NVARCHAR(MAX),
    anh_nen VARCHAR(255),
    toa_do GEOGRAPHY, 
    trang_thai_thoi_tiet NVARCHAR(50), 
    nhiet_do FLOAT
);

-- Gợi ý theo tháng
CREATE TABLE goi_y_thang (
    id_goi_y INT PRIMARY KEY IDENTITY(1,1),
    id_dia_diem INT,
    thang INT CHECK (thang BETWEEN 1 AND 12),
    ly_do_goi_y NVARCHAR(255),
    FOREIGN KEY (id_dia_diem) REFERENCES dia_diem(id_dia_diem) ON DELETE CASCADE
);

-- ======================================================
-- 4. CẨM NANG & ẨM THỰC
-- ======================================================
CREATE TABLE am_thuc (
    id_mon_an INT PRIMARY KEY IDENTITY(1,1),
    id_dia_diem INT,
    ten_mon_an NVARCHAR(255),
    mo_ta_mon_an NVARCHAR(MAX),
    hinh_anh VARCHAR(255),
    loai_mon NVARCHAR(50) CHECK (loai_mon IN (N'Đặc sản', N'Ăn vặt', N'Đồ uống')),
    FOREIGN KEY (id_dia_diem) REFERENCES dia_diem(id_dia_diem) ON DELETE CASCADE
);

CREATE TABLE bai_viet_cam_nang (
    id_bai_viet INT PRIMARY KEY IDENTITY(1,1),
    tieu_de NVARCHAR(255),
    noi_dung NVARCHAR(MAX),
    anh_bia VARCHAR(255),
    chu_de NVARCHAR(50) CHECK (chu_de IN (N'Mẹo du lịch', N'Văn hóa', N'Lịch trình')),
    ngay_dang DATETIME DEFAULT GETDATE()
);

-- ======================================================
-- 5. TƯƠNG TÁC & YÊU THÍCH
-- ======================================================
CREATE TABLE bai_dang_cong_dong (
    id_post INT PRIMARY KEY IDENTITY(1,1),
    id_user INT,
    id_dia_diem INT,
    noi_dung NVARCHAR(MAX),
    hinh_anh_checkin VARCHAR(255),
    so_sao INT CHECK (so_sao BETWEEN 1 AND 5),
    ngay_dang DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (id_user) REFERENCES nguoi_dung(id_user),
    FOREIGN KEY (id_dia_diem) REFERENCES dia_diem(id_dia_diem)
);

CREATE TABLE yeu_thich (
    id_user INT,
    id_dia_diem INT,
    PRIMARY KEY (id_user, id_dia_diem),
    FOREIGN KEY (id_user) REFERENCES nguoi_dung(id_user),
    FOREIGN KEY (id_dia_diem) REFERENCES dia_diem(id_dia_diem)
);
GO