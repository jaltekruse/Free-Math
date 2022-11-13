<?php

/* TODO put back in util.php after fixing server config */

// connect to DB
try {
    $db = new mysqli('mysql', 'root', 'password', 'free_math');
        if ($db->connect_error) {
            echo 'error connecting to database: ' . $db->connect_error;
        }   
} catch (Exception $ex) {
        echo "error: other error " . $ex->getMessage();
}


// util functions
function esc($db, $key){
    return mysqli_real_escape_string($db, $key);
}

/* TODO put the above back in util.php after fixing server config */


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
