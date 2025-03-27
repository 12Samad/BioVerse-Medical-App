"use client"

import { Input } from "@/components/ui/input"
import { useEffect, useState } from "react"

export function TimePickerInput({ id, value, onChange }: { id: string, value: string, onChange: (newTime: string) => void }) {
    const [time, setTime] = useState(value || "09:00")

    useEffect(() => {
        if (value) {
            setTime(value)
        }
    }, [value])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTime = e.target.value
        setTime(newTime)
        onChange(newTime)
    }

    return <Input id={id} type="time" value={time} onChange={handleChange} />
}

