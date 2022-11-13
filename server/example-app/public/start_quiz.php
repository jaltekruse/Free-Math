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

// TODO - check login
session_start();

$first_question_sql = "SELECT min(question_id) first_question_id FROM questions join quizzes using(quiz_id) where quiz_name = '" . esc($db, $_POST['quiz_name']) . "'";
echo $first_question_sql;
$result = $db->query($first_question_sql);
if (! $result) {
    echo $db->error;
}
if ($result->num_rows > 0) {
    $first_question = $result->fetch_assoc();
    $first_question = $first_question['first_question_id'];
    echo "first question:" . $first_question;
    $result = $db->query("update questions set active = '1' where question_id = '" . esc($db, $first_question)  . "'");
    if (! $result) {
        echo $db->error;
    }
    header('Location: /index.php');
} else {
    echo 'no problems set up for this quiz';
}
?>
