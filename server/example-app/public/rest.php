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

// Takes raw data from the request
$json = file_get_contents('php://input');

// Converts it into a PHP object
$data = json_decode($json);


if ($data->verb == 'create_quiz') {
    /* TODO put the above back in util.php after fixing server config */
    $result = $db->query("select user_id from users where username='" . esc($db, $data->username) . "'");
    $user_id = $result->fetch_assoc()['user_id'];

    if (! $user_id) {
        $result = $db->query("insert into users (username) values ('" . esc($db, $data->username) . "')");

        $result = $db->query("select user_id from users where username='" . esc($db, $data->username) . "'");
        $user_id = $result->fetch_assoc()['user_id'];
    }

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
    $result = $db->query("select join_code, quiz_name from quizzes"); // where username='" . esc($db, $data->username) . "'");
    $res_array = [];
    while( $row = $result->fetch_assoc()) {
        $res_array[] = $row;
    }
    echo json_encode($res_array);
}
?>
