import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, Smartphone, Monitor, Info, Share, HelpCircle, CheckCircle2, ChevronRight } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function PWAPrompt() {
  const [isVisible, setIsVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [activeTab, setActiveTab] = useState<'ios' | 'android' | 'desktop'>('ios');

  useEffect(() => {
    // 检查是否已被用户永久关闭（在本次浏览器缓存生命周期中）
    const isDismissed = localStorage.getItem('pwa-prompt-dismissed') === 'true';
    
    // 检查是否已经是 PWA 独立窗口运行
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone 
      || document.referrer.includes('android-app://');

    if (isStandalone) {
      setInstalled(true);
      return;
    }

    if (!isDismissed) {
      // 延迟显示提示框，让用户先关注首屏内容
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // 阻止浏览器默认的安装弹窗
      e.preventDefault();
      // 保存事件以便后续手动触发
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setInstalled(true);
      setIsVisible(false);
      localStorage.setItem('pwa-prompt-dismissed', 'true');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // 自动检测用户操作系统，从而预设指引面板中的默认 Tab
    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) {
      setActiveTab('ios');
    } else if (/android/.test(ua)) {
      setActiveTab('android');
    } else {
      setActiveTab('desktop');
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // 触发浏览器原生安装提示
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setInstalled(true);
        setIsVisible(false);
      }
    } else {
      // 如果没有原生提示可用（如 iOS Safari 或部分国产浏览器），打开交互指引模态框
      setShowGuideModal(true);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  if (installed) return null;

  return (
    <>
      {/* 底部悬浮提示条 */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed bottom-6 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50"
          >
            <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/80 dark:border-slate-850 rounded-2xl p-4.5 shadow-xl shadow-slate-950/10 flex flex-col gap-3.5 relative overflow-hidden">
              {/* 彩色背景微光 */}
              <div className="absolute top-0 left-0 w-2 h-full bg-linear-to-b from-blue-500 to-indigo-600"></div>

              <div className="flex items-start gap-3 pl-2 pr-6">
                <div className="p-2 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-xl shrink-0 mt-0.5">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-1.5">
                    支持离线使用 · 添加到桌面
                  </h4>
                  <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                    本分析工具已适配 <strong className="font-semibold text-slate-700 dark:text-slate-300">PWA 离线缓存技术</strong>。您可以将其安装至桌面或手机主屏幕，即使在断网、坐地铁或离线状态下也能够秒速启动、极速试算。
                  </p>
                </div>
              </div>

              {/* 操作区 */}
              <div className="flex items-center justify-between gap-3 pl-2">
                <button
                  onClick={() => setShowGuideModal(true)}
                  className="text-[10px] font-bold text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors flex items-center gap-0.5"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  手动安装指南
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDismiss}
                    className="px-3 py-1.5 rounded-lg text-[11px] font-medium text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    暂不需要
                  </button>
                  <button
                    onClick={handleInstallClick}
                    className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-[11px] transition-all flex items-center gap-1 cursor-pointer shadow-sm shadow-blue-500/10"
                  >
                    <Download className="w-3.5 h-3.5" />
                    添加到桌面
                  </button>
                </div>
              </div>

              {/* 右上角关闭按钮 */}
              <button
                onClick={handleDismiss}
                className="absolute top-3.5 right-3.5 p-1 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="关闭提示"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 安装引导模态框 */}
      <AnimatePresence>
        {showGuideModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* 背景半透明遮罩 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowGuideModal(false)}
              className="absolute inset-0 bg-slate-950/50 backdrop-blur-xs"
            ></motion.div>

            {/* 指引面板卡片 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative z-10 overflow-hidden"
            >
              <div className="flex justify-between items-center mb-5">
                <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-base flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-blue-600" />
                  应用添加到桌面指南
                </h3>
                <button
                  onClick={() => setShowGuideModal(false)}
                  className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* 说明段落 */}
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 p-3 rounded-xl">
                由于各浏览器标准差异，若点击“添加到桌面”没有反应，请按照您当前的设备和浏览器，使用以下标准安装方式：
              </p>

              {/* 平台标签切换 */}
              <div className="flex border-b border-slate-100 dark:border-slate-800 gap-1 mb-4">
                <button
                  onClick={() => setActiveTab('ios')}
                  className={`flex-1 pb-2.5 text-xs font-bold transition-all relative cursor-pointer ${
                    activeTab === 'ios'
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-400'
                  }`}
                >
                  苹果 iOS 设备 (Safari)
                  {activeTab === 'ios' && (
                    <motion.div
                      layoutId="activeTabUnderline"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400"
                    />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('android')}
                  className={`flex-1 pb-2.5 text-xs font-bold transition-all relative cursor-pointer ${
                    activeTab === 'android'
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-400'
                  }`}
                >
                  安卓 Android 设备
                  {activeTab === 'android' && (
                    <motion.div
                      layoutId="activeTabUnderline"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400"
                    />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('desktop')}
                  className={`flex-1 pb-2.5 text-xs font-bold transition-all relative cursor-pointer ${
                    activeTab === 'desktop'
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-400'
                  }`}
                >
                  电脑桌面端 (PC/Mac)
                  {activeTab === 'desktop' && (
                    <motion.div
                      layoutId="activeTabUnderline"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400"
                    />
                  )}
                </button>
              </div>

              {/* 标签页步骤内容 */}
              <div className="space-y-4">
                {activeTab === 'ios' && (
                  <div className="space-y-3.5">
                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                        1
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        在 iPhone/iPad 自带的 <strong className="font-semibold text-slate-800 dark:text-slate-100">Safari 浏览器</strong> 中打开本工具。
                      </p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                        2
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed flex items-center gap-1.5 flex-wrap">
                        点击底部工具栏的
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-50 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 rounded-md text-[10px] font-bold text-blue-600">
                          <Share className="w-3 h-3" /> 分享按钮
                        </span>
                        。
                      </p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                        3
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        在分享菜单中向下滑动，选择并点击 <strong className="font-semibold text-slate-800 dark:text-slate-100">“添加到主屏幕” (Add to Home Screen)</strong>。
                      </p>
                    </div>
                  </div>
                )}

                {activeTab === 'android' && (
                  <div className="space-y-3.5">
                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                        1
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        推荐在 <strong className="font-semibold text-slate-800 dark:text-slate-100">Chrome 谷歌浏览器</strong> 中打开本工具。
                      </p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                        2
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        点击浏览器右上角 “三个点” 菜单图标。
                      </p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                        3
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        在弹出的菜单中选择 <strong className="font-semibold text-slate-800 dark:text-slate-100">“安装应用”</strong> 或 <strong className="font-semibold text-slate-800 dark:text-slate-100">“添加到主屏幕”</strong>。
                      </p>
                    </div>
                  </div>
                )}

                {activeTab === 'desktop' && (
                  <div className="space-y-3.5">
                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                        1
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        使用 <strong className="font-semibold text-slate-800 dark:text-slate-100">Chrome、Edge</strong> 等主流现代浏览器访问。
                      </p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                        2
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed flex items-center gap-1 flex-wrap">
                        在浏览器顶部的地址栏右侧，寻找
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-slate-50 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 rounded-md text-[10px] text-blue-600">
                          <Download className="w-3 h-3" /> 安装图标
                        </span>
                        并点击。
                      </p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                        3
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        或在浏览器右上角菜单中选择 <strong className="font-semibold text-slate-800 dark:text-slate-100">“安装房贷提前还款分析沙盒”</strong>。
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* 离线使用好处总结 */}
              <div className="mt-5 pt-4.5 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  成功添加后，即可享受桌面单应用秒开，完全脱离浏览器窗口！
                </span>
              </div>

              {/* 底部确认按钮 */}
              <button
                onClick={() => setShowGuideModal(false)}
                className="w-full mt-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold tracking-wide transition-all cursor-pointer"
              >
                我知道了
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
