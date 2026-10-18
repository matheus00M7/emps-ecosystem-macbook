import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import type { ChargingSession } from '../domain/models';
import { receiptRows, currency } from './receipt-html';

/** Presentation only: every monetary component comes from the paid backend record. */
export async function receiptPdf(session: ChargingSession, station: string, charger: string, logo: Uint8Array) {
  const rows = receiptRows(session, station, charger);
  const paid = session.receipt!;
  return receiptDocumentPdf(rows, logo, {
    title: 'Comprovante de pagamento',
    metadataTitle: 'Comprovante EMPS - ' + paid.transactionId,
    subtitle: 'EMPS Charge | ' + (paid.sandbox ?? ['stripe','sandbox','zero_amount'].includes(paid.provider) ? 'Sandbox / demonstracao' : 'Pagamento registrado'),
    totalLabel: 'Total pago',
    total: currency(paid.amountPaid),
    notes: ['Valores oficiais do pagamento. Horários de Brasília.', 'Este comprovante não substitui documento fiscal.'],
  });
}

type DocumentOptions = {
  title: string;
  metadataTitle: string;
  subtitle: string;
  totalLabel: string;
  total: string;
  notes: string[];
};

export async function receiptDocumentPdf(
  rows: (string | null | undefined)[][], logo: Uint8Array, options: DocumentOptions,
) {
  const doc = await PDFDocument.create();
  doc.setTitle(options.metadataTitle);
  doc.setAuthor('EMPS');
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const supported = new Set(regular.getCharacterSet());
  const clean = (value: string) => Array.from(value).map(c => supported.has(c.codePointAt(0)!) ? c : '?').join('');
  let page = doc.addPage([595.28, 841.89]);
  let y = 794;
  const red = rgb(.82,.09,.15);
  const gray = rgb(.30,.34,.40);
  const text = (value: string, x: number, top: number, size = 10, strong = false) => page.drawText(clean(value), {x,y:top,size,font:strong?bold:regular,color:gray});
  const image = await doc.embedPng(logo);
  const dimensions = image.scale(Math.min(135/image.width, 48/image.height));
  page.drawImage(image,{x:40,y:y-dimensions.height,...dimensions});
  y -= 78;
  text(options.title,40,y,23,true);
  y -= 23;
  text(options.subtitle,40,y);
  y -= 18;
  page.drawLine({start:{x:40,y},end:{x:555,y},thickness:2,color:red});
  y -= 27;
  for (const [label, raw] of rows) {
    const value = clean(String(raw ?? 'Não informado'));
    const lines: string[] = []; let line = '';
    for (const c of value) {
      if (regular.widthOfTextAtSize(line+c,10)>300) {lines.push(line);line='';}
      line += c;
    }
    lines.push(line);
    for (let i=0;i<lines.length;i++) {
      if (y<120) {page=doc.addPage([595.28,841.89]);y=790;text('EMPS | Continuação do comprovante',40,y,12,true);y-=30;}
      if (i===0) text(String(label),40,y);
      text(lines[i],248,y);
      y-=14;
    }
    y-=12;
  }
  if (y<135) {page=doc.addPage([595.28,841.89]);y=790;}
  page.drawRectangle({x:40,y:y-45,width:515,height:55,color:rgb(.95,.96,.97)});
  text(options.totalLabel,54,y-23,16,true);
  text(options.total,350,y-23,20,true);
  options.notes.forEach((note, index) => text(note,40,y-70-index*15,9));
  return doc.save();
}
