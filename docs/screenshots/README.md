# Screenshots

🇬🇧 **English** | [🇷🇺 Русский](README.ru.md)

Files referenced from `README.md` / `README.ru.md`. Keep the file names — the
READMEs link them directly.

## Current inventory

| File                   | Content                                                 |
| ---------------------- | ------------------------------------------------------- |
| `todo-flow.gif`        | CRUD + filters + sign-out in one recording              |
| `reorder.gif`          | drag-and-drop reordering (mouse)                        |
| `locale-switch.gif`    | EN → RU → EN language switch                            |
| `desktop/todo.png`     | todo list: one created todo, two done, one important    |
| `desktop/stats.png`    | aggregate cards + 7-day completion chart with real data |
| `desktop/settings.png` | all four account sections                               |
| `desktop/login.png`    | sign-in screen, anonymous header                        |
| `desktop/register.png` | sign-up screen with a filled-in form                    |
| `desktop/ru.png`       | the todo screen in Russian (shows i18n)                 |
| `mobile/todo.png`      | todo list at 390x844                                    |
| `mobile/stats.png`     | `/stats` at 390x844                                     |
| `mobile/register.png`  | sign-up at 390x844                                      |

## Regenerating

```bash
node scripts/capture-screenshots.mjs
```

Requirements: Node 24, pnpm, Docker (postgres), ffmpeg (gif assembly). The script
is self-contained: it recreates a dedicated `beautiful_todo_capture` database,
builds both apps as production (the web app points at the local api), registers a
showcase account and captures every screenshot with full-page Playwright shots and
both gifs from frame sequences. It finishes by regenerating `og-image.jpg` from
the freshest `desktop/todo.png`.

The capture never touches the dev or e2e databases.
