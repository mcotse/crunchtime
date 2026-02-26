import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TriangleAlertIcon } from 'lucide-react'
import { Button } from './ui/Button'

interface ConfirmDeleteModalProps {
  isOpen: boolean
  title: string
  description: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDeleteModal({
  isOpen,
  title,
  description,
  onConfirm,
  onCancel,
}: ConfirmDeleteModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="fixed inset-0 bg-black z-[70]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[71] flex items-center justify-center px-6"
          >
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
              <div className="px-6 pt-6 pb-4 text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-4">
                  <TriangleAlertIcon size={24} className="text-red-500" />
                </div>
                <h3 className="text-lg font-bold text-black dark:text-white mb-1.5">
                  {title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  {description}
                </p>
              </div>
              <div className="px-6 pb-6 flex gap-3">
                <Button
                  variant="secondary"
                  className="flex-1 h-12"
                  onClick={onCancel}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  className="flex-1 h-12"
                  onClick={onConfirm}
                >
                  Delete
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
