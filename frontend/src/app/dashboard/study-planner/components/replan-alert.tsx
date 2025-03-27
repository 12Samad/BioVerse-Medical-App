"use client"

import { motion } from 'framer-motion'
import { AlertCircle, RefreshCw } from 'lucide-react'

interface ReplanAlertProps {
  onReplan: () => void
}

export const ReplanAlert: React.FC<ReplanAlertProps> = ({ onReplan }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <AlertCircle className="text-amber-600 mr-2" size={20} />
          <div>
            <h3 className="font-medium text-amber-800">Your study plan needs adjustment</h3>
            <p className="text-sm text-amber-700">
              Some tasks were marked as not understood or skipped. Click to redistribute them into future weeks.
            </p>
          </div>
        </div>
        <button
          onClick={onReplan}
          className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors flex items-center"
        >
          <RefreshCw className="mr-2" size={16} />
          Adjust Plan
        </button>
      </div>
    </motion.div>
  )
}
