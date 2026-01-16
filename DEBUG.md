# Отладка создания проектов

## Проверка работы Electron API

### 1. Откройте DevTools в Electron
- Нажмите `Ctrl+Shift+I` или `F12` в окне Electron
- Перейдите на вкладку Console

### 2. Проверьте доступность API

В консоли браузера (DevTools) выполните:

```javascript
// Проверка доступности API
console.log('electronAPI available:', typeof window.electronAPI !== 'undefined')

// Если доступен, проверьте методы
if (window.electronAPI) {
  console.log('Methods:', Object.keys(window.electronAPI))
  
  // Попробуйте создать тестовый проект
  const testProject = {
    id: 'test-' + Date.now(),
    name: 'Test Project',
    factors: [],
    strategies: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    schemaVersion: '1.0.0',
    appVersion: '1.0.0'
  }
  
  window.electronAPI.saveProject(testProject).then(result => {
    console.log('Save result:', result)
  }).catch(err => {
    console.error('Save error:', err)
  })
}
```

### 3. Проверьте логи в терминале

При запуске `npm run electron:dev` должны быть видны логи:
- `[preload] fileService loaded successfully`
- `[preload] Exposing electronAPI to renderer...`
- При создании проекта: `[preload] Saving project: ...`

### 4. Проверьте создание директории

Проекты должны сохраняться в:
- Linux/Mac: `~/SWOTProjects/`
- Windows: `%USERPROFILE%\SWOTProjects\`

Проверьте, создалась ли директория:
```bash
ls -la ~/SWOTProjects/
```

### 5. Типичные проблемы

#### Проблема: `window.electronAPI is undefined`

**Причина**: preload.js не загружается или contextBridge не работает

**Решение**:
1. Проверьте путь к preload.js в main.js
2. Убедитесь, что `contextIsolation: true` в webPreferences
3. Перезапустите Electron

#### Проблема: Ошибка при сохранении файла

**Причина**: Нет прав на запись в домашнюю директорию

**Решение**:
```bash
# Проверьте права
ls -ld ~/SWOTProjects/

# Создайте директорию вручную
mkdir -p ~/SWOTProjects/
chmod 755 ~/SWOTProjects/
```

#### Проблема: fileService не загружается

**Причина**: Неправильный путь к fileService.js

**Решение**: Убедитесь, что fileService.js находится в `electron/fileService.js`

### 6. Тестирование вручную

Создайте тестовый файл проекта вручную:

```bash
mkdir -p ~/SWOTProjects/
cat > ~/SWOTProjects/test-project.json << 'EOF'
{
  "id": "test-123",
  "name": "Test Project",
  "factors": [],
  "strategies": [],
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "schemaVersion": "1.0.0",
  "appVersion": "1.0.0"
}
EOF
```

Затем перезапустите приложение и проверьте, виден ли проект в списке.
