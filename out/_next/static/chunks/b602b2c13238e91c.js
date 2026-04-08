(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,86064,e=>{"use strict";var t=e.i(43476),r=e.i(71645);function i({conditions:e,deadlines:r,regionFactor:i,title:o,showTitle:a}){return(0,t.jsx)("div",{className:"page-header-block",children:a&&(0,t.jsx)("div",{className:"doc-header",children:(0,t.jsx)("h1",{children:o||"Tabela de Preços"})})})}function o({product:e,conditions:i,deadlines:o,regionFactor:a}){let[d,n]=(0,r.useState)(!1),s=(e.cod||"").trim();return(0,t.jsxs)("div",{className:"product-block",children:[(0,t.jsxs)("div",{className:"prod-left",children:[d?(0,t.jsxs)("div",{className:"prod-img-placeholder",children:[(0,t.jsx)("span",{style:{fontSize:20},children:"📦"}),(0,t.jsx)("span",{children:"Sem imagem"})]}):(0,t.jsx)("img",{className:"prod-img",src:`/images/${s}.jpg`,alt:e.desc,onError:()=>n(!0)}),(0,t.jsx)("div",{className:"prod-code",children:s}),(0,t.jsx)("div",{className:"prod-name",children:e.desc})]}),(0,t.jsx)("div",{className:"prod-right",children:(0,t.jsxs)("table",{className:"price-table",children:[(0,t.jsx)("thead",{children:(0,t.jsxs)("tr",{children:[(0,t.jsx)("th",{className:"th-cond",children:"Prazos"}),i.map(e=>(0,t.jsx)("th",{className:"th-cond",children:e.descri},e.codigo))]})}),(0,t.jsx)("tbody",{children:o.map((r,o)=>{let d,n;return(0,t.jsxs)("tr",{className:o%2==0?"tr-even":"tr-odd",children:[(0,t.jsx)("td",{className:"td-label",children:(d=(r.cond||"").trim(),n=(r.descri||"").trim(),d&&!n.match(/^\d/)?`${d} (${n})`:n||d)}),i.map(i=>{var o,d;return(0,t.jsx)("td",{className:"td-price",children:(o=e.prv1||0,!(d=Math.max(0,o*(r.xfator+(a-1)+(i.fator-1))))||isNaN(d))?"0,00":d.toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2})},i.codigo)})]},r.codigo)})})]})})]})}function a(){let[e,a]=(0,r.useState)(null),[d,n]=(0,r.useState)(!0),[s,l]=(0,r.useState)(""),[c,p]=(0,r.useState)(6),g=new Date,x=`${g.toLocaleDateString("pt-BR")} \xe0s ${g.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})}`;if((0,r.useEffect)(()=>{try{let e=localStorage.getItem("tabela_precos_print_config");if(!e){l('Nenhuma configuração encontrada. Volte, selecione condições, prazos, tipo de venda e produtos, depois clique em "Imprimir PDF".'),n(!1);return}let t=JSON.parse(e);a(t);let r=(t.deadlines||[]).length;r<=3?p(8):r<=5?p(7):r<=8?p(6):p(5)}catch(e){l("Erro ao carregar configuração: "+e.message)}n(!1)},[]),d)return(0,t.jsxs)("div",{style:{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",fontFamily:"Arial, sans-serif",color:"#2d6a4f",gap:12},children:[(0,t.jsx)("div",{style:{width:24,height:24,border:"3px solid #c3ddc9",borderTopColor:"#40916c",borderRadius:"50%",animation:"spin 0.6s linear infinite"}}),"Carregando prévia...",(0,t.jsx)("style",{children:"@keyframes spin { to { transform: rotate(360deg) } }"})]});if(s)return(0,t.jsxs)("div",{style:{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100vh",fontFamily:"Arial, sans-serif",gap:16,padding:32,textAlign:"center"},children:[(0,t.jsx)("div",{style:{fontSize:40},children:"⚠️"}),(0,t.jsx)("div",{style:{color:"#cc3300",fontSize:15,maxWidth:480},children:s}),(0,t.jsx)("button",{onClick:()=>window.close(),style:{padding:"8px 24px",background:"#2d6a4f",color:"white",border:"none",borderRadius:6,cursor:"pointer",fontSize:13},children:"Fechar"})]});if(!e)return null;let{conditions:m,deadlines:b,saleType:h,products:f,title:u}=e,j=h?.fator??1,w=Math.ceil(f.length/c);return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)("style",{children:`
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

        /* ── Wrapper das p\xe1ginas A4 ── */
        .print-pages {
          padding: 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }

        /* ── P\xe1gina A4 ── */
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

        /* ── Cabe\xe7alho do documento ── */
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

        /* ── Tabela de condi\xe7\xf5es (repetida em cada p\xe1gina) ── */
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

        /* ── Divisor entre cabe\xe7alho e produtos ── */
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

        /* RIGHT: tabela de pre\xe7os */
        .prod-right {
          flex: 1;
          overflow: hidden;
        }

        /* ── Tabela de pre\xe7os do produto ── */
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

        /* ── Rodap\xe9 da p\xe1gina ── */
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

        /* ── Estilos de impress\xe3o ── */
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
      `}),(0,t.jsxs)("div",{className:"screen-bar",children:[(0,t.jsxs)("div",{children:[(0,t.jsx)("div",{className:"screen-bar-title",children:"📄 Prévia de Impressão"}),(0,t.jsxs)("div",{className:"screen-bar-sub",children:[f.length," produto",1!==f.length?"s":""," •"," ",m.length," condição",1!==m.length?"ões":""," •"," ",b.length," prazo",1!==b.length?"s":""," •"," ",w," página",1!==w?"s":""]})]}),(0,t.jsxs)("div",{style:{display:"flex",gap:12,alignItems:"center"},children:[(0,t.jsxs)("label",{className:"items-ctrl",children:["Itens/página:",(0,t.jsx)("select",{value:c,onChange:e=>p(Number(e.target.value)),children:[4,5,6,7,8,9,10].map(e=>(0,t.jsx)("option",{value:e,children:e},e))})]}),(0,t.jsx)("button",{className:"btn-back",onClick:()=>window.close(),children:"✕ Fechar"}),(0,t.jsx)("button",{className:"btn-print",onClick:()=>window.print(),children:"🖨 Imprimir / Salvar PDF"})]})]}),(0,t.jsx)("div",{className:"print-pages",children:Array.from({length:w},(e,r)=>{let a=f.slice(r*c,(r+1)*c);return(0,t.jsxs)("div",{className:"a4-page",children:[(0,t.jsx)(i,{conditions:m,deadlines:b,regionFactor:j,title:u,showTitle:!0}),(0,t.jsx)("div",{className:"products-section",children:a.map(e=>(0,t.jsx)(o,{product:e,conditions:m,deadlines:b,regionFactor:j},e.cod))}),(0,t.jsxs)("div",{className:"page-footer",children:[(0,t.jsxs)("span",{children:["Emitido em ",x]}),(0,t.jsx)("span",{className:"page-footer-center",children:h?.descri||""}),(0,t.jsxs)("span",{children:["Página ",r+1," de ",w]})]})]},r)})})]})}e.s(["default",()=>a])}]);