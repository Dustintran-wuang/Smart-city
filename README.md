# Smart City - Drowsiness Alert System

Hệ thống cảnh báo buồn ngủ tích hợp trong giải pháp Smart City. Dự án bao gồm các thành phần:
1. **Backend**: Spring Boot (Java) kết nối PostgreSQL.
2. **Frontend**: React (Vite) hiển thị dashboard và quản lý cảnh báo.
3. **AI Service**: Script Python xử lý Face Mesh sử dụng MediaPipe và OpenCV để phát hiện buồn ngủ từ camera.

---

## 🛠️ Hướng dẫn Cài đặt Môi trường từ Đầu (Cho máy trống)

Nếu máy tính của bạn là máy mới hoặc chưa cài đặt các công cụ lập trình, hãy làm theo hướng dẫn dưới đây:

### 1. Cài đặt Java JDK 17 & Maven (Cho Backend)
* **Bước 1: Cài đặt Java JDK 17**
  * Tải JDK 17 từ trang chủ Oracle hoặc dùng [Eclipse Temurin JDK 17 (khuyên dùng)](https://adoptium.net/temurin/releases/?version=17).
  * Chạy file cài đặt. Sau khi cài xong, thiết lập biến môi trường `JAVA_HOME` trỏ tới thư mục cài đặt JDK (Ví dụ: `C:\Program Files\Eclipse Adoptium\jdk-17.x.x`).
  * Thêm `%JAVA_HOME%\bin` vào biến môi trường `PATH`.
* **Bước 2: Cài đặt Maven**
  * Tải Apache Maven từ [trang chủ Apache Maven](https://maven.apache.org/download.cgi) (chọn file dạng `.zip`).
  * Giải nén file zip vào một thư mục (Ví dụ: `C:\Program Files\apache-maven-3.9.x`).
  * Thiết lập biến môi trường `MAVEN_HOME` trỏ tới thư mục vừa giải nén.
  * Thêm `%MAVEN_HOME%\bin` (hoặc `$MAVEN_HOME/bin` trên Linux/macOS) vào biến môi trường `PATH`.
* **Kiểm tra cài đặt**: Mở Terminal/cmd mới và chạy:
  ```bash
  java -version
  mvn -version
  ```

### 2. Cài đặt Node.js (Cho Frontend)
* Truy cập trang chủ [Node.js](https://nodejs.org/) và tải phiên bản **LTS (Long Term Support)** mới nhất.
* Chạy file cài đặt, nhấn Next liên tục cho đến khi hoàn thành. Việc này sẽ tự động cài cả `npm`.
* **Kiểm tra cài đặt**:
  ```bash
  node -v
  npm -v
  ```

### 3. Cài đặt Python 3.9 - 3.11 (Cho AI Service)
* Truy cập trang chủ [Python Releases for Windows](https://www.python.org/downloads/windows/) để tải bản cài đặt Python (khuyến nghị bản 3.10.x).
* **QUAN TRỌNG**: Khi chạy file cài đặt, nhớ tích chọn vào ô **"Add Python to PATH"** ở góc dưới cùng trước khi nhấn Install.
* **Kiểm tra cài đặt**:
  ```bash
  python --version
  pip --version
  ```

### 4. Cài đặt PostgreSQL (Cơ sở dữ liệu)
* Truy cập trang tải [PostgreSQL](https://www.postgresql.org/download/windows/) và tải bản cài đặt tương ứng.
* Trong quá trình cài đặt, ghi nhớ mật khẩu của tài khoản `postgres` (khuyên dùng `admin123` để khớp cấu hình mặc định của dự án).
* Cài đặt kèm công cụ **pgAdmin** (đã có sẵn trong bộ cài) để dễ dàng quản lý database trực quan.

---

## 1. Cấu hình Cơ sở dữ liệu (PostgreSQL)

1. Mở PostgreSQL client (hoặc pgAdmin) và tạo một database tên là:
   ```sql
   CREATE DATABASE drowsiness_db;
   ```
2. Chạy tệp SQL khởi tạo cấu trúc bảng từ thư mục dự án:
   * Đường dẫn file: [schema.sql](file:///d:/Project/Smart%20City/Smart-city/database/schema.sql) hoặc [schema.sql trong backend](file:///d:/Project/Smart%20City/Smart-city/backend/src/main/resources/schema.sql).
3. Đảm bảo cấu hình kết nối trong file [application.yml](file:///d:/Project/Smart%20City/Smart-city/backend/src/main/resources/application.yml) khớp với thông tin PostgreSQL của bạn:
   ```yaml
   spring:
     datasource:
       url: jdbc:postgresql://localhost:5432/drowsiness_db
       username: postgres
       password: admin123 # Thay đổi mật khẩu phù hợp với máy của bạn
   ```

---

## 2. Cài đặt & Khởi chạy Backend (Spring Boot)

Di chuyển vào thư mục `backend`:
```bash
cd backend
```

### Tải các dependency & Build dự án
Sử dụng Maven để tải các thư viện cần thiết:
```bash
mvn clean install
```

### Khởi chạy Backend
Khởi chạy ứng dụng Spring Boot:
```bash
mvn spring-boot:run
```
* Backend sẽ khởi chạy tại: `http://localhost:8080`

---

## 3. Cài đặt & Khởi chạy Frontend (React Vite)

Di chuyển vào thư mục `frontend/smart-traffic-web`:
```bash
cd frontend/smart-traffic-web
```

### Cài đặt các thư viện (Dependencies)
Sử dụng npm để cài đặt:
```bash
npm install
```

### Khởi chạy Frontend ở chế độ Development
Khởi chạy dự án:
```bash
npm run dev
```
* Truy cập ứng dụng tại địa chỉ local được hiển thị trên console (mặc định thường là `http://localhost:5173`).

---

## 4. Cài đặt & Khởi chạy AI Service (Python)

Di chuyển vào thư mục `ai-service`:
```bash
cd ai-service
```

### Tạo môi trường ảo (Khuyến nghị)
```bash
python -m venv venv
# Kích hoạt trên Windows:
.\venv\Scripts\activate
```

### Cài đặt các thư viện cần thiết
```bash
pip install opencv-python mediapipe numpy scipy requests
```

### Khởi chạy AI Service
Chạy script để nhận diện từ camera:
```bash
python camera.py
```
*(Hãy đảm bảo thiết bị của bạn có kết nối camera/webcam hoạt động bình thường)*