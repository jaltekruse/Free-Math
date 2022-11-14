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

function get_question_id($quiz_id, $question_title, $db) {
    $sql = "select question_id from questions where quiz_id='" . esc($db, $quiz_id) . "' " .
        "and question_title='" . esc($db, $question_title) . "'";

    //echo $sql;
    $result = $db->query($sql);
    $question_id = $result->fetch_assoc()['question_id'];

    return $question_id;
}

// Takes raw data from the request
$json = file_get_contents('php://input');

// Converts it into a PHP object
$data = json_decode($json);


if ($data->verb == 'create_quiz') {
    $user_id = username_to_id($data->username, $db);
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

    $result = $db->query("insert into questions(question_title, question_content, quiz_id, active) values ('" .
        esc($db, $data->question_title) . "','"  .
        esc($db, $data->question_content)  . "','"  .
        esc($db, $quiz_id)  . "','"  .
        esc($db, '0')  . "') on duplicate key " .
        "update question_content = '" . esc($db, $data->question_content) . "'"
    );
    if (! $result) {
        echo $db->error;
    } else {
        $ret = [];
        $ret['question_id'] = $db->insert_id;
        echo json_encode($ret);
    }
} else if ($data->verb == 'create_response') {
    $quiz_id = join_code_to_quiz_id($data->quiz_join_code, $db);
    $user_id = username_to_id($data->username, $db);
    $question_id = get_question_id($quiz_id, $data->question_title, $db);
    $question_content = esc($db, $data->question_content);

    $sql = "insert into responses(content, user_id, questions_question_id) values ('" .
        $question_content . "','"  .
        esc($db, $user_id)  . "','"  .
        esc($db, $question_id) . "') on duplicate key " .
        "update content = '" . $question_content . "'";
    //echo $sql;
    $result = $db->query($sql);
    if (! $result) {
        echo $db->error;
    } else {
        $ret = [];
        $ret['question_id'] = $db->insert_id;
        echo json_encode($ret);
    }
} else if ($data->verb == 'get_question_content') {
    $quiz_id = join_code_to_quiz_id($data->quiz_join_code, $db);

    $result = $db->query("select question_title, question_content, quiz_id, active from questions where " .
        "question_title='" . esc($db, $data->question_title) . "' AND "  .
        "quiz_id='" . esc($db, $quiz_id)  . "'");
    if (! $result) {
        echo $db->error;
    } else {
        echo json_encode($result->fetch_assoc());
    }
} else if ($data->verb == 'get_quiz_content') {
    $quiz_id = join_code_to_quiz_id($data->quiz_join_code, $db);
    // TODO - probably want this to behave differently for students vs teachers
    // yup, also should respect the 'active' flag
    $user_id = username_to_id($data->username, $db);

    $sql = "select question_title, case when (content is not null) then content else question_content end as question_content, quiz_id, active from questions " . 
        "left join responses on questions_question_id = question_id " .
        "and user_id='" . esc($db, $user_id)  . "' " .
        "where " .
        "quiz_id='" . esc($db, $quiz_id)  . "' ";
    //echo $sql;

    $result = $db->query($sql);
    if (! $result) {
        echo $db->error;
    } else {
        $res_array = [];
        while( $row = $result->fetch_assoc()) {
            $res_array[] = $row;
        }
        echo json_encode($res_array);
    }
} else if ($data->verb == 'get_all_responses') {
    $quiz_id = join_code_to_quiz_id($data->quiz_join_code, $db);
    // TODO - probably want this to behave differently for students vs teachers
    // yup, also should respect the 'active' flag
    $user_id = username_to_id($data->username, $db);

    $sql = "select question_title, case when (content is not null) then content else question_content end as question_content, quiz_id, username, active from questions " . 
        "left join responses on questions_question_id = question_id " .
        "join users using(user_id) " .
        "where " .
        "quiz_id='" . esc($db, $quiz_id)  . "' order by question_id asc";
    //echo $sql;

    $result = $db->query($sql);
    if (! $result) {
        echo $db->error;
    } else {
        $res_array = [];
        while( $row = $result->fetch_assoc()) {
            $res_array[] = $row;
        }
        echo json_encode($res_array);
    }
}
?>
