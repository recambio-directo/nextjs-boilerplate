// Ruta de pruebas desactivada por seguridad (exponía llamadas reales con credenciales).
export async function GET() {
  return Response.json({ error: "No encontrado" }, { status: 404 });
}
