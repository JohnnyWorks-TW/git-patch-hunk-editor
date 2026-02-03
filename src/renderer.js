import { createApp } from 'vue';
import App from './App.vue';
import { createI18n } from 'vue-i18n';
import en from './locales/en';
import zh from './locales/zh-TW';

const messages = {
  en,
  zh
}

const i18n = createI18n({
  locale: 'zh',
  fallbackLocale: 'en',
  messages,
})

const app = createApp(App)
app.use(i18n)
app.mount('#app')