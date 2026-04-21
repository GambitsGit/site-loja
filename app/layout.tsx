import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Glow Maker 3D — Acessórios em Impressão 3D',
  description:
    'Acessórios exclusivos para maquiagem e beleza em impressão 3D. Porta-batons, organizadores e muito mais. Peça pelo WhatsApp!',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className="bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  )
}
