import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      {/* Hero Section */}
      <div className="text-center mb-12 animate-fade-in">
        <h1 className="text-hero font-display font-bold mb-4 text-gradient-primary">
          🎵 Blind Test
        </h1>
        <p className="text-xl text-text-secondary max-w-2xl mx-auto">
          Testez vos connaissances musicales avec 6 modes de jeu différents !
        </p>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full">
        {/* Hôte */}
        <Link href="/host">
          <div className="bg-bg-card rounded-3xl p-8 text-center hover:scale-105 transition-transform cursor-pointer border-2 border-transparent hover:border-primary">
            <div className="text-6xl mb-4">🎤</div>
            <h2 className="font-display text-2xl font-semibold mb-2">
              Créer une partie
            </h2>
            <p className="text-text-secondary">
              Vous êtes l'animateur
            </p>
          </div>
        </Link>

        {/* Display TV */}
        <Link href="/display">
          <div className="bg-bg-card rounded-3xl p-8 text-center hover:scale-105 transition-transform cursor-pointer border-2 border-transparent hover:border-primary">
            <div className="text-6xl mb-4">📺</div>
            <h2 className="font-display text-2xl font-semibold mb-2">
              Affichage TV
            </h2>
            <p className="text-text-secondary">
              Grand écran partagé
            </p>
          </div>
        </Link>

        {/* Joueur */}
        <Link href="/player">
          <div className="bg-bg-card rounded-3xl p-8 text-center hover:scale-105 transition-transform cursor-pointer border-2 border-transparent hover:border-primary">
            <div className="text-6xl mb-4">📱</div>
            <h2 className="font-display text-2xl font-semibold mb-2">
              Rejoindre
            </h2>
            <p className="text-text-secondary">
              Vous êtes joueur
            </p>
          </div>
        </Link>
      </div>

      {/* Footer */}
      <div className="mt-12 text-center text-text-secondary text-sm">
        <p>Powered by Spotify • Made with ❤️</p>
      </div>
    </div>
  )
}
