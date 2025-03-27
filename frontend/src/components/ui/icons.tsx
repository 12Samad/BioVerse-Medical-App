import type { LucideIcon } from "lucide-react"
import { UserPlus, LoaderPinwheelIcon as Spinner } from "lucide-react"

interface Icons {
  userPlus: LucideIcon
  spinner: LucideIcon
}

export const Icons: Icons = {
  userPlus: UserPlus,
  spinner: Spinner,
}