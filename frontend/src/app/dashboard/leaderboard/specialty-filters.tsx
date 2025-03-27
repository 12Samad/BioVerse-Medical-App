"use client"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useState, useEffect } from "react"

interface SpecialtyFiltersProps {
  specialties: string[]
  selectedSpecialty: string | null
  onSpecialtySelect: (specialty: string) => void
  className?: string
}

export default function SpecialtyFilters({
  specialties,
  selectedSpecialty,
  onSpecialtySelect,
  className = "",
}: SpecialtyFiltersProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredSpecialties, setFilteredSpecialties] = useState<string[]>(specialties)

  // Filter specialties based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredSpecialties(specialties)
      return
    }

    const filtered = specialties.filter((specialty) =>
      specialty.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredSpecialties(filtered)
  }, [searchTerm, specialties])

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder="Search specialties..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        />
        {searchTerm && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setSearchTerm("")}
            className="h-9 px-2"
          >
            Clear
          </Button>
        )}
      </div>
      
      <ScrollArea className="h-[200px] pr-3">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onSpecialtySelect("all")}
            className={`px-3 py-1.5 text-xs rounded-full transition-colors ${
              selectedSpecialty === "all"
                ? "bg-primary text-primary-foreground"
                : "bg-muted hover:bg-muted/80"
            }`}
          >
            All Specialties
          </button>
          
          {filteredSpecialties.map((specialty) => (
            <button
              key={specialty}
              onClick={() => onSpecialtySelect(specialty)}
              className={`px-3 py-1.5 text-xs rounded-full transition-colors ${
                selectedSpecialty === specialty
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80"
              }`}
            >
              {specialty}
            </button>
          ))}
          
          {filteredSpecialties.length === 0 && (
            <p className="text-sm text-muted-foreground p-2">No specialties found matching &quot;{searchTerm}&quot;</p>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
