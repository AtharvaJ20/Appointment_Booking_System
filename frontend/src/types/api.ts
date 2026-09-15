export interface Service {
  id: number
  name: string
  duration_minutes: number
  price: number
  image_filename: string | null
}

export interface TimeSlot {
  id: number
  start_time: string  // "HH:MM"
  end_time: string    // "HH:MM"
}

export interface BookingRequest {
  service_id: number
  slot_id: number
  client_name: string
  client_email: string
  client_phone: string
}

export interface BookingResponse {
  appointment_id: number
  access_token: string
}

export interface AppointmentConfirmation {
  id: number
  client_name: string
  client_email: string
  client_phone: string
  service_name: string
  date: string        // "YYYY-MM-DD"
  start_time: string  // "HH:MM"
  end_time: string    // "HH:MM"
  status: 'Pending' | 'Completed'
}

export interface AdminBooking {
  id: number
  client_name: string
  client_email: string
  client_phone: string
  service_name: string
  date: string
  start_time: string
  end_time: string
  status: 'Pending' | 'Completed'
}

export interface ApiErrorBody {
  error: {
    code: string
    message: string
  }
}
