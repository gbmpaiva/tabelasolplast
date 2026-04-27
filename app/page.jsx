'use client'

import { useState, useEffect, useRef } from 'react'

const STORAGE_KEY = 'tabela_precos_products'

/* ── TOTVS Color Tokens ── */
const C = {
  blueDark:    '#003366',
  blueMid:     '#0077B3',
  bluePrimary: '#0096D7',
  blueAccent:  '#29ABE2',
  blueSurface: '#E6F4FB',
  blueSurf2:   '#CCE9F6',
  blueBorder:  '#A8D4EF',
  borderLight: '#D0E8F5',
  bgPage:      '#F0F6FA',
  rowEven:     '#F0F8FC',
  textPrimary: '#1A2B3C',
  textMuted:   '#8AA8BC',
  danger:      '#E53935',
  white:       '#FFFFFF',
}

/* ── helpers ── */
function trimStr(s) {
  return typeof s === 'string' ? s.trim() : String(s ?? '')
}

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

/* ── SavedBadge ── */
function SavedBadge({ saved }) {
  if (!saved) return null
  return (
    <span style={{ fontSize: 11, color: C.blueAccent, fontWeight: 600, marginLeft: 8 }}>
      ✓ Salvo
    </span>
  )
}

/* ── CheckboxList ── */
function CheckboxList({ title, items, selected, onToggle, onSelectAll, loading, error, keyField, labelField, extraField, extraLabel }) {
  const allSelected = items.length > 0 && items.every(item => selected.includes(trimStr(item[keyField])))

  return (
    <div className="section-card flex-1 min-w-0">
      <div className="section-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>{title}</span>
        {!loading && !error && items.length > 0 && (
          <button
            onClick={() => onSelectAll(allSelected ? [] : items.map(i => trimStr(i[keyField])))}
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.3)',
              color: '#fff',
              borderRadius: 4,
              padding: '3px 10px',
              fontSize: 11,
              cursor: 'pointer',
              fontWeight: 600,
              whiteSpace: 'nowrap',
            }}
          >
            {allSelected ? '☐ Desmarcar todos' : '☑ Marcar todos'}
          </button>
        )}
      </div>
      {loading && (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <span className="loading-spinner" />
          <span style={{ marginLeft: 8, color: C.blueAccent, fontSize: 12 }}>Carregando...</span>
        </div>
      )}
      {error && !loading && (
        <div style={{ padding: '12px', color: C.danger, fontSize: 12, background: '#fff5f5', margin: 8, borderRadius: 4 }}>
          ⚠ {error}
        </div>
      )}
      {!loading && !error && (
        <>
          <div className="table-header" style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '8px', padding: '8px 12px', fontSize: 11 }}>
            <span>Descrição</span>
            {extraField && <span style={{ minWidth: 60, textAlign: 'right' }}>{extraLabel}</span>}
            <span style={{ minWidth: 32, textAlign: 'center' }}>✓</span>
          </div>
          <div className="scrollable-list">
            {items.length === 0 && <div className="empty-state">Nenhum item encontrado</div>}
            {items.map((item, idx) => {
              const key = trimStr(item[keyField])
              const label = trimStr(item[labelField])
              const extra = extraField ? item[extraField] : null
              const isSelected = selected.includes(key)
              return (
                <label
                  key={key}
                  className={`checkbox-item${isSelected ? ' selected' : ''}`}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto auto',
                    gap: '8px',
                    background: isSelected ? C.blueSurf2 : idx % 2 === 0 ? C.rowEven : C.white,
                    borderRadius: 0,
                  }}
                >
                  <span style={{ fontSize: 12, color: C.textPrimary }}>{label}</span>
                  {extraField && (
                    <span style={{ fontSize: 11, color: C.blueMid, fontWeight: 600, textAlign: 'right', minWidth: 60 }}>
                      {typeof extra === 'number' ? extra.toFixed(4) : extra}
                    </span>
                  )}
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggle(key)}
                    style={{ accentColor: C.bluePrimary, width: 14, height: 14, cursor: 'pointer', margin: 'auto' }}
                  />
                </label>
              )
            })}
          </div>
          <div style={{ padding: '8px 12px', borderTop: `1px solid ${C.borderLight}`, fontSize: 11, color: C.blueAccent }}>
            {selected.length} selecionado{selected.length !== 1 ? 's' : ''} de {items.length}
          </div>
        </>
      )}
    </div>
  )
}

/* ── ProductSearchModal ── */
const PAGE_SIZE = 20
 
function ProductSearchModal({ onAdd, onRemove, onClose, alreadyAdded }) {
  const [code,    setCode]    = useState('')
  const [desc,    setDesc]    = useState('')
  const [tipo,    setTipo]    = useState('')
  const [tipos,   setTipos]   = useState([])
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingTipos, setLoadingTipos] = useState(true)
  const [searched, setSearched] = useState(false)
 
  // pagination
  const [page,       setPage]       = useState(1)
  const [total,      setTotal]      = useState(0)
  const [totalPages, setTotalPages] = useState(0)
 
  // keep last query params so page-change can re-fetch without re-reading state
  const lastQuery = useRef(null)
  const descRef   = useRef(null)
 
  /* fetch distinct tipos once on mount */
  useEffect(() => {
    fetch('/api/products?tipos=1')
      .then(r => r.json())
      .then(d => setTipos((d.data || []).map(x => (x.B1_TIPO || '').trim()).filter(Boolean)))
      .catch(() => {})
      .finally(() => setLoadingTipos(false))
    descRef.current?.focus()
  }, [])
 
  async function fetchPage(targetPage, query) {
    setLoading(true)
    try {
      const p = new URLSearchParams(query)
      p.set('page', targetPage)
      p.set('pageSize', PAGE_SIZE)
      const res  = await fetch(`/api/products?${p.toString()}`)
      const data = await res.json()
      setResults(data.notFound || !data.data ? [] : data.data)
      setTotal(data.total ?? 0)
      setTotalPages(data.totalPages ?? 0)
      setPage(targetPage)
    } catch {
      setResults([])
      setTotal(0)
      setTotalPages(0)
    } finally {
      setLoading(false)
    }
  }
 
  async function search() {
    const query = { desc: desc.trim(), tipo }
    if (code.trim()) query.code = code.trim()
    lastQuery.current = query
    setSearched(true)
    await fetchPage(1, query)
  }
 
  function goToPage(p) {
    if (!lastQuery.current) return
    fetchPage(p, lastQuery.current)
    // scroll result list to top
    document.getElementById('modal-results-list')?.scrollTo({ top: 0, behavior: 'smooth' })
  }
 
  function handleKey(e) {
    if (e.key === 'Enter') search()
    if (e.key === 'Escape') onClose()
  }
 
  /* ── pagination bar ── */
  function Pagination() {
    if (totalPages <= 1) return null
    const pages = buildPageRange(page, totalPages)
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 16px', borderTop: `1px solid ${C.borderLight}`,
        background: C.bgPage, flexShrink: 0, gap: 8, flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: 11, color: C.textMuted }}>
          {total} produto{total !== 1 ? 's' : ''} •{' '}
          página {page} de {totalPages}
        </span>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <PageBtn label="«" onClick={() => goToPage(1)}          disabled={page === 1} />
          <PageBtn label="‹" onClick={() => goToPage(page - 1)}   disabled={page === 1} />
          {pages.map((p, i) =>
            p === '…'
              ? <span key={`ellipsis-${i}`} style={{ padding: '0 4px', color: C.textMuted, fontSize: 12 }}>…</span>
              : <PageBtn key={p} label={p} onClick={() => goToPage(p)} active={p === page} />
          )}
          <PageBtn label="›" onClick={() => goToPage(page + 1)}   disabled={page === totalPages} />
          <PageBtn label="»" onClick={() => goToPage(totalPages)} disabled={page === totalPages} />
        </div>
      </div>
    )
  }
 
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: C.white, borderRadius: 10, width: '94%', maxWidth: 860,
        boxShadow: '0 8px 40px rgba(0,0,0,0.2)', overflow: 'hidden',
        display: 'flex', flexDirection: 'column', maxHeight: '90vh',
      }}>
 
        {/* header */}
        <div style={{ background: `linear-gradient(135deg, ${C.blueDark}, ${C.blueMid})`, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <span style={{ color: C.white, fontWeight: 700, fontSize: 14 }}>🔍 Pesquisar Produto</span>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: C.white, borderRadius: 5, padding: '4px 10px', cursor: 'pointer', fontSize: 13 }}>✕</button>
        </div>
 
        {/* filters */}
        <div style={{ padding: '14px 18px', borderBottom: `1px solid ${C.borderLight}`, flexShrink: 0 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto', gap: 10, alignItems: 'end' }}>
 
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: C.blueDark }}>Descrição contém</label>
              <input ref={descRef} className="input-field" placeholder="Ex: cano, tubo, cola..." value={desc} onChange={e => setDesc(e.target.value)} onKeyDown={handleKey} />
            </div>
 
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: C.blueDark }}>Código / Cód. barras</label>
              <input className="input-field" placeholder="Código exato ou parcial..." value={code} onChange={e => setCode(e.target.value)} onKeyDown={handleKey} />
            </div>
 
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: C.blueDark }}>Tipo</label>
              {loadingTipos
                ? <span className="loading-spinner" style={{ margin: 8 }} />
                : (
                  <select className="select-field" style={{ minWidth: 130 }} value={tipo} onChange={e => setTipo(e.target.value)}>
                    <option value="">Todos</option>
                    {tipos.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                )
              }
            </div>
 
            <button className="btn-primary" onClick={search} disabled={loading} style={{ height: 36, whiteSpace: 'nowrap' }}>
              {loading
                ? <span className="loading-spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                : '🔍'}
              Buscar
            </button>
          </div>
        </div>
 
        {/* results */}
        <div id="modal-results-list" style={{ flex: 1, overflow: 'auto' }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <span className="loading-spinner" />
              <p style={{ color: C.blueAccent, fontSize: 12, marginTop: 8 }}>Buscando...</p>
            </div>
          )}
 
          {!loading && searched && results.length === 0 && (
            <div className="empty-state">Nenhum produto encontrado para os filtros informados.</div>
          )}
 
          {!loading && results.length > 0 && (
            <>
              <div style={{ padding: '6px 18px', background: C.blueSurface, borderBottom: `1px solid ${C.borderLight}`, fontSize: 11, color: C.blueAccent }}>
                {total} produto{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''} — mostrando {results.length} da página {page}
              </div>
              <table className="product-table" style={{ minWidth: 'unset' }}>
                <thead>
                  <tr className="table-header">
                    <th style={{ padding: '9px 12px', textAlign: 'left', fontSize: 11 }}>Código</th>
                    <th style={{ padding: '9px 12px', textAlign: 'left', fontSize: 11 }}>Descrição</th>
                    <th style={{ padding: '9px 12px', textAlign: 'left', fontSize: 11 }}>Tipo</th>
                    <th style={{ padding: '9px 12px', width: 80 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((p, i) => {
                    const cod   = trimStr(p.B1_COD)
                    const added = alreadyAdded.includes(cod)
                    return (
                      <tr key={cod} style={{ background: i % 2 === 0 ? C.rowEven : C.white }}>
                        <td style={{ padding: '7px 12px', fontSize: 12, fontWeight: 600, color: C.blueMid, whiteSpace: 'nowrap' }}>{cod}</td>
                        <td style={{ padding: '7px 12px', fontSize: 12, maxWidth: 340 }} title={trimStr(p.B1_DESC)}>{trimStr(p.B1_DESC)}</td>
                        <td style={{ padding: '7px 12px', fontSize: 11 }}>
                          {trimStr(p.B1_TIPO)
                            ? <span className="tag-badge" style={{ fontSize: 10 }}>{trimStr(p.B1_TIPO)}</span>
                            : <span style={{ color: C.textMuted }}>—</span>}
                        </td>
                        <td style={{ padding: '7px 12px', textAlign: 'center' }}>
                          {added ? (
                            <button
                              onClick={() => onRemove(cod)}
                              style={{ padding: '4px 10px', fontSize: 11, fontWeight: 700, background: '#fff0f0', border: '1px solid #ffb3b3', color: C.danger, borderRadius: 4, cursor: 'pointer', whiteSpace: 'nowrap' }}
                            >
                              − Retirar
                            </button>
                          ) : (
                            <button className="btn-primary" style={{ padding: '4px 12px', fontSize: 11 }} onClick={() => onAdd(p)}>+ Add</button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </>
          )}
 
          {!searched && (
            <div className="empty-state" style={{ padding: 48 }}>
              Use os filtros acima e clique em <strong>Buscar</strong>
            </div>
          )}
        </div>
 
        {/* pagination */}
        {!loading && searched && <Pagination />}
      </div>
    </div>
  )
}
 
/* ── helpers ──────────────────────────────────────────────── */
 
function PageBtn({ label, onClick, disabled, active }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        minWidth: 30, height: 28, padding: '0 6px',
        border: `1px solid ${active ? C.bluePrimary : C.blueBorder}`,
        background: active ? C.bluePrimary : C.white,
        color: active ? C.white : disabled ? C.textMuted : C.blueDark,
        borderRadius: 4, fontSize: 12, cursor: disabled ? 'default' : 'pointer',
        fontWeight: active ? 700 : 400,
        opacity: disabled ? 0.45 : 1,
      }}
    >
      {label}
    </button>
  )
}
 
/** Returns an array like [1, '…', 4, 5, 6, '…', 12] */
function buildPageRange(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages = new Set([1, total, current])
  for (let d = -2; d <= 2; d++) {
    const p = current + d
    if (p > 1 && p < total) pages.add(p)
  }
  const sorted = [...pages].sort((a, b) => a - b)
  const result = []
  let prev = 0
  for (const p of sorted) {
    if (p - prev > 1) result.push('…')
    result.push(p)
    prev = p
  }
  return result
}
/* ── ProductBlock (prévia) ── */
function ProductBlock({ product, conditions, deadlines, regionFactor }) {
  const [imgError, setImgError] = useState(false)
  const cod = (product.cod || '').trim()
  const SFTP_PROXY_BASE = 'https://tabelasolplast.vercel.app/api/image'

  return (
    <div className="product-block">
      <div className="prod-left">
        {imgError ? (
          <div className="prod-img-placeholder">
            <span style={{ fontSize: 20 }}>📦</span>
            <span>Sem imagem</span>
          </div>
        ) : (
          <img
            className="prod-img"
            src={`/api/image?cod=${cod}`}
            alt={product.desc}
            onError={() => setImgError(true)}
          />
        )}
        <div className="prod-code">{cod}</div>
        <div className="prod-name">{product.desc}</div>
      </div>
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

/* ── PrintPreview ── */
/* ── PrintPreview ── */
function PrintPreview({ config, onBack }) {
  const now = new Date()
  const emitido = `${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })}`

  const { conditions, deadlines, saleType, products, title } = config
  const regionFactor = saleType?.fator ?? 1

  return (
    <>
      {/* ── Barra de preview (oculta ao imprimir) ── */}
      <div className="preview-bar no-print">
        <div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>📄 Prévia de Impressão</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>
            {products.length} produto{products.length !== 1 ? 's' : ''} •{' '}
            {conditions.length} condição{conditions.length !== 1 ? 'ões' : ''} •{' '}
            {deadlines.length} prazo{deadlines.length !== 1 ? 's' : ''}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button
            onClick={onBack}
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.25)',
              color: C.white,
              padding: '7px 16px',
              borderRadius: 5,
              cursor: 'pointer',
              fontSize: 12,
            }}
          >
            ← Voltar
          </button>
          <button
            onClick={() => window.print()}
            style={{
              background: C.white,
              border: 'none',
              color: C.blueDark,
              padding: '8px 20px',
              borderRadius: 5,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            🖨 Imprimir / Salvar PDF
          </button>
        </div>
      </div>

      {/*
        ── Documento imprimível ──
        Um único fluxo contínuo. O CSS abaixo garante:
          • Cabeçalho repete em toda página  →  <thead> com display:table-header-group
          • Cada produto NÃO quebra no meio  →  break-inside: avoid
          • Margens A4 definidas via @page
      */}
      <style>{`
        @page {
          size: A4 portrait;
          margin: 14mm 12mm 16mm 12mm;
        }

        /* Cabeçalho do documento: só aparece na 1ª página em tela,
           mas ao imprimir o browser repete thead automaticamente */
        .print-doc-header {
          text-align: center;
          padding-bottom: 8px;
          border-bottom: 2px solid ${C.bluePrimary};
          margin-bottom: 10px;
        }

        /* Cada bloco de produto não pode ser quebrado entre páginas */
        .product-block {
          break-inside: avoid;
          page-break-inside: avoid; /* fallback Safari/Edge legados */
        }

        /* Rodapé fixo na parte inferior de cada página impressa */
        .print-running-footer {
          display: none;
        }
        @media print {
          .print-running-footer {
            display: flex;
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            justify-content: space-between;
            font-size: 8pt;
            color: #888;
            border-top: 1px solid #ddd;
            padding: 3pt 10pt;
            background: white;
          }
        }
      `}</style>

      {/* Rodapé que flutua em toda página ao imprimir */}
      <div className="print-running-footer">
        <span>Emitido em {emitido}</span>
        <span style={{ fontStyle: 'italic', color: '#bbb' }}>{saleType?.descri || ''}</span>
      </div>

      {/* Conteúdo principal */}
      <div className="print-pages" style={{ paddingBottom: 40 }}>
        {/* Cabeçalho visível em tela e na 1ª página impressa */}
        <div className="a4-page" style={{ paddingBottom: 0 }}>
          <div className="print-doc-header">
            <h1
              style={{
                fontSize: 13,
                fontWeight: 'bold',
                color: C.blueDark,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                margin: 0,
              }}
            >
              {title || 'Tabela de Preços'}
            </h1>
          </div>

          {/* Todos os produtos em sequência — o browser quebra as páginas */}
          {products.map((product) => (
            <ProductBlock
              key={product.cod}
              product={product}
              conditions={conditions}
              deadlines={deadlines}
              regionFactor={regionFactor}
            />
          ))}
        </div>
      </div>
    </>
  )
}
/* ══════════════════════════════════════
   PÁGINA PRINCIPAL
══════════════════════════════════════ */
export default function TabelaPrecos() {
  /* --- dados do servidor --- */
  const [conditions, setConditions] = useState([])
  const [deadlines, setDeadlines] = useState([])
  const [saleTypes, setSaleTypes] = useState([])
  const [loadingCond, setLoadingCond] = useState(true)
  const [loadingDeadl, setLoadingDeadl] = useState(true)
  const [loadingSale, setLoadingSale] = useState(true)
  const [errorCond, setErrorCond] = useState('')
  const [errorDeadl, setErrorDeadl] = useState('')
  const [errorSale, setErrorSale] = useState('')

  /* --- seleções --- */
  const [selectedConds, setSelectedConds] = useState([])
  const [selectedDeadlines, setSelectedDeadlines] = useState([])
  const [selectedSaleType, setSelectedSaleType] = useState('')

  /* --- produtos --- */
  const [products, setProducts] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [savedBadge, setSavedBadge] = useState(false)
  const [barcodeInput, setBarcodeInput] = useState('')
  const [barcodeLoading, setBarcodeLoading] = useState(false)
  const [barcodeError, setBarcodeError] = useState('')

  /* --- controle de view --- */
  const [view, setView] = useState('config') // 'config' | 'preview'
  const [printConfig, setPrintConfig] = useState(null)
  const [printError, setPrintError] = useState('')

  const dragIdx = useRef(null)
  const dragOverIdx = useRef(null)

  useEffect(() => {
    fetch('/api/conditions')
      .then(r => r.json())
      .then(d => { setConditions(d.data || []); if (!d.success) setErrorCond(d.error || 'Erro') })
      .catch(e => setErrorCond(e.message))
      .finally(() => setLoadingCond(false))

    fetch('/api/deadlines')
      .then(r => r.json())
      .then(d => { setDeadlines(d.data || []); if (!d.success) setErrorDeadl(d.error || 'Erro') })
      .catch(e => setErrorDeadl(e.message))
      .finally(() => setLoadingDeadl(false))

    fetch('/api/sale-types')
      .then(r => r.json())
      .then(d => { setSaleTypes(d.data || []); if (!d.success) setErrorSale(d.error || 'Erro') })
      .catch(e => setErrorSale(e.message))
      .finally(() => setLoadingSale(false))

    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) setProducts(JSON.parse(saved))
    } catch {}
  }, [])

  function saveProducts(list) {
    setProducts(list)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
      setSavedBadge(true)
      setTimeout(() => setSavedBadge(false), 2000)
    } catch {}
  }

  function toggleCond(key) {
    setSelectedConds(p => p.includes(key) ? p.filter(x => x !== key) : [...p, key])
  }
  function toggleDeadline(key) {
    setSelectedDeadlines(p => p.includes(key) ? p.filter(x => x !== key) : [...p, key])
  }

  function addProduct(p) {
    const cod = trimStr(p.B1_COD)
    if (products.find(x => x.cod === cod)) return
    saveProducts([...products, {
      cod,
      desc: trimStr(p.B1_DESC),
      tipo: trimStr(p.B1_TIPO) || '-',
      prv1: typeof p.B1_PRV1 === 'number' ? p.B1_PRV1 : parseFloat(p.B1_PRV1) || 0,
    }])
  }

  async function addByBarcode() {
    const code = barcodeInput.trim()
    if (!code) return
    if (products.find(x => x.cod === code)) { setBarcodeError('Produto já está na lista'); return }
    setBarcodeLoading(true)
    setBarcodeError('')
    try {
      const res = await fetch(`/api/products?code=${encodeURIComponent(code)}`)
      const data = await res.json()
      if (data.notFound || !data.data || data.data.length === 0) {
        setBarcodeError('Produto não encontrado')
      } else {
        addProduct(data.data[0])
        setBarcodeInput('')
      }
    } catch {
      setBarcodeError('Erro ao buscar produto')
    } finally {
      setBarcodeLoading(false)
    }
  }

  function handlePrint() {
    setPrintError('')
    const errors = []
    if (selectedConds.length === 0) errors.push('Selecione ao menos uma condição')
    if (selectedDeadlines.length === 0) errors.push('Selecione ao menos um prazo')
    if (!selectedSaleType) errors.push('Selecione um tipo de venda')
    if (products.length === 0) errors.push('Adicione ao menos um produto')
    if (errors.length > 0) { setPrintError(errors.join(' • ')); return }

    const saleTypeObj = saleTypes.find(s => trimStr(s.Z01_CODIGO) === selectedSaleType)

    setPrintConfig({
      conditions: conditions
        .filter(c => selectedConds.includes(trimStr(c.Z02_CODIGO)))
        .map(c => ({ codigo: trimStr(c.Z02_CODIGO), descri: trimStr(c.Z02_DESCRI), fator: c.Z02_FATOR, comiss: c.Z02_COMISS })),
      deadlines: deadlines
        .filter(d => selectedDeadlines.includes(trimStr(d.E4_CODIGO)))
        .map(d => ({ codigo: trimStr(d.E4_CODIGO), cond: trimStr(d.E4_COND), descri: trimStr(d.E4_DESCRI), xfator: d.E4_XFATOR })),
      saleType: saleTypeObj
        ? { codigo: trimStr(saleTypeObj.Z01_CODIGO), descri: trimStr(saleTypeObj.Z01_DESCRI), fator: saleTypeObj.Z01_FATOR }
        : { fator: 1 },
      products,
      title: `Tabela de Preços - ${saleTypeObj ? trimStr(saleTypeObj.Z01_DESCRI) : 'FOB'}`,
    })
    setView('preview')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleBack() {
    setView('config')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function removeProduct(cod) { saveProducts(products.filter(p => p.cod !== cod)) }
  function handleDragStart(idx) { dragIdx.current = idx }
  function handleDragOver(e, idx) { e.preventDefault(); dragOverIdx.current = idx }
  function handleDrop() {
    const from = dragIdx.current
    const to = dragOverIdx.current
    if (from === null || from === to) return
    const newList = [...products]
    const [moved] = newList.splice(from, 1)
    newList.splice(to, 0, moved)
    saveProducts(newList)
    dragIdx.current = null
    dragOverIdx.current = null
  }

  const alreadyAddedCods = products.map(p => p.cod)

  return (
    <>

      {/* ══ CONFIG VIEW ══ */}
      {view === 'config' && (
        <div className="config-root">

          <header style={{
            background: `linear-gradient(135deg, ${C.bluePrimary} 0%, ${C.blueMid} 50%, ${C.blueDark} 100%)`,
            padding: '14px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            boxShadow: '0 2px 12px rgba(0,50,100,0.25)'
          }}>
            <div>
              <h1 style={{ color: C.white, fontSize: 16, fontWeight: 700, margin: 0 }}>Impressão de Tabela de Preços</h1>
            </div>
          </header>

          <div style={{ maxWidth: 1400, margin: '0 auto', padding: '18px 18px 0' }}>
            {/* Condições + Prazos */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
              <CheckboxList
  title="Condição de Pagamento"
  items={conditions}
  selected={selectedConds}
  onToggle={toggleCond}
  onSelectAll={setSelectedConds}  
  loading={loadingCond}
  error={errorCond}
  keyField="Z02_CODIGO"
  labelField="Z02_DESCRI"
  extraField="Z02_FATOR"
  extraLabel="Multiplicador"
/>
<CheckboxList
  title="Prazo de Pagamento"
  items={deadlines}
  selected={selectedDeadlines}
  onToggle={toggleDeadline}
  onSelectAll={setSelectedDeadlines}  
  error={errorDeadl}
  keyField="E4_CODIGO"
  labelField="E4_DESCRI"
  extraField="E4_XFATOR"
  extraLabel="Fator"
/>
            </div>

            {/* Tipo de Venda */}
            <div className="section-card" style={{ marginBottom: 16 }}>
              <div className="section-title">Tipo de Venda</div>
              <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.blueDark, minWidth: 90 }}>Tipo de Venda</label>
                {loadingSale ? <span className="loading-spinner" /> : errorSale ? (
                  <span style={{ color: C.danger, fontSize: 12 }}>⚠ {errorSale}</span>
                ) : (
                  <select className="select-field" style={{ minWidth: 320 }} value={selectedSaleType} onChange={e => setSelectedSaleType(e.target.value)}>
                    <option value="">— Selecione um tipo de venda —</option>
                    {saleTypes.map(s => (
                      <option key={trimStr(s.Z01_CODIGO)} value={trimStr(s.Z01_CODIGO)}>{trimStr(s.Z01_DESCRI)}</option>
                    ))}
                  </select>
                )}
                {selectedSaleType && (
                  <span className="tag-badge">{trimStr(saleTypes.find(s => trimStr(s.Z01_CODIGO) === selectedSaleType)?.Z01_DESCRI || '')}</span>
                )}
              </div>
            </div>

            {/* Produtos */}
            <div className="section-card">
              <div className="section-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>Produtos</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <SavedBadge saved={savedBadge} />
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 400 }}>
                    {products.length} produto{products.length !== 1 ? 's' : ''}
                  </span>
                  <button
                    onClick={handlePrint}
                    style={{ background: C.white, border: 'none', color: C.blueDark, padding: '5px 14px', borderRadius: 4, fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
                  >
                    🖨 Imprimir PDF
                  </button>
                </div>
              </div>

              {printError && (
                <div style={{ padding: '8px 14px', background: '#fff5f5', borderBottom: '1px solid #ffd0d0', color: C.danger, fontSize: 11, fontWeight: 500 }}>
                  ⚠ {printError}
                </div>
              )}

              {/* Busca */}
              <div style={{ padding: '12px 14px', borderBottom: `1px solid ${C.borderLight}`, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: 8, flex: 1, minWidth: 280 }}>
                  <div style={{ position: 'relative', flex: 1, maxWidth: 340 }}>
                    <input
                      className="input-field"
                      style={{ width: '100%', paddingLeft: 32 }}
                      placeholder="Código de barras ou código do produto..."
                      value={barcodeInput}
                      onChange={e => { setBarcodeInput(e.target.value); setBarcodeError('') }}
                      onKeyDown={e => e.key === 'Enter' && addByBarcode()}
                    />
                    <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: C.textMuted }}>🔎</span>
                  </div>
                  <button className="btn-primary" onClick={addByBarcode} disabled={barcodeLoading || !barcodeInput.trim()}>
                    {barcodeLoading ? <span className="loading-spinner" style={{ width: 13, height: 13, borderWidth: 2 }} /> : '+'}
                    Adicionar
                  </button>
                    <button className="btn-primary"     onClick={() => setShowModal(true)} >
                    {barcodeLoading ? <span className="loading-spinner" style={{ width: 13, height: 13, borderWidth: 2 }} /> : '🔍'}
                    Procurar
                  </button>
                </div>
                {barcodeError && (
                  <div style={{ width: '100%', color: C.danger, fontSize: 11, marginTop: 2 }}>⚠ {barcodeError}</div>
                )}
              </div>

              {/* Lista */}
              <div className="product-grid-container">
                {products.length === 0 ? (
                  <div className="empty-state" style={{ padding: '48px 16px' }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>📦</div>
                    <div style={{ fontWeight: 600, color: C.blueMid, marginBottom: 4 }}>Nenhum produto adicionado</div>
                    <div>Use o campo acima para adicionar produtos</div>
                  </div>
                ) : (
                  <table className="product-table">
                    <thead>
                      <tr className="table-header">
                        <th style={{ width: 32, padding: '10px 6px' }}></th>
                        <th style={{ width: 32, padding: '10px 6px', textAlign: 'center' }}>#</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left' }}>Cód. Produto</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left' }}>Nome</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left' }}>Tipo</th>
                        <th style={{ width: 40, textAlign: 'center' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((p, i) => (
                        <tr
                          key={p.cod}
                          className="drag-row"
                          draggable
                          onDragStart={() => handleDragStart(i)}
                          onDragOver={(e) => handleDragOver(e, i)}
                          onDrop={() => handleDrop(i)}
                          style={{ background: i % 2 === 0 ? C.rowEven : C.white, cursor: 'default' }}
                        >
                          <td style={{ padding: '8px 6px', textAlign: 'center' }}>
                            <span className="drag-handle" title="Arraste para reordenar">⠿</span>
                          </td>
                          <td style={{ padding: '8px 6px', textAlign: 'center', color: C.textMuted, fontSize: 11 }}>{i + 1}</td>
                          <td style={{ padding: '8px 12px', fontWeight: 600, color: C.blueMid }}>{p.cod}</td>
                          <td style={{ padding: '8px 12px', maxWidth: 320 }} title={p.desc}>{p.desc}</td>
                          <td style={{ padding: '8px 12px' }}>
                            {p.tipo && p.tipo !== '-' ? <span className="tag-badge" style={{ fontSize: 10 }}>{p.tipo}</span> : '-'}
                          </td>
                          <td style={{ padding: '8px 8px', textAlign: 'center' }}>
                            <button className="btn-remove" onClick={() => removeProduct(p.cod)} title="Remover">×</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {products.length > 0 && (
                <div style={{ padding: '8px 14px', borderTop: `1px solid ${C.borderLight}`, fontSize: 11, color: C.blueAccent, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>⠿</span>
                  Arraste as linhas para reordenar • A lista é salva automaticamente no navegador
                </div>
              )}
            </div>
          </div>

          {/* Summary bar */}
          {(selectedConds.length > 0 || selectedDeadlines.length > 0 || selectedSaleType || products.length > 0) && (
            <div style={{
              position: 'fixed', bottom: 0, left: 0, right: 0,
              background: C.blueDark,
              padding: '10px 24px',
              display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center',
              boxShadow: '0 -2px 12px rgba(0,0,0,0.2)',
              zIndex: 100
            }}>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 600 }}>SELEÇÃO ATUAL:</span>
              {selectedConds.length > 0 && (
                <span style={{ color: C.white, fontSize: 11 }}>
                  <span style={{ color: C.blueAccent }}>Condições:</span> {selectedConds.length} selecionada{selectedConds.length !== 1 ? 's' : ''}
                </span>
              )}
              {selectedDeadlines.length > 0 && (
                <span style={{ color: C.white, fontSize: 11 }}>
                  <span style={{ color: C.blueAccent }}>Prazos:</span> {selectedDeadlines.length} selecionado{selectedDeadlines.length !== 1 ? 's' : ''}
                </span>
              )}
              {selectedSaleType && (
                <span style={{ color: C.white, fontSize: 11 }}>
                  <span style={{ color: C.blueAccent }}>Tipo Venda:</span>{' '}
                  {trimStr(saleTypes.find(s => trimStr(s.Z01_CODIGO) === selectedSaleType)?.Z01_DESCRI || selectedSaleType)}
                </span>
              )}
              {products.length > 0 && (
                <span style={{ color: C.white, fontSize: 11 }}>
                  <span style={{ color: C.blueAccent }}>Produtos:</span> {products.length}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* ══ PREVIEW VIEW ══ */}
      {view === 'preview' && printConfig && (
        <div className="preview-root">
          <PrintPreview config={printConfig} onBack={handleBack} />
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <ProductSearchModal
    onAdd={(p) => addProduct(p)}
    onRemove={(cod) => removeProduct(cod)} 
    onClose={() => setShowModal(false)}
    alreadyAdded={alreadyAddedCods}
        />
      )}
    </>
  )
}