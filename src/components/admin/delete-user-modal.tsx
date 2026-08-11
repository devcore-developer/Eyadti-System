"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { deleteUser } from "@/lib/actions/admin"
import { AlertTriangle, X, Loader2 } from "lucide-react"
import { showSuccess, showError } from "@/components/shared/feedback-toast"

type UserToDelete = {
  id: string
  name: string
  email: string
  role: string
}

interface DeleteUserModalProps {
  user: UserToDelete
  isOpen: boolean
  onClose: () => void
}

export function DeleteUserModal({ user, isOpen, onClose }: DeleteUserModalProps) {
  const router = useRouter()
  const [confirmName, setConfirmName] = useState("")
  const [isPending, startTransition] = useTransition()

  const isMatch = confirmName.trim() === user.name.trim()

  function handleDelete() {
    if (!isMatch) return

    startTransition(async () => {
      const result = await deleteUser(user.id)
      if (result.success) {
        showSuccess(`${user.name} has been deleted successfully.`)
        onClose()
        setConfirmName("")
        router.refresh()
      } else {
        showError("Failed to delete user", result.error || "An unexpected error occurred.")
      }
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white dark:bg-[#1E293B] p-6 shadow-2xl border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 text-red-600">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Delete User</h3>
          </div>
          <button 
            onClick={() => { onClose(); setConfirmName("") }} 
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Warning Box */}
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg p-4 mb-5">
          <p className="text-sm text-red-800 dark:text-red-300 font-medium">This action is destructive and cannot be undone.</p>
          <p className="text-sm text-red-700 dark:text-red-400 mt-1">
            You are about to permanently delete <strong>{user.name}</strong> ({user.role}) and all their associated branch assignments and schedules.
          </p>
        </div>

        {/* Confirmation Input */}
        <div className="space-y-2 mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Type <span className="font-bold font-mono bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white px-1.5 py-0.5 rounded">{user.name}</span> to confirm:
          </label>
          <input
            type="text"
            value={confirmName}
            onChange={(e) => setConfirmName(e.target.value)}
            placeholder="Enter user name"
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            autoFocus
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => { onClose(); setConfirmName("") }}
            className="rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            disabled={isPending}
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={!isMatch || isPending}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Delete User
          </button>
        </div>
      </div>
    </div>
  )
}