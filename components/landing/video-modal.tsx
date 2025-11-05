"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface VideoModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function VideoModal({ open, onOpenChange }: VideoModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden bg-gradient-to-br from-gray-800/20 via-gray-900/40 to-gray-800/20 backdrop-blur-md border-gray-700/30 [&>button]:text-gray-400 [&>button]:hover:text-white [&>button]:hover:bg-gray-700/50 p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="text-white text-xl font-semibold">
            See How BitBasis Works
          </DialogTitle>
        </DialogHeader>
        
        <div className="px-6 pb-6">
          <div className="relative w-full rounded-lg overflow-hidden bg-black">
            <video
              className="w-full h-auto"
              controls
              autoPlay
              preload="auto"
              playsInline
              controlsList="nodownload"
              src="/bitbasisdemo.mp4"
            >
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

