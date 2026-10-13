# JixozMed — Android-приложение для планшета

Демонстрационное Android-приложение для планшетов, повторяющее веб-систему [JixozMed](https://github.com/jahongirdv/jixozmed-react) — учёт медицинского оборудования.

Создано как **демо-прототип**, чтобы показать руководству, как платформа выглядит на планшете.

![Превью приложения](./screenshots/demo.gif)

---

## 🎯 Назначение

Это **демонстрационный прототип**, а не продакшн-приложение. Его цель — показать, как веб-версия JixozMed переносится на планшетный интерфейс, для презентации руководству.

## ✨ Возможности (демо)

- 📋 Список оборудования
- 🔍 Поиск и фильтрация
- 📄 Экран детальной информации об оборудовании
- 📊 Базовая панель управления
- 🌙 Поддержка тёмной темы

## 🛠 Стек технологий

- **Язык:** Kotlin
- **UI:** Jetpack Compose / XML *(замени на то, что используешь)*
- **Архитектура:** MVVM
- **Сборка:** Gradle (Kotlin DSL)
- **Min SDK:** 24
- **Target SDK:** 34

## 📱 Скриншоты
<p align="center">
  <img src="./screenshots/1.jpg" width="40%" />
  <img src="./screenshots/2.jpg" width="40%" />
</p>

<p align="center">
  <img src="./screenshots/3.jpg" width="40%" />
  <img src="./screenshots/4.jpg" width="40%" />
</p>

<p align="center">
  <img src="./screenshots/5.jpg" width="40%" />
  <img src="./screenshots/6.jpg" width="40%" />
</p>

<p align="center">
  <img src="./screenshots/7.jpg" width="40%" />
</p>

## 🚀 Сборка и запуск

### Требования
- Android Studio (Ladybug или новее)
- JDK 17
- Android SDK 34
- Эмулятор планшета или реальный планшет

### Клонирование и сборка
```bash
git clone https://github.com/jahongirdv/ИМЯ_РЕПО.git
cd ИМЯ_РЕПО
./gradlew assembleDebug
