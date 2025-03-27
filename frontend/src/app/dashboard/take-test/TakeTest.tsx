import { Suspense } from 'react'
import TestComponent from './TestComponent'

export default function TakeTest() {
    return (
        <Suspense fallback="Loading...">
            <TestComponent />
        </Suspense>
    )
}
