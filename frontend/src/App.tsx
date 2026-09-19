import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import { useEffect } from 'react'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}
import { Nav } from './shared/components/Nav'
import { Footer } from './shared/components/Footer'
import { HomePage } from './features/home/components/HomePage'
import { BookingPage } from './features/booking/components/BookingPage'
import { ConfirmationPage } from './features/confirmation/components/ConfirmationPage'
import { AdminLoginPage } from './features/admin/components/AdminLoginPage'
import { AdminDashboardPage } from './features/admin/components/AdminDashboardPage'

// Client-facing pages share the Nav + Footer shell
function ClientLayout() {
  return (
    <>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <Nav />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/book" element={<BookingPage />} />
        <Route path="/confirm/:id" element={<ConfirmationPage />} />
      </Routes>
      <Footer />
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        {/* Admin routes — own minimal layout, no client Nav/Footer */}
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin" element={<AdminDashboardPage />} />

        {/* All client routes */}
        <Route path="/*" element={<ClientLayout />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
