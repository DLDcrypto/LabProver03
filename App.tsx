
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { StandardCard } from './components/StandardCard';
import { searchStandards, compareStandards, fetchFullMethodDetails, generateMethodCardDraft, performQCAndFinalize } from './geminiService';
import { AnalyticalStandard, DetailedMethod, DetailedSection, AppLanguage, MethodCard, QCReport } from './types';
import { Search, Loader2, Sparkles, ArrowRightLeft, Database, BookOpen, X, FlaskConical, Cpu, ShieldAlert, Activity, Target, ChevronRight, AlertTriangle, Lightbulb, ClipboardList, Gauge, CheckCircle2, FileText, Verified, Wand2, Layers } from 'lucide-react';

const App: React.FC = () => {
  const [isDark, setIsDark] = useState(false);
  const [language, setLanguage] = useState<AppLanguage>('vi');
  const [activeTab, setActiveTab] = useState('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [standards, setStandards] = useState<AnalyticalStandard[]>([]);
  const [sources, setSources] = useState<{ title?: string, uri?: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [comparingCodes, setComparingCodes] = useState<string[]>([]);
  const [comparisonResult, setComparisonResult] = useState<any>(null);
  const [comparing, setComparing] = useState(false);

  const [selectedStandard, setSelectedStandard] = useState<AnalyticalStandard | null>(null);
  const [methodDetails, setMethodDetails] = useState<DetailedMethod | null>(null);
  const [loadingMethod, setLoadingMethod] = useState(false);

  // Method Card Workflow State
  const [cardInputs, setCardInputs] = useState({
    analyte: '',
    chemicalGroup: '',
    matrix: '',
    technique: '',
    standards: ''
  });
  const [currentMethodCard, setCurrentMethodCard] = useState<MethodCard | null>(null);
  const [qcReport, setQcReport] = useState<QCReport | null>(null);
  const [generationStep, setGenerationStep] = useState<'idle' | 'drafting' | 'reviewing'>('idle');
  const [cardError, setCardError] = useState<string | null>(null);

  useEffect(() => {
    if (isDark) document.documentElement.classList.add('class', 'dark');
    else document.documentElement.classList.remove('dark');
  }, [isDark]);

  const handleSearch = async (query: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    const { standards: results, sources: searchSources } = await searchStandards(query);
    setStandards(results);
    setSources(searchSources);
    setLoading(false);
  };

  const handleViewDetails = async (standard: AnalyticalStandard) => {
    setSelectedStandard(standard);
    setLoadingMethod(true);
    try {
      const details = await fetchFullMethodDetails(standard.code, standard.title);
      setMethodDetails(details);
    } catch (error) {
      console.error("Failed to fetch method details:", error);
    } finally {
      setLoadingMethod(false);
    }
  };

  const closeMethodReader = () => {
    setSelectedStandard(null);
    setMethodDetails(null);
  };

  const startMethodCardWorkflow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardInputs.analyte || !cardInputs.matrix) return;

    setCardError(null);
    setCurrentMethodCard(null);
    setQcReport(null);

    try {
      setGenerationStep('drafting');
      const draft = await generateMethodCardDraft(cardInputs);
      
      setGenerationStep('reviewing');
      const { qcReport: report, finalCard } = await performQCAndFinalize(draft);
      
      setQcReport(report);
      setCurrentMethodCard(finalCard);
      setGenerationStep('idle');
    } catch (error) {
      console.error(error);
      setCardError(language === 'vi' ? "Hệ thống đang bận hoặc dữ liệu quá phức tạp. Thử lại sau." : "Workflow failed. Try again.");
      setGenerationStep('idle');
    }
  };

  const renderProgress = () => {
    if (generationStep === 'idle') return null;
    return (
      <div className="py-10 flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-300">
        <div className="relative">
          <div className="w-24 h-24 border-4 border-emerald-100 dark:border-emerald-900/30 rounded-full"></div>
          <div className="w-24 h-24 border-4 border-emerald-600 rounded-full border-t-transparent animate-spin absolute top-0 flex items-center justify-center">
            {generationStep === 'drafting' ? <FileText className="text-emerald-600" size={24}/> : <Verified className="text-emerald-600" size={24}/>}
          </div>
        </div>
        <div className="text-center">
           <p className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-widest">
             {generationStep === 'drafting' ? (language === 'vi' ? 'Đang soạn thảo bản nháp...' : 'Drafting methodology...') : (language === 'vi' ? 'QC & Hoàn thiện chuyên gia...' : 'QA Review & Finalizing...')}
           </p>
           <p className="text-xs text-slate-500 font-medium mt-1 italic">{language === 'vi' ? 'Mô hình Flash đang tối ưu hóa quy trình phân tích' : 'Flash engine optimizing analytical protocol'}</p>
        </div>
      </div>
    );
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} isDark={isDark} toggleDark={() => setIsDark(!isDark)} language={language} setLanguage={setLanguage}>
      {activeTab === 'search' && (
        <div className="space-y-12">
          <div className="bg-slate-900 rounded-[3.5rem] p-12 md:p-16 text-white shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px]"></div>
             <h2 className="text-4xl md:text-6xl font-black mb-8 leading-tight">{language === 'vi' ? 'Hệ thống Tiêu chuẩn' : 'Standards Hub'}</h2>
             <form onSubmit={(e) => handleSearch(searchQuery, e)} className="relative max-w-2xl">
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={language === 'vi' ? 'Nhập tên chỉ tiêu hoặc mã ISO/EPA...' : 'Enter analyte or ISO/EPA code...'} className="w-full h-20 pl-16 pr-40 bg-white/10 border border-white/20 rounded-3xl outline-none focus:bg-white focus:text-slate-900 transition-all text-xl" />
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-white/40" size={28} />
                <button type="submit" className="absolute right-3 top-3 bottom-3 bg-blue-600 px-8 rounded-2xl font-black hover:bg-blue-700 transition-colors">{language === 'vi' ? 'TÌM KIẾM' : 'SEARCH'}</button>
             </form>
          </div>
          <div className="flex flex-col gap-6">{standards.map(std => (<StandardCard key={std.id} standard={std} onCompareToggle={() => {}} isComparing={false} onViewDetails={handleViewDetails} language={language} />))}</div>
        </div>
      )}

      {activeTab === 'methodCard' && (
        <div className="space-y-12">
          <div className="bg-gradient-to-br from-indigo-950 to-slate-900 rounded-[3.5rem] p-12 md:p-16 text-white shadow-2xl">
            <div className="flex items-center gap-3 mb-8">
              <FlaskConical className="text-emerald-400" size={24} />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400">Laboratory Application Engine</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black mb-10 tracking-tight">{language === 'vi' ? 'Tạo Thẻ Phương Pháp' : 'Method Card Generator'}</h2>
            <form onSubmit={startMethodCardWorkflow} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">{language === 'vi' ? 'Chỉ tiêu' : 'Analyte'}</label>
                <input type="text" required value={cardInputs.analyte} onChange={e => setCardInputs({...cardInputs, analyte: e.target.value})} className="w-full bg-white/10 border border-white/20 p-4 rounded-2xl outline-none focus:bg-white focus:text-slate-900 transition-all" placeholder="e.g. Pesticide" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">{language === 'vi' ? 'Nhóm hóa chất' : 'Chem Group'}</label>
                <input type="text" value={cardInputs.chemicalGroup} onChange={e => setCardInputs({...cardInputs, chemicalGroup: e.target.value})} className="w-full bg-white/10 border border-white/20 p-4 rounded-2xl outline-none focus:bg-white focus:text-slate-900 transition-all" placeholder="e.g. Organophosphates" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">{language === 'vi' ? 'Nền mẫu' : 'Matrix'}</label>
                <input type="text" required value={cardInputs.matrix} onChange={e => setCardInputs({...cardInputs, matrix: e.target.value})} className="w-full bg-white/10 border border-white/20 p-4 rounded-2xl outline-none focus:bg-white focus:text-slate-900 transition-all" placeholder="e.g. Fruit, Soil" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">{language === 'vi' ? 'Kỹ thuật' : 'Technique'}</label>
                <input type="text" value={cardInputs.technique} onChange={e => setCardInputs({...cardInputs, technique: e.target.value})} className="w-full bg-white/10 border border-white/20 p-4 rounded-2xl outline-none focus:bg-white focus:text-slate-900 transition-all" placeholder="e.g. LC-MS/MS, GC-FID" />
              </div>
              <div className="space-y-2 lg:col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">{language === 'vi' ? 'Tiêu chuẩn tham chiếu' : 'Reference Standards'}</label>
                <input type="text" value={cardInputs.standards} onChange={e => setCardInputs({...cardInputs, standards: e.target.value})} className="w-full bg-white/10 border border-white/20 p-4 rounded-2xl outline-none focus:bg-white focus:text-slate-900 transition-all" placeholder="e.g. EN 15662, ISO 11885" />
              </div>
              <button type="submit" disabled={generationStep !== 'idle'} className="lg:col-span-3 bg-emerald-600 h-16 rounded-2xl font-black shadow-xl flex items-center justify-center gap-4 hover:bg-emerald-700 active:scale-[0.98] transition-all disabled:opacity-50">
                {generationStep === 'idle' ? <><Wand2 size={24}/> {language === 'vi' ? 'BẮT ĐẦU TỔNG HỢP' : 'START SYNTHESIS'}</> : <Loader2 className="animate-spin" size={24}/>}
              </button>
            </form>
          </div>

          {renderProgress()}

          {currentMethodCard && (
            <div className="animate-in zoom-in slide-in-from-bottom-8 duration-500 space-y-12">
              {qcReport && (
                <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-500/20 rounded-[2.5rem] p-8">
                  <h5 className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Verified size={16}/> QC Audit Report</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="text-xs text-slate-600 dark:text-slate-400 italic leading-relaxed">{qcReport.suggestions}</div>
                    <div className="flex items-center gap-4">
                      <div className="px-4 py-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                        <span className="text-[9px] font-black uppercase text-slate-400 block mb-1">Confidence</span>
                        <span className="text-emerald-500 font-bold">{qcReport.confidence}</span>
                      </div>
                      <div className="px-4 py-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                        <span className="text-[9px] font-black uppercase text-slate-400 block mb-1">Audit Score</span>
                        <span className="text-blue-500 font-bold">{qcReport.isReady ? 'PASS' : 'REVIEW'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="bg-white dark:bg-slate-900 rounded-[4rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-2xl">
                {/* Header Section */}
                <div className="p-12 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                  <div className="flex items-center gap-8">
                    <div className="w-24 h-24 bg-emerald-600 text-white rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-emerald-500/20 shrink-0">
                      <FlaskConical size={48} />
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-emerald-600 tracking-[0.4em] uppercase mb-1">Expert Application Method Card</p>
                      <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-none">{currentMethodCard.title.toUpperCase()}</h3>
                      <div className="flex gap-4 mt-4">
                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase"><Layers size={14}/> {currentMethodCard.matrix}</div>
                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase"><Cpu size={14}/> {currentMethodCard.technique}</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* 2-Column Grid Layout */}
                <div className="p-12 grid grid-cols-1 xl:grid-cols-2 gap-16">
                  {/* Left Column */}
                  <div className="space-y-16">
                    <section>
                      <h4 className="flex items-center gap-3 text-lg font-black text-slate-900 dark:text-white mb-6 uppercase">
                        <span className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 rounded-lg flex items-center justify-center text-xs font-black">01</span>
                        {language === 'vi' ? 'Tổng quan phương pháp' : 'Method Overview'}
                      </h4>
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-10 rounded-[2.5rem] border border-slate-100 dark:border-slate-700/50 text-sm leading-[1.8] text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
                        {currentMethodCard.sections.overview}
                      </div>
                    </section>

                    <section>
                      <h4 className="flex items-center gap-3 text-lg font-black text-slate-900 dark:text-white mb-6 uppercase">
                        <span className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 rounded-lg flex items-center justify-center text-xs font-black">02</span>
                        {language === 'vi' ? 'Xử lý mẫu (Quy trình)' : 'Sample Preparation'}
                      </h4>
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-10 rounded-[2.5rem] border border-slate-100 dark:border-slate-700/50 text-sm leading-[1.8] text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
                        {currentMethodCard.sections.samplePrep}
                      </div>
                    </section>

                    <section>
                      <h4 className="flex items-center gap-3 text-lg font-black text-slate-900 dark:text-white mb-6 uppercase">
                        <span className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 rounded-lg flex items-center justify-center text-xs font-black">03</span>
                        {language === 'vi' ? 'Thiết bị & Điều kiện' : 'Instrumentation'}
                      </h4>
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-10 rounded-[2.5rem] border border-slate-100 dark:border-slate-700/50 text-sm leading-[1.8] text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
                        {currentMethodCard.sections.instrumentation}
                      </div>
                    </section>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-16">
                    <section>
                      <h4 className="flex items-center gap-3 text-lg font-black text-slate-900 dark:text-white mb-6 uppercase">
                        <span className="w-8 h-8 bg-amber-100 dark:bg-amber-900/40 text-amber-600 rounded-lg flex items-center justify-center text-xs font-black">04</span>
                        {language === 'vi' ? 'Đặc tính hiệu năng' : 'Performance Specs'}
                      </h4>
                      <div className="bg-amber-50/30 dark:bg-amber-900/10 p-10 rounded-[2.5rem] border border-amber-100/50 dark:border-amber-500/20 text-sm leading-[1.8] text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                        {currentMethodCard.sections.performance}
                      </div>
                    </section>

                    <section>
                      <h4 className="flex items-center gap-3 text-lg font-black text-slate-900 dark:text-white mb-6 uppercase">
                        <span className="w-8 h-8 bg-rose-100 dark:bg-rose-900/40 text-rose-600 rounded-lg flex items-center justify-center text-xs font-black">05</span>
                        {language === 'vi' ? 'Lỗi thường gặp & Khắc phục' : 'Pitfalls & Troubleshooting'}
                      </h4>
                      <div className="bg-rose-50/50 dark:bg-rose-900/10 p-10 rounded-[2.5rem] border border-rose-100/50 dark:border-rose-500/20 text-sm leading-[1.8] text-rose-700 dark:text-rose-300 whitespace-pre-wrap">
                        {currentMethodCard.sections.pitfalls}
                      </div>
                    </section>

                    <section>
                      <h4 className="flex items-center gap-3 text-lg font-black text-slate-900 dark:text-white mb-6 uppercase">
                        <span className="w-8 h-8 bg-blue-100 dark:bg-blue-900/40 text-blue-600 rounded-lg flex items-center justify-center text-xs font-black">06</span>
                        {language === 'vi' ? 'Ghi chú thực tế' : 'Application Notes'}
                      </h4>
                      <div className="bg-blue-50/50 dark:bg-blue-900/10 p-10 rounded-[2.5rem] border border-blue-100/50 dark:border-blue-500/20 text-sm leading-[1.8] text-blue-800 dark:text-blue-300 whitespace-pre-wrap">
                        <div className="flex items-center gap-2 mb-4 text-xs font-black uppercase text-blue-600 dark:text-blue-400">
                          <Lightbulb size={16}/> Expert Insight
                        </div>
                        {currentMethodCard.sections.labNotes}
                      </div>
                    </section>
                  </div>
                </div>

                {/* Footer Selection/Compliance Table Row */}
                <div className="px-12 pb-12 grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-10 rounded-[3rem] border border-slate-100 dark:border-slate-700/50">
                     <h5 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-3"><Target size={18}/> Selection Guide</h5>
                     <div className="text-sm text-slate-600 dark:text-slate-400 italic leading-relaxed">{currentMethodCard.sections.selection}</div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-10 rounded-[3rem] border border-slate-100 dark:border-slate-700/50">
                     <h5 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-3"><CheckCircle2 size={18}/> Compliance Check</h5>
                     <div className="text-sm text-slate-600 dark:text-slate-400 italic leading-relaxed">{currentMethodCard.sections.compliance}</div>
                  </div>
                </div>
                
                <div className="p-12 bg-slate-950 text-white border-t border-slate-800">
                   <p className="text-[9px] text-slate-500 italic text-center uppercase tracking-widest leading-relaxed max-w-4xl mx-auto">
                     {currentMethodCard.sections.disclaimer}
                   </p>
                </div>
              </div>
            </div>
          )}

          {!currentMethodCard && generationStep === 'idle' && (
            <div className="py-24 text-center">
              <div className="w-24 h-24 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto mb-8 text-emerald-400">
                <ClipboardList size={48} />
              </div>
              <h3 className="text-2xl font-black mb-3">{language === 'vi' ? 'Sẵn sàng tổng hợp' : 'Ready for Synthesis'}</h3>
              <p className="text-slate-500 max-w-md mx-auto">{language === 'vi' ? 'Điền thông số chỉ tiêu và nền mẫu để tạo quy trình phân tích chuyên sâu.' : 'Fill in the analyte and matrix parameters to generate a high-density expert protocol.'}</p>
            </div>
          )}
        </div>
      )}

      {selectedStandard && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-950 w-full max-w-6xl max-h-[90vh] rounded-[4rem] shadow-2xl overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800">
            <div className="p-10 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-950 shrink-0">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-xl"><FlaskConical size={32} /></div>
                <h2 className="text-2xl font-black tracking-tight">{selectedStandard.code} - {selectedStandard.title}</h2>
              </div>
              <button onClick={closeMethodReader} className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all"><X size={32}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-12 bg-slate-50/30 dark:bg-slate-900/30">
               {loadingMethod ? (
                 <div className="h-full flex flex-col items-center justify-center gap-6">
                    <Loader2 className="animate-spin text-blue-600" size={48}/>
                    <p className="font-black uppercase tracking-widest text-slate-400">Loading Protocol...</p>
                 </div>
               ) : methodDetails ? (
                  <div className="space-y-12 pb-20">
                     {Object.entries(methodDetails).map(([key, content]: [string, any]) => (
                       <section key={key} className="bg-white dark:bg-slate-800 p-10 rounded-[3rem] shadow-sm border border-slate-100 dark:border-slate-700">
                          <h4 className="text-[10px] font-black uppercase text-blue-600 mb-6 tracking-widest">{key}</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="text-slate-800 dark:text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">{content.en}</div>
                            <div className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed whitespace-pre-wrap italic bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl">{content.vi}</div>
                          </div>
                       </section>
                     ))}
                  </div>
               ) : null}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;
