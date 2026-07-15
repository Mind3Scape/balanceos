# Отложено: ДЕТАЛЬ ПРИВЫЧКИ v624/v660 (единый блок + календарь-пилюля + трио Серия/Лучшая/Всего)

Отложено 2026-07-16: деталь привычки переписана на СТАНДАРТ «лесенка» (макет Л,
`_devgoal3.html`): одно тело `BosHabitStandardBodyLive` на три ступени — личная,
с друзьями, в круге (`screens/live/habit_standard_live.jsx`). Решение David:
«реализуй И К Л М полностью, как по дизайну; всё старое зархивируй условно».

## Что здесь
- `habit_detail_v660.jsx` — прежний `HabitDetailLive` целиком (extra_live.jsx 65–285 на v764):
  SkyThreadLive-нить сверху, единый блок с PeopleMonthCalendarLive (`defaultView="year"`,
  tap-по-сегодня = отметка), StatTrioLive Серия/Лучшая/Всего, тонировка cardTint.

## Что осталось В ПРИЛОЖЕНИИ
- Все данные и механика: bosStreak/лучшая/всего теперь ЧИПАМИ в той же шапке;
  отметка — тем же живым HabitCheck/HabitCountCheck/HabitTimerCheck, теперь в шапке;
  BACKFILL общего лога (setSharedLogBulk) перенесён как был.
- `PeopleMonthCalendarLive`, `SkyThreadLive`, `StatTrioLive` живы — их используют другие
  экраны (цель, круги-архив, «Я»). Ничего не удалено.
- Тонировка cardTint на детали временно не применяется (стандарт — матовая карточка);
  сам тумблер и bosGoalSkin не тронуты.

## Как воскресить (5 минут)
Вернуть тело `habit_detail_v660.jsx` вместо нынешнего `HabitDetailLive` в
`screens/live/extra_live.jsx`, пересобрать `node scripts/build.js`, поднять версию.
