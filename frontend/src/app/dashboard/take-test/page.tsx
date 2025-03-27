import { Suspense } from 'react'
import TakeTestPage from './TakeTestPage'

export default function page() {
  return (
    <Suspense fallback="loading...">
      <TakeTestPage />
    </Suspense>
  )
}
