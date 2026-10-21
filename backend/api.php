<?php
    session_start();

    if ($_SERVER["REQUEST_METHOD"] !== "POST") {
        header("Location: ../index.php");
        exit;
    }

    $email    = trim($_POST["email"] ?? "");
    $password = $_POST["password"] ?? "";

    if ($email === "" || $password === "") {
        $_SESSION["error"] = "Completa todos los campos";
        header("Location: ../index.php");
        exit;
    }   // <- se cierra aquí

    // 1. Inicializar cURL
    $url = "http://127.0.0.1:8000/api/v1/login";

    $ch = curl_init($url);

    $body = json_encode([
        "email"    => $email,
        "password" => $password
    ]);

    // 2. Configurar opciones
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Accept: application/json'
    ]);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);

    // 3. Ejecutar la petición y obtener la respuesta
    $response = curl_exec($ch);
    $curlFail = curl_errno($ch);

    if ($curlFail || $response === false) {
        $_SESSION["error"] = "No se pudo conectar con el servidor";
        header("Location: ../index.php");
        exit;
    }

    // 4. Convertir JSON a objeto de PHP
    $data = json_decode($response);

    if ($data && !empty($data->success) && !empty($data->token)) {
        session_regenerate_id(true);
        $_SESSION["token"] = $data->token;
        $_SESSION["user"]  = $data->user;
        header("Location: ../kiosco/kiosco.php");
        exit;
    }

    $_SESSION["error"] = "Correo o contraseña incorrectos";
    header("Location: ../index.php");
    exit;