<?php

header('Access-Control-Allow-Origin: *');
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

// returns user_id
function authenticate_or_create($db, $username){
    $password_check = "SELECT * FROM users WHERE username = '" . esc($db, $username) . "'";
    $result = $db->query($password_check);
    if ($result->num_rows > 0) {
        return $result->fetch_assoc()['user_id'];
    } else {
        $result = $db->query("insert into users (username) values ('" . esc($db, $username)  . "')");
        if (! $result) {
            echo $db->error;
        }
        return $db->insert_id;
    }
}

session_start();
if ($_SERVER['REQUEST_METHOD'] == 'POST'){
    // differentiate login/logout
    if (isset($_POST['username'])) {
        $username = $_POST['username'];
        $user_id = authenticate_or_create($db, $username);
        $authenticated = true;
        session_start();
        $_SESSION['username'] = $username;
        $_SESSION['user_id'] = $user_id;
        $_SESSION['quiz_name'] = 'default quiz';
    }
}

?>
<h2>Free Math Live</h2>
<?php
if (isset($_SESSION['username'])) {
?>
    <p> logged in as <?php echo $_SESSION['username']  . ' ('  . $_SESSION['user_id'] . ')'?> </p>
<?php
}
if (! isset($_SESSION['username'])) {
?>
    <form action="" method = "POST">
    Username&nbsp;<input type="text" name="username"/><br />
    <input type="submit" value="login"/>
    </form>
<?php
} else if (isset($_SESSION['username']) && $_SESSION['username'] == 'testing_teacher') {

    $get_active_question = "SELECT * from questions join quizzes using(quiz_id) where active = '1' " .
        "and quiz_name = '" . esc($db, $_SESSION['quiz_name']). "'";
    $result = $db->query($get_active_question);
    if (! $result) {
        echo $db->error;
    }
    // is there an active question?
    if ($result->num_rows > 0) {
        $question = $result->fetch_assoc();
        // give teachers for to move to next question
        ?>
        Quiz already started <br />
        Current question titled: <?php echo $question['question_title'] ?> </br>
        <form action="/next_question.php" method="POST">
        Quiz Name &nbsp;<input type="text" value="default quiz" name="quiz_name" readonly="readonly"/>
        <input type="hidden" value="<?php echo $question['question_id']?>" name="question_id"/>
        <input type="submit" value="move to next question"/>
        </form>

          
        <?php 
        $first_question_sql = "SELECT * FROM responses join users using(user_id) join questions on questions.question_id = responses.questions_question_id join quizzes using(quiz_id) left join reviews on reviews.responses_response_id = responses.response_id where quiz_name = '" . esc($db, $_SESSION['quiz_name']) . "' order by question_id, user_id";
        // echo $first_question_sql;
        $result = $db->query($first_question_sql);
        if (! $result) {
            echo $db->error;
        }
        $current_problem = NULL;
        $current_student = NULL;
        echo "Num reviews: " . $result->num_rows;
        for ($i = 0; $i < $result->num_rows; $i++) {
            $response = $result->fetch_assoc();
            if ($response['question_id'] != $current_problem) {
                    $current_problem = $response['question_id'];
                ?>
                <h3><?php echo $response['question_title']?></h3>
                <?php echo $response['question_content']?> <br /></br>
            <?php
            }
            if ($response['user_id'] != $current_student) {
                $current_student = $response['user_id'];
            ?>
                <b>Response from <?php echo $response['username']?></b></br></br>
                <?php echo $response['content']?><br /></br> 
                <b>Reviews</b></br> </br> 
            <?php
            }
            if (!is_null($response['reviewer_user_id'])) {
            ?> 
                <p><?php echo $response['review_content']?></p>
                <br />
                <?php
            }
        }
    } else {
        // give teachers form to start the quiz
?>
        Signed in as a teacher
        <form action="/start_quiz.php" method="POST">
        Quiz Name &nbsp;<input type="text" value="default quiz" name="quiz_name" readonly="readonly"/>
        <input type="submit" value="start quiz"/>
        </form>
    <?php
    }
} else if (isset($_SESSION['quiz_name'])) {
    // get current activity, question or review page
         
    $get_active_question = "SELECT * from questions join quizzes using(quiz_id) where active = '1' " .
        "and quiz_name = '" . esc($db, $_SESSION['quiz_name']). "'";
    $result = $db->query($get_active_question);
    if (! $result) {
        echo $db->error;
    }
    $question = $result->fetch_assoc();
    // is there an active question?
    if ($result->num_rows > 0) {
        // get all reviews already done by this user
        $get_completed_reviews = "SELECT * from questions join quizzes using(quiz_id) join responses on questions.question_id = responses.questions_question_id  " .
            "join reviews on reviews.responses_response_id = responses.response_id " .
            "where active = '1' " .
            "and quiz_name = '" . esc($db, $_SESSION['quiz_name']). "' and reviewer_user_id = '" . $_SESSION['user_id'] . "'";
        //echo $get_active_question;
        $result = $db->query($get_completed_reviews);
        if (! $result) {
            echo $db->error;
        }

        $peers_graded = array();
        for ($i = 0; $i < $result->num_rows; $i++) {
            $completed_review = $result->fetch_assoc();
            $peers_graded[$completed_review['user_id']] = TRUE;
        }

        /*
        echo '<br /> Peers already reviewed by';
        echo '<br />';
        print_r($peers_graded);
        echo '<br />';
        echo '<br />';
         */
        
        $get_active_question = "SELECT * from questions join quizzes using(quiz_id) join responses on questions.question_id = responses.questions_question_id  where active = '1' " .
            "and quiz_name = '" . esc($db, $_SESSION['quiz_name']). "' and user_id = '" . $_SESSION['user_id'] . "'";
        //echo $get_active_question;
        $result = $db->query($get_active_question);
        if (! $result) {
            echo $db->error;
        }

        // did this user answer the current question already
        if ($result->num_rows != 0) {
            // get a response that isn't theirs, or one they already reviewed
            // give up on proper single sql for now, do it in a loop
            // TODO - come back and figure this out
            /*
            $get_active_question = "SELECT * from questions join quizzes using(quiz_id) join responses on questions.question_id = responses.questions_question_id left join reviews on reviews.responses_response_id = responses.response_id where active = '1' " .
                "and quiz_name = '" . esc($db, $_SESSION['quiz_name']). "' and user_id != '" . $_SESSION['user_id'] . "' " .
                "and (0 = (select count(*) from questions join quizzes using(quiz_id) join responses on questions.question_id = responses.questions_question_id join reviews on reviews.responses_response_id = responses.response_id where active = '1' " .
                "and quiz_name = '" . esc($db, $_SESSION['quiz_name']). "' and reviewer_user_id =  '" . $_SESSION['user_id'] . "') or review_id not in (select user_id from questions join quizzes using(quiz_id) join responses on questions.question_id = responses.questions_question_id left join reviews on reviews.responses_response_id = responses.response_id where active = '1' " .
                "and quiz_name = '" . esc($db, $_SESSION['quiz_name']). "' and reviewer_user_id = '" . esc($db, $_SESSION['user_id']) . "'))";
             */

            $get_active_question = "SELECT * from questions join quizzes using(quiz_id) join responses on questions.question_id = responses.questions_question_id left join reviews on reviews.responses_response_id = responses.response_id where active = '1' " .
                "and quiz_name = '" . esc($db, $_SESSION['quiz_name']). "' and user_id != '" . $_SESSION['user_id'] . "' ";
            //echo $get_active_question;
            $result = $db->query($get_active_question);
            if (! $result) {
                echo $db->error;
            }
            $resonse_to_review = FALSE;
            // loop through to find peer response ungraded by this student yet if it exists
            for ($i = 0; $i < $result->num_rows; $i++) {
                $candidate = $result->fetch_assoc();

                /*
                echo '<br />';
                print_r($candidate);
                echo '<br />';
                echo '<br />';
                 */
                if (! isset($peers_graded[$candidate['user_id']])) {
                    $response_to_review = $candidate;
                    break;
                }
            }
            // echo 'see a peers work for review';
            if ($response_to_review) {
                //print_r($response_to_review); 
                ?>
                <h3><?php echo $response_to_review ['question_title']?></h3>
                <p><?php echo $response_to_review ['question_content']?></p>
                Response </br>
                <p><?php echo $response_to_review ['content']?></p>
                <form action="/submit_review.php" method = "POST">
                Review Comments </br>
                <textarea name="content"></textarea><br />
                <input type="hidden" name="response_id" value="<?php echo $response_to_review['response_id']?>"/>
                <input type="submit"/>
                </form>
                <?php
            } else {
                echo ' No new peer work to review yet, refresh the page to check back in a little bit';
            }
        } else {
        ?>
            <h3><?php echo $question['question_title']?></h3>
            <p><?php echo $question['question_content']?></p>
            
            <form action="/submit_response.php" method = "POST">
            Answer </br>
            <textarea name="content"></textarea><br />
            <input type="hidden" name="question_id" value="<?php echo $question['question_id']?>"/>
            <input type="submit"/>
            </form>
        <?php
        }
    } else {
    ?>
        Signed in as <?php echo $_SESSION['username'] ?>, waiting for quiz to start.
    <?php
    }
} else {
?>
    Signed in as <?php echo $_SESSION['username'] ?>, waiting for quiz to start.
<?php
}
?>
<br />
<form action="/logout.php" method = "POST">
<input type="submit" value="logout"/>
</form>
