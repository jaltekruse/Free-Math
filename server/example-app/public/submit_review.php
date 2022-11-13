<?php
require("util.php");

session_start();
$result = $db->query("insert into reviews (reviewer_user_id, review_content, responses_response_id) values ('" .
    esc($db, $_SESSION['user_id']) . "','"  .
    esc($db, $_POST['content'])  . "','"  .
    esc($db, $_POST['response_id'])  . "')");
if (! $result) {
    echo $db->error;
} else {
    header('Location: /index.php');
}
?>
