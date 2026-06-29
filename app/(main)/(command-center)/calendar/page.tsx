import { Suspense } from 'react'
import Msc_CalendarPageContent from './MscCalendarPageContent'
import { CalendarSkeleton } from '@/components/MscLoadingSkeleton'

export default function MSC_Projectz_CalendarPage() {
  return (
    <Suspense fallback={<CalendarSkeleton />}>
      <Msc_CalendarPageContent />
    </Suspense>
  )
}
