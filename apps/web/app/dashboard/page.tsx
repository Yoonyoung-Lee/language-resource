// Redirect to home page since dashboard is now integrated into the main page

import { redirect } from 'next/navigation'

export default function DashboardPage() {
  redirect('/')
}
