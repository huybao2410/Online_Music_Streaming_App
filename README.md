# Online Music Streaming App

An online music player that allows users to explore, search, and stream music anytime, anywhere.

## Features

- User authentication (login/signup)
- Music streaming with player controls
- Song search and filtering
- Create and manage playlists
- Premium subscription support
- Responsive design for all devices
- Modern and intuitive UI inspired by Spotify

## Tech Stack

### Frontend
- React.js
- Context API for state management
- TailwindCSS for styling
- Axios for API requests
- React Router for navigation

### Backend
- Node.js & Express.js
- MongoDB for database
- JWT for authentication
- AWS S3 for file storage
- Stripe for payments

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- AWS Account (for S3)
- Stripe Account (for payments)

### Installation

1. Clone the repository
```bash
git clone https://github.com/huybao2410/Online_Music_Streaming_App.git
cd Online_Music_Streaming_App
```

2. Install dependencies
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

3. Environment Variables
```bash
# Backend setup
cd backend
cp .env.example .env
# Update .env with your values

# Frontend setup
cd ../frontend
cp .env.example .env
# Update .env with your values
```

4. Run the application
```bash
# Run backend (from backend directory)
npm run dev

# Run frontend (from frontend directory)
npm start
```

The application should now be running on:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## Project Structure

```
Online_Music_Streaming_App/
├── backend/                # Backend server
│   ├── src/               # Source files
│   │   ├── config/        # Configuration files
│   │   ├── controllers/   # Request handlers
│   │   ├── middlewares/   # Custom middlewares
│   │   ├── models/        # Database models
│   │   ├── routes/        # API routes
│   │   └── utils/         # Utility functions
│   └── package.json       # Backend dependencies
├── frontend/              # React frontend
│   ├── public/           # Static files
│   ├── src/              # Source files
│   │   ├── assets/       # Images, icons, etc.
│   │   ├── components/   # Reusable components
│   │   ├── context/      # Context providers
│   │   ├── hooks/        # Custom hooks
│   │   ├── layout/       # Layout components
│   │   ├── pages/        # Page components
│   │   └── services/     # API services
│   └── package.json      # Frontend dependencies
└── README.md             # Project documentation
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Design inspired by Spotify
- Icons from [React Icons](https://react-icons.github.io/react-icons/)
