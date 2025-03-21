<!-- filepath: /Users/arthurevain/Documents/Code/SDT/submit_form.php -->
<?php
session_start();

$servername = "mariadb-projet.enst.fr";
$username = "perso-evain-24";
$password = "KDf8gsHNFXdv";
$dbname = "perso_evain_24";

// Créer une connexion
$conn = new mysqli($servername, $username, $password, $dbname);

// Vérifier la connexion
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $name = trim($_POST['name']);
    $email = trim($_POST['email']);
    $message = trim($_POST['message']);

    if (empty($name) || empty($email)) {
        $conn->close();
        header("Location: field_error2.php");
        exit();
    }

    $sql = "INSERT INTO submissions (name, email, message, plan) VALUES ('$name', '$email', '$message', 2)";

    if ($conn->query($sql) === TRUE) {
        $_SESSION['message'] = "Votre demande a bien été transmise.";
        $conn->close();
        header("Location: confirmation.php");
        exit();
    } else {
        $_SESSION['message'] = "Erreur lors de la transmission de votre demande.";
        $conn->close();
        header("Location: echec.php");
        exit();
    }
}
?>