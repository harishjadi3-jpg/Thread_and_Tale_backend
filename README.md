# 🛍️ Thread & Tale - Backend

Backend API for the **Thread & Tale** full-stack fashion e-commerce platform built with **Node.js, Express.js, MongoDB, and Cloudinary**.

It provides secure authentication, product management, shopping cart, wishlist, order management, payment integration, address management, reviews, and image uploads.

---

## 🚀 Features

- 🔐 JWT Authentication (Access & Refresh Tokens)
- 👤 User Registration & Login
- 📧 OTP Verification
- 🔑 Forgot Password & Reset Password
- 👤 User Profile Management
- 🛍️ Product Management
- 🔎 Product Search
- 🗂️ Product Filtering
- 📦 Category-wise Products
- ❤️ Wishlist Management
- 🛒 Shopping Cart
- 📍 Address Management
- 📦 Order Management
- 💳 Razorpay Payment Integration
- ⭐ Product Reviews & Ratings
- 👍 Like & Dislike Reviews
- ☁️ Cloudinary Image Upload
- 📧 Email Notifications

---

## 🛠️ Tech Stack

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication
- Cloudinary
- Multer
- Razorpay
- Nodemailer
- Cookie Parser
- CORS

---

## 📂 Project Structure

```
src
├── config
├── controllers
├── db
├── middlewares
├── models
├── routes
├── utils
├── app.js
└── index.js
```

---

## ⚙️ Installation

### Clone the repository

```bash
git clone https://github.com/harishjadi3-jpg/Thread_and_Tale_backend.git
```

### Navigate into the project

```bash
cd Thread_and_Tale_backend
```

### Install dependencies

```bash
npm install
```

---

## 🔑 Environment Variables

Create a `.env` file in the root directory.

```env
PORT=8000

MONGODB_URI=

ACCESS_TOKEN_SECRET=
ACCESS_TOKEN_EXPIRY=

REFRESH_TOKEN_SECRET=
REFRESH_TOKEN_EXPIRY=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

EMAIL=
EMAIL_PASSWORD=

FRONTEND_URL=
```

---

## ▶️ Run the Project

Development

```bash
npm run dev
```

Production

```bash
npm start
```

---

## 📌 API Features

### Authentication

- Register User
- Login
- Logout
- Refresh Token
- Verify OTP
- Forgot Password
- Change Password

### Products

- Add Product
- Get All Products
- Get Product By ID
- Search Products
- Filter Products
- Featured Products
- Category Products

### Cart

- Add to Cart
- Remove from Cart
- Update Quantity
- Clear Cart

### Wishlist

- Add Wishlist
- Remove Wishlist
- Get Wishlist

### Orders

- Place Order
- Cancel Order
- Return Order
- Replace Order
- Track Order
- Order History

### Reviews

- Add Review
- Update Review
- Delete Review
- Like Review
- Dislike Review

### Address

- Add Address
- Update Address
- Delete Address
- Get Addresses

### Payments

- Create Razorpay Order
- Verify Payment
- Razorpay Webhook

---

## 🔒 Authentication

Protected routes require a valid JWT Access Token.

Authentication uses:

- HTTP Only Cookies
- Refresh Tokens
- JWT Verification Middleware

---

## 📸 Image Upload

Images are uploaded using:

- Multer
- Cloudinary

Supports multiple product images.

---

## 🌐 Deployment

Backend can be deployed on:

- Railway
- Render
- Koyeb

Database:

- MongoDB Atlas

---

## 👨‍💻 Author

**Harish Jadi**

GitHub:
https://github.com/harishjadi3-jpg

---

## 📜 License

This project is developed for educational and portfolio purposes.
