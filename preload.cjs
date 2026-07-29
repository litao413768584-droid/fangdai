// Electron Preload Script
// 可以在这里向渲染进程暴露安全的 Native API 接口（如需要）
const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
});
