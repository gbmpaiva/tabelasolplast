'use client'

import { useState, useEffect, useRef } from 'react'

const STORAGE_KEY = 'tabela_precos_products'

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
    <span style={{ fontSize: 11, color: '#40916c', fontWeight: 600, marginLeft: 8 }}>
      ✓ Salvo
    </span>
  )
}

/* ── CheckboxList ── */
function CheckboxList({ title, items, selected, onToggle, loading, error, keyField, labelField, extraField, extraLabel }) {
  return (
    <div className="section-card flex-1 min-w-0">
      <div className="section-title">{title}</div>
      {loading && (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <span className="loading-spinner" />
          <span style={{ marginLeft: 8, color: '#6b9e7a', fontSize: 12 }}>Carregando...</span>
        </div>
      )}
      {error && !loading && (
        <div style={{ padding: '12px', color: '#cc3300', fontSize: 12, background: '#fff5f5', margin: 8, borderRadius: 4 }}>
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
                    background: isSelected ? '#d8f3dc' : idx % 2 === 0 ? '#f6fbf7' : '#fff',
                    borderRadius: 0,
                  }}
                >
                  <span style={{ fontSize: 12, color: '#2d2d2d' }}>{label}</span>
                  {extraField && (
                    <span style={{ fontSize: 11, color: '#40916c', fontWeight: 600, textAlign: 'right', minWidth: 60 }}>
                      {typeof extra === 'number' ? extra.toFixed(4) : extra}
                    </span>
                  )}
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggle(key)}
                    style={{ accentColor: '#40916c', width: 14, height: 14, cursor: 'pointer', margin: 'auto' }}
                  />
                </label>
              )
            })}
          </div>
          <div style={{ padding: '8px 12px', borderTop: '1px solid #e8f2ea', fontSize: 11, color: '#6b9e7a' }}>
            {selected.length} selecionado{selected.length !== 1 ? 's' : ''} de {items.length}
          </div>
        </>
      )}
    </div>
  )
}

/* ── ProductSearchModal ── */
function ProductSearchModal({ onAdd, onClose, alreadyAdded }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  async function search() {
    setLoading(true)
    setSearched(true)
    try {
      const res = await fetch(`/api/products?code=${encodeURIComponent(query)}`)
      const data = await res.json()
      setResults(data.notFound || !data.data ? [] : data.data)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter') search()
    if (e.key === 'Escape') onClose()
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ background: '#fff', borderRadius: 10, width: '92%', maxWidth: 820, boxShadow: '0 8px 40px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
        <div style={{ background: 'linear-gradient(135deg, #2d6a4f, #40916c)', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ color: 'white', fontWeight: 700, fontSize: 14 }}>🔍 Pesquisar Produto</span>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: 5, padding: '4px 10px', cursor: 'pointer', fontSize: 13 }}>✕</button>
        </div>
        <div style={{ padding: '14px 18px' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <input ref={inputRef} className="input-field" style={{ flex: 1 }} placeholder="Código, descrição ou código de barras..." value={query} onChange={e => setQuery(e.target.value)} onKeyDown={handleKey} />
            <button className="btn-primary" onClick={search} disabled={loading}>
              {loading ? <span className="loading-spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> : '🔍'}
              Buscar
            </button>
          </div>
        </div>
        <div style={{ maxHeight: 380, overflow: 'auto', borderTop: '1px solid #e8f2ea' }}>
          {loading && (<div style={{ textAlign: 'center', padding: 32 }}><span className="loading-spinner" /><p style={{ color: '#6b9e7a', fontSize: 12, marginTop: 8 }}>Buscando...</p></div>)}
          {!loading && searched && results.length === 0 && (<div className="empty-state">Nenhum produto encontrado para "<strong>{query}</strong>"</div>)}
          {!loading && results.length > 0 && (
            <table className="product-table" style={{ minWidth: 'unset' }}>
              <thead>
                <tr className="table-header">
                  <th style={{ padding: '9px 12px', textAlign: 'left', fontSize: 11 }}>Código</th>
                  <th style={{ padding: '9px 12px', textAlign: 'left', fontSize: 11 }}>Descrição</th>
                  <th style={{ padding: '9px 12px', textAlign: 'left', fontSize: 11 }}>Tipo</th>
                  <th style={{ padding: '9px 12px', width: 70 }}></th>
                </tr>
              </thead>
              <tbody>
                {results.map((p, i) => {
                  const cod = trimStr(p.B1_COD)
                  const added = alreadyAdded.includes(cod)
                  return (
                    <tr key={cod} style={{ background: i % 2 === 0 ? '#f6fbf7' : '#fff' }}>
                      <td style={{ padding: '7px 12px', fontSize: 12, fontWeight: 600, color: '#2d6a4f' }}>{cod}</td>
                      <td style={{ padding: '7px 12px', fontSize: 12, maxWidth: 320 }}>{trimStr(p.B1_DESC)}</td>
                      <td style={{ padding: '7px 12px', fontSize: 12, color: '#666' }}>{trimStr(p.B1_TIPO) || '-'}</td>
                      <td style={{ padding: '7px 12px', textAlign: 'center' }}>
                        {added ? (
                          <span style={{ fontSize: 11, color: '#999' }}>Adicionado</span>
                        ) : (
                          <button className="btn-primary" style={{ padding: '4px 12px', fontSize: 11 }} onClick={() => onAdd(p)}>+ Add</button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
          {!searched && (<div className="empty-state" style={{ padding: 40 }}>Digite um código ou descrição e clique em Buscar</div>)}
        </div>
      </div>
    </div>
  )
}

/* ── ProductBlock (prévia) ── */
function ProductBlock({ product, conditions, deadlines, regionFactor }) {
  const [imgError, setImgError] = useState(false)
  const cod = (product.cod || '').trim()

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
            src={`/images/${cod}.jpg`}
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
function PrintPreview({ config, onBack }) {
  const [itemsPerPage, setItemsPerPage] = useState(6)

  const now = new Date()
  const emitido = `${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`

  useEffect(() => {
    const count = (config.deadlines || []).length
    if (count <= 3) setItemsPerPage(8)
    else if (count <= 5) setItemsPerPage(7)
    else if (count <= 8) setItemsPerPage(6)
    else setItemsPerPage(5)
  }, [config])

  const { conditions, deadlines, saleType, products, title } = config
  const regionFactor = saleType?.fator ?? 1
  const totalPages = Math.ceil(products.length / itemsPerPage)

  return (
    <>
      {/* Toolbar de prévia — oculta ao imprimir */}
      <div className="preview-bar no-print">
        <div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>📄 Prévia de Impressão</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>
            {products.length} produto{products.length !== 1 ? 's' : ''} •{' '}
            {conditions.length} condição{conditions.length !== 1 ? 'ões' : ''} •{' '}
            {deadlines.length} prazo{deadlines.length !== 1 ? 's' : ''} •{' '}
            {totalPages} página{totalPages !== 1 ? 's' : ''}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(255,255,255,0.85)' }}>
            Itens/página:
            <select
              value={itemsPerPage}
              onChange={e => setItemsPerPage(Number(e.target.value))}
              style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', padding: '4px 8px', borderRadius: 4, fontSize: 12, cursor: 'pointer' }}
            >
              {[4,5,6,7,8,9,10].map(n => <option key={n} value={n} style={{ background: '#2d6a4f' }}>{n}</option>)}
            </select>
          </label>
          <button
            onClick={onBack}
            style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', color: 'white', padding: '7px 16px', borderRadius: 5, cursor: 'pointer', fontSize: 12 }}
          >
            ← Voltar
          </button>
          <button
            onClick={() => window.print()}
            style={{ background: 'white', border: 'none', color: '#1b4332', padding: '8px 20px', borderRadius: 5, cursor: 'pointer', fontSize: 13, fontWeight: 700 }}
          >
            🖨 Imprimir / Salvar PDF
          </button>
        </div>
      </div>

      {/* Páginas A4 */}
      <div className="print-pages">
        {Array.from({ length: totalPages }, (_, pageIdx) => {
          const pageProducts = products.slice(pageIdx * itemsPerPage, (pageIdx + 1) * itemsPerPage)
          const pageNum = pageIdx + 1
          return (
            <div key={pageIdx} className="a4-page">
              {/* Cabeçalho */}
              <div style={{ marginBottom: 8 }}>
                <div style={{ textAlign: 'center', marginBottom: 6, paddingBottom: 6, borderBottom: '2px solid #2d6a4f' }}>
                  <h1 style={{ fontSize: 13, fontWeight: 'bold', color: '#1b4332', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
                    {title || 'Tabela de Preços'}
                  </h1>
                </div>
              </div>

              {/* Produtos */}
              <div style={{ flex: 1 }}>
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

              {/* Rodapé */}
              <div className="page-footer">
                <span>Emitido em {emitido}</span>
                <span style={{ fontSize: 8, color: '#ccc', fontStyle: 'italic' }}>{saleType?.descri || ''}</span>
                <span>Página {pageNum} de {totalPages}</span>
              </div>
            </div>
          )
        })}
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

  /* ── Abrir prévia na mesma página ── */
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
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          font-family: Arial, Helvetica, sans-serif;
          font-size: 12px;
          color: #1a1a1a;
        }

        /* ════════════════ CONFIG VIEW ════════════════ */
        .config-root {
          min-height: 100vh;
          padding: 0 0 60px;
          background: #f0f4f1;
        }

        .section-card {
          background: white;
          border-radius: 8px;
          border: 1px solid #dce8de;
          overflow: hidden;
          box-shadow: 0 1px 4px rgba(27,67,50,0.07);
        }
        .section-title {
          background: linear-gradient(90deg, #7d9de4, #486de9);
          color: white;
          padding: 10px 14px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.03em;
          text-transform: uppercase;
        }
        .table-header {
          background: #e8f2ea;
          color: #619ce9;
          font-weight: 700;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .scrollable-list {
          max-height: 260px;
          overflow-y: auto;
        }
        .checkbox-item {
          padding: 7px 12px;
          cursor: pointer;
          transition: background 0.1s;
          border-bottom: 1px solid #f0f5f1;
          align-items: center;
        }
        .checkbox-item:hover { background: #e8f5eb !important; }
        .checkbox-item.selected { font-weight: 600; }
        .empty-state {
          padding: 32px 16px;
          text-align: center;
          color: #9eadc3;
          font-size: 12px;
        }
        .input-field {
          border: 1px solid #c8d3de;
          border-radius: 5px;
          padding: 7px 10px;
          font-size: 12px;
          outline: none;
          font-family: inherit;
          transition: border-color 0.15s;
        }
        .input-field:focus { border-color: #1131e7; box-shadow: 0 0 0 2px rgba(31, 14, 177, 0.12); }
        .select-field {
          border: 1px solid #92b0f1;
          border-radius: 5px;
          padding: 7px 10px;
          font-size: 12px;
          outline: none;
          font-family: inherit;
          background: white;
          cursor: pointer;
        }
        .select-field:focus { border-color: #669ef1; box-shadow: 0 0 0 2px rgba(67, 36, 240, 0.12); }
        .btn-primary {
          background: linear-gradient(135deg, #387ee7, #1949e9);
          border: none;
          color: white;
          padding: 7px 14px;
          border-radius: 5px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-family: inherit;
          transition: opacity 0.15s;
          white-space: nowrap;
        }
        .btn-primary:hover { opacity: 0.9; }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-remove {
          background: none;
          border: 1px solid #e0b4b4;
          color: #cc4444;
          width: 22px;
          height: 22px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          line-height: 1;
          font-family: inherit;
          transition: all 0.15s;
        }
        .btn-remove:hover { background: #cc4444; color: white; }
        .tag-badge {
          background: #d8f3dc;
          color: #335bdf;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
        }
        .product-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 520px;
        }
        .product-grid-container {
          overflow-x: auto;
        }
        .drag-row { transition: background 0.1s; }
        .drag-row:hover td { background: #edf7ef !important; }
        .drag-handle { color: #5059df; font-size: 14px; cursor: grab; }
        .loading-spinner {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid #82a5f1;
          border-top-color: #1131e7;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg) } }

        /* ════════════════ PREVIEW VIEW ════════════════ */
        .preview-root {
          background: #899bec;
          min-height: 100vh;
        }

        .preview-bar {
          background: linear-gradient(135deg, #387ee7, #1949e9);
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

        .print-pages {
          padding: 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }

        .a4-page {
          width: 794px;
          min-height: 1123px;
          background: white;
          box-shadow: 0 4px 24px rgba(0,0,0,0.18);
          padding: 10mm 11mm 14mm 11mm;
          position: relative;
          display: flex;
          flex-direction: column;
        }

        /* produto */
        .product-block {
          display: flex;
          gap: 10px;
          margin-bottom: 7px;
          padding-bottom: 7px;
          border-bottom: 1px solid #dce8de;
          page-break-inside: avoid;
        }
        .product-block:last-child { border-bottom: none; margin-bottom: 0; }
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
        .prod-code { font-size: 8.5px; color: #777; text-align: center; word-break: break-all; line-height: 1.2; }
        .prod-name { font-size: 9px; font-weight: bold; text-align: center; color: #1b4332; line-height: 1.3; text-transform: uppercase; }
        .prod-right { flex: 1; overflow: hidden; }

        .price-table { width: 100%; border-collapse: collapse; font-size: 10px; }
        .th-cond { background: #3d5add; color: white; padding: 4px 7px; text-align: center; font-size: 9.5px; font-weight: 700; border-left: 1px solid rgba(255,255,255,0.2); letter-spacing: 0.02em; }
        .td-label { padding: 3.5px 7px; font-size: 9px; font-weight: 600; color: #2d2d2d; background: #f0f9f3 !important; border: 1px solid #dce8de; white-space: nowrap; }
        .td-price { padding: 3.5px 7px; text-align: center; font-size: 10px; border: 1px solid #dce8de; font-variant-numeric: tabular-nums; font-weight: 600; }
        .tr-even .td-price { background: #f6fbf7; }
        .tr-odd  .td-price { background: #ffffff; }

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

        /* ════════════════ PRINT ════════════════ */
        @media print {
          .no-print { display: none !important; }
          .config-root { display: none !important; }
          .preview-root { background: white; }
          .print-pages { padding: 0; gap: 0; }
          .a4-page {
            width: 100%;
            min-height: auto;
            box-shadow: none;
            padding: 8mm 10mm 18mm 10mm;
            page-break-after: always;
          }
          .product-block { page-break-inside: avoid; }
        }
      `}</style>

      {/* ══ CONFIG VIEW ══ */}
      {view === 'config' && (
        <div className="config-root">
     
          <header style={{ background: 'linear-gradient(135deg, #6284f3 0%, #5951d1 60%, #4c1ccf 100%)', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 2px 12px rgba(27,67,50,0.25)' }}>
            {/* <div style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.15)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📋</div> */}
            <div>
              <h1 style={{ color: 'white', fontSize: 16, fontWeight: 700, margin: 0 }}>Impressão de Tabela de Preços</h1>
              {/* <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11, margin: 0 }}>Configuração de condições, prazos e produtos</p> */}
            </div>
           </header>

          <div style={{ maxWidth: 1400, margin: '0 auto', padding: '18px 18px 0' }}>
            {/* Condições + Prazos */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
              <CheckboxList title="Condição de Pagamento" items={conditions} selected={selectedConds} onToggle={toggleCond} loading={loadingCond} error={errorCond} keyField="Z02_CODIGO" labelField="Z02_DESCRI" extraField="Z02_FATOR" extraLabel="Multiplicador" />
              <CheckboxList title="Prazo de Pagamento" items={deadlines} selected={selectedDeadlines} onToggle={toggleDeadline} loading={loadingDeadl} error={errorDeadl} keyField="E4_CODIGO" labelField="E4_DESCRI" extraField="E4_XFATOR" extraLabel="Fator" />
            </div>

            {/* Tipo de Venda */}
            <div className="section-card" style={{ marginBottom: 16 }}>
              <div className="section-title">Tipo de Venda</div>
              <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#2a1fc2', minWidth: 90 }}>Tipo de Venda</label>
                {loadingSale ? <span className="loading-spinner" /> : errorSale ? (
                  <span style={{ color: '#cc3300', fontSize: 12 }}>⚠ {errorSale}</span>
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
                    style={{ background: 'white', border: 'none', color: '#1f1950', padding: '5px 14px', borderRadius: 4, fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
                  >
                    🖨 Imprimir PDF
                  </button>
                </div>
              </div>

              {printError && (
                <div style={{ padding: '8px 14px', background: '#fff5f5', borderBottom: '1px solid #ffd0d0', color: '#cc3300', fontSize: 11, fontWeight: 500 }}>
                  ⚠ {printError}
                </div>
              )}

              {/* Busca */}
              <div style={{ padding: '12px 14px', borderBottom: '1px solid #e8f2ea', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-start' }}>
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
                    <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: '#9ec3a8' }}>🔎</span>
                  </div>
                  <button className="btn-primary" onClick={addByBarcode} disabled={barcodeLoading || !barcodeInput.trim()}>
                    {barcodeLoading ? <span className="loading-spinner" style={{ width: 13, height: 13, borderWidth: 2 }} /> : '+'}
                    Adicionar
                  </button>
                </div>
                {/* <button className="btn-primary" style={{ background: 'linear-gradient(135deg, #2421e4, #2421e4)' }} onClick={() => setShowModal(true)}>
                  🔍 Pesquisar produto
                </button> */}
                {barcodeError && (
                  <div style={{ width: '100%', color: '#cc3300', fontSize: 11, marginTop: 2 }}>⚠ {barcodeError}</div>
                )}
              </div>

              {/* Lista */}
              <div className="product-grid-container">
                {products.length === 0 ? (
                  <div className="empty-state" style={{ padding: '48px 16px' }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>📦</div>
                    <div style={{ fontWeight: 600, color: '#2d6bdd', marginBottom: 4 }}>Nenhum produto adicionado</div>
                    <div>Use o campo acima ou clique em "Pesquisar produto" para adicionar</div>
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
                          style={{ background: i % 2 === 0 ? '#f6fbf7' : '#ffffff', cursor: 'default' }}
                        >
                          <td style={{ padding: '8px 6px', textAlign: 'center' }}>
                            <span className="drag-handle" title="Arraste para reordenar">⠿</span>
                          </td>
                          <td style={{ padding: '8px 6px', textAlign: 'center', color: '#aaa', fontSize: 11 }}>{i + 1}</td>
                          <td style={{ padding: '8px 12px', fontWeight: 600, color: '#2959df' }}>{p.cod}</td>
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
                <div style={{ padding: '8px 14px', borderTop: '1px solid #e8f2ea', fontSize: 11, color: '#2566f1', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>⠿</span>
                  Arraste as linhas para reordenar • A lista é salva automaticamente no navegador
                </div>
              )}
            </div>
          </div>

          {/* Summary bar */}
          {(selectedConds.length > 0 || selectedDeadlines.length > 0 || selectedSaleType || products.length > 0) && (
            <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'linear-gradient(135deg, #1b1e43, #1b1e43)', padding: '10px 24px', display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center', boxShadow: '0 -2px 12px rgba(0,0,0,0.15)', zIndex: 100 }}>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 600 }}>SELEÇÃO ATUAL:</span>
              {selectedConds.length > 0 && (
                <span style={{ color: 'white', fontSize: 11 }}>
                  <span style={{ color: '#2475f0' }}>Condições:</span> {selectedConds.length} selecionada{selectedConds.length !== 1 ? 's' : ''}
                </span>
              )}
              {selectedDeadlines.length > 0 && (
                <span style={{ color: 'white', fontSize: 11 }}>
                  <span style={{ color: '#2475f0' }}>Prazos:</span> {selectedDeadlines.length} selecionado{selectedDeadlines.length !== 1 ? 's' : ''}
                </span>
              )}
              {selectedSaleType && (
                <span style={{ color: 'white', fontSize: 11 }}>
                  <span style={{ color: '#2475f0' }}>Tipo Venda:</span>{' '}
                  {trimStr(saleTypes.find(s => trimStr(s.Z01_CODIGO) === selectedSaleType)?.Z01_DESCRI || selectedSaleType)}
                </span>
              )}
              {products.length > 0 && (
                <span style={{ color: 'white', fontSize: 11 }}>
                  <span style={{ color: '#2475f0' }}>Produtos:</span> {products.length}
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
          onClose={() => setShowModal(false)}
          alreadyAdded={alreadyAddedCods}
        />
      )}
    </>
  )
}