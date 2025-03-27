import { Suspense } from 'react'
import ReviewSessionPage from './Session'

export default function page() {
    return (
        <Suspense fallback="loading...">
            <ReviewSessionPage />
        </Suspense>
    )
}
