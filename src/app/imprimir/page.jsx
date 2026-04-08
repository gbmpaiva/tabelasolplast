'use client'
import { useState, useEffect } from 'react'

const PRINT_CONFIG_KEY = 'tabela_precos_print_config'

/* ── Cálculo de preço ── */
function calcPrice(prv1, deadlineFactor, regionFactor, discountFactor) {
  const result = prv1 * (deadlineFactor + (regionFactor - 1) + (discountFactor - 1))
  return Math.max(0, result)
}

function fmt(value) {
  if (!value || isNaN(value)) return '0,00'
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function getDeadlineLabel(d) {
  const cond = (d.cond || '').trim()
  const descri = (d.descri || '').trim()
  if (cond && !descri.match(/^\d/)) return `${cond} (${descri})`
  return descri || cond
}

/* ── Cabeçalho da tabela de preços (repetido em cada página) ── */
function PriceTableHeader({ conditions, deadlines, regionFactor, title, showTitle }) {
  return (
    <div className="page-header-block">
      {showTitle && (
        <div className="doc-header">
          <h1>{title || 'Tabela de Preços'}</h1>
        </div>
      )}
    </div>
  )
}

/* ── Bloco de produto compacto ── */
function ProductBlock({ product, conditions, deadlines, regionFactor }) {
  const [imgError, setImgError] = useState(false)
  const cod = (product.cod || '').trim()

  return (
    <div className="product-block">
      {/* LEFT — imagem + código + nome */}
      <div className="prod-left">
        {imgError ? (
          <div className="prod-img-placeholder">
            <span style={{ fontSize: 20 }}>📦</span>
            <span>Sem imagem</span>
          </div>
        ) : (
          <img
            className="prod-img"
            src={`/images/${cod}.jpg`}
            alt={product.desc}
            onError={() => setImgError(true)}
          />
        )}
        <div className="prod-code">{cod}</div>
        <div className="prod-name">{product.desc}</div>
      </div>

      {/* RIGHT — tabela de preços */}
      <div className="prod-right">
        <table className="price-table">
          <thead>
            <tr>
              <th className="th-cond">Prazos</th>
              {conditions.map(c => (
                <th key={c.codigo} className="th-cond">{c.descri}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {deadlines.map((d, di) => (
              <tr key={d.codigo} className={di % 2 === 0 ? 'tr-even' : 'tr-odd'}>
                <td className="td-label">{getDeadlineLabel(d)}</td>
                {conditions.map(c => (
                  <td key={c.codigo} className="td-price">
                    {fmt(calcPrice(product.prv1 || 0, d.xfator, regionFactor, c.fator))}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ── Página ── */
export default function ImprimirPage() {
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [itemsPerPage, setItemsPerPage] = useState(6)

  const now = new Date()
  const emitido = `${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`

  useEffect(() => {
    try {
      const saved = localStorage.getItem(PRINT_CONFIG_KEY)
      if (!saved) {
        setError('Nenhuma configuração encontrada. Volte, selecione condições, prazos, tipo de venda e produtos, depois clique em "Imprimir PDF".')
        setLoading(false)
        return
      }
      const parsed = JSON.parse(saved)
      setConfig(parsed)

      // Ajuste dinâmico: menos prazos → mais produtos por página
      const deadlineCount = (parsed.deadlines || []).length
      if (deadlineCount <= 3) setItemsPerPage(8)
      else if (deadlineCount <= 5) setItemsPerPage(7)
      else if (deadlineCount <= 8) setItemsPerPage(6)
      else setItemsPerPage(5)

    } catch (e) {
      setError('Erro ao carregar configuração: ' + e.message)
    }
    setLoading(false)
  }, [])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'Arial, sans-serif', color: '#2d6a4f', gap: 12 }}>
        <div style={{ width: 24, height: 24, border: '3px solid #c3ddc9', borderTopColor: '#40916c', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
        Carregando prévia...
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'Arial, sans-serif', gap: 16, padding: 32, textAlign: 'center' }}>
        <div style={{ fontSize: 40 }}>⚠️</div>
        <div style={{ color: '#cc3300', fontSize: 15, maxWidth: 480 }}>{error}</div>
        <button onClick={() => window.close()} style={{ padding: '8px 24px', background: '#2d6a4f', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>
          Fechar
        </button>
      </div>
    )
  }

  if (!config) return null

  const { conditions, deadlines, saleType, products, title } = config
  const regionFactor = saleType?.fator ?? 1
  const totalPages = Math.ceil(products.length / itemsPerPage)

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          font-family: Arial, Helvetica, sans-serif;
          background: #d8ddd9;
          font-size: 12px;
          color: #1a1a1a;
        }

        /* ── Toolbar (oculta ao imprimir) ── */
        .screen-bar {
          background: linear-gradient(135deg, #1b4332, #2d6a4f);
          color: white;
          padding: 10px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: sticky;
          top: 0;
          z-index: 200;
          box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        }
        .screen-bar-title { font-weight: 700; font-size: 14px; }
        .screen-bar-sub { font-size: 11px; color: rgba(255,255,255,0.65); margin-top: 2px; }

        .btn-back {
          background: rgba(255,255,255,0.15);
          border: 1px solid rgba(255,255,255,0.25);
          color: white;
          padding: 7px 16px;
          border-radius: 5px;
          cursor: pointer;
          font-size: 12px;
        }
        .btn-print {
          background: white;
          border: none;
          color: #1b4332;
          padding: 8px 20px;
          border-radius: 5px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .items-ctrl {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: rgba(255,255,255,0.85);
        }
        .items-ctrl select {
          background: rgba(255,255,255,0.15);
          border: 1px solid rgba(255,255,255,0.3);
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
        }
        .items-ctrl select option { background: #2d6a4f; color: white; }

        /* ── Wrapper das páginas A4 ── */
        .print-pages {
          padding: 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }

        /* ── Página A4 ── */
        .a4-page {
          width: 794px;
          min-height: 1123px;
          background: white;
          box-shadow: 0 4px 24px rgba(0,0,0,0.18);
          padding: 10mm 11mm 14mm 11mm;
          position: relative;
          page-break-after: always;
          display: flex;
          flex-direction: column;
        }

        /* ── Cabeçalho do documento ── */
        .doc-header {
          text-align: center;
          margin-bottom: 6px;
          padding-bottom: 6px;
          border-bottom: 2px solid #2d6a4f;
        }
        .doc-header h1 {
          font-size: 13px;
          font-weight: bold;
          color: #1b4332;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        /* ── Tabela de condições (repetida em cada página) ── */
        .page-header-block {
          margin-bottom: 8px;
        }

        .conditions-legend {
          background: #f0f9f3;
          border: 1px solid #b7d8be;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 8px;
        }

        .legend-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 9px;
        }

        .leg-th-label {
          background: #1b4332;
          color: white;
          padding: 4px 8px;
          font-weight: 700;
          text-align: left;
          min-width: 100px;
          letter-spacing: 0.04em;
        }

        .leg-th-cond {
          background: #1b4332;
          color: white;
          padding: 4px 8px;
          font-weight: 700;
          text-align: center;
          border-left: 1px solid rgba(255,255,255,0.15);
          letter-spacing: 0.04em;
        }

        .leg-td-label {
          padding: 3px 8px;
          font-weight: 600;
          color: #1b4332;
          border-top: 1px solid #cde3d2;
          white-space: nowrap;
        }

        .leg-td-factor {
          padding: 3px 8px;
          text-align: center;
          color: #555;
          border-top: 1px solid #cde3d2;
          border-left: 1px solid #cde3d2;
          font-variant-numeric: tabular-nums;
        }

        .leg-even .leg-td-label,
        .leg-even .leg-td-factor { background: #f0f9f3; }
        .leg-odd  .leg-td-label,
        .leg-odd  .leg-td-factor { background: #ffffff; }

        /* ── Divisor entre cabeçalho e produtos ── */
        .products-section {
          flex: 1;
        }

        /* ── Bloco de produto (compacto) ── */
        .product-block {
          display: flex;
          gap: 10px;
          margin-bottom: 7px;
          padding-bottom: 7px;
          border-bottom: 1px solid #dce8de;
          page-break-inside: avoid;
        }
        .product-block:last-child {
          border-bottom: none;
          margin-bottom: 0;
        }

        /* LEFT: imagem */
        .prod-left {
          width: 90px;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
        }
        .prod-img {
          width: 82px;
          height: 82px;
          object-fit: contain;
          border: 1px solid #e0e8e2;
          border-radius: 3px;
        }
        .prod-img-placeholder {
          width: 82px;
          height: 82px;
          background: #f5f7f5;
          border: 1px solid #dce8de;
          border-radius: 3px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #aaa;
          font-size: 9px;
          gap: 3px;
        }
        .prod-code {
          font-size: 8.5px;
          color: #777;
          text-align: center;
          word-break: break-all;
          line-height: 1.2;
        }
        .prod-name {
          font-size: 9px;
          font-weight: bold;
          text-align: center;
          color: #1b4332;
          line-height: 1.3;
          text-transform: uppercase;
        }

        /* RIGHT: tabela de preços */
        .prod-right {
          flex: 1;
          overflow: hidden;
        }

        /* ── Tabela de preços do produto ── */
        .price-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 10px;
        }

        .th-empty {
          background: #2d6a4f;
          padding: 4px 7px;
          min-width: 80px;
        }
        .th-cond {
          background: #2d6a4f;
          color: white;
          padding: 4px 7px;
          text-align: center;
          font-size: 9.5px;
          font-weight: 700;
          border-left: 1px solid rgba(255,255,255,0.2);
          letter-spacing: 0.02em;
        }
        .td-label {
          padding: 3.5px 7px;
          font-size: 9px;
          font-weight: 600;
          color: #2d2d2d;
          background: #f0f9f3 !important;
          border: 1px solid #dce8de;
          white-space: nowrap;
        }
        .td-price {
          padding: 3.5px 7px;
          text-align: center;
          font-size: 10px;
          border: 1px solid #dce8de;
          font-variant-numeric: tabular-nums;
          font-weight: 600;
        }
        .tr-even .td-price { background: #f6fbf7; }
        .tr-odd  .td-price { background: #ffffff; }

        /* ── Rodapé da página ── */
        .page-footer {
          position: absolute;
          bottom: 8mm;
          left: 11mm;
          right: 11mm;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 8.5px;
          color: #bbb;
          border-top: 1px solid #e8e8e8;
          padding-top: 4px;
        }
        .page-footer-center {
          font-size: 8px;
          color: #ccc;
          font-style: italic;
        }

        /* ── Estilos de impressão ── */
        @media print {
          .screen-bar { display: none !important; }
          .print-pages { padding: 0; gap: 0; }
          body { background: white; }

          .a4-page {
            width: 100%;
            min-height: auto;
            box-shadow: none;
            padding: 8mm 10mm 18mm 10mm;
            page-break-after: always;
          }

          .product-block { page-break-inside: avoid; }
        }

        @keyframes spin { to { transform: rotate(360deg) } }
      `}</style>

      {/* ── Toolbar de tela ── */}
      <div className="screen-bar">
        <div>
          <div className="screen-bar-title">📄 Prévia de Impressão</div>
          <div className="screen-bar-sub">
            {products.length} produto{products.length !== 1 ? 's' : ''} •{' '}
            {conditions.length} condição{conditions.length !== 1 ? 'ões' : ''} •{' '}
            {deadlines.length} prazo{deadlines.length !== 1 ? 's' : ''} •{' '}
            {totalPages} página{totalPages !== 1 ? 's' : ''}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {/* Controle manual de itens por página */}
          <label className="items-ctrl">
            Itens/página:
            <select value={itemsPerPage} onChange={e => setItemsPerPage(Number(e.target.value))}>
              {[4, 5, 6, 7, 8, 9, 10].map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </label>

          <button className="btn-back" onClick={() => window.close()}>✕ Fechar</button>
          <button className="btn-print" onClick={() => window.print()}>
            🖨 Imprimir / Salvar PDF
          </button>
        </div>
      </div>

      {/* ── Páginas A4 ── */}
      <div className="print-pages">
        {Array.from({ length: totalPages }, (_, pageIdx) => {
          const pageProducts = products.slice(pageIdx * itemsPerPage, (pageIdx + 1) * itemsPerPage)
          const pageNum = pageIdx + 1

          return (
            <div key={pageIdx} className="a4-page">

              {/* ── Cabeçalho repetido em TODAS as páginas ── */}
              <PriceTableHeader
                conditions={conditions}
                deadlines={deadlines}
                regionFactor={regionFactor}
                title={title}
                showTitle={true}
              />

              {/* ── Produtos da página ── */}
              <div className="products-section">
                {pageProducts.map(product => (
                  <ProductBlock
                    key={product.cod}
                    product={product}
                    conditions={conditions}
                    deadlines={deadlines}
                    regionFactor={regionFactor}
                  />
                ))}
              </div>

              {/* ── Rodapé ── */}
              <div className="page-footer">
                <span>Emitido em {emitido}</span>
                <span className="page-footer-center">{saleType?.descri || ''}</span>
                <span>Página {pageNum} de {totalPages}</span>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}