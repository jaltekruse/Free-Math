// TODO NOTE - testing utils only so far, may want to keep separate file for prod utils if they come up

var PROBLEMS = 'PROBLEMS';
var STEPS = 'STEPS';
var STEP_ID = 'STEP_ID';

// copied from here, didn't seem worth adding a dependency, I'm sure the JS people will cure me of that eventually...
// https://github.com/substack/deep-freeze/blob/master/index.js
function deepFreeze (o) {
  Object.freeze(o);

  Object.getOwnPropertyNames(o).forEach(function (prop) {
    if (o.hasOwnProperty(prop)
    && o[prop] !== null
    && (typeof o[prop] === "object" || typeof o[prop] === "function")
    && !Object.isFrozen(o[prop])) {
      deepFreeze(o[prop]);
    }
  });

  return o;
};

// Comparision function that ignores randomly generated IDs
// Still checks that the IDs are set and non-zero, because the fact that
// they are present is important, there values just aren't deterministic.
function compareOverallEditorState(expected, actual) {
    try {
    expect({...actual, DOC_ID : null, PROBLEMS : null}).toEqual({...expected, DOC_ID : null, PROBLEMS : null});
    expected[PROBLEMS].forEach(function (problem, index, arr) {
        compareSingleProblem(problem, actual[PROBLEMS][index]);
    });
    } catch(ex) {
        console.log(ex);
        // Note: diff view is more useful than the low level comparison error for debugging:
        expect(actual).toEqual(expected);
    }
}

// similar to above function for overall editor state, but just for a single problem
function compareSingleProblem(expected, actual) {
    expect({...actual, STEPS : null}).toEqual({...expected, STEPS : null});
    expected[STEPS].forEach(function (step, index, arr) {
        expect({...actual[STEPS][index], STEP_ID : null}).toEqual({...step, STEP_ID: null});
    });
}

export { deepFreeze, compareOverallEditorState};
