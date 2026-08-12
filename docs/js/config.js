/* =========================================================================
   НАСТРОЙКИ
   ========================================================================= */

const CONFIG = {
  RELEASE_URL: 'https://band.link/ayazkuk',
  SITE_URL: 'https://ultramilausha.tatar/ayaz',

  ARTIST: 'ultramilausha',
  SINGLE: 'Күк һәрвакыт аяз',

  // Язык подписей. Позже сюда встанет переключатель языков.
  LANG: 'ru',

  // Сколько слов ловит игрок за сеанс — столько же строк в стихотворении.
  // Название партии в строки не входит, оно становится заголовком.
  // При 4 первая и вторая строки рифмуются между собой, третья и четвёртая — между собой.
  CATCHES: 4,

  // Скорость падения слов (пикселей в секунду, от и до)
  WORD_SPEED_MIN: 22,
  WORD_SPEED_MAX: 52,

  // Скорость парашютиста
  HERO_SPEED: 190
};

/* Подписи — по языкам. Картинка для сториз и тексты, которыми делятся. */
const STRINGS = {
  ru: {
    posterTop: [
      'Это стихотворение было написано тут:',
      'ultramilausha.tatar/ayaz'
    ],
    posterBottom: [
      'По мотивам песни ultramilausha',
      '— Күк һәрвакыт аяз',
      'Слушать: band.link/ayazkuk'
    ]
  },
  tt: {
    posterTop: [
      'Бу шигырьне мин биредә яздым:',
      'ultramilausha.tatar/ayaz'
    ],
    posterBottom: [
      'ultramilausha — Күк һәрвакыт аяз',
      'җырына кушылып',
      'Тыңларга: band.link/ayazkuk'
    ]
  }
};

function L(key) {
  return (STRINGS[CONFIG.LANG] || STRINGS.ru)[key];
}

/* Партии */
const PARTIES = [
  { id: 'night',  title: 'Ак күзле төн карый', scene: 'night',  hint: 'ночная' },
  { id: 'meadow', title: 'Болыннар гүзәл',     scene: 'meadow', hint: 'Карадуган' },
  { id: 'red',    title: 'Кызар',              scene: 'red',    hint: 'злая' },
  { id: 'sea',    title: 'Диңгез',             scene: 'sea',    hint: 'под водой' },
  { id: 'gold',   title: 'Алтын кояш нурлары', scene: 'gold',   hint: 'золотая' }
];
