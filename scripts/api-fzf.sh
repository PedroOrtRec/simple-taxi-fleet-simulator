#!/usr/bin/env bash

# =============================================================================
# Simple Taxi Fleet Simulator - Interactive API Runner with FZF & HTTPie
# =============================================================================

set -e

BASE_URL="${API_URL:-http://localhost:3000}"

# Verificar herramientas requeridas
if ! command -v http &>/dev/null && ! command -v httpie &>/dev/null; then
  echo "Error: 'httpie' no está instalado. Instálalo con: brew install httpie"
  exit 1
fi

if ! command -v fzf &>/dev/null; then
  echo "Error: 'fzf' no está instalado. Instálalo con: brew install fzf"
  exit 1
fi

HTTP_CMD="http"
if ! command -v http &>/dev/null; then
  HTTP_CMD="httpie"
fi

print_header() {
  clear
  echo "============================================================"
  echo " 🚖 TAXI FLEET SIMULATOR - INTERACTIVE API EXPLORER"
  echo " Base URL: $BASE_URL"
  echo "============================================================"
  echo ""
}

run_full_flow() {
  echo "🚀 Ejecutando Flujo Completo Automático..."
  echo ""

  echo "1. Creando Conductor (PostgreSQL)..."
  DRIVER_RES=$($HTTP_CMD POST "$BASE_URL/drivers" name="Carlos Sainz" status="AVAILABLE")
  echo "$DRIVER_RES"
  DRIVER_ID=$(echo "$DRIVER_RES" | jq -r '.id // empty')
  if [ -z "$DRIVER_ID" ]; then
    echo "❌ Error al crear conductor."
    return
  fi
  echo " Conductor ID: $DRIVER_ID"
  echo ""

  echo "2. Creando Vehículo (PostgreSQL)..."
  VEHICLE_RES=$($HTTP_CMD POST "$BASE_URL/vehicles" plate="9988-XYZ" licenseNumber="TX-MAD-01" status="AVAILABLE")
  echo "$VEHICLE_RES"
  VEHICLE_ID=$(echo "$VEHICLE_RES" | jq -r '.id // empty')
  echo " Vehículo ID: $VEHICLE_ID"
  echo ""

  echo "3. Asignando Vehículo a Conductor..."
  $HTTP_CMD PATCH "$BASE_URL/drivers/$DRIVER_ID" assignedVehicleId:="$VEHICLE_ID"
  echo " Vehículo asignado con éxito."
  echo ""

  echo "4. Solicitando Servicio de Taxi (Redis - PENDING)..."
  SHIFT_RES=$($HTTP_CMD POST "$BASE_URL/shifts" clientName="Pedro Ortega" from="Puerta del Sol" to="Aeropuerto T4")
  echo "$SHIFT_RES"
  SHIFT_ID=$(echo "$SHIFT_RES" | jq -r '.id // empty')
  echo " Turno ID: $SHIFT_ID"
  echo ""

  echo "5. Consultando Turno en Redis..."
  $HTTP_CMD GET "$BASE_URL/shifts/$SHIFT_ID"
  echo ""

  echo "6. Conductor Acepta Turno (Redis -> ONTHEWAY, PostgreSQL -> Flota BUSY)..."
  $HTTP_CMD POST "$BASE_URL/shifts/$SHIFT_ID/accept" driverId:="$DRIVER_ID"
  echo ""

  echo "7. Verificando estado BUSY en PostgreSQL..."
  $HTTP_CMD GET "$BASE_URL/drivers/$DRIVER_ID"
  echo ""

  echo "8. Completando Turno (Mueve a MongoDB, libera PostgreSQL y borra de Redis)..."
  $HTTP_CMD POST "$BASE_URL/shifts/$SHIFT_ID/complete" fare:=35.50
  echo ""

  echo "9. Verificando que el Turno se borró de Redis (esperado 404)..."
  $HTTP_CMD --ignore-stdin --check-status GET "$BASE_URL/shifts/$SHIFT_ID" || true
  echo ""

  echo "10. Consultando Histórico en MongoDB..."
  $HTTP_CMD GET "$BASE_URL/shift-histories"
  echo ""
  echo "🎉 ¡Flujo completo ejecutado con éxito!"
}

while true; do
  print_header

  OPTIONS=$(cat <<'EOF'
1  | FLOW     | E2E Flow             | Ejecutar flujo completo interactivo (Driver -> Shift -> Archive)
2  | PING     | GET /ping            | Verificar estado y conectividad del servidor
3  | DRIVERS  | GET /drivers         | Listar todos los conductores (PostgreSQL)
4  | DRIVERS  | POST /drivers        | Crear un nuevo conductor (PostgreSQL)
5  | DRIVERS  | GET /drivers/:id     | Consultar detalle de un conductor (PostgreSQL)
6  | DRIVERS  | PATCH /drivers/:id   | Modificar estado o vehículo asignado (PostgreSQL)
7  | DRIVERS  | DELETE /drivers/:id  | Dar de baja a un conductor (PostgreSQL)
8  | VEHICLES | GET /vehicles        | Listar todos los vehículos (PostgreSQL)
9  | VEHICLES | POST /vehicles       | Crear un nuevo vehículo (PostgreSQL)
10 | VEHICLES | GET /vehicles/:id    | Consultar detalle de un vehículo (PostgreSQL)
11 | SHIFTS   | POST /shifts         | Solicitar un nuevo servicio (Redis - PENDING)
12 | SHIFTS   | GET /shifts/:id      | Consultar estado activo en tiempo real (Redis)
13 | SHIFTS   | POST /accept         | Conductor acepta turno (Redis ONTHEWAY + Postgres BUSY)
14 | SHIFTS   | POST /complete       | Finalizar turno (MongoDB FINISHED + Libera Flota + Borra Redis)
15 | HISTORY  | GET /shift-histories | Listar histórico de turnos archivados (MongoDB)
16 | USERS    | GET /users           | Listar operadores (In-Memory DB)
17 | USERS    | POST /users          | Registrar nuevo operador (In-Memory DB)
0  | EXIT     | Salir                | Salir del selector
EOF
)

  CHOICE=$(echo "$OPTIONS" | fzf \
    --header="Selecciona una operación con las flechas o escribe para filtrar:" \
    --prompt="API Endpoint > " \
    --delimiter='|' \
    --with-nth=2,3,4 \
    --preview-window=down:3:wrap \
    --preview='echo "Opción {1}: {4}"' \
    | awk '{print $1}')

  if [ -z "$CHOICE" ] || [ "$CHOICE" = "0" ]; then
    echo "Saliendo..."
    break
  fi

  echo ""
  echo "--- Ejecutando Opción $CHOICE ---"
  echo ""

  case "$CHOICE" in
    1)
      run_full_flow
      ;;
    2)
      $HTTP_CMD GET "$BASE_URL/ping"
      ;;
    3)
      $HTTP_CMD GET "$BASE_URL/drivers"
      ;;
    4)
      read -rp "Nombre del conductor [Carlos Sainz]: " d_name
      d_name="${d_name:-Carlos Sainz}"
      $HTTP_CMD POST "$BASE_URL/drivers" name="$d_name" status="AVAILABLE"
      ;;
    5)
      read -rp "ID del conductor [1]: " d_id
      d_id="${d_id:-1}"
      $HTTP_CMD GET "$BASE_URL/drivers/$d_id"
      ;;
    6)
      read -rp "ID del conductor [1]: " d_id
      d_id="${d_id:-1}"
      read -rp "Nuevo estado (AVAILABLE / BUSY) [AVAILABLE]: " d_status
      d_status="${d_status:-AVAILABLE}"
      $HTTP_CMD PATCH "$BASE_URL/drivers/$d_id" status="$d_status"
      ;;
    7)
      read -rp "ID del conductor a eliminar: " d_id
      if [ -n "$d_id" ]; then
        $HTTP_CMD DELETE "$BASE_URL/drivers/$d_id"
      fi
      ;;
    8)
      $HTTP_CMD GET "$BASE_URL/vehicles"
      ;;
    9)
      read -rp "Matrícula [1234-XYZ]: " v_plate
      v_plate="${v_plate:-1234-XYZ}"
      read -rp "Licencia [TX-100]: " v_lic
      v_lic="${v_lic:-TX-100}"
      $HTTP_CMD POST "$BASE_URL/vehicles" plate="$v_plate" licenseNumber="$v_lic" status="AVAILABLE"
      ;;
    10)
      read -rp "ID del vehículo [1]: " v_id
      v_id="${v_id:-1}"
      $HTTP_CMD GET "$BASE_URL/vehicles/$v_id"
      ;;
    11)
      read -rp "Nombre del cliente [Pedro Ortega]: " c_name
      c_name="${c_name:-Pedro Ortega}"
      read -rp "Origen [Puerta del Sol]: " s_from
      s_from="${s_from:-Puerta del Sol}"
      read -rp "Destino [Aeropuerto T4]: " s_to
      s_to="${s_to:-Aeropuerto T4}"
      $HTTP_CMD POST "$BASE_URL/shifts" clientName="$c_name" from="$s_from" to="$s_to"
      ;;
    12)
      read -rp "ID del turno (número/timestamp): " s_id
      if [ -n "$s_id" ]; then
        $HTTP_CMD GET "$BASE_URL/shifts/$s_id"
      fi
      ;;
    13)
      read -rp "ID del turno a aceptar: " s_id
      read -rp "ID del conductor que acepta [1]: " s_driver
      s_driver="${s_driver:-1}"
      if [ -n "$s_id" ]; then
        $HTTP_CMD POST "$BASE_URL/shifts/$s_id/accept" driverId:="$s_driver"
      fi
      ;;
    14)
      read -rp "ID del turno a completar: " s_id
      read -rp "Importe del trayecto (€) [25.0]: " s_fare
      s_fare="${s_fare:-25.0}"
      if [ -n "$s_id" ]; then
        $HTTP_CMD POST "$BASE_URL/shifts/$s_id/complete" fare:="$s_fare"
      fi
      ;;
    15)
      $HTTP_CMD GET "$BASE_URL/shift-histories"
      ;;
    16)
      $HTTP_CMD GET "$BASE_URL/users"
      ;;
    17)
      read -rp "Nombre del operador [Central]: " u_name
      u_name="${u_name:-Central}"
      read -rp "Email [admin@taxifleet.com]: " u_email
      u_email="${u_email:-admin@taxifleet.com}"
      read -rp "Password [secret123]: " u_pass
      u_pass="${u_pass:-secret123}"
      $HTTP_CMD POST "$BASE_URL/users" name="$u_name" email="$u_email" password="$u_pass" role="OPERATOR"
      ;;
    *)
      echo "Opción no reconocida."
      ;;
  esac

  echo ""
  read -rp "Presiona [Enter] para continuar..." _
done
