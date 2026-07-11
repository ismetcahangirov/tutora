import { useTranslation } from 'react-i18next';
import { APP_NAME } from '@shared/constants';
import { LanguageSwitcher } from '@shared/i18n';
import './App.css';

function App() {
  const { t } = useTranslation();

  return (
    <main className="app">
      <header className="app__bar">
        <h1>{APP_NAME}</h1>
        <LanguageSwitcher />
      </header>
      <section className="app__content">
        <h2>{t('dashboard.title')}</h2>
        <p>{t('dashboard.subtitle')}</p>
      </section>
    </main>
  );
}

export default App;
