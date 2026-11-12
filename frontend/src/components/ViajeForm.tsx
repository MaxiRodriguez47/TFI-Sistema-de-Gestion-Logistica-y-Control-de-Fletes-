import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createViaje, deleteViaje, updateViaje } from "../api/viajes";
import { listFincas } from "../api/fincas";
import { listCamiones } from "../api/camiones";
import { listChoferes } from "../api/choferes";
import { listIngenios } from "../api/ingenios";
import ConfirmDialog from "./ConfirmDialog";
import { parseError } from "../utils/errors";
import { dash, formatKg, formatMoney } from "../utils/format";
import { calcularFlete, parseDecimal } from "../utils/viajes";
import type { Viaje, ViajeInput } from "../types/api";

const inputClass = "mt-1 block min-h-11 w-full rounded-md border border-slate-300 px-3";

function mensajeErrorCampo(campo: string): string {
  return (
    {
      peso_bruto_kg: "Peso bruto inválido (mayor o igual a 0, hasta 2 decimales)",
      tara_kg: "Tara inválida (mayor o igual a 0, hasta 2 decimales)",
      tarifa_ton: "Tarifa inválida (mayor o igual a 0, hasta 2 decimales)",
      num_vale: "Número de vale inválido",
      id_viaje: "ID inválido",
      producto_cuit: "Seleccioná un productor asociado a la finca",
      camion_patente: "Seleccioná un camión",
      chofer_dni: "Seleccioná un chofer",
      id_finca: "Seleccioná una finca",
      id_ingenio: "Seleccioná un ingenio",
    }[campo] ?? "Revisá este campo"
  );
}

interface Props {
  viaje?: Viaje;
  modo: "admin" | "chofer";
  choferFijo?: { dni: string; nombre: string };
  volverA: string;
  permitirEliminar?: boolean;
}

export default function ViajeForm({ viaje, modo, choferFijo, volverA, permitirEliminar = false }: Props) {
  const esEdicion = Boolean(viaje);
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: fincas } = useQuery({ queryKey: ["fincas"], queryFn: listFincas });
  const { data: camiones } = useQuery({ queryKey: ["camiones"], queryFn: listCamiones });
  const { data: choferes } = useQuery({
    queryKey: ["choferes"],
    queryFn: listChoferes,
    enabled: modo === "admin",
  });
  const { data: ingenios } = useQuery({ queryKey: ["ingenios"], queryFn: listIngenios });

  const [idViaje, setIdViaje] = useState(viaje?.id_viaje ?? "");
  const [numVale, setNumVale] = useState(viaje?.num_vale ?? "");
  const [fincaId, setFincaId] = useState(viaje ? String(viaje.id_finca) : "");
  const [cuit, setCuit] = useState(viaje?.producto_cuit ?? "");
  const [patente, setPatente] = useState(viaje?.camion_patente ?? "");
  const [dni, setDni] = useState(viaje?.chofer_dni ?? choferFijo?.dni ?? "");
  const [ingenioId, setIngenioId] = useState(viaje ? String(viaje.id_ingenio) : "");
  const [bruto, setBruto] = useState(viaje ? String(viaje.peso_bruto_kg) : "");
  const [tara, setTara] = useState(viaje ? String(viaje.tara_kg) : "");
  const [tarifa, setTarifa] = useState(viaje ? String(viaje.tarifa_ton) : "");
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [errorGeneral, setErrorGeneral] = useState("");
  const [toDelete, setToDelete] = useState(false);

  const fincaSeleccionada = fincas?.find((f) => String(f.id_finca) === fincaId);
  const productores = fincaSeleccionada?.productores ?? [];

  const brutoNum = parseDecimal(bruto);
  const taraNum = parseDecimal(tara);
  const tarifaNum = parseDecimal(tarifa);
  const neto =
    brutoNum != null && taraNum != null && brutoNum >= taraNum ? brutoNum - taraNum : null;
  const flete = neto != null && tarifaNum != null ? calcularFlete(neto, tarifaNum) : null;

  const guardar = useMutation({
    mutationFn: (payload: ViajeInput) =>
      esEdicion
        ? updateViaje(viaje!.id_viaje, payload)
        : createViaje({ id_viaje: idViaje.trim(), ...payload }),
    onSuccess: async () => {
      qc.invalidateQueries({ queryKey: ["viajes"] });
      qc.invalidateQueries({ queryKey: ["mis-viajes"] });
      if (esEdicion) qc.invalidateQueries({ queryKey: ["viaje", viaje!.id_viaje] });
      // Esperar el refresco del listado evita mostrar datos viejos al volver.
      await qc.refetchQueries({
        queryKey: modo === "chofer" ? ["mis-viajes"] : ["viajes"],
        type: "all",
      });
      navigate(volverA, {
        state: { notice: esEdicion ? "Viaje actualizado" : "Viaje registrado" },
      });
    },
    onError: (e) => {
      const err = parseError(e);
      setErrorGeneral(err.message);
      setErrores(err.fieldErrors);
    },
  });

  const eliminar = useMutation({
    mutationFn: () => deleteViaje(viaje!.id_viaje),
    onSuccess: async () => {
      qc.invalidateQueries({ queryKey: ["viajes"] });
      qc.invalidateQueries({ queryKey: ["mis-viajes"] });
      await qc.refetchQueries({
        queryKey: modo === "chofer" ? ["mis-viajes"] : ["viajes"],
        type: "all",
      });
      navigate(volverA, { state: { notice: `Viaje ${viaje!.id_viaje} eliminado` } });
    },
    onError: (e) => setErrorGeneral(parseError(e).message),
  });

  function cambiarFinca(valor: string) {
    setFincaId(valor);
    const finca = fincas?.find((f) => String(f.id_finca) === valor);
    if (!finca?.productores.some((p) => p.producto_cuit === cuit)) setCuit("");
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};

    if (!esEdicion) {
      if (!idViaje.trim() || idViaje.trim().length > 20) {
        errs.id_viaje = "Ingresá un ID de hasta 20 caracteres";
      }
    }
    if (!numVale.trim() || numVale.trim().length > 20) {
      errs.num_vale = "Ingresá un número de vale de hasta 20 caracteres";
    }
    if (!fincaId) errs.id_finca = "Seleccioná una finca";
    if (!cuit) errs.producto_cuit = "Seleccioná un productor";
    if (!patente) errs.camion_patente = "Seleccioná un camión";
    if (modo === "admin" && !dni) errs.chofer_dni = "Seleccioná un chofer";
    if (modo === "chofer" && !choferFijo) errs.chofer_dni = "Tu usuario no tiene un chofer vinculado";
    if (!ingenioId) errs.id_ingenio = "Seleccioná un ingenio";

    for (const [campo, valor] of [
      ["peso_bruto_kg", bruto],
      ["tara_kg", tara],
      ["tarifa_ton", tarifa],
    ] as const) {
      if (!valor.trim() || parseDecimal(valor) == null) errs[campo] = mensajeErrorCampo(campo);
    }

    if (brutoNum != null && taraNum != null && brutoNum < taraNum) {
      errs.tara_kg = "La tara no puede superar el peso bruto";
    }

    setErrores(errs);
    if (Object.keys(errs).length > 0) {
      setErrorGeneral("Revisá los datos ingresados");
      return;
    }
    setErrorGeneral("");

    guardar.mutate({
      id_finca: Number(fincaId),
      producto_cuit: cuit,
      camion_patente: patente,
      chofer_dni: modo === "chofer" ? (choferFijo?.dni as string) : dni,
      id_ingenio: Number(ingenioId),
      num_vale: numVale.trim(),
      peso_bruto_kg: brutoNum as number,
      tara_kg: taraNum as number,
      tarifa_ton: tarifaNum as number,
    });
  }

  function campoError(campo: string) {
    return errores[campo] ? (
      <span className="mt-1 block text-sm text-red-700">{errores[campo]}</span>
    ) : null;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold">
          {esEdicion ? `Editar viaje ${viaje?.id_viaje}` : "Nuevo viaje"}
        </h1>
        <Link to={volverA} className="min-h-11 text-sm text-emerald-700">
          Volver
        </Link>
      </div>

      {errorGeneral && (
        <p role="alert" className="mb-3 rounded bg-red-50 p-2 text-sm text-red-700">
          {errorGeneral}
        </p>
      )}

      <form onSubmit={onSubmit} className="space-y-4 rounded-lg bg-white p-4 shadow">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="block text-sm font-medium">
            ID de viaje
            <input
              className={`${inputClass} disabled:bg-slate-100 disabled:text-slate-500`}
              value={idViaje}
              onChange={(e) => setIdViaje(e.target.value)}
              disabled={esEdicion}
              placeholder="Ej.: V009"
            />
            <span className="mt-1 block text-xs text-slate-500">
              {esEdicion
                ? "El ID no se puede modificar."
                : "Lo definís vos; tiene que ser único (ej. V009)."}
            </span>
            {campoError("id_viaje")}
          </label>

          <label className="block text-sm font-medium">
            N° de vale
            <input
              className={inputClass}
              value={numVale}
              onChange={(e) => setNumVale(e.target.value)}
              placeholder="Ej.: VAL-009"
            />
            {campoError("num_vale")}
          </label>

          <label className="block text-sm font-medium">
            Finca de origen
            <select className={inputClass} value={fincaId} onChange={(e) => cambiarFinca(e.target.value)}>
              <option value="">Seleccioná una finca</option>
              {fincas?.map((f) => (
                <option key={f.id_finca} value={f.id_finca}>
                  {f.finca_nombre} — {f.localidad?.localidad_nombre ?? ""}
                </option>
              ))}
            </select>
            {campoError("id_finca")}
          </label>

          <label className="block text-sm font-medium">
            Productor
            <select
              className={inputClass}
              value={cuit}
              onChange={(e) => setCuit(e.target.value)}
              disabled={!fincaId}
            >
              <option value="">{fincaId ? "Seleccioná un productor" : "Elegí primero una finca"}</option>
              {productores.map((p) => (
                <option key={p.producto_cuit} value={p.producto_cuit}>
                  {p.producto_nombre} — {p.producto_cuit}
                </option>
              ))}
            </select>
            {fincaId && productores.length === 0 && (
              <span className="mt-1 block text-xs text-amber-700">
                Esta finca no tiene productores asociados.
              </span>
            )}
            {campoError("producto_cuit")}
          </label>

          <label className="block text-sm font-medium">
            Camión
            <select className={inputClass} value={patente} onChange={(e) => setPatente(e.target.value)}>
              <option value="">Seleccioná un camión</option>
              {camiones?.map((c) => (
                <option key={c.camion_patente} value={c.camion_patente}>
                  {c.camion_patente}
                </option>
              ))}
            </select>
            {campoError("camion_patente")}
          </label>

          {modo === "admin" ? (
            <label className="block text-sm font-medium">
              Chofer
              <select className={inputClass} value={dni} onChange={(e) => setDni(e.target.value)}>
                <option value="">Seleccioná un chofer</option>
                {choferes?.map((c) => (
                  <option key={c.chofer_dni} value={c.chofer_dni}>
                    {c.chofer_nombre} — {c.chofer_dni}
                  </option>
                ))}
              </select>
              {campoError("chofer_dni")}
            </label>
          ) : (
            <div className="text-sm font-medium">
              Chofer
              <p className="mt-1 min-h-11 rounded-md border border-slate-200 bg-slate-50 px-3 py-3 text-slate-700">
                {choferFijo?.nombre ?? dash} — {choferFijo?.dni ?? dash}
              </p>
              <span className="mt-1 block text-xs text-slate-500">
                El viaje se registra a tu nombre.
              </span>
              {campoError("chofer_dni")}
            </div>
          )}

          <label className="block text-sm font-medium">
            Ingenio de destino
            <select className={inputClass} value={ingenioId} onChange={(e) => setIngenioId(e.target.value)}>
              <option value="">Seleccioná un ingenio</option>
              {ingenios?.map((i) => (
                <option key={i.id_ingenio} value={i.id_ingenio}>
                  {i.ingenio_nombre}
                </option>
              ))}
            </select>
            {campoError("id_ingenio")}
          </label>

          <label className="block text-sm font-medium">
            Peso bruto (kg)
            <input
              className={inputClass}
              inputMode="decimal"
              value={bruto}
              onChange={(e) => setBruto(e.target.value)}
              placeholder="Ej.: 32500"
            />
            {campoError("peso_bruto_kg")}
          </label>

          <label className="block text-sm font-medium">
            Tara (kg)
            <input
              className={inputClass}
              inputMode="decimal"
              value={tara}
              onChange={(e) => setTara(e.target.value)}
              placeholder="Ej.: 12000"
            />
            {campoError("tara_kg")}
          </label>

          <label className="block text-sm font-medium">
            Tarifa ($/t)
            <input
              className={inputClass}
              inputMode="decimal"
              value={tarifa}
              onChange={(e) => setTarifa(e.target.value)}
              placeholder="Ej.: 8500"
            />
            {campoError("tarifa_ton")}
          </label>
        </div>

        <dl className="grid grid-cols-1 gap-3 rounded-md bg-slate-50 p-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-slate-600">Peso neto</dt>
            <dd className="text-lg font-semibold">{neto == null ? dash : formatKg(neto)}</dd>
          </div>
          <div>
            <dt className="text-slate-600">Flete estimado</dt>
            <dd className="text-lg font-semibold text-emerald-800">
              {flete == null ? dash : formatMoney(flete)}
            </dd>
          </div>
        </dl>

        <div className="flex flex-wrap justify-end gap-2">
          {permitirEliminar && esEdicion && (
            <button
              type="button"
              onClick={() => setToDelete(true)}
              className="min-h-11 rounded-md border border-red-300 px-4 text-red-700"
            >
              Eliminar viaje
            </button>
          )}
          <Link
            to={volverA}
            className="inline-flex min-h-11 items-center rounded-md border border-slate-300 px-4"
          >
            Cancelar
          </Link>
          <button
            disabled={guardar.isPending}
            className="min-h-11 rounded-md bg-emerald-700 px-4 text-white disabled:opacity-60"
          >
            {guardar.isPending ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </form>

      {permitirEliminar && (
        <ConfirmDialog
          open={toDelete}
          title="Eliminar viaje"
          message={`¿Eliminar el viaje ${viaje?.id_viaje} (vale ${viaje?.num_vale})? Esta acción no se puede deshacer.`}
          busy={eliminar.isPending}
          onCancel={() => setToDelete(false)}
          onConfirm={() => eliminar.mutate()}
        />
      )}
    </div>
  );
}
