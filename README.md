# Cargo Management App

Мобильное приложение для управления карго с функциями сканирования штрих-кодов и учета товаров.

## Архитектура

### Backend (Node.js + TypeScript)
- **API**: Express.js REST API
- **База данных**: PostgreSQL с Prisma ORM
- **Аутентификация**: JWT tokens
- **Валидация**: Joi

### Mobile App (React Native + Expo)
- **Фреймворк**: Expo с TypeScript
- **Навигация**: React Navigation v6
- **Управление состоянием**: TanStack Query (React Query)
- **Сканирование**: expo-barcode-scanner
- **Локальное хранение**: AsyncStorage

## Функции

### Основные возможности:
1. **Управление клиентами** - создание, редактирование, просмотр списка клиентов
2. **Сканирование товаров** - добавление товаров через штрих-код сканер
3. **Учет товаров** с полями:
   - КОД клиента
   - Код товара (через сканер)
   - Дата поступления товара
   - Количество
   - Вес
   - Цена в USD
   - Курс валют
   - Сумма к оплате в тенге
   - Себестоимость
   - Маржа

### Дополнительные функции:
- Аутентификация пользователей
- Поиск клиентов и товаров
- Управление курсами валют
- Автоматический расчет суммы и маржи

## Установка и запуск

### Требования
- Node.js 18+
- PostgreSQL
- Expo CLI
- Android Studio / Xcode (для эмуляторов)

### Backend

```bash
cd backend

# Установить зависимости
npm install

# Настроить базу данных
cp .env.example .env
# Отредактировать .env с вашими настройками

# Создать и применить миграции
npx prisma migrate dev

# Запустить в режиме разработки
npm run dev
```

### Mobile App

```bash
cd mobile-app

# Установить зависимости
npm install

# Запустить Expo
npm start

# Для сборки
npx expo build:android
npx expo build:ios
```

## Деплой

### Backend
Проект настроен для деплоя на любую облачную платформу поддерживающую Node.js:
- Railway
- Heroku
- Vercel
- AWS / Google Cloud

### Mobile App
Используется EAS Build для сборки и публикации:

```bash
# Установить EAS CLI
npm install -g @expo/eas-cli

# Войти в аккаунт
eas login

# Настроить проект
eas build:configure

# Сборка для production
eas build --platform all --profile production

# Публикация в сторы
eas submit --platform all --profile production
```

## CI/CD

Настроен GitHub Actions для:
- Автоматические тесты
- Сборка backend
- Сборка мобильного приложения
- Деплой в production при пуше в main

### Необходимые секреты в GitHub:
- `EXPO_TOKEN` - токен для EAS
- `EXPO_APPLE_ID` - Apple ID для App Store
- `EXPO_ASC_APP_ID` - App Store Connect App ID
- `EXPO_APPLE_TEAM_ID` - Apple Team ID
- `EXPO_ANDROID_SERVICE_ACCOUNT_KEY_PATH` - ключ Google Play

## API Endpoints

### Auth
- `POST /api/auth/login` - Вход
- `POST /api/auth/register` - Регистрация

### Clients
- `GET /api/clients` - Список клиентов
- `POST /api/clients` - Создать клиента
- `GET /api/clients/:id` - Получить клиента
- `PUT /api/clients/:id` - Обновить клиента
- `DELETE /api/clients/:id` - Удалить клиента

### Items
- `GET /api/items` - Список товаров
- `POST /api/items` - Создать товар
- `GET /api/items/:id` - Получить товар
- `PUT /api/items/:id` - Обновить товар
- `DELETE /api/items/:id` - Удалить товар

### Exchange Rates
- `GET /api/exchange-rates` - Курсы валют
- `GET /api/exchange-rates/latest` - Последний курс
- `POST /api/exchange-rates` - Создать/обновить курс

## База данных

### Таблицы:
- `users` - Пользователи
- `clients` - Клиенты
- `items` - Товары
- `exchange_rates` - Курсы валют

См. `database-schema.sql` и `prisma/schema.prisma` для подробной схемы.

## Безопасность

- JWT аутентификация
- Валидация входных данных
- CORS настройки
- Helmet для безопасности заголовков
- Хеширование паролей с bcrypt

## Лицензия

MIT