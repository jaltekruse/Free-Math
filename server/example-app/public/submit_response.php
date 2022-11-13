<?php
require("util.php");

session_start();
$result = $db->query("insert into responses (user_id, content, questions_question_id) values ('" .
    esc($db, $_SESSION['user_id']) . "','"  .
    esc($db, $_POST['content'])  . "','"  .
    esc($db, $_POST['question_id'])  . "')");
if (! $result) {
    echo $db->error;
} else {
    header('Location: /index.php');
}
?>
