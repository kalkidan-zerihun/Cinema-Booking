import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ScrollToTop } from './components/ScrollToTop';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminRoute } from './components/AdminRoute';

// Public Pages
import { Home } from './pages/Home';
import { Movies } from './pages/Movies';
import { MovieDetails } from './pages/MovieDetails';
import { Cinemas } from './pages/Cinemas';
import { CinemaDetails } from './pages/CinemaDetails';
import { Login } from './pages/Login';
import { Register } from './pages/Register';

// Booking & Seats
import { SeatSelection } from './pages/SeatSelection';
import { Booking } from './pages/Booking';
import { PaymentCallback } from './pages/PaymentCallback';
import { MyReservations } from './pages/MyReservations';
import { ReservationDetails } from './pages/ReservationDetails';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminMovies } from './pages/admin/AdminMovies';
import { AdminCinemas } from './pages/admin/AdminCinemas';
import { AdminHalls } from './pages/admin/AdminHalls';
import { AdminSeats } from './pages/admin/AdminSeats';
import { AdminShowtimes } from './pages/admin/AdminShowtimes';
import { AdminReservations } from './pages/admin/AdminReservations';
import { AdminUsers } from './pages/admin/AdminUsers';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <div className="min-h-screen flex flex-col bg-[#0c0d12] text-gray-100 selection:bg-red-600 selection:text-white font-sans antialiased">
          <Navbar />

          <main className="flex-1">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/movies" element={<Movies />} />
              <Route path="/movies/:movieId" element={<MovieDetails />} />
              <Route path="/cinemas" element={<Cinemas />} />
              <Route path="/cinemas/:cinemaId" element={<CinemaDetails />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected Customer Routes */}
              <Route
                path="/showtimes/:showtimeId/seats"
                element={
                  <ProtectedRoute>
                    <SeatSelection />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/booking/:reservationId"
                element={
                  <ProtectedRoute>
                    <Booking />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/payment/callback"
                element={
                  <ProtectedRoute>
                    <PaymentCallback />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-reservations"
                element={
                  <ProtectedRoute>
                    <MyReservations />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-reservations/:reservationId"
                element={
                  <ProtectedRoute>
                    <ReservationDetails />
                  </ProtectedRoute>
                }
              />

              {/* Admin Protected Routes */}
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/movies"
                element={
                  <AdminRoute>
                    <AdminMovies />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/cinemas"
                element={
                  <AdminRoute>
                    <AdminCinemas />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/halls"
                element={
                  <AdminRoute>
                    <AdminHalls />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/seats"
                element={
                  <AdminRoute>
                    <AdminSeats />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/showtimes"
                element={
                  <AdminRoute>
                    <AdminShowtimes />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/reservations"
                element={
                  <AdminRoute>
                    <AdminReservations />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <AdminRoute>
                    <AdminUsers />
                  </AdminRoute>
                }
              />

              {/* 404 Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}
