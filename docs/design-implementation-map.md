# Cardly design implementation map

Source of truth: `App-design.pen`, inspected through Pencil MCP on 2026-08-04.

## Design system

- Typography: Geist for headings and prominent numbers, Inter for body and controls.
- Type scale: 40, 28, 20, 17, 16, 14, 12 and 11 px.
- Spacing scale: 4, 8, 12, 16, 20, 24, 32, 40 and 48 px.
- Radius scale: 8, 12, 16, 20, 24 and pill.
- Icon scale: 16, 18, 20, 24 and 32 px, implemented with Lucide.
- Light palette: warm off-white canvas, white surfaces, quiet green accent, low-contrast borders.
- Dark palette: green-charcoal canvas and surfaces, desaturated mint accent, border-led elevation.
- Editorial palette: warm paper, brown-black typography, rust CTA and serif display accents.
- Responsive rules: 16 px gutters at 320, 20 px at 390, split rail at 768, sidebar/form/sticky preview at 1440.
- Bottom navigation: 72 px plus safe-area inset; owner content receives matching bottom padding.
- Accessibility: 44 px targets, 2 px focus ring, icon plus text errors, focus-trapped dialogs, reduced-motion fallback.

## Route and frame mapping

| Pencil frame(s)                                                                                | Route                     | React page/layout                                   | Main components                                                             | Responsive behavior and states                                                                                               |
| ---------------------------------------------------------------------------------------------- | ------------------------- | --------------------------------------------------- | --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Launch / Splash, Connecting Telegram, Authorization Error, Open in Telegram, Offline, Retrying | `/` and owner route guard | `LaunchPage`, `OwnerRoute`                          | `SystemState`, `TelegramOpenButton`, `RetryAction`                          | Full-height safe-area screen; browser owner-block outside Telegram; demo bypass only in development                          |
| Onboarding / 01 Welcome through 06 Publish, Success                                            | `/app/onboarding`         | `OnboardingPage`                                    | `StepProgress`, step forms, `ThemePicker`, `SlugField`, `CardPreview`       | One step per mobile screen; desktop centered shell; draft recovery, validation, saving/error/success                         |
| Owner / Card / Published, Draft, Unpublished Changes                                           | `/app/card`               | `OwnerHomePage`, `OwnerLayout`                      | `OwnerCardPreview`, status badge, copy field, owner actions, recent summary | Bottom navigation on mobile; desktop navigation/sidebar; draft, published, unpublished changes, offline                      |
| Editor / Sections                                                                              | `/app/editor`             | `EditorIndexPage`                                   | `EditorSectionList`                                                         | Route list on mobile; becomes editor rail on tablet/desktop                                                                  |
| Editor / Basic                                                                                 | `/app/editor/basic`       | `BasicEditorPage`, `EditorLayout`                   | avatar uploader, text/select fields, live preview                           | Dedicated route on mobile; rail + form + sticky 390 px preview on desktop                                                    |
| Editor / Contacts                                                                              | `/app/editor/contacts`    | `ContactsEditorPage`                                | primary CTA editor, public links, visibility controls                       | Reorder buttons instead of drag-and-drop; max 10 links                                                                       |
| Editor / Skills                                                                                | `/app/editor/skills`      | `SkillsEditorPage`                                  | tag input, reorderable rows                                                 | Max 10, dedupe and whitespace normalization                                                                                  |
| Editor / Services                                                                              | `/app/editor/services`    | `ServicesEditorPage`                                | service list/editor, enable and reorder controls                            | Max 6; empty and destructive confirmation states                                                                             |
| Editor / Projects                                                                              | `/app/editor/projects`    | `ProjectsEditorPage`                                | cover uploader, project editor, project cards                               | Max 6; stable 16:10 previews; upload progress/error                                                                          |
| Editor / Appearance                                                                            | `/app/editor/appearance`  | `AppearanceEditorPage`                              | theme cards, accent choices, section visibility                             | Clean/Dark/Editorial previews; theme changes update live preview                                                             |
| Editor / Publication                                                                           | `/app/editor/publish`     | `PublicationPage`                                   | slug field, copy fields, QR, share/download/unpublish                       | checking/available/unavailable, published, unpublished changes, publication errors                                           |
| Statistics / Overview                                                                          | `/app/stats`              | `StatsPage`                                         | period segmented control, metrics, labelled bar chart, popular actions      | 7/30/all-time data; reduced X labels on mobile, full daily labels on tablet/desktop                                          |
| Statistics / Leads                                                                             | `/app/stats?tab=leads`    | `StatsPage`                                         | lead cards and status controls                                              | Empty/loading/error/list states; owner-only data                                                                             |
| Profile / Light, Profile / Dark                                                                | `/app/profile`            | `ProfilePage`                                       | verified Telegram profile, language, notification settings, sign out        | Theme-aware; platform and private Telegram ID visible only to owner                                                          |
| Public / Clean variants                                                                        | `/c/:slug`                | `PublicCardPage`, `CleanCardTheme`                  | public header, hero, services, projects, contacts, lead form                | Calm centered mobile card; spacious asymmetric desktop portfolio; hidden sections collapse                                   |
| Public / Dark variants                                                                         | `/c/:slug`                | `PublicCardPage`, `DarkCardTheme`                   | monospaced labels, dark hero, work grid, CTA                                | Black-green technical composition with sand CTA; separate mobile and desktop layouts                                         |
| Public / Editorial variants                                                                    | `/c/:slug`                | `PublicCardPage`, `EditorialCardTheme`              | journal masthead, serif hero, numbered services, editorial projects         | Warm paper composition, serif display, rust CTA; asymmetric desktop grid                                                     |
| Public Project Open variants                                                                   | `/c/:slug` project state  | `ProjectDialog`                                     | cover, metadata, URL action                                                 | Bottom sheet on mobile, accessible dialog on desktop, Escape/focus return                                                    |
| Public Lead Form variants                                                                      | `/c/:slug` lead state     | `LeadForm`                                          | name, contact, message, honeypot                                            | Explicit send, offline/rate-limit/error/success, no data loss on failure                                                     |
| Desktop / Editor, Statistics, Publication, Owner Home                                          | matching owner routes     | responsive owner layouts                            | desktop sidebar, section rail, form, sticky preview                         | 1440 reference; max-width content; no heavy CRM styling                                                                      |
| Tablet / Public, Editor, Statistics, Publication                                               | matching routes           | responsive layouts                                  | tablet rail and content                                                     | 768 reference; public max 680 px; no tiny live preview                                                                       |
| System states section                                                                          | route/component states    | `SystemState`, `Toast`, `ConfirmDialog`, `Skeleton` | shared feedback components                                                  | loading, skeleton, empty, network/server/auth errors, unpublished/private/404, save/upload/publish errors, retry, rate limit |

## Assets

- Telegram avatar with initials/photo fallback.
- Four 16:10 project covers with stable aspect ratio and focal point support.
- Generated QR code with quiet zone.
- Optional 1200x630 social preview is documented but not required for runtime UI.

## Prototype flows

1. Splash -> Telegram auth -> onboarding 1-6 -> publish -> success.
2. Owner card -> editor -> basic -> autosave -> preview.
3. Publication -> slug -> QR -> share.
4. Public card -> project -> mobile sheet/desktop dialog.
5. Public card -> lead validation -> success.
6. Statistics -> leads -> lead details/status.
7. Profile -> language -> confirmation.
8. Network/server error -> retry -> restored state.
