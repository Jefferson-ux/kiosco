<?php
session_start();

// Configurar cabeceras para aceptar y devolver JSON
header("Content-Type: application/json; charset=UTF-8");

// Validar que el método sea POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Método no permitido"]);
    exit;
}

// Verificar que el token exista en la sesión
if (!isset($_SESSION["token"]) || empty($_SESSION["token"])) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "No autorizado. Token no encontrado en sesión."]);
    exit;
}

$token = $_SESSION["token"];

// Obtener el cuerpo de la petición enviada por JavaScript
$inputJSON = file_get_contents('php://input');
$input = json_decode($inputJSON, true);

$employee_code = $input['employee_code'] ?? null;
$type = $input['type'] ?? null;
$request_id = $input['request_id'] ?? null;

// Validar parámetros requeridos
if (!$employee_code || !$request_id) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Parámetros incompletos"]);
    exit;
}

// URL de la API externa de destino
$external_api_url = "http://127.0.0.1:8000/api/v1/attendance/mark";

// Preparar los datos a enviar a la API
$data = [
    "employee_code" => $employee_code,
    "type" => $type,
    "request_id" => $request_id
];

// Configurar cURL para realizar la petición POST
$ch = curl_init($external_api_url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Content-Type: application/json",
    "Accept: application/json",
    "Authorization: Bearer " . $token
]);

// Ejecutar la petición
$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curl_error = curl_error($ch);
curl_close($ch);

// Manejar errores de conexión cURL
if ($curl_error) {
    http_response_code(502);
    echo json_encode(["success" => false, "message" => "Error de conexión con el servidor de la API"]);
    exit;
}

// Retornar el código de estado y la respuesta obtenida de la API al cliente JavaScript
http_response_code($http_code);
echo $response;