/* АРХИВ. Вкладка «Цели» из CardStyleMenuLive (screens/live/shared_live.jsx).
   Формы баннер/квадрат + тумблеры «Орбиты вокруг цели» / «Прогресс» / «Название». */

          <>
            <div style={{ display: "flex", gap: 7 }}>{formBtn("banner", BN, gs.form, (k) => setG({ form: k }))}{formBtn("square", SQ, gs.form, (k) => setG({ form: k }))}</div>
            {divider}
            <div style={{ marginTop: 0 }}>
              {toggleRow("Орбиты вокруг цели", gs.orbits, (v) => setG({ orbits: v }))}
              {toggleRow("Прогресс", gs.progress, (v) => setG({ progress: v }))}
              {toggleRow("Название", gs.name, (v) => setG({ name: v }))}
            </div>
            <div style={{ fontSize: 11.5, color: "rgba(10,10,10,0.42)", lineHeight: 1.4, padding: "4px 2px 0" }}>Орбиты показывают привычки и людей вокруг цели — превью, вокруг чего она.</div>
          </>
        )}
