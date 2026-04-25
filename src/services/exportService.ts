import { Project, Calculation } from '../types'
import { calculationService } from './calculationService'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, AlignmentType } from 'docx'

// Вспомогательная функция для экранирования HTML
const escapeHtml = (text: string): string => {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

export const exportService = {
  async exportToPDF(project: Project, calculation: Calculation): Promise<Blob> {
    const factors = calculation.factors
    const strategies = calculation.strategies
    const profile = calculation.formulaProfileSnapshot
    const quadrantTotals = calculationService.calculateQuadrantTotals(factors)
    const factorTypeCounts = {
      S: factors.filter(f => f.type === 'S').length,
      W: factors.filter(f => f.type === 'W').length,
      O: factors.filter(f => f.type === 'O').length,
      T: factors.filter(f => f.type === 'T').length,
    }
    const topFactors = calculationService.getTopFactors(factors, 10)
    const groupedStrategies = {
      SO: strategies.filter(s => s.type === 'SO'),
      WO: strategies.filter(s => s.type === 'WO'),
      ST: strategies.filter(s => s.type === 'ST'),
      WT: strategies.filter(s => s.type === 'WT'),
    }

    const createdAt = new Date(project.createdAt).toLocaleDateString('ru-RU', {
      year: 'numeric', month: 'long', day: 'numeric',
    })
    const updatedAt = new Date(calculation.updatedAt).toLocaleDateString('ru-RU', {
      year: 'numeric', month: 'long', day: 'numeric',
    })

    let htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: 'DejaVu Sans', Arial, sans-serif;
            font-size: 12px;
            line-height: 1.6;
            padding: 20px;
            color: #000;
          }
          h1 {
            text-align: center;
            font-size: 24px;
            margin-bottom: 10px;
          }
          h2 {
            font-size: 18px;
            margin-top: 20px;
            margin-bottom: 10px;
            border-bottom: 2px solid #333;
            padding-bottom: 5px;
          }
          h3 {
            font-size: 14px;
            margin-top: 15px;
            margin-bottom: 8px;
          }
          .project-info {
            text-align: center;
            margin-bottom: 20px;
          }
          .info-item {
            margin: 5px 0;
          }
          .stats {
            display: flex;
            gap: 20px;
            margin: 15px 0;
          }
          .stat-item {
            flex: 1;
          }
          .factor-types {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
            margin: 15px 0;
          }
          .factor-type-item {
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
          }
          .top-factors {
            margin: 15px 0;
          }
          .factor-item {
            margin: 8px 0;
            padding: 5px;
            border-left: 3px solid #0066cc;
            padding-left: 10px;
          }
          .strategies {
            margin: 15px 0;
          }
          .strategy-group {
            margin: 15px 0;
          }
          .strategy-item {
            margin: 10px 0;
            padding: 10px;
            background: #f5f5f5;
            border-radius: 4px;
          }
          .strategy-title {
            font-weight: bold;
            margin-bottom: 5px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          th {
            background-color: #f0f0f0;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <h1>SWOT Анализ</h1>
        <div class="project-info">
          <div class="info-item"><strong>Проект:</strong> ${escapeHtml(project.name)}</div>
          ${project.description ? `<div class="info-item"><strong>Описание:</strong> ${escapeHtml(project.description)}</div>` : ''}
          <div class="info-item"><strong>Расчёт:</strong> ${escapeHtml(calculation.name)}</div>
          <div class="info-item"><strong>Формула:</strong> ${escapeHtml(profile.name)}</div>
          <div class="info-item"><strong>Создан:</strong> ${createdAt}</div>
          <div class="info-item"><strong>Обновлён:</strong> ${updatedAt}</div>
        </div>

        <h2>Статистика</h2>
        <div class="stats">
          <div class="stat-item"><strong>Всего факторов:</strong> ${factors.length}</div>
          <div class="stat-item"><strong>Стратегий:</strong> ${strategies.length}</div>
        </div>

        <h2>Распределение факторов по типам</h2>
        <div class="factor-types">
          <div class="factor-type-item">
            <strong>S (Сильные стороны):</strong> ${factorTypeCounts.S} (${quadrantTotals.S.toFixed(1)})
          </div>
          <div class="factor-type-item">
            <strong>W (Слабые стороны):</strong> ${factorTypeCounts.W} (${quadrantTotals.W.toFixed(1)})
          </div>
          <div class="factor-type-item">
            <strong>O (Возможности):</strong> ${factorTypeCounts.O} (${quadrantTotals.O.toFixed(1)})
          </div>
          <div class="factor-type-item">
            <strong>T (Угрозы):</strong> ${factorTypeCounts.T} (${quadrantTotals.T.toFixed(1)})
          </div>
        </div>
    `

    // Топ факторы
    if (topFactors.length > 0) {
      htmlContent += `
        <h2>Топ-10 факторов по оценке</h2>
        <table>
          <thead>
            <tr>
              <th>Ранг</th>
              <th>Тип</th>
              <th>Текст</th>
              <th>Категория</th>
              <th>Оценка</th>
            </tr>
          </thead>
          <tbody>
      `
      topFactors.forEach((factor, index) => {
        htmlContent += `
          <tr>
            <td>${index + 1}</td>
            <td>${factor.type}</td>
            <td>${escapeHtml(factor.text)}</td>
            <td>${escapeHtml(factor.category)}</td>
            <td>${factor.score?.toFixed(1) ?? '-'}</td>
          </tr>
        `
      })
      htmlContent += `
          </tbody>
        </table>
      `
    }

    // Стратегии
    if (strategies.length > 0) {
      htmlContent += `<h2>Сгенерированные стратегии</h2>`
      
      Object.entries(groupedStrategies).forEach(([type, strategies]) => {
        if (strategies.length > 0) {
          htmlContent += `<h3>${type} стратегии (${strategies.length})</h3>`
          
          strategies.forEach(strategy => {
            htmlContent += `
              <div class="strategy-item">
                <div class="strategy-title">${escapeHtml(strategy.title)}</div>
                <div>${escapeHtml(strategy.description)}</div>
                ${strategy.factors.length > 0 ? `
                  <div style="margin-top: 5px; font-size: 11px; color: #666;">
                    <strong>Ключевые факторы:</strong> ${strategy.factors.map(f => escapeHtml(f.text)).join(', ')}
                  </div>
                ` : ''}
              </div>
            `
          })
        }
      })
    }

    htmlContent += `
      </body>
      </html>
    `

    // Создаём временный элемент для рендеринга HTML
    const tempDiv = document.createElement('div')
    tempDiv.style.position = 'absolute'
    tempDiv.style.left = '-9999px'
    tempDiv.style.top = '0'
    tempDiv.style.width = '210mm' // A4 width
    tempDiv.style.padding = '20mm'
    tempDiv.style.backgroundColor = '#ffffff'
    tempDiv.style.fontFamily = 'Arial, sans-serif'
    tempDiv.innerHTML = htmlContent
    document.body.appendChild(tempDiv)

    try {
      // Ждём рендеринга
      await new Promise(resolve => setTimeout(resolve, 100))

      // Конвертируем HTML в canvas с поддержкой кириллицы
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: tempDiv.scrollWidth,
        height: tempDiv.scrollHeight,
      })

      // Создаём PDF из canvas
      const imgData = canvas.toDataURL('image/png', 1.0)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      })

      const imgWidth = 210 // A4 width in mm
      const pageHeight = 297 // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight
      let position = 0

      // Добавляем первую страницу
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      // Добавляем дополнительные страницы если нужно
      while (heightLeft > 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      // Удаляем временный элемент
      document.body.removeChild(tempDiv)

      return pdf.output('blob')
    } catch (error) {
      // Удаляем временный элемент в случае ошибки
      if (document.body.contains(tempDiv)) {
        document.body.removeChild(tempDiv)
      }
      throw error
    }
  },

  async exportToWord(project: Project, calculation: Calculation): Promise<Blob> {
    const children: (Paragraph | Table)[] = []

    // Заголовок
    children.push(
      new Paragraph({
        text: 'SWOT Анализ',
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
      })
    )

    children.push(
      new Paragraph({
        text: `Проект: ${project.name}`,
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
      })
    )

    if (project.description) {
      children.push(new Paragraph({ children: [new TextRun({ text: `Описание: ${project.description}` })] }))
    }

    children.push(new Paragraph({ text: '' }))

    children.push(new Paragraph({ text: 'Информация о проекте и расчёте', heading: HeadingLevel.HEADING_2 }))

    const createdAt = new Date(project.createdAt).toLocaleDateString('ru-RU')
    const updatedAt = new Date(calculation.updatedAt).toLocaleDateString('ru-RU')
    const profile = calculation.formulaProfileSnapshot
    const factors = calculation.factors
    const strategies = calculation.strategies

    children.push(new Paragraph({ children: [new TextRun({ text: `Расчёт: ${calculation.name}` })] }))
    children.push(new Paragraph({ children: [new TextRun({ text: `Формула: ${profile.name}` })] }))
    
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Создан: ${createdAt}`,
          }),
        ],
      })
    )

    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Обновлён: ${updatedAt}`,
          }),
        ],
      })
    )

    children.push(new Paragraph({ text: '' }))

    // Статистика
    children.push(
      new Paragraph({
        text: 'Статистика',
        heading: HeadingLevel.HEADING_2,
      })
    )

    children.push(new Paragraph({ children: [new TextRun({ text: `Всего факторов: ${factors.length}` })] }))
    children.push(new Paragraph({ children: [new TextRun({ text: `Стратегий: ${strategies.length}` })] }))

    children.push(new Paragraph({ text: '' }))

    const quadrantTotals = calculationService.calculateQuadrantTotals(factors)
    children.push(new Paragraph({ text: 'Распределение факторов по типам', heading: HeadingLevel.HEADING_2 }))
    const factorTypeCounts = {
      S: factors.filter(f => f.type === 'S').length,
      W: factors.filter(f => f.type === 'W').length,
      O: factors.filter(f => f.type === 'O').length,
      T: factors.filter(f => f.type === 'T').length,
    }
    children.push(new Paragraph({ children: [new TextRun({ text: `S (Сильные стороны): ${factorTypeCounts.S} (${quadrantTotals.S.toFixed(1)})` })] }))
    children.push(new Paragraph({ children: [new TextRun({ text: `W (Слабые стороны): ${factorTypeCounts.W} (${quadrantTotals.W.toFixed(1)})` })] }))
    children.push(new Paragraph({ children: [new TextRun({ text: `O (Возможности): ${factorTypeCounts.O} (${quadrantTotals.O.toFixed(1)})` })] }))
    children.push(new Paragraph({ children: [new TextRun({ text: `T (Угрозы): ${factorTypeCounts.T} (${quadrantTotals.T.toFixed(1)})` })] }))

    children.push(new Paragraph({ text: '' }))

    // Топ факторы
    if (factors.length > 0) {
      const topFactors = calculationService.getTopFactors(factors, 10)
      
      children.push(
        new Paragraph({
          text: 'Топ-10 факторов по оценке',
          heading: HeadingLevel.HEADING_2,
        })
      )

      const factorRows = topFactors.map((factor, index) => {
        return new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({
                text: `${index + 1}`,
                alignment: AlignmentType.CENTER,
              })],
              width: { size: 8, type: WidthType.PERCENTAGE },
            }),
            new TableCell({
              children: [new Paragraph({
                text: factor.type,
                alignment: AlignmentType.CENTER,
              })],
              width: { size: 8, type: WidthType.PERCENTAGE },
            }),
            new TableCell({
              children: [new Paragraph(factor.text)],
              width: { size: 50, type: WidthType.PERCENTAGE },
            }),
            new TableCell({
              children: [new Paragraph(factor.category)],
              width: { size: 24, type: WidthType.PERCENTAGE },
            }),
            new TableCell({
              children: [new Paragraph({
                text: factor.score?.toFixed(1) ?? '-',
                alignment: AlignmentType.CENTER,
              })],
              width: { size: 10, type: WidthType.PERCENTAGE },
            }),
          ],
        })
      })

      // Заголовок таблицы с жирным шрифтом
      const headerRow = new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: 'Ранг', bold: true })],
              alignment: AlignmentType.CENTER,
            })],
            width: { size: 8, type: WidthType.PERCENTAGE },
          }),
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: 'Тип', bold: true })],
              alignment: AlignmentType.CENTER,
            })],
            width: { size: 8, type: WidthType.PERCENTAGE },
          }),
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: 'Текст', bold: true })],
              alignment: AlignmentType.CENTER,
            })],
            width: { size: 50, type: WidthType.PERCENTAGE },
          }),
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: 'Категория', bold: true })],
              alignment: AlignmentType.CENTER,
            })],
            width: { size: 24, type: WidthType.PERCENTAGE },
          }),
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: 'Оценка', bold: true })],
              alignment: AlignmentType.CENTER,
            })],
            width: { size: 10, type: WidthType.PERCENTAGE },
          }),
        ],
      })

      children.push(
        new Table({
          rows: [headerRow, ...factorRows],
          width: {
            size: 100,
            type: WidthType.PERCENTAGE,
          },
        })
      )

      children.push(new Paragraph({ text: '' }))
    }

    // Стратегии
    if (strategies.length > 0) {
      children.push(new Paragraph({ text: 'Сгенерированные стратегии', heading: HeadingLevel.HEADING_2 }))
      const groupedStrategies = {
        SO: strategies.filter(s => s.type === 'SO'),
        WO: strategies.filter(s => s.type === 'WO'),
        ST: strategies.filter(s => s.type === 'ST'),
        WT: strategies.filter(s => s.type === 'WT'),
      }

      Object.entries(groupedStrategies).forEach(([type, strategies]) => {
        if (strategies.length > 0) {
          children.push(
            new Paragraph({
              text: `${type} стратегии (${strategies.length})`,
              heading: HeadingLevel.HEADING_3,
            })
          )

          strategies.forEach(strategy => {
            children.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: strategy.title,
                    bold: true,
                  }),
                ],
              })
            )

            children.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: strategy.description,
                  }),
                ],
              })
            )

            if (strategy.factors.length > 0) {
              children.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: 'Ключевые факторы: ',
                      bold: true,
                    }),
                    new TextRun({
                      text: strategy.factors.map(f => f.text).join(', '),
                    }),
                  ],
                })
              )
            }

            children.push(new Paragraph({ text: '' }))
          })
        }
      })
    }

    const doc = new Document({
      sections: [
        {
          children,
        },
      ],
    })

    return await Packer.toBlob(doc)
  },
}
