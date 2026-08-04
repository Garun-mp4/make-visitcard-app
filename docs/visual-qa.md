# Visual QA

Сравнение выполнено с экспортами Pencil из `App-design.pen`: owner mobile light/dark, public Clean/Dark/Editorial, desktop editor/statistics/publication и 320/390 layouts. Использованы фреймы `YeGWe`, `P3AIBl`, `PvMSS`, `HTyZH`, `icPNw`, `vfruX`, `H0OUoH`, `CXPCc`, `X32jVy`, `O7EmVA`, `r2BFe`, `SRwCp`, `zHLZq`, `IlSFS`.

Проверяемые маршруты: `/app/card`, `/app/editor/basic`, `/app/stats`, `/app/profile`, `/app/editor/publish`, `/c/alexey`.

Реализация перенесла Geist/Inter, 4–48 spacing scale, 8–24 radii, зелёный accent, semantic dark palette, 72 px bottom navigation, safe-area offsets, desktop three-column editor и три отличающиеся композиции public theme. Исправлены активные состояния навигации, вертикальная читаемость графика и ширина desktop labels.

Минимальные отличия: системные шрифты могут иметь иной rasterization по ОС; QR и введённые данные динамические; Telegram safe-area зависит от клиента. Pixel-perfect статус не заявляется. Финальные app screenshots сохраняются в `artifacts/visual-qa/` при Playwright-прогоне.
