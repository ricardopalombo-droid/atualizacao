"use client"

type Props = {
  videoId: string
  onClose: () => void
}

export default function VideoModal({ videoId, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center">
      <div className="bg-black rounded-xl overflow-hidden w-full max-w-3xl relative">
        
        {/* botão fechar */}
        <button
          onClick={onClose}
          className="absolute top-2 right-3 text-white text-2xl font-bold z-10"
        >
          ✕
        </button>

        <div className="aspect-video">
          <iframe
            src={`https://www.youtube.com/embed/${videoId}`}
            title="Demonstração"
            allowFullScreen
            className="w-full h-full"
          />
        </div>
      </div>
    </div>
  )
}
