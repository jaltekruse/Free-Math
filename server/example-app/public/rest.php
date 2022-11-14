<?php

header('Access-Control-Allow-Origin: localhost:3001');
header('Access-Control-Allow-Methods: GET, PUT, POST, DELETE, OPTIONS');

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

function username_to_id($username, $db) {
    $result = $db->query("select user_id from users where username='" . esc($db, $username) . "'");
    $user_id = $result->fetch_assoc()['user_id'];

    if (! $user_id) {
        $result = $db->query("insert into users (username) values ('" . esc($db, $username) . "')");

        $result = $db->query("select user_id from users where username='" . esc($db, $username) . "'");
        $user_id = $result->fetch_assoc()['user_id'];
    }
    return $user_id;
}

function join_code_to_quiz_id($join_code, $db) {
    $result = $db->query("select quiz_id from quizzes where join_code='" . esc($db, $join_code) . "'");
    $quiz_id = $result->fetch_assoc()['quiz_id'];

    return $quiz_id;
}

// Takes raw data from the request
$json = file_get_contents('php://input');

// Converts it into a PHP object
$data = json_decode($json);


if ($data->verb == 'create_quiz') {
    $user_id = username_to_id($data->username, $db);
    session_start();
    $join_code = substr(dechex(random_int(10000000, 20000000)), 0, 8);
    $result = $db->query("insert into quizzes(teacher_user_id, join_code, quiz_name, active) values ('" .
        esc($db, $user_id) . "','"  .
        esc($db, $join_code)  . "','"  .
        esc($db, $data->quiz_name)  . "','"  .
        esc($db, '0')  . "')");
    if (! $result) {
        echo $db->error;
    } else {
        $ret = [];
        $ret['join_code'] = $join_code;
        echo json_encode($ret);
    }
} else if ($data->verb == 'list_quizzes') {
    $user_id = username_to_id($data->username, $db);
    $result = $db->query("select join_code, quiz_name from quizzes where teacher_user_id='" . esc($db, $user_id) . "'");
    $res_array = [];
    while( $row = $result->fetch_assoc()) {
        $res_array[] = $row;
    }
    echo json_encode($res_array);
} else if ($data->verb == 'create_question') {
    $quiz_id = join_code_to_quiz_id($data->quiz_join_code, $db);

    session_start();
    $result = $db->query("insert into questions(question_title, question_content, quiz_id, active) values ('" .
        esc($db, $data->question_title) . "','"  .
        esc($db, $data->question_content)  . "','"  .
        esc($db, $quiz_id)  . "','"  .
        esc($db, '0')  . "')");
    if (! $result) {
        echo $db->error;
    } else {
        $ret = [];
        $ret['question_id'] = $db->insert_id;
        echo json_encode($ret);
    }
}
?>
