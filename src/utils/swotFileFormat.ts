/**
 * Формат файла SWOT проекта
 * 
 * Структура файла:
 * - Заголовок (сигнатура + версия)
 * - JSON данные проекта
 * 
 * Сигнатура: "SWOT" (4 байта)
 * Версия формата: 1 (для будущих расширений)
 */

export interface SWOTFileHeader {
  signature: string  // "SWOT"
  formatVersion: number  // Версия формата файла
  appVersion: string  // Версия приложения
}

export interface SWOTFile {
  header: SWOTFileHeader
  project: any  // Project данные
}

const FILE_SIGNATURE = 'SWOT'
const FORMAT_VERSION = 1

/**
 * Создаёт содержимое файла .swot из проекта
 */
export function serializeProject(project: any, appVersion: string): string {
  const file: SWOTFile = {
    header: {
      signature: FILE_SIGNATURE,
      formatVersion: FORMAT_VERSION,
      appVersion: appVersion,
    },
    project: project,
  }
  
  return JSON.stringify(file, null, 2)
}

/**
 * Парсит содержимое файла .swot и возвращает проект
 */
export function deserializeProject(content: string): { project: any; isValid: boolean; error?: string } {
  try {
    const file: SWOTFile = JSON.parse(content)
    
    // Проверка сигнатуры
    if (!file.header || file.header.signature !== FILE_SIGNATURE) {
      return {
        project: null,
        isValid: false,
        error: 'Неверный формат файла: отсутствует сигнатура SWOT',
      }
    }
    
    // Проверка версии формата
    if (file.header.formatVersion > FORMAT_VERSION) {
      return {
        project: null,
        isValid: false,
        error: `Файл создан в более новой версии приложения (формат ${file.header.formatVersion}, поддерживается ${FORMAT_VERSION})`,
      }
    }
    
    // Миграция формата (если нужно)
    if (file.header.formatVersion < FORMAT_VERSION) {
      console.log(`Migrating file format from ${file.header.formatVersion} to ${FORMAT_VERSION}`)
      // Здесь можно добавить логику миграции
    }
    
    return {
      project: file.project,
      isValid: true,
    }
  } catch (error) {
    return {
      project: null,
      isValid: false,
      error: `Ошибка парсинга файла: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`,
    }
  }
}

/**
 * Проверяет, является ли файл валидным .swot файлом
 */
export function isValidSWOTFile(content: string): boolean {
  try {
    const file = JSON.parse(content)
    return file.header?.signature === FILE_SIGNATURE
  } catch {
    return false
  }
}
