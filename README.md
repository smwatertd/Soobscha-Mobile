# Сообща

Мобильное приложение для координации социальной и материальной помощи: волонтёры, благополучатели, заявки, карта, верификация.

## Структура репозитория

| Путь | Описание |
|------|----------|
| `src/` | Expo / React Native приложение |
| `openapi.json` | OpenAPI-спецификация бэкенда |

## Запуск приложения

```bash
cd src
cp .env.example .env
# укажите EXPO_PUBLIC_API_URL и EXPO_PUBLIC_YANDEX_MAPS_API_KEY
npm install
npm start
```

Сборка на устройство: `npm run android` / `npm run ios`.

## Тесты

```bash
cd src
npm run test:run
```

## Переменные окружения

См. `src/.env.example`. Файл `.env` в git не попадает.
