<?php
    session_start();

    if (empty($_SESSION["token"])) {
        header("Location: ../index.php");
        exit;
    }

?>