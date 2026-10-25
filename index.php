<?php
    require_once __DIR__ . '/backend/session.php';
    $error = $_SESSION["error"] ?? null;
    unset($_SESSION["error"]); // se borra para que salga solo una vez
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Iniciar Sesión</title>
    <link rel="stylesheet" href="styles/global.css">
    <link rel="stylesheet" href="styles/auth.css">
</head>
<body class="auth-page">
    <form class="auth-form" action="backend/login.php" method="POST">
        <h1>Iniciar Sesión</h1>
        <p class="auth-subtitle">Ingresa tus credenciales para continuar</p>
        <?php if ($error): ?>
            <div class="auth-error" role="alert">
                <?= htmlspecialchars($error) ?>
            </div>
        <?php endif; ?>

        <div class="auth-field">
            <label for="email">Correo Electrónico</label>
            <input id="email" name="email" type="email" placeholder="correo@ejemplo.com" required>
        </div>

        <div class="auth-field">
            <label for="password">Contraseña</label>
            <input id="password" name="password" type="password" placeholder="••••••••" required>
        </div>

        <input type="submit" value="Entrar">
    </form>
</body>
</html>