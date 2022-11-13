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

//print_r($_POST);

$next_question_sql = "SELECT min(question_id) next_question_id FROM (select question_id from questions join quizzes using(quiz_id) where question_id > " . $_POST['question_id'] . " and quiz_name = '" . esc($db, $_POST['quiz_name']) . "') as t";
//echo $first_question_sql;
$result = $db->query($next_question_sql);
if (! $result) {
    echo $db->error;
}
// agg query, it will get a result but may be null
$next_question = $result->fetch_assoc();
if (!is_null($next_question['next_question_id'])) {
    $next_question = $next_question['next_question_id'];
    //echo "next  question:" . $first_question;
    $result = $db->query("update questions set active = '0' where question_id = '" . esc($db, $_POST['question_id'])  . "'");
    if (! $result) {
        echo $db->error;
    }
    $result = $db->query("update questions set active = '1' where question_id = '" . esc($db, $next_question)  . "'");
    if (! $result) {
        echo $db->error;
    }
    header('Location: /index.php');
} else {
    echo 'no problems set up for this quiz, or the end has been reached';
}
?>
