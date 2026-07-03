/* HOME CUSTOMIZE — LIVE-only fork of HomeCustomizeScreen (real Telegram user,
   app.mode === "live" is ALWAYS true here).
   v529: страница = та же ЕДИНАЯ галерея главного экрана, что и шторка «+» на доске
   (HomeGalleryContentLive в shared_live): виджеты + привычки + цели + совместные,
   одна логика вкл/выкл (order/hidden в app.homeLayout), никакого дрейфа.
   The ONLY new top-level declaration in this file is `function HomeCustomizeLive`. */
function HomeCustomizeLive() {
  const { navigate } = useNav();
  const app = useApp();
  const isDark = app?.themeOverride === "dark";
  return (
    <div className="page-in" style={{ padding: "0 16px 24px" }}>
      <PageHeader title="Главный экран" onBack={() => navigate("settings")} />
      <div className="bos-sys-text-3" style={{ fontSize: 13, marginBottom: 6, lineHeight: 1.5, padding: "0 2px" }}>
        Что показывать на главной. А ещё — зажми что угодно прямо на главной: всё можно перетащить, убрать или добавить.
      </div>
      {typeof HomeGalleryContentLive === "function" && <HomeGalleryContentLive dark={isDark} />}
    </div>
  );
}
