import { Suspense } from 'react'
import { GlobalTasksView } from '@/components/global-tasks-view'
import { TasksSkeleton } from '@/components/MscLoadingSkeleton'

export default function MSC_Projectz_TasksPage() {
  return (
    <Suspense fallback={<TasksSkeleton />}>
      <GlobalTasksView />
    </Suspense>
  )
}
