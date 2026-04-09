import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { FileUp, Loader2, FileText } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { cn } from '../../lib/utils';

// Configuração do worker do PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

interface PdfUploaderProps {
  onTextExtracted: (text: string, fileName: string) => void;
  isProcessing: boolean;
}

export const PdfUploader: React.FC<PdfUploaderProps> = ({ onTextExtracted, isProcessing }) => {
  const [fileName, setFileName] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setFileName(file.name);
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      const typedArray = new Uint8Array(e.target?.result as ArrayBuffer);
      try {
        const pdf = await pdfjsLib.getDocument(typedArray).promise;
        let fullText = "";
        
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: any) => item.str).join(" ");
          fullText += pageText + "\n";
        }
        
        onTextExtracted(fullText, file.name);
      } catch (err) {
        console.error("Erro ao ler PDF:", err);
        alert("Erro ao ler o arquivo PDF. Verifique se o arquivo não está protegido.");
      }
    };
    reader.readAsArrayBuffer(file);
  }, [onTextExtracted]);


  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false,
    disabled: isProcessing
  } as any);

  return (
    <div
      {...getRootProps()}
      className={cn(
        "relative border-2 border-dashed rounded-[2rem] p-12 transition-all cursor-pointer",
        "flex flex-col items-center justify-center gap-6 text-center group",
        isDragActive 
          ? "border-emerald-500 bg-emerald-50/50" 
          : "border-slate-100 bg-white hover:border-emerald-200 hover:bg-slate-50/50",
        isProcessing && "opacity-50 cursor-not-allowed"
      )}
    >
      <input {...getInputProps()} />
      
      {isProcessing ? (
        <div className="space-y-4">
          <div className="relative">
            <Loader2 className="w-16 h-16 text-emerald-500 animate-spin mx-auto" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            </div>
          </div>
          <div>
            <p className="text-xl font-bold text-slate-900">Analisando Relatório</p>
            <p className="text-sm text-slate-500 font-medium mt-1">Nossa IA está extraindo as transações...</p>
          </div>
        </div>
      ) : (
        <>
          <div className="relative">
            <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <FileUp className="w-10 h-10 text-emerald-600" />
            </div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center">
              <FileText className="w-4 h-4 text-slate-400" />
            </div>
          </div>
          
          <div className="space-y-2">
            <p className="text-xl font-bold text-slate-900">
              {fileName ? fileName : 'Arraste o relatório PDF'}
            </p>
            <p className="text-sm text-slate-500 font-medium max-w-xs mx-auto leading-relaxed">
              Clique ou arraste o arquivo PDF exportado da sua maquininha para começar a conciliação.
            </p>
          </div>

          <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-full border border-slate-100">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">IA PRONTA PARA EXTRAÇÃO</span>
          </div>
        </>
      )}
    </div>
  );
};
