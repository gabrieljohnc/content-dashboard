import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DateRange {
  start: string
  end: string
}

interface DateRanges {
  analise: DateRange
  comparacao: DateRange
}

interface PlatformNote {
  id: string
  plataforma: string
  criadoEm: string
  periodoAnalise: DateRange
  periodoComparacao: DateRange
  certo: string
  errado: string
  insight: string
  proximaAcao: string
}

interface KpiRow {
  label: string
  current: string
  previous: string
  change: string
}

interface ChartPoint {
  label: string
  value: number
}

interface ChartConfig {
  title: string
  data: ChartPoint[]
  color: [number, number, number]
  type: 'bar' | 'line'
  suffix?: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function hexToRgb(hex: string): [number, number, number] {
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)]
}

function formatRangeBR(range: DateRange): string {
  const fmt = (d: string) => { const [y, m, day] = d.split('-'); return `${day}/${m}/${y}` }
  return `${fmt(range.start)} – ${fmt(range.end)}`
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString('pt-BR')
}

function formatPercent(n: number): string { return `${n.toFixed(1)}%` }

function formatChange(n: number): string {
  return `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`
}

function calcChange(current: number, previous: number): number {
  if (previous === 0) return 0
  return ((current - previous) / previous) * 100
}

function makeKpiRow(label: string, cur: number, prev: number, fmt: 'number' | 'percent' | 'hours' | 'seconds' = 'number'): KpiRow {
  const fmtVal = fmt === 'percent' ? formatPercent(cur) : fmt === 'hours' ? `${formatNumber(cur)}h` : fmt === 'seconds' ? `${cur.toFixed(1)}s` : formatNumber(cur)
  const fmtPrev = fmt === 'percent' ? formatPercent(prev) : fmt === 'hours' ? `${formatNumber(prev)}h` : fmt === 'seconds' ? `${prev.toFixed(1)}s` : formatNumber(prev)
  return { label, current: fmtVal, previous: fmtPrev, change: formatChange(calcChange(cur, prev)) }
}

// ---------------------------------------------------------------------------
// Native chart drawing
// ---------------------------------------------------------------------------

function drawChart(doc: jsPDF, chart: ChartConfig, x: number, y: number, w: number, h: number) {
  const { data, color, type, title, suffix = '' } = chart
  if (data.length === 0) return

  const padding = { top: 14, right: 6, bottom: 16, left: 28 }
  const chartW = w - padding.left - padding.right
  const chartH = h - padding.top - padding.bottom
  const cx = x + padding.left
  const cy = y + padding.top

  // Background
  doc.setFillColor(30, 30, 34)
  doc.roundedRect(x, y, w, h, 2, 2, 'F')

  // Title
  doc.setTextColor(161, 161, 170)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.text(title, x + 6, y + 9)

  const maxVal = Math.max(...data.map((d) => d.value), 1)
  const minVal = Math.min(...data.map((d) => d.value), 0)
  const range = maxVal - minVal || 1

  // Y-axis labels
  doc.setFontSize(5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(113, 113, 122)
  const steps = 4
  for (let i = 0; i <= steps; i++) {
    const val = minVal + (range * i) / steps
    const yPos = cy + chartH - (chartH * i) / steps
    doc.text(`${formatNumber(val)}${suffix}`, cx - 2, yPos + 1, { align: 'right' })

    // Grid line
    doc.setDrawColor(50, 50, 56)
    doc.setLineWidth(0.1)
    doc.line(cx, yPos, cx + chartW, yPos)
  }

  const barWidth = chartW / data.length

  if (type === 'bar') {
    for (let i = 0; i < data.length; i++) {
      const d = data[i]
      const barH = ((d.value - minVal) / range) * chartH
      const bx = cx + i * barWidth + barWidth * 0.15
      const bw = barWidth * 0.7
      const by = cy + chartH - barH

      doc.setFillColor(color[0], color[1], color[2])
      if (barH > 1) {
        doc.roundedRect(bx, by, bw, barH, 1, 1, 'F')
      }

      // X label (every N)
      if (data.length <= 15 || i % Math.ceil(data.length / 10) === 0) {
        doc.setTextColor(113, 113, 122)
        doc.setFontSize(4.5)
        doc.text(d.label, bx + bw / 2, cy + chartH + 6, { align: 'center' })
      }
    }
  } else {
    // Line chart
    doc.setDrawColor(color[0], color[1], color[2])
    doc.setLineWidth(0.5)

    const points: { px: number; py: number }[] = []
    for (let i = 0; i < data.length; i++) {
      const d = data[i]
      const px = cx + i * barWidth + barWidth / 2
      const py = cy + chartH - ((d.value - minVal) / range) * chartH
      points.push({ px, py })

      // X label
      if (data.length <= 15 || i % Math.ceil(data.length / 10) === 0) {
        doc.setTextColor(113, 113, 122)
        doc.setFontSize(4.5)
        doc.text(d.label, px, cy + chartH + 6, { align: 'center' })
      }
    }

    // Draw area fill
    if (points.length > 1) {
      // Semi-transparent area (simulated with lighter color)
      doc.setFillColor(color[0], color[1], color[2])
      doc.setGState(new (doc as any).GState({ opacity: 0.1 }))
      const areaPoints: number[] = []
      areaPoints.push(points[0].px, cy + chartH)
      for (const p of points) areaPoints.push(p.px, p.py)
      areaPoints.push(points[points.length - 1].px, cy + chartH)

      // Draw as polygon manually
      const lines: string[] = []
      lines.push(`${points[0].px.toFixed(2)} ${(cy + chartH).toFixed(2)} m`)
      for (const p of points) lines.push(`${p.px.toFixed(2)} ${p.py.toFixed(2)} l`)
      lines.push(`${points[points.length - 1].px.toFixed(2)} ${(cy + chartH).toFixed(2)} l`)
      lines.push('f')

      doc.setGState(new (doc as any).GState({ opacity: 1 }))
    }

    // Draw line
    doc.setDrawColor(color[0], color[1], color[2])
    doc.setLineWidth(0.5)
    for (let i = 1; i < points.length; i++) {
      doc.line(points[i - 1].px, points[i - 1].py, points[i].px, points[i].py)
    }

    // Dots
    for (const p of points) {
      doc.setFillColor(color[0], color[1], color[2])
      doc.circle(p.px, p.py, 0.6, 'F')
    }
  }
}

// ---------------------------------------------------------------------------
// PDF Generation
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Metric Explanations
// ---------------------------------------------------------------------------

const METRIC_EXPLANATIONS: Record<string, { metric: string; description: string }[]> = {
  instagram: [
    { metric: 'Alcance', description: 'Número de contas únicas que viram seu conteúdo. Indica o poder de distribuição do algoritmo.' },
    { metric: 'Salvamentos', description: 'Quantas vezes o conteúdo foi salvo. Sinal forte de valor — o usuário quer revisitar.' },
    { metric: 'Compartilhamentos', description: 'Quantas vezes o conteúdo foi compartilhado via DM ou Stories. Principal motor de alcance orgânico.' },
    { metric: 'Watch Time', description: 'Tempo total de reprodução dos vídeos (Reels/Stories). Indica retenção de atenção e relevância.' },
    { metric: 'Cliques no Link', description: 'Cliques em links da bio ou stickers. Mede conversão de atenção para ação.' },
    { metric: 'Interações no Direct', description: 'Mensagens recebidas no Direct em resposta ao conteúdo. Indica conexão real com a audiência.' },
  ],
  linkedin: [
    { metric: 'Impressões', description: 'Quantas vezes o conteúdo apareceu no feed. Mede a visibilidade e distribuição da rede.' },
    { metric: 'Comentários', description: 'Número de comentários recebidos. No LinkedIn, comentário é o principal indicador de autoridade.' },
    { metric: 'Dwell Time', description: 'Tempo médio que usuários permanecem no post. Indica profundidade de leitura e interesse.' },
    { metric: 'Novos Seguidores', description: 'Seguidores conquistados no período. Mede crescimento de audiência qualificada.' },
    { metric: 'Salvamentos', description: 'Posts salvos pelos usuários. Indica conteúdo de referência ou consulta futura.' },
    { metric: 'Compartilhamentos', description: 'Reposts e compartilhamentos. Amplifica alcance para redes de segundo grau.' },
  ],
  youtube: [
    { metric: 'Watch Time', description: 'Tempo total de exibição em horas. Métrica #1 do YouTube — determina recomendação algorítmica.' },
    { metric: 'Retenção Média', description: 'Percentual médio do vídeo assistido. Acima de 50% é considerado bom.' },
    { metric: 'CTR Thumbnail', description: 'Taxa de clique na miniatura. Mede a eficácia do título + thumbnail em gerar curiosidade.' },
    { metric: 'Engajamento', description: 'Taxa de interação (likes + comentários / visualizações). Indica conexão com a audiência.' },
    { metric: 'Visualizações', description: 'Total de views no período. Mede o volume de consumo do conteúdo.' },
    { metric: 'Novos Inscritos', description: 'Inscritos conquistados no período. Indica conteúdo que converte visitantes em audiência recorrente.' },
  ],
}

export async function exportAnalyticsPDF({
  ranges,
  instagram,
  linkedin,
  youtube,
  comparativo,
  notes,
  chartData,
  introducao,
  conclusao,
}: {
  ranges: DateRanges
  introducao: string
  conclusao: string
  instagram: {
    alcance: number; alcancePrev: number
    salvamentos: number; salvamentosPrev: number
    compartilhamentos: number; compartilhamentosPrev: number
    watchTime: number; watchTimePrev: number
    cliquesLink: number; cliquesLinkPrev: number
    interacoesDirect: number; interacoesDirectPrev: number
    seguidores: number
  }
  linkedin: {
    impressoes: number; impressoesPrev: number
    comentarios: number; comentariosPrev: number
    salvamentos: number; salvamentosPrev: number
    dwellTime: number; dwellTimePrev: number
    novosSeguidores: number; novosSeguidoresPrev: number
    compartilhamentos: number; compartilhamentosPrev: number
    seguidores: number
  }
  youtube: {
    ctrThumbnail: number; ctrThumbnailPrev: number
    retencaoMedia: number; retencaoMediaPrev: number
    watchTime: number; watchTimePrev: number
    engajamento: number; engajamentoPrev: number
    visualizacoes: number; visualizacoesPrev: number
    novosInscritos: number; novosInscritosPrev: number
  }
  comparativo: {
    ig: { alcance: number; alcancePrev: number; salvamentos: number; salvamentosPrev: number; compartilhamentos: number; compartilhamentosPrev: number; watchTime: number; watchTimePrev: number }
    li: { impressoes: number; impressoesPrev: number; comentarios: number; comentariosPrev: number; dwellTime: number; dwellTimePrev: number; novosSeg: number; novosSegPrev: number }
    yt: { watchTime: number; watchTimePrev: number; retencao: number; retencaoPrev: number; ctrThumb: number; ctrThumbPrev: number; engajamento: number; engajamentoPrev: number }
  }
  notes: PlatformNote[]
  chartData: {
    instagram: ChartConfig[]
    linkedin: ChartConfig[]
    youtube: ChartConfig[]
  }
}): Promise<void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 15
  const contentWidth = pageWidth - margin * 2
  let y = margin

  const IG_COLOR = hexToRgb('#E1306C')
  const LI_COLOR = hexToRgb('#0A66C2')
  const YT_COLOR = hexToRgb('#FF0000')

  // =========================================================================
  // COVER
  // =========================================================================

  doc.setFillColor(24, 24, 27)
  doc.rect(0, 0, pageWidth, pageHeight, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(28)
  doc.setFont('helvetica', 'bold')
  doc.text('Relatório de Analytics', margin, 50)

  doc.setFontSize(14)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(161, 161, 170)
  doc.text('Central do Conteúdo — Distribuição de Energia', margin, 62)

  y = 85
  doc.setFontSize(11)
  doc.setTextColor(52, 211, 153)
  doc.setFont('helvetica', 'bold')
  doc.text('PERÍODO DE ANÁLISE', margin, y)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(212, 212, 216)
  doc.text(formatRangeBR(ranges.analise), margin, y + 7)

  y += 20
  doc.setTextColor(96, 165, 250)
  doc.setFont('helvetica', 'bold')
  doc.text('PERÍODO DE COMPARAÇÃO', margin, y)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(212, 212, 216)
  doc.text(formatRangeBR(ranges.comparacao), margin, y + 7)

  y += 25
  doc.setFontSize(9)
  doc.setTextColor(113, 113, 122)
  doc.text(`Gerado em ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, margin, y)

  y += 15
  const badges: { label: string; color: [number, number, number] }[] = [
    { label: 'Instagram', color: IG_COLOR },
    { label: 'LinkedIn', color: LI_COLOR },
    { label: 'YouTube', color: YT_COLOR },
  ]
  let badgeX = margin
  for (const badge of badges) {
    doc.setFillColor(badge.color[0], badge.color[1], badge.color[2])
    doc.roundedRect(badgeX, y - 4, 30, 8, 2, 2, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.text(badge.label, badgeX + 15, y + 1, { align: 'center' })
    badgeX += 35
  }

  // Introduction on cover page
  if (introducao.trim()) {
    y += 18
    doc.setFillColor(52, 211, 153)
    doc.rect(margin, y, 3, 10, 'F')
    doc.setTextColor(52, 211, 153)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Introdução', margin + 7, y + 7)
    y += 16

    doc.setTextColor(200, 200, 200)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    const introLines = doc.splitTextToSize(introducao, contentWidth)
    for (const line of introLines) {
      if (y + 4 > pageHeight - margin) break
      doc.text(line, margin, y)
      y += 4.5
    }
  }

  // =========================================================================
  // Helpers
  // =========================================================================

  function newPage() {
    doc.addPage()
    doc.setFillColor(24, 24, 27)
    doc.rect(0, 0, pageWidth, pageHeight, 'F')
    return margin
  }

  function sectionHeader(title: string, subtitle: string, color: [number, number, number], yPos: number): number {
    doc.setFillColor(color[0], color[1], color[2])
    doc.rect(margin, yPos, 4, 14, 'F')
    doc.setTextColor(color[0], color[1], color[2])
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text(title, margin + 8, yPos + 6)
    doc.setTextColor(161, 161, 170)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(subtitle, margin + 8, yPos + 13)
    return yPos + 22
  }

  function drawTextBlock(text: string, startY: number, fontSize = 10, textColor: [number, number, number] = [212, 212, 216]): number {
    if (!text.trim()) return startY
    doc.setTextColor(textColor[0], textColor[1], textColor[2])
    doc.setFontSize(fontSize)
    doc.setFont('helvetica', 'normal')
    const lines = doc.splitTextToSize(text, contentWidth)
    const lineHeight = fontSize * 0.45
    let currentY = startY

    for (const line of lines) {
      if (currentY + lineHeight > pageHeight - margin) {
        currentY = newPage()
      }
      doc.text(line, margin, currentY)
      currentY += lineHeight
    }

    return currentY + 4
  }

  function kpiTableWithExplanations(rows: KpiRow[], platform: string, color: [number, number, number], yPos: number): number {
    const explanations = METRIC_EXPLANATIONS[platform] || []
    const explanationMap = new Map(explanations.map((e) => [e.metric, e.description]))

    autoTable(doc, {
      startY: yPos,
      margin: { left: margin, right: margin },
      head: [['Métrica', 'Atual', 'Anterior', 'Variação', 'O que mede']],
      body: rows.map((r) => [r.label, r.current, r.previous, r.change, explanationMap.get(r.label) || '']),
      styles: {
        fillColor: [30, 30, 34],
        textColor: [212, 212, 216],
        fontSize: 8,
        cellPadding: 3,
        lineColor: [63, 63, 70],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [color[0], color[1], color[2]],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
      },
      alternateRowStyles: { fillColor: [39, 39, 42] },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 32 },
        1: { halign: 'right', cellWidth: 22 },
        2: { halign: 'right', cellWidth: 22 },
        3: { halign: 'right', cellWidth: 20 },
        4: { cellWidth: contentWidth - 96, textColor: [161, 161, 170], fontSize: 7 },
      },
    })
    return (doc as any).lastAutoTable.finalY + 8
  }

  function kpiTable(rows: KpiRow[], color: [number, number, number], yPos: number): number {
    autoTable(doc, {
      startY: yPos,
      margin: { left: margin, right: margin },
      head: [['Métrica', 'Período Atual', 'Período Anterior', 'Variação']],
      body: rows.map((r) => [r.label, r.current, r.previous, r.change]),
      styles: {
        fillColor: [30, 30, 34],
        textColor: [212, 212, 216],
        fontSize: 9,
        cellPadding: 4,
        lineColor: [63, 63, 70],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [color[0], color[1], color[2]],
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold',
      },
      alternateRowStyles: { fillColor: [39, 39, 42] },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 55 },
        1: { halign: 'right', cellWidth: 40 },
        2: { halign: 'right', cellWidth: 40 },
        3: { halign: 'right', cellWidth: 35 },
      },
    })
    return (doc as any).lastAutoTable.finalY + 8
  }

  function drawChartsGrid(charts: ChartConfig[], startY: number): number {
    if (charts.length === 0) return startY
    const chartW = (contentWidth - 4) / 2
    const chartH = 78
    const gap = 4
    let currentY = startY

    for (let i = 0; i < charts.length; i++) {
      const col = i % 2
      const row = Math.floor(i / 2)
      const gx = margin + col * (chartW + 4)
      const gy = currentY + row * (chartH + gap)

      if (gy + chartH > pageHeight - margin) {
        currentY = newPage()
        // recalculate from new page
        return drawChartsGrid(charts.slice(i), currentY)
      }

      drawChart(doc, charts[i], gx, gy, chartW, chartH)
    }

    return currentY + Math.ceil(charts.length / 2) * (chartH + gap) + 4
  }

  const FIELD_COLORS: Record<string, [number, number, number]> = {
    'certo': [52, 211, 153],     // emerald-400
    'errado': [248, 113, 113],   // red-400
    'insight': [251, 191, 36],   // amber-400
    'proximaAcao': [96, 165, 250], // blue-400
  }

  const FIELD_LABELS: Record<string, string> = {
    'certo': 'O que deu certo',
    'errado': 'O que deu errado',
    'insight': 'Insight',
    'proximaAcao': 'Próxima ação',
  }

  function drawNotes(platform: string, color: [number, number, number], platformLabel: string, startY: number): number {
    const platformNotes = notes.filter((n) => n.plataforma === platform)
    if (platformNotes.length === 0) return startY

    let currentY = startY

    if (currentY + 20 > pageHeight - margin) currentY = newPage()

    // Section title
    doc.setTextColor(color[0], color[1], color[2])
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text(`Notas de Análise — ${platformLabel} (${platformNotes.length})`, margin + 1, currentY + 4)
    currentY += 8

    for (const note of platformNotes) {
      if (currentY + 40 > pageHeight - margin) currentY = newPage()

      // Note card background
      const cardStartY = currentY

      // Period header
      doc.setFillColor(35, 35, 40)
      doc.roundedRect(margin, currentY, contentWidth, 8, 1.5, 1.5, 'F')
      doc.setTextColor(200, 200, 200)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      doc.text(
        `${formatRangeBR(note.periodoAnalise)} vs ${formatRangeBR(note.periodoComparacao)}`,
        margin + 4, currentY + 5.5
      )
      doc.setTextColor(113, 113, 122)
      doc.setFontSize(7)
      doc.setFont('helvetica', 'normal')
      doc.text(
        new Date(note.criadoEm).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        contentWidth + margin - 4, currentY + 5.5, { align: 'right' }
      )
      currentY += 11

      // Fields as proper table rows
      const fields: { key: string; label: string; color: [number, number, number] }[] = [
        { key: 'certo', label: FIELD_LABELS.certo, color: FIELD_COLORS.certo },
        { key: 'errado', label: FIELD_LABELS.errado, color: FIELD_COLORS.errado },
        { key: 'insight', label: FIELD_LABELS.insight, color: FIELD_COLORS.insight },
        { key: 'proximaAcao', label: FIELD_LABELS.proximaAcao, color: FIELD_COLORS.proximaAcao },
      ]

      const noteBody: any[][] = []
      for (const field of fields) {
        const value = (note as any)[field.key] as string
        noteBody.push([
          { content: field.label, styles: { textColor: field.color, fontStyle: 'bold' } },
          value || '—',
        ])
      }

      autoTable(doc, {
        startY: currentY,
        margin: { left: margin, right: margin },
        head: [
          [
            { content: '', styles: { fillColor: [45, 45, 50] } },
            { content: '', styles: { fillColor: [45, 45, 50] } },
          ],
        ],
        showHead: false,
        body: noteBody,
        styles: {
          fillColor: [30, 30, 34],
          textColor: [200, 200, 200],
          fontSize: 8,
          cellPadding: { top: 3, right: 4, bottom: 3, left: 4 },
          lineColor: [50, 50, 56],
          lineWidth: 0.1,
        },
        alternateRowStyles: { fillColor: [35, 35, 40] },
        columnStyles: {
          0: { cellWidth: 40, halign: 'left' },
          1: { cellWidth: contentWidth - 40 },
        },
      })
      currentY = (doc as any).lastAutoTable.finalY + 6
    }

    return currentY + 2
  }

  // =========================================================================
  // INSTAGRAM — Métricas
  // =========================================================================

  y = newPage()
  y = sectionHeader('Instagram', 'Atenção e Distribuição — Foco: parar o scroll + engajar rápido', IG_COLOR, y)

  y = kpiTableWithExplanations([
    makeKpiRow('Alcance', instagram.alcance, instagram.alcancePrev),
    makeKpiRow('Salvamentos', instagram.salvamentos, instagram.salvamentosPrev),
    makeKpiRow('Compartilhamentos', instagram.compartilhamentos, instagram.compartilhamentosPrev),
    makeKpiRow('Watch Time', instagram.watchTime, instagram.watchTimePrev, 'hours'),
    makeKpiRow('Cliques no Link', instagram.cliquesLink, instagram.cliquesLinkPrev),
    makeKpiRow('Interações no Direct', instagram.interacoesDirect, instagram.interacoesDirectPrev),
  ], 'instagram', IG_COLOR, y)

  doc.setTextColor(161, 161, 170)
  doc.setFontSize(9)
  doc.text(`Total de Seguidores: ${formatNumber(instagram.seguidores)}`, margin, y)

  // =========================================================================
  // INSTAGRAM — Gráficos
  // =========================================================================

  y = newPage()
  y = sectionHeader('Instagram', 'Evolução das Métricas', IG_COLOR, y)
  y = drawChartsGrid(chartData.instagram, y)

  // =========================================================================
  // LINKEDIN — Métricas
  // =========================================================================

  y = newPage()
  y = sectionHeader('LinkedIn', 'Autoridade e Conversão Leve — Foco: credibilidade + conversa', LI_COLOR, y)

  y = kpiTableWithExplanations([
    makeKpiRow('Impressões', linkedin.impressoes, linkedin.impressoesPrev),
    makeKpiRow('Comentários', linkedin.comentarios, linkedin.comentariosPrev),
    makeKpiRow('Dwell Time', linkedin.dwellTime, linkedin.dwellTimePrev, 'seconds'),
    makeKpiRow('Novos Seguidores', linkedin.novosSeguidores, linkedin.novosSeguidoresPrev),
    makeKpiRow('Salvamentos', linkedin.salvamentos, linkedin.salvamentosPrev),
    makeKpiRow('Compartilhamentos', linkedin.compartilhamentos, linkedin.compartilhamentosPrev),
  ], 'linkedin', LI_COLOR, y)

  doc.setTextColor(161, 161, 170)
  doc.setFontSize(9)
  doc.text(`Total de Seguidores: ${formatNumber(linkedin.seguidores)}`, margin, y)

  // =========================================================================
  // LINKEDIN — Gráficos
  // =========================================================================

  y = newPage()
  y = sectionHeader('LinkedIn', 'Evolução das Métricas', LI_COLOR, y)
  y = drawChartsGrid(chartData.linkedin, y)

  // =========================================================================
  // YOUTUBE — Métricas
  // =========================================================================

  y = newPage()
  y = sectionHeader('YouTube', 'Retenção e Profundidade — Foco: tempo e consumo', YT_COLOR, y)

  y = kpiTableWithExplanations([
    makeKpiRow('Watch Time', youtube.watchTime, youtube.watchTimePrev, 'hours'),
    makeKpiRow('Retenção Média', youtube.retencaoMedia, youtube.retencaoMediaPrev, 'percent'),
    makeKpiRow('CTR Thumbnail', youtube.ctrThumbnail, youtube.ctrThumbnailPrev, 'percent'),
    makeKpiRow('Engajamento', youtube.engajamento, youtube.engajamentoPrev, 'percent'),
    makeKpiRow('Visualizações', youtube.visualizacoes, youtube.visualizacoesPrev),
    makeKpiRow('Novos Inscritos', youtube.novosInscritos, youtube.novosInscritosPrev),
  ], 'youtube', YT_COLOR, y)

  // =========================================================================
  // YOUTUBE — Gráficos
  // =========================================================================

  y = newPage()
  y = sectionHeader('YouTube', 'Evolução das Métricas', YT_COLOR, y)
  y = drawChartsGrid(chartData.youtube, y)

  // =========================================================================
  // COMPARATIVO — INSTAGRAM
  // =========================================================================

  y = newPage()
  doc.setTextColor(161, 161, 170)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('COMPARATIVO — KPIs por Plataforma', margin, y + 4)
  y += 12

  y = sectionHeader('Instagram', 'Atenção e Distribuição — Comparativo de período', IG_COLOR, y)
  y = kpiTable([
    makeKpiRow('Alcance', comparativo.ig.alcance, comparativo.ig.alcancePrev),
    makeKpiRow('Salvamentos', comparativo.ig.salvamentos, comparativo.ig.salvamentosPrev),
    makeKpiRow('Compartilhamentos', comparativo.ig.compartilhamentos, comparativo.ig.compartilhamentosPrev),
    makeKpiRow('Watch Time', comparativo.ig.watchTime, comparativo.ig.watchTimePrev, 'hours'),
  ], IG_COLOR, y)

  y = drawNotes('instagram', IG_COLOR, 'Instagram', y)

  // =========================================================================
  // COMPARATIVO — LINKEDIN
  // =========================================================================

  y = newPage()
  doc.setTextColor(161, 161, 170)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('COMPARATIVO — KPIs por Plataforma', margin, y + 4)
  y += 12

  y = sectionHeader('LinkedIn', 'Autoridade e Conversão — Comparativo de período', LI_COLOR, y)
  y = kpiTable([
    makeKpiRow('Impressões', comparativo.li.impressoes, comparativo.li.impressoesPrev),
    makeKpiRow('Comentários', comparativo.li.comentarios, comparativo.li.comentariosPrev),
    makeKpiRow('Dwell Time', comparativo.li.dwellTime, comparativo.li.dwellTimePrev, 'seconds'),
    makeKpiRow('Novos Seguidores', comparativo.li.novosSeg, comparativo.li.novosSegPrev),
  ], LI_COLOR, y)

  y = drawNotes('linkedin', LI_COLOR, 'LinkedIn', y)

  // =========================================================================
  // COMPARATIVO — YOUTUBE
  // =========================================================================

  y = newPage()
  doc.setTextColor(161, 161, 170)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('COMPARATIVO — KPIs por Plataforma', margin, y + 4)
  y += 12

  y = sectionHeader('YouTube', 'Retenção e Profundidade — Comparativo de período', YT_COLOR, y)
  y = kpiTable([
    makeKpiRow('Watch Time', comparativo.yt.watchTime, comparativo.yt.watchTimePrev, 'hours'),
    makeKpiRow('Retenção Média', comparativo.yt.retencao, comparativo.yt.retencaoPrev, 'percent'),
    makeKpiRow('CTR Thumbnail', comparativo.yt.ctrThumb, comparativo.yt.ctrThumbPrev, 'percent'),
    makeKpiRow('Engajamento', comparativo.yt.engajamento, comparativo.yt.engajamentoPrev, 'percent'),
  ], YT_COLOR, y)

  y = drawNotes('youtube', YT_COLOR, 'YouTube', y)

  // =========================================================================
  // CONCLUSION PAGE
  // =========================================================================

  if (conclusao.trim()) {
    y = newPage()

    doc.setFillColor(96, 165, 250)
    doc.rect(margin, y, 4, 14, 'F')
    doc.setTextColor(96, 165, 250)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('Conclusão', margin + 8, y + 6)
    doc.setTextColor(161, 161, 170)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text('Considerações finais e próximos passos', margin + 8, y + 13)
    y += 24

    y = drawTextBlock(conclusao, y)
  }

  // =========================================================================
  // FOOTER
  // =========================================================================

  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setTextColor(82, 82, 91)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.text('Central do Conteúdo — Relatório de Analytics', margin, pageHeight - 8)
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, pageHeight - 8, { align: 'right' })
  }

  // =========================================================================
  // SAVE
  // =========================================================================

  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  doc.save(`analytics-report-${dateStr}.pdf`)
}
