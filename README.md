
# CampusVerse -Smart Campus Portal

Welcome to the CampusVerse (Smart Campus Portal), a comprehensive web application designed to streamline various academic and administrative processes within a university or college environment. This frontend application is built with React.js, Vite, and Tailwind CSS, with a strong emphasis on secure JWT-based authentication and a highly responsive, user-friendly interface.

## Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation/Running the Application](#installation)
  
- [Authentication and Authorization (JWT)](#authentication-and-authorization-jwt)
- [Key Modules and Functionality](#key-modules-and-functionality)
- [UI/UX Principles](#uiux-principles)
- [Contribution](#contribution)
- [License](#license)

## Features

The Smart Campus Portal offers a wide range of features categorized by user roles (Student, Faculty, Admin), all secured by JWT authentication:

* **Authentication & Authorization:** Secure login, registration, logout, and profile management with role-based access control using JWTs.
* **User Management (Admin):** View, edit, and delete user accounts.
* **Dashboard Statistics:** Dynamic dashboards displaying relevant statistics based on user roles.
* **Course Management:** View courses, enroll (Student), create, edit, delete, and add materials (Faculty/Admin).
* **Attendance Management:** Mark attendance (Faculty/Admin), view individual and course attendance history (Student/Faculty/Admin).
* **Event Management:** View events, register (Student), create, edit, delete, and manage registrations (Faculty/Admin).
* **Placement Tracking:** View opportunities, apply (Student), create, edit, manage applicants, and view statistics (Faculty/Admin).
* **Notes and PYQs:** Access academic resources, upload, edit, and delete notes and previous year questions (Faculty/Admin).
* **Quiz Management:** Create questions and quizzes (Faculty), attempt quizzes (Student), view attempts, and evaluate (Faculty).
* **Fee Management:** View personal fees (Student), add, view all, update, record payments, and analyze statistics (Admin).
* **AI Features:** Utilize AI for roadmap generation, resume building, and ATS checking (Student), with credit tracking and admin statistics.
* **Notification System:** Real-time notifications, unread counts, mark as read functionality, and the ability to send alerts (Faculty/Admin).

## Technology Stack

* **Framework:** React.js
* **Build Tool:** Vite
* **Styling:** Tailwind CSS
* **State Management:** React Context API (with potential for Redux Toolkit for complex state)
* **Routing:** React Router DOM
* **HTTP Client:** Axios
* **Authentication:** JWT (JSON Web Tokens)
* **Animations:** Framer Motion (for subtle animations where needed)
* **Notifications:** React Toastify





## Getting Started

Follow these instructions to set up and run the frontend application locally.

### Prerequisites

* Node.js (LTS version recommended)
* npm or yarn

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Abhinav-Vishwakarma/CampusVerse.git
    ```
2.  **For Frontend:**
    ```bash
    cd frontend
    npm install
    # or
    yarn install
    ```
    **Create a `.env` file in the root directory i.e frontend** and add your backend API URL:
    ```
    VITE_API_BASE_URL=http://localhost:5000/api  # Replace with your backend URL
    ```
    **Run development frontend server**
    ```bash
    cd frontend
    npm run dev
    ```
3.  **For Backend:**
    ```bash
    cd backend
    npm install
    # or
    yarn install
    ```
    **Create a `.env` file in the root directory i.e frontend** and add your backend API URL:
    ```
    MONGODB_URI="your_mongodb_uri"
    JWT_SECRET=your_jwt_secret_key
    FRONTEND_URL=http://localhost:3000 #replace with yours
    PORT=5000
    GEMINI_API_KEY="your_gemini_api_key" 
    ```
    **Run development backend server**
    ```bash
    cd backend
    nodemon server.js
    ```
    get from here [Gemini API Key](https://aistudio.google.com/apikey)




## Authentication and Authorization (JWT)

This application heavily relies on JSON Web Tokens (JWT) for secure authentication and authorization.

  * **Secure JWT Storage:** Upon successful login, the JWT returned by the backend is securely stored in `localStorage` or `sessionStorage`. For enhanced security (if the backend supports it), `HttpOnly` cookies could be used.
  * **Axios Interceptor:** An Axios interceptor is configured to automatically attach the JWT to the `Authorization` header (`Bearer <token>`) for all outgoing requests to the backend API.
  * **Error Handling:** The interceptor also handles 401 (Unauthorized) and 403 (Forbidden) errors, typically redirecting the user to the login page and clearing the invalid token.
  * **Protected Routes:** `react-router-dom` is used to implement `ProtectedRoute` components that verify the presence and validity of the JWT. These routes also enforce role-based access control, ensuring only authorized users can access specific sections of the application.

## Key Modules and Functionality

Each module corresponds to a set of API endpoints and provides a dedicated user interface:

  * **Authentication & User Profile:** Login, Register, Logout, Update Profile, Google Drive integration.
  * **User Management (Admin):** CRUD operations for users.
  * **Dashboard:** Displays user-specific and overall campus statistics.
  * **Courses:** Browse courses, enroll, and manage course details/materials.
  * **Attendance:** Mark and view attendance records.
  * **Events:** Discover, register for, and manage campus events.
  * **Placements:** Explore job opportunities, apply, and track placement progress.
  * **Notes & PYQs:** Access and contribute to a repository of academic notes and previous year's questions.
  * **Quizzes:** Teachers can create and manage quizzes, while students can attempt and view results.
  * **Fee Management:** Students can view their fee status, while administrators can manage all fee records.
  * **AI Features:** Leverage AI tools for career development and resume optimization.
  * **Notifications:** A robust system for campus-wide alerts and personalized notifications.

## UI/UX Principles

The frontend is designed with a focus on delivering a professional, intuitive, and performant user experience:

  * **Modern Design:** Clean, intuitive, and consistent design utilizing Tailwind CSS.
  * **Responsive:** Optimized for seamless experience across desktop, tablet, and mobile devices.
  * **Accessibility:** Adherence to WCAG guidelines where applicable.
  * **Performance:** Optimized for fast loading times and smooth interactions.
  * **Error Handling:** Graceful display of API errors and client-side form validation.
  * **Theming:** Dynamic Light and Dark mode toggle with persistent selection.
  * **Animations:** Subtle and smooth animations for a polished feel.
  * **Notifications:** Global toast/snackbar notifications for user feedback.

## Contribution

Contributions are welcome\! Please follow these steps:

1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/your-feature-name`).
3.  Make your changes.
4.  Commit your changes (`git commit -m 'feat: Add new feature'`).
5.  Push to the branch (`git push origin feature/your-feature-name`).
6.  Open a Pull Request.

Please ensure your code adheres to the existing coding style and includes relevant tests if applicable.

## License

This project is licensed under the MIT License - see the [LICENSE](https://www.google.com/search?q=LICENSE) file for details.

