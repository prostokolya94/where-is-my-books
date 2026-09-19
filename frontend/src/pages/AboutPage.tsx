import { useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { authStore } from '../stores/authStore';
import Reveal from '../components/Reveal';

const FEATURES = [
  {
    icon: '📚',
    title: 'Книжный каталог',
    text: 'Ведите полный список книг: автор, год покупки и чтения, статус — прочитана, куплена или в списке желаемого.',
  },
  {
    icon: '☰',
    title: 'Категории и жанры',
    text: 'Двухуровневая структура справочника с перетаскиванием. Жанр — подраздел категории, порядок легко менять.',
  },
  {
    icon: '▤',
    title: 'Вкладки-фильтры',
    text: 'Создавайте «табы» с готовыми выборками: например, «Куплено в 2024» или «Любимые серии» — всё в один клик.',
  },
  {
    icon: '▦',
    title: 'План покупок',
    text: 'Планируйте покупки по годам, привязывайте позиции к книгам каталога.',
  },
  {
    icon: '▧',
    title: 'Мониторинг непрочитанного',
    text: 'Графики динамики нечитаного, цели по жанрам и разбивка по годам выхода — чтобы ничего не потерялось.',
  },
  {
    icon: '₽',
    title: 'Стоимость библиотеки',
    text: 'Считайте итоговые затраты: по годам покупки, по статусам и по произвольным «счётам» с фильтрами.',
  },
  {
    icon: '▥',
    title: 'Статистика',
    text: 'Наглядные сводки по категориям, жанрам и статусам — каталог всегда под контролем.',
  },
  {
    icon: '🗄',
    title: 'Версии базы',
    text: 'Личные снимки своих данных с восстановлением в один клик. Все версии хранятся у вас, в вашем аккаунте.',
  },
];

const STEPS = [
  {
    num: '01',
    title: 'Создайте аккаунт',
    text: 'Логин, пароль и имя — занимает меньше минуты. Ваша библиотека полностью изолирована.',
  },
  {
    num: '02',
    title: 'Заполните каталог',
    text: 'Добавьте книги, создайте категории и жанры, расставьте статусы.',
  },
  {
    num: '03',
    title: 'Стройте аналитику',
    text: 'Откройте планы, мониторинги и стоимость — сервис всё посчитает сам.',
  },
];

const AboutPage = observer(() => {
  const navigate = useNavigate();
  const isAuth = authStore.isAuthenticated;

  return (
    <div className="about-page">
      <section className="about-hero">
        <Reveal className="about-hero-card">
          <div className="about-hero-icon animate-in">📚</div>
          <h1
            className="about-hero-title animate-in"
            style={{ animationDelay: '120ms' }}
          >
            <span className="about-hero-title-accent">Where Is My Books</span>
          </h1>
          <p
            className="about-hero-subtitle animate-in"
            style={{ animationDelay: '240ms' }}
          >
            Личный каталог книг: коллекция, планы покупок и аналитика — в одном месте.
            Храните всё у себя, а не разбросанным по заметкам.
          </p>
          <div className="about-cta animate-in" style={{ animationDelay: '360ms' }}>
            {isAuth ? (
              <button className="btn btn-primary btn-lg" onClick={() => navigate('/')}>
                К библиотеке →
              </button>
            ) : (
              <>
                <button className="btn btn-primary btn-lg" onClick={() => navigate('/login')}>
                  Войти
                </button>
                <button className="btn btn-outline btn-lg" onClick={() => navigate('/register')}>
                  Создать аккаунт
                </button>
              </>
            )}
          </div>
        </Reveal>
      </section>

      <section className="about-section">
        <Reveal className="about-section-head">
          <h2 className="about-h2">Что умеет приложение</h2>
          <p className="about-lead">
            Всё про книги: от простого каталога до планов покупок и аналитики чтения.
          </p>
        </Reveal>
        <div className="about-features">
          {FEATURES.map((feature, i) => (
            <Reveal key={feature.title} delay={(i % 4) * 80}>
              <div className="about-feature-card">
                <div className="about-feature-icon">{feature.icon}</div>
                <h3 className="about-feature-title">{feature.title}</h3>
                <p className="about-feature-text">{feature.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="about-section">
        <Reveal className="about-section-head">
          <h2 className="about-h2">Как начать</h2>
        </Reveal>
        <div className="about-steps">
          {STEPS.map((step, i) => (
            <Reveal key={step.num} delay={i * 120}>
              <div className="about-step">
                <div className="about-step-num">{step.num}</div>
                <h3 className="about-step-title">{step.title}</h3>
                <p className="about-step-text">{step.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="about-section">
        <Reveal className="about-final">
          <p className="about-final-text">
            Где мои книги? Теперь — всегда под рукой.
          </p>
          {isAuth ? (
            <button className="btn btn-primary" onClick={() => navigate('/')}>
              Открыть мою библиотеку
            </button>
          ) : (
            <button className="btn btn-primary" onClick={() => navigate('/register')}>
              Создать аккаунт и начать
            </button>
          )}
        </Reveal>
      </section>

      <footer className="about-footer">
        Where Is My Books · v1.0 · личный сервис для тех, кто любит книги
      </footer>
    </div>
  );
});

export default AboutPage;