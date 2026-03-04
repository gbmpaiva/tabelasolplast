'use client'
import { useState, useEffect } from 'react'

const PRINT_CONFIG_KEY = 'tabela_precos_print_config'

/* ── price formula: b1_prv1 * (fator_prazo + (fator_regiao - 1) + (fator_desconto - 1)) ── */
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
  // "ANTECIPADO" → "00 (ANTECIPADO)", "15 DD" stays as-is
  if (cond && !descri.match(/^\d/)) return `${cond} (${descri})`
  return descri || cond
}

/* ── Product row: image left + price table right ── */
function ProductBlock({ product, conditions, deadlines, regionFactor, idx }) {
  const [imgError, setImgError] = useState(false)
  const cod = (product.cod || '').trim()

  return (
    <div className="product-block" style={{ pageBreakInside: 'avoid' }}>
      {/* LEFT — image + code + name */}
      <div className="prod-left">
        {imgError ? (
          <div className="prod-img-placeholder">
            <span style={{ fontSize: 28, marginBottom: 4 }}>📦</span>
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

      {/* RIGHT — price matrix */}
      <div className="prod-right">
        <table className="price-table">
          <thead>
            <tr>
              <th className="th-empty"></th>
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

/* ── Main page ── */
export default function ImprimirPage() {
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const now = new Date()
  const emitido = `${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}AM`

  useEffect(() => {
    try {
      const saved = localStorage.getItem(PRINT_CONFIG_KEY)
      if (!saved) {
        setError('Nenhuma configuração encontrada. Volte, selecione condições, prazos, tipo de venda e produtos, depois clique em "Imprimir PDF".')
        setLoading(false)
        return
      }
      setConfig(JSON.parse(saved))
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
  const totalPages = Math.ceil(products.length / 3)

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          font-family: Arial, Helvetica, sans-serif;
          background: #e8e8e8;
          font-size: 12px;
          color: #1a1a1a;
        }

        /* ── Screen toolbar (hidden when printing) ── */
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

        /* ── A4 page wrapper ── */
        .print-pages {
          padding: 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 24px;
        }

        .a4-page {
          width: 794px;
          min-height: 1123px;
          background: white;
          box-shadow: 0 4px 24px rgba(0,0,0,0.15);
          padding: 18mm 14mm 14mm 14mm;
          position: relative;
          page-break-after: always;
        }

        /* ── Document header ── */
        .doc-header {
          text-align: center;
          margin-bottom: 14px;
          padding-bottom: 10px;
          border-bottom: 2px solid #2d6a4f;
        }

        .doc-header h1 {
          font-size: 14px;
          font-weight: bold;
          color: #1b4332;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        /* ── Product block ── */
        .product-block {
          display: flex;
          gap: 12px;
          margin-bottom: 12px;
          padding-bottom: 12px;
          border-bottom: 1px solid #dce8de;
        }

        .product-block:last-child {
          border-bottom: none;
          margin-bottom: 0;
        }

        /* LEFT column */
        .prod-left {
          width: 118px;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 5px;
        }

        .prod-img {
          width: 110px;
          height: 110px;
          object-fit: contain;
          border: 1px solid #e0e8e2;
          border-radius: 4px;
        }

        .prod-img-placeholder {
          width: 110px;
          height: 110px;
          background: #f5f7f5;
          border: 1px solid #dce8de;
          border-radius: 4px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #aaa;
          font-size: 10px;
        }

        .prod-code {
          font-size: 9px;
          color: #666;
          text-align: center;
          word-break: break-all;
          line-height: 1.3;
        }

        .prod-name {
          font-size: 10px;
          font-weight: bold;
          text-align: center;
          color: #1b4332;
          line-height: 1.35;
          text-transform: uppercase;
        }

        /* RIGHT column */
        .prod-right {
          flex: 1;
          overflow: hidden;
        }

        /* ── Price table ── */
        .price-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 10.5px;
        }

        .th-empty {
          background: #2d6a4f;
          padding: 6px 8px;
          min-width: 88px;
        }

        .th-cond {
          background: #2d6a4f;
          color: white;
          padding: 6px 8px;
          text-align: center;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.03em;
          border-left: 1px solid rgba(255,255,255,0.2);
        }

        .td-label {
          padding: 5px 8px;
          font-size: 10px;
          font-weight: 600;
          color: #2d2d2d;
          background: #f0f9f3 !important;
          border: 1px solid #dce8de;
          white-space: nowrap;
        }

        .td-price {
          padding: 5px 8px;
          text-align: center;
          font-size: 10.5px;
          border: 1px solid #dce8de;
          font-variant-numeric: tabular-nums;
        }

        .tr-even .td-price { background: #f6fbf7; }
        .tr-odd  .td-price { background: #ffffff; }

        /* ── Page footer ── */
        .page-footer {
          position: absolute;
          bottom: 10mm;
          left: 14mm;
          right: 14mm;
          display: flex;
          justify-content: space-between;
          font-size: 9px;
          color: #aaa;
          border-top: 1px solid #e8e8e8;
          padding-top: 4px;
        }

        /* ── Print styles ── */
        @media print {
          .screen-bar { display: none !important; }
          .print-pages { padding: 0; gap: 0; }
          body { background: white; }

          .a4-page {
            width: 100%;
            min-height: auto;
            box-shadow: none;
            padding: 12mm 10mm 20mm 10mm;
            page-break-after: always;
          }

          .product-block { page-break-inside: avoid; }
        }

        @keyframes spin { to { transform: rotate(360deg) } }
      `}</style>

      {/* ── Screen toolbar ── */}
      <div className="screen-bar">
        <div>
          <div className="screen-bar-title">📄 Prévia de Impressão</div>
          <div className="screen-bar-sub">{products.length} produto{products.length !== 1 ? 's' : ''} • {conditions.length} condição{conditions.length !== 1 ? 'ões' : ''} • {deadlines.length} prazo{deadlines.length !== 1 ? 's' : ''}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="btn-back" onClick={() => window.close()}>✕ Fechar</button>
          <button className="btn-print" onClick={() => window.print()}>
            🖨 Imprimir / Salvar PDF
          </button>
        </div>
      </div>

      {/* ── A4 pages ── */}
      <div className="print-pages">
        {/* Split products into pages of 3 */}
        {Array.from({ length: Math.ceil(products.length / 3) }, (_, pageIdx) => {
          const pageProducts = products.slice(pageIdx * 3, pageIdx * 3 + 3)
          const pageNum = pageIdx + 1
          return (
            <div key={pageIdx} className="a4-page">
              {/* Document title — only on first page, or repeat on each */}
              {pageIdx === 0 && (
                <div className="doc-header">
                  <h1>{title || 'Tabela de Preços'}</h1>
                </div>
              )}

              {pageProducts.map((product, idx) => (
                <ProductBlock
                  key={product.cod}
                  product={product}
                  conditions={conditions}
                  deadlines={deadlines}
                  regionFactor={regionFactor}
                  idx={pageIdx * 3 + idx}
                />
              ))}

              {/* Page footer */}
              <div className="page-footer">
                <span>Emitido em {emitido}</span>
                <span>Página {pageNum} de {Math.ceil(products.length / 3)}</span>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}