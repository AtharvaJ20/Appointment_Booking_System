import { Hero } from './Hero'
import { Services } from './Services'
import { About } from './About'
import { BookingCta } from './BookingCta'

export function HomePage() {
  return (
    <main id="main-content">
      <Hero />
      <Services />
      <About />
      <BookingCta />
    </main>
  )
}
