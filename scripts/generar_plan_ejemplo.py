"""Genera src/services/planEjemplo.json con la respuesta REAL de GET /api/v1/priorizador.

Los datos de ejemplo del plan no se calculan en el frontend: salen del backend (T45), para que la
pantalla de ejemplo y la real muestren las mismas cifras. Hay que volver a correrlo si cambia la
estructura de la respuesta.

Uso (con las dependencias del backend instaladas):
    python scripts/generar_plan_ejemplo.py ../ikamoney-backend-t45
"""
import json
import os
import sys
from datetime import date
from pathlib import Path

backend = Path(sys.argv[1]).resolve()
sys.path.insert(0, str(backend))
os.environ.setdefault("DATABASE_URL", "sqlite://")
os.environ["JWT_SECRET"] = "secreto-de-ejemplo"

from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import create_engine  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402
from sqlalchemy.pool import StaticPool  # noqa: E402

from app import models  # noqa: E402,F401
from app.core.database import Base, get_db  # noqa: E402
from app.core.seguridad import crear_token  # noqa: E402
from app.main import app  # noqa: E402
from app.models import Categoria, Usuario  # noqa: E402
from app.services import fechas  # noqa: E402

HOY = date(2026, 3, 15)
MES_BASE = "2026-03"
PASO = 500
MAX_EXTRA = 10000
MESES_CALENDARIO = 24          # el ejemplo recorta el calendario para que el archivo sea chico

fechas.hoy_mx = lambda: HOY
motor = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
Sesion = sessionmaker(bind=motor, autoflush=False)


def _db():
    db = Sesion()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = _db
cliente = TestClient(app)


def nuevo_usuario():
    Base.metadata.drop_all(motor)
    Base.metadata.create_all(motor)
    with Sesion() as db:
        u = Usuario(nombre="Ejemplo", correo="ejemplo@ikamoney.dev", contrasena_hash="x", moneda="MXN")
        c = Categoria(usuario_id=None, nombre="Vivienda")
        db.add_all([u, c])
        db.commit()
        return {"Authorization": f"Bearer {crear_token(u.id)}"}, c.id


def post(h, ruta, cuerpo):
    r = cliente.post(f"/api/v1/{ruta}", json=cuerpo, headers=h)
    assert r.status_code == 201, r.text
    return r.json()


def movimiento(h, tipo, concepto, monto, fecha, clase=None, cat=None, frecuencia="mensual"):
    cuerpo = {"tipo": tipo, "concepto": concepto, "monto": monto, "fecha": fecha, "frecuencia": frecuencia}
    if tipo == "gasto":
        cuerpo.update({"categoria_id": cat, "clase": clase})
    post(h, "movimientos", cuerpo)


def tarjeta(h, nombre, saldo, limite, tasa):
    return post(h, "tarjetas", {"nombre": nombre, "banco": "Banco", "limite_credito": limite,
                                "saldo_actual": saldo, "dia_corte": 10, "dia_pago": 30, "tasa_anual": tasa})


def escenario_normal():
    h, cat = nuevo_usuario()
    movimiento(h, "ingreso", "Sueldo", 20000, "2026-01-01")
    movimiento(h, "gasto", "Renta", 8000, "2026-01-01", "fijo", cat)
    for f in ("2025-12-10", "2026-01-10", "2026-02-10"):
        movimiento(h, "gasto", "Gastos", 4000, f, "variable", cat, "unico")
    a = tarjeta(h, "Tarjeta A", 20000, 60000, 60)
    b = tarjeta(h, "Tarjeta B", 12000, 30000, 45)
    post(h, "msi", {"tarjeta_id": a["id"], "descripcion": "MSI 1", "monto_original": 12000,
                    "num_mensualidades": 12, "mensualidades_pagadas": 4, "fecha_compra": "2025-11-10"})
    post(h, "msi", {"tarjeta_id": b["id"], "descripcion": "MSI 2", "monto_original": 6000,
                    "num_mensualidades": 6, "mensualidades_pagadas": 3, "fecha_compra": "2025-12-10"})
    post(h, "deudas", {"nombre": "Préstamo personal", "tipo": "prestamo_personal", "monto_original": 30000,
                       "saldo_actual": 24000, "tasa_anual": 32, "pago_mensual": 1450, "dia_pago": 5,
                       "fecha_inicio": "2025-06-05"})
    return h


def escenario_atrapado():
    h, cat = nuevo_usuario()
    movimiento(h, "ingreso", "Sueldo", 15000, "2026-01-01")
    movimiento(h, "gasto", "Renta", 9000, "2026-01-01", "fijo", cat)
    for f in ("2025-12-10", "2026-01-10", "2026-02-10"):
        movimiento(h, "gasto", "Gastos", 2500, f, "variable", cat, "unico")
    post(h, "deudas", {"nombre": "Crédito de nómina", "tipo": "prestamo_personal", "monto_original": 60000,
                       "saldo_actual": 50000, "tasa_anual": 36, "pago_mensual": 800, "dia_pago": 5,
                       "fecha_inicio": "2025-06-05"})
    tarjeta(h, "Tarjeta departamental", 6000, 15000, 55)
    return h


def escenario_sin_deudas():
    h, _ = nuevo_usuario()
    movimiento(h, "ingreso", "Sueldo", 20000, "2026-01-01")
    return h


def pedir(h, extra):
    r = cliente.get("/api/v1/priorizador", params={"extra_mensual": extra}, headers=h)
    assert r.status_code == 200, r.text
    return r.json()


def recortar(plan):
    """Lo que no cambia con el extra va una sola vez; el calendario se recorta a lo que usa la pantalla."""
    cal = plan["calendario"]
    return {
        "extra_mensual": plan["extra_mensual"],
        "extra_sugerido": plan["extra_sugerido"],
        "presupuesto_mensual": plan["presupuesto_mensual"],
        "deudas": plan["deudas"],
        "total": plan["total"],
        "calendario": [
            {"mes": m["mes"], "periodo": m["periodo"],
             "pagos": [{"clave": p["clave"], "pago": p["pago"], "abono_extra": p["abono_extra"]}
                       for p in m["pagos"]]}
            for m in cal[:MESES_CALENDARIO]
        ],
        "calendario_completo": plan["calendario_completo"] and len(cal) <= MESES_CALENDARIO,
        "avisos": plan["avisos"],
    }


def armar(h):
    base = pedir(h, 0)
    comun = None
    planes = []
    if base["plan"] is not None:
        p = base["plan"]
        comun = {"escenario_base": p["escenario_base"], "escenario_base_texto": p["escenario_base_texto"],
                 "supuestos": p["supuestos"]}
        for extra in range(0, MAX_EXTRA + 1, PASO):
            planes.append(recortar(pedir(h, extra)["plan"]))
    sin_plan = {k: v for k, v in base.items() if k != "plan"}
    return {"respuesta": sin_plan, "plan_comun": comun, "planes": planes}


salida = {
    "mesBase": MES_BASE, "paso": PASO,
    "escenarios": {
        "normal": armar(escenario_normal()),
        "atrapado": armar(escenario_atrapado()),
        "sin_deudas": armar(escenario_sin_deudas()),
    },
}
destino = Path(__file__).resolve().parent.parent / "src" / "services" / "planEjemplo.json"
destino.write_text(json.dumps(salida, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
print(f"{destino} ({destino.stat().st_size / 1024:.0f} KB)")
