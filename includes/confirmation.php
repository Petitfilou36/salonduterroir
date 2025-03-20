<?php
session_start();
$message = '';
if (isset($_SESSION['message'])) {
    $message = $_SESSION['message'];
    unset($_SESSION['message']);
}
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Confirmation</title>
    <!-- Ajoutez vos autres balises head ici -->
</head>
<body>
    <?php if (!empty($message)): ?>
        <div class="alert alert-success">
            <?php echo $message; ?>
        </div>
    <?php endif; ?>
    <p>Merci pour votre soumission. Vous pouvez retourner à la <a href="index.html">page d'accueil</a>.</p>
</body>
</html>