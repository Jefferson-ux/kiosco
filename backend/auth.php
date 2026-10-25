<?php
    require_once __DIR__ . '/session.php';

    if (empty($_SESSION['token'])) {
        header('Location: ../index.php');
        exit;
    }

?>