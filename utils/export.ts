
import { jsPDF } from 'jspdf';
import { Message } from '../types';

export const exportToPDF = (messages: Message[]): void => {
  const doc = new jsPDF();
  const margin = 10;
  const maxWidth = doc.internal.pageSize.getWidth() - margin * 2;
  let cursorY = margin;

  doc.setFontSize(16);
  doc.text("Mazda RX-8 AI Mechanic - Diagnosis Report", margin, cursorY);
  cursorY += 10;

  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(`Report generated on: ${new Date().toLocaleString()}`, margin, cursorY);
  cursorY += 10;

  doc.setLineWidth(0.5);
  doc.line(margin, cursorY, doc.internal.pageSize.getWidth() - margin, cursorY);
  cursorY += 10;


  messages.forEach(message => {
    if (cursorY > doc.internal.pageSize.getHeight() - 20) {
      doc.addPage();
      cursorY = margin;
    }

    const isModel = message.role === 'model';
    doc.setFont("helvetica", isModel ? "normal" : "bold");
    doc.setFontSize(12);
    doc.setTextColor(isModel ? 40 : 0);
    
    const prefix = isModel ? "RotorDoc: " : "You: ";
    const textLines = doc.splitTextToSize(prefix + message.content, maxWidth);
    
    doc.text(textLines, margin, cursorY);
    cursorY += (textLines.length * 5) + 8; // Adjust spacing after message
  });

  doc.save(`rx8-diagnosis-${new Date().toISOString().split('T')[0]}.pdf`);
};
