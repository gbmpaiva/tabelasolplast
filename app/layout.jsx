import './globals.css'

export const metadata = {
  title: 'Tabela de Preços',
  description: 'Configuração de tabela de preços',
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
