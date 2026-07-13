# Отложено: «Баланс окружения» (+ «Баланс круга»)

Отложено 2026-07-13 по решению David: сейчас полируем существующее, эту большую
тему воскресим позже. Здесь лежат наработки целиком — фронтовые проводки вырезаны
из приложения, но НЕ выброшены (бэкенд и данные не тронуты).

## Что здесь
- `env_balance_live.jsx` — весь модуль: подробный экран (`BosEnvBalanceFullLive`),
  компактный блок на «И» (`BosEnvBalanceLive`), переключатель двух балансов
  (`BosBalanceTabsLive`), виджет главной (`EnvPulseWidgetLive`), круговой баланс
  (`BosCircleBalanceLive`) + все хелперы `bosEnv*`.
- `_devsun.html` — dev-харнесс «светила» (круг у огня).

## Что осталось В ПРИЛОЖЕНИИ нетронутым (бэкенд/данные — можно воскрешать без миграций)
- `cloud.js`: `savePulse`, `envPulse` (RPC `bos_env_pulse`), поле `circle_balance_on`
  в `loadTeams/teamById/createTeam/updateTeam` — живые, просто не вызываются из UI.
- Supabase: `supabase/patch_day_pulse.sql`, `patch_day_pulse_fix.sql` (таблица
  `day_pulse` + агрегат `bos_env_pulse`) — УЖЕ прогнаны в БД, оставлены на месте.
- `screens/live/community_live.jsx`: локальный хелпер `_pulseFor` и state `circleBalOn`
  (безвредны; `_pulseFor` ещё используется орбитой «Люди»).
- `screens/live/habits_extra_live.jsx`: переменная `circleBalanceOn` (всегда `true`,
  тумблер убран) — по-прежнему протянута в сохранение цели.

## Как воскресить (обратные шаги к вырезанию)
1. Вернуть файл: `git mv _parked/env-balance/env_balance_live.jsx screens/live/`
   (и заново собрать `build/screens/live/env_balance_live.js`).
2. `index.html` и `sw.js`: вернуть строку
   `build/screens/live/env_balance_live.js?v=vNNN`.
3. `app.jsx`: вернуть маршрут `"env-balance": () => BosEnvBalanceFullLive`.
4. `screens/live/profile_live.jsx` (вкладка «И»): вернуть блок `BosBalanceTabsLive`
   вместо прямого `BosBalanceWheelLive` (переключатель Жизнь ↔ Окружение).
5. `screens/live/shared_live.jsx` (`BOS_HOME_WIDGETS`): вернуть пункт
   `{ id: "env", t: "Баланс окружения", ... }`.
6. `screens/live/home_live.jsx`: вернуть ветку `if (id === "env") { … }`.
7. `screens/live/community_live.jsx`: вернуть секцию `key: "circle"` («Баланс круга»).
8. `screens/live/habits_extra_live.jsx`: вернуть тумблер-`Switch` «Баланс круга».

Точные удалённые фрагменты см. в git-истории коммита, где всё это вырезано.
