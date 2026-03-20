---
description: Regras de Projeto
---

# LionSolver - Regras do Projeto

## NUNCA usar tauri-plugin-fs
- NÃO adicionar tauri-plugin-fs no Cargo.toml
- NÃO adicionar tauri_plugin_fs no main.rs
- NÃO adicionar fs:* nas capabilities/default.json
- Persistência usa localStorage (loadData/saveData no App.jsx)

## Plugins Tauri ativos
- tauri-plugin-shell
- tauri-plugin-updater
- tauri-plugin-dialog
- tauri-plugin-process

## Build
- Versão deve ser atualizada em 4 arquivos: App.jsx (APP_VERSION), tauri.conf.json, Cargo.toml, package.json
- Build: npx tauri build (com TAURI_SIGNING_PRIVATE_KEY configurada)

## Stack
- React 18 + Vite 6 + Tauri 2.x
- Single file: src/App.jsx (~1390 linhas)
- localStorage para persistência