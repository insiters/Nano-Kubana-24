
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Upload, 
  Download, 
  Undo2, 
  Redo2, 
  Sparkles, 
  Layers, 
  Image as ImageIcon,
  Loader2,
  Trash2,
  Eye,
  EyeOff,
  Wand2,
  Maximize2
} from 'lucide-react';
import { HistoryState, AspectRatio } from './types';
import { editWithAI, generateImage } from './services/geminiService';

const App: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [createPrompt, setCreatePrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [showOriginal, setShowOriginal] = useState(false);
  const [activeTab, setActiveTab] = useState<'ai' | 'create'>('ai');
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Push to history
  const addToHistory = useCallback((img: string) => {
    const newState: HistoryState = { image: img };
    const newHistory = history.slice(0, historyIndex + 1);
    setHistory([...newHistory, newState]);
    setHistoryIndex(newHistory.length);
  }, [history, historyIndex]);

  // Handle Image Upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setImage(result);
        setHistory([{ image: result }]);
        setHistoryIndex(0);
      };
      reader.readAsDataURL(file);
    }
  };

  // Apply Image to Canvas
  useEffect(() => {
    if (!image || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
    };
    img.src = history[historyIndex]?.image || image;
  }, [image, historyIndex, history]);

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
    }
  };

  const handleAiEdit = async () => {
    if (!aiPrompt || !image) return;
    
    setIsProcessing(true);
    const currentBase64 = canvasRef.current?.toDataURL('image/png') || image;
    
    const result = await editWithAI(currentBase64, aiPrompt, aspectRatio);
    
    if (result.imageUrl) {
      setImage(result.imageUrl);
      addToHistory(result.imageUrl);
      setAiPrompt('');
    } else {
      alert(result.error || "Не удалось обработать запрос с помощью ИИ.");
    }
    setIsProcessing(false);
  };

  const handleAiCreate = async () => {
    if (!createPrompt) return;
    
    setIsProcessing(true);
    const result = await generateImage(createPrompt, aspectRatio);
    
    if (result.imageUrl) {
      setImage(result.imageUrl);
      addToHistory(result.imageUrl);
      setCreatePrompt('');
      setActiveTab('ai');
    } else {
      alert(result.error || "Не удалось создать изображение.");
    }
    setIsProcessing(false);
  };

  const downloadImage = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = 'nano-kubana-edit.png';
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 overflow-hidden text-slate-200">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">Nano-Kubana</h1>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className="p-2 rounded-lg hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Назад"
          >
            <Undo2 className="w-5 h-5" />
          </button>
          <button 
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            className="p-2 rounded-lg hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Вперед"
          >
            <Redo2 className="w-5 h-5" />
          </button>
          <div className="w-px h-6 bg-slate-800 mx-1" />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors text-sm font-medium"
          >
            <Upload className="w-4 h-4" /> Импорт
          </button>
          <button 
            onClick={downloadImage}
            disabled={!image}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium shadow-lg shadow-indigo-900/20"
          >
            <Download className="w-4 h-4" /> Экспорт
          </button>
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-80 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">
          <div className="flex border-b border-slate-800">
            <button 
              onClick={() => setActiveTab('ai')}
              className={`flex-1 py-4 text-sm font-medium transition-colors border-b-2 flex items-center justify-center gap-2 ${activeTab === 'ai' ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
            >
              <Wand2 className="w-4 h-4" /> ИИ Правка
            </button>
            <button 
              onClick={() => setActiveTab('create')}
              className={`flex-1 py-4 text-sm font-medium transition-colors border-b-2 flex items-center justify-center gap-2 ${activeTab === 'create' ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
            >
              <Sparkles className="w-4 h-4" /> ИИ Создание
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {(!image && activeTab !== 'create') ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <ImageIcon className="w-12 h-12 text-slate-700 mb-4" />
                <p className="text-slate-500 text-sm">Загрузите изображение или перейдите в "ИИ Создание"</p>
              </div>
            ) : activeTab === 'ai' ? (
              <div className="space-y-4">
                <div className="bg-indigo-500/10 rounded-xl p-4 border border-indigo-500/20">
                  <h3 className="text-indigo-400 text-sm font-semibold mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" /> ИИ Трансформация
                  </h3>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    Опишите, что вы хотите изменить. Gemini возьмет на себя сложную работу.
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Пропорции</h4>
                  <div className="flex gap-2">
                    {(['1:1', '16:9', '9:16'] as AspectRatio[]).map((ratio) => (
                      <button
                        key={ratio}
                        onClick={() => setAspectRatio(ratio)}
                        className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all border ${
                          aspectRatio === ratio 
                            ? 'bg-indigo-600 border-indigo-500 text-white' 
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                        }`}
                      >
                        {ratio}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative">
                  <textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Напр., 'Сделай в стиле киберпанка под дождем', 'Удали фон', 'Добавь винтажный фильтр полароид'..."
                    className="w-full h-40 bg-slate-800 border border-slate-700 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none placeholder:text-slate-600"
                  />
                  <div className="absolute bottom-3 right-3 flex gap-2">
                    <button 
                      onClick={() => setAiPrompt('')}
                      className="p-1.5 text-slate-500 hover:text-slate-300 transition-colors"
                      title="Очистить"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <button 
                  onClick={handleAiEdit}
                  disabled={isProcessing || !aiPrompt}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:bg-slate-800 disabled:cursor-not-allowed rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/30"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Обработка ИИ...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Сгенерировать правку
                    </>
                  )}
                </button>

                <div className="pt-4 border-t border-slate-800">
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter mb-2">Попробуйте:</p>
                  <div className="flex flex-wrap gap-2">
                    {['Летнее настроение', 'Ретро 80-х', 'Нуар (ЧБ)', 'Фэнтези сияние'].map(suggestion => (
                      <button
                        key={suggestion}
                        onClick={() => setAiPrompt(suggestion)}
                        className="px-3 py-1 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 rounded-full text-[11px] text-slate-400 transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-indigo-500/10 rounded-xl p-4 border border-indigo-500/20">
                  <h3 className="text-indigo-400 text-sm font-semibold mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" /> ИИ Создание
                  </h3>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    Создайте совершенно новое изображение с нуля, просто описав его.
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Пропорции</h4>
                  <div className="flex gap-2">
                    {(['1:1', '16:9', '9:16'] as AspectRatio[]).map((ratio) => (
                      <button
                        key={ratio}
                        onClick={() => setAspectRatio(ratio)}
                        className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all border ${
                          aspectRatio === ratio 
                            ? 'bg-indigo-600 border-indigo-500 text-white' 
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                        }`}
                      >
                        {ratio}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative">
                  <textarea
                    value={createPrompt}
                    onChange={(e) => setCreatePrompt(e.target.value)}
                    placeholder="Напр., 'Футуристический город в неоновых огнях', 'Милый кот в скафандре на Луне', 'Пейзаж в стиле Ван Гога'..."
                    className="w-full h-40 bg-slate-800 border border-slate-700 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none placeholder:text-slate-600"
                  />
                  <div className="absolute bottom-3 right-3 flex gap-2">
                    <button 
                      onClick={() => setCreatePrompt('')}
                      className="p-1.5 text-slate-500 hover:text-slate-300 transition-colors"
                      title="Очистить"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <button 
                  onClick={handleAiCreate}
                  disabled={isProcessing || !createPrompt}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:bg-slate-800 disabled:cursor-not-allowed rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/30"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Создание...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Создать фото
                    </>
                  )}
                </button>

                <div className="pt-4 border-t border-slate-800">
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter mb-2">Идеи:</p>
                  <div className="flex flex-wrap gap-2">
                    {['Киберпанк город', 'Космический пейзаж', 'Портрет робота', 'Закат в горах'].map(suggestion => (
                      <button
                        key={suggestion}
                        onClick={() => setCreatePrompt(suggestion)}
                        className="px-3 py-1 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 rounded-full text-[11px] text-slate-400 transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="p-4 bg-slate-900/50 border-t border-slate-800">
             <div className="flex items-center gap-2 text-[10px] text-slate-500 uppercase tracking-widest font-bold">
               <Layers className="w-3 h-3" /> Статус: 
               <span className={image ? "text-emerald-500" : "text-amber-500"}>
                 {image ? "В работе" : "Готов"}
               </span>
             </div>
          </div>
        </aside>

        {/* Canvas Area */}
        <section className="flex-1 relative bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900 to-slate-950 p-8 flex items-center justify-center overflow-auto group">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageUpload} 
            accept="image/*" 
            className="hidden" 
          />
          
          {!image ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="max-w-md w-full aspect-square border-2 border-dashed border-slate-800 rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all group/upload"
            >
              <div className="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center mb-4 group-hover/upload:scale-110 transition-transform">
                <Upload className="w-8 h-8 text-slate-400 group-hover/upload:text-indigo-400" />
              </div>
              <p className="text-slate-300 font-medium mb-1">Загрузите изображение</p>
              <p className="text-slate-500 text-sm">PNG, JPG, WEBP до 20МБ</p>
            </div>
          ) : (
            <div className="relative max-w-full max-h-full shadow-2xl shadow-black/50 rounded-lg overflow-hidden border border-white/5">
              <canvas 
                ref={canvasRef} 
                className={`max-w-full max-h-[calc(100vh-200px)] object-contain transition-opacity ${showOriginal ? 'opacity-0' : 'opacity-100'}`}
              />
              
              {showOriginal && (
                <img 
                  src={image} 
                  alt="Оригинал" 
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                />
              )}

              {isProcessing && (
                <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm flex flex-col items-center justify-center z-50">
                   <div className="relative">
                      <div className="absolute inset-0 blur-xl bg-indigo-500 animate-pulse opacity-20"></div>
                      <Loader2 className="w-12 h-12 text-indigo-500 animate-spin relative" />
                   </div>
                   <p className="mt-4 text-white font-medium animate-pulse">Gemini переосмысливает ваше изображение...</p>
                </div>
              )}

              {/* Float Controls */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-slate-900/80 backdrop-blur-md border border-white/10 p-2 rounded-full shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <button 
                  onMouseDown={() => setShowOriginal(true)}
                  onMouseUp={() => setShowOriginal(false)}
                  onMouseLeave={() => setShowOriginal(false)}
                  className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-white/10 text-xs font-semibold transition-colors"
                >
                  {showOriginal ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />} Сравнить
                </button>
                <div className="w-px h-4 bg-white/10" />
                <button 
                  onClick={() => setImage(null)}
                  className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-red-500/20 text-red-400 text-xs font-semibold transition-colors"
                >
                  <Trash2 className="w-3 h-3" /> Удалить
                </button>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Mini Footer / History Strip */}
      <footer className="h-14 bg-slate-900 border-t border-slate-800 shrink-0 flex items-center px-6 text-[10px] text-slate-500 justify-between">
        <div className="flex gap-4 items-center">
          <span className="flex items-center gap-1.5"><Sparkles className="w-3 h-3" /> На движке Nano-Kubana</span>
          <div className="w-px h-3 bg-slate-800" />
          <span>Разрешение: {canvasRef.current ? `${canvasRef.current.width}x${canvasRef.current.height}` : 'Н/Д'}</span>
        </div>
        <div className="flex gap-2">
           {history.map((_, idx) => (
             <div 
               key={idx} 
               className={`w-1.5 h-1.5 rounded-full ${idx === historyIndex ? 'bg-indigo-500 scale-125' : 'bg-slate-700'}`}
             />
           ))}
        </div>
      </footer>
    </div>
  );
};

export default App;
