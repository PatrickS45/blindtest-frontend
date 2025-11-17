'use client'

import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'

export default function HostControl() {
  const params = useParams()
  const router = useRouter()
  const roomCode = params.roomCode as string

  return (
    <div className="min-h-screen bg-gradient-to-b from-bg-dark to-bg-medium text-text-primary p-6 flex flex-col items-center justify-center">
      <div className="max-w-2xl text-center space-y-8">
        {/* Success Icon */}
        <div className="text-8xl animate-bounce">🎉</div>

        {/* Title */}
        <div>
          <h1 className="text-hero font-display font-bold mb-4 text-gradient-primary">
            Partie créée !
          </h1>
          <p className="text-title text-text-secondary mb-6">
            Code de la salle
          </p>
          <div className="bg-bg-card rounded-3xl p-8 border-4 border-primary inline-block">
            <p className="font-mono text-6xl font-bold tracking-wider text-primary">
              {roomCode.toUpperCase()}
            </p>
          </div>
        </div>

        {/* Info */}
        <div className="bg-bg-card rounded-2xl p-6 border-2 border-primary/20">
          <p className="text-text-secondary mb-4">
            🚧 <strong>Interface en cours de migration...</strong>
          </p>
          <p className="text-sm text-text-secondary">
            L'interface de contrôle hôte complète sera disponible sous peu.
            Pour l'instant, vous pouvez tester avec l'ancienne interface.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-4 justify-center">
          <Button
            variant="secondary"
            size="large"
            onClick={() => router.push('/host')}
          >
            ← Nouvelle partie
          </Button>

          <Button
            variant="primary"
            size="large"
            onClick={() => {
              // For now, navigate to old interface (if still available)
              window.location.href = `/host-control?roomCode=${roomCode}`
            }}
          >
            Interface temporaire →
          </Button>
        </div>

        {/* Next Steps */}
        <div className="bg-bg-card rounded-2xl p-6 text-left">
          <h3 className="font-display text-xl font-semibold mb-4">
            📝 Prochaines étapes :
          </h3>
          <ol className="space-y-2 text-text-secondary text-sm">
            <li>✅ Partager le code <strong>{roomCode.toUpperCase()}</strong> avec vos joueurs</li>
            <li>⏳ Charger une playlist Spotify</li>
            <li>⏳ Attendre que les joueurs rejoignent</li>
            <li>⏳ Lancer la première manche</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
