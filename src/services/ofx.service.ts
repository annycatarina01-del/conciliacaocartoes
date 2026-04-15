import { parse } from 'ofx-js'

function parseOFXDate(ofxDate: string): string {
  if (!ofxDate) return new Date().toISOString()
  
  // Formato comum: YYYYMMDDHHMMSS
  const year = ofxDate.substring(0, 4)
  const month = ofxDate.substring(4, 6)
  const day = ofxDate.substring(6, 8)
  const hour = ofxDate.substring(8, 10) || '00'
  const minute = ofxDate.substring(10, 12) || '00'
  const second = ofxDate.substring(12, 14) || '00'

  try {
    const date = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`)
    return isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString()
  } catch {
    return new Date().toISOString()
  }
}

export async function parseOFX(file: File) {
  const text = await file.text()
  const data = await parse(text)

  const transactions =
    data?.OFX?.BANKMSGSRSV1?.STMTTRNRS?.STMTRS?.BANKTRANLIST?.STMTTRN || []

  // Garante que seja um array mesmo se houver apenas uma transação
  const transactionList = Array.isArray(transactions) ? transactions : [transactions]

  return transactionList.map((t: any) => ({
    id: t.FITID || crypto.randomUUID(),
    tipo: t.TRNTYPE,
    valor: parseFloat(t.TRNAMT.replace(',', '.')),
    descricao: t.MEMO || t.NAME || "Sem descrição",
    data: parseOFXDate(t.DTPOSTED)
  }))
}

