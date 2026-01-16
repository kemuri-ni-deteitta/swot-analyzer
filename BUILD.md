# Сборка приложения в .exe файл

## Быстрая сборка для Windows

```bash
npm run electron:build:win
```

Эта команда:
1. Скомпилирует TypeScript
2. Соберёт React приложение через Vite
3. Создаст установщик Windows (.exe) через electron-builder

## Результат сборки

После сборки файлы будут в папке `dist-electron/`:

- **MSIX** (современный формат Windows): `SWOT Analyzer Setup x.x.x.msix`
- **NSIS** (классический установщик): `SWOT Analyzer Setup x.x.x.exe`

## Что включено в сборку

- ✅ Весь React код (скомпилированный)
- ✅ Electron runtime
- ✅ Все зависимости (node_modules)
- ✅ Electron main процесс и preload скрипты

## Требования для сборки

### На Windows:
- Просто запустите `npm run electron:build:win`

### На Linux (кроссплатформенная сборка):
Для сборки Windows .exe на Linux нужны дополнительные инструменты:

```bash
# Установка wine (для сборки Windows приложений)
sudo apt-get install wine

# Или используйте Docker с Windows образом
```

**Рекомендация**: Если вы на Linux, но нужен .exe, лучше собрать на Windows машине или использовать CI/CD (GitHub Actions, например).

## Сборка для Linux

```bash
npm run electron:build:linux
```

Создаст:
- **AppImage**: `SWOT Analyzer-x.x.x.AppImage` (портативный формат)
- **DEB**: `swot-analyzer_x.x.x_amd64.deb` (установщик для Debian/Ubuntu)

## Настройка иконки

Для Windows нужна иконка в формате `.ico`:
- Путь: `resources/icon.ico`
- Размеры: 256x256, 128x128, 64x64, 48x48, 32x32, 16x16

Для Linux нужна иконка в формате `.png`:
- Путь: `resources/icon.png`
- Размер: 512x512 или 256x256

**Совет**: Можно использовать онлайн конвертеры для создания .ico из .png

## Размер итогового файла

Ожидаемый размер:
- **MSIX**: ~100-150 MB
- **NSIS .exe**: ~100-150 MB
- **AppImage**: ~100-150 MB

Это нормально для Electron приложений - они включают в себя Chromium и Node.js.

## Распространение

### MSIX (рекомендуется для Windows 10/11):
- Современный формат установки
- Автоматические обновления
- Изоляция приложения
- Требует подписи для публикации в Microsoft Store

### NSIS .exe (классический установщик):
- Работает на всех версиях Windows
- Можно распространять без подписи
- Пользователь может установить в любую папку

## Автоматическая сборка (CI/CD)

Пример для GitHub Actions:

```yaml
name: Build Windows

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm install
      - run: npm run electron:build:win
      - uses: actions/upload-artifact@v3
        with:
          name: windows-installer
          path: dist-electron/*.exe
```

## Проверка сборки

После сборки можно протестировать:

1. **На Windows**: Запустите .exe файл и установите приложение
2. **На Linux**: Запустите AppImage напрямую (chmod +x и ./SWOT\ Analyzer-*.AppImage)

## Устранение проблем

### Ошибка "icon not found"
- Создайте файл `resources/icon.ico` (для Windows)
- Или временно уберите строку `"icon": "resources/icon.ico"` из package.json

### Большой размер файла
- Это нормально для Electron приложений
- Можно использовать `electron-builder` с настройками для уменьшения размера (но это сложнее)

### Ошибки при сборке
- Убедитесь, что `npm run build` проходит успешно
- Проверьте, что все зависимости установлены (`npm install`)
