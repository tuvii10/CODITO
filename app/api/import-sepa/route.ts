/**
 * API Route para importar SEPA desde el panel web (opcional).
 * Solo accesible con clave secreta para evitar abusos.
 *
 * POST /api/import-sepa
 * Headers: { "x-import-key": "TU_CLAVE_SECRETA" }
 * Body: FormData con campo "file" (CSV del SEPA)
 */

import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  // Verificar clave de acceso
  const key = req.headers.get('x-import-key')
  if (key !== process.env.IMPORT_SECRET_KEY) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  return NextResponse.json({
    message: 'Para importar, usá el script: npx tsx scripts/import-sepa.ts --file ./sepa.csv',
  })
}
