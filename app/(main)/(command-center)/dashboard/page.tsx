import { Suspense } from 'react'
import { MSC_Projectz_DashboardRouteView } from '@/components/MSC-Projectz-DashboardRouteView'
import { DashboardSkeleton } from '@/components/MscLoadingSkeleton'

export default function MSC_Projectz_DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <MSC_Projectz_DashboardRouteView />
    </Suspense>
  )
}
