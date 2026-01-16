# SWOT Analyzer

Desktop приложение для проведения SWOT-анализа, построенное на React + Electron.

## Технологический стек

- **React 18** - UI библиотека
- **TypeScript** - типизация
- **Zustand** - управление состоянием
- **Vite** - сборщик
- **Electron** - десктопная платформа
- **Recharts** - графики и визуализация
- **@tanstack/react-virtual** - виртуализация списков
- **Zod** - валидация данных

## Структура проекта

```
swotReact/
├── src/
│   ├── components/          # React компоненты
│   │   ├── stages/          # Компоненты этапов (0-5)
│   │   └── widgets/         # Переиспользуемые виджеты
│   ├── services/            # Бизнес-логика
│   ├── store/               # Zustand stores
│   ├── types/               # TypeScript типы
│   ├── utils/               # Утилиты
│   ├── hooks/               # React hooks
│   └── contexts/            # React contexts
├── electron/                # Electron main процесс
├── public/                  # Статические файлы
└── resources/               # Ресурсы (иконки, стили)
```

## Установка

```bash
npm install
```

## Разработка

Запуск в режиме разработки:
```bash
npm run electron:dev
```

Это запустит Vite dev server и Electron одновременно.

## Сборка

Сборка для Windows (MSIX):
```bash
npm run electron:build:win
```

Сборка для Linux:
```bash
npm run electron:build:linux
```

## Хранение данных

Проекты сохраняются в:
- **Windows**: `%USERPROFILE%\SWOTProjects\`
- **Linux/Mac**: `~/SWOTProjects/`

Каждый проект = один JSON файл с именем `{project_id}.json`
