---
name: js-functional-development
description: Use when writing, reviewing, or refactoring JavaScript or TypeScript in a functional style — pure functions, immutable data, array pipelines, reducers, function composition, and async flows over lists — for browsers or Node.js, including code that must stay fast on large inputs.
---

# Intent

Produce JavaScript whose calculations are pure and tested without mocks, and whose hot paths are as fast as a profiler can prove.
When entries conflict or none applies, choose readable functional code off the hot path and measured speed on it.

# Reasoning Principles

KEEP_CALCULATIONS_PURE — Keep business calculations pure, and do I/O, DOM work, and global state changes only in the outer layer that calls them.
A calculation mixed with a database call can only be tested with mocks. Mocks check calls instead of results, so they break on every refactor and miss real bugs. The cost is an outer layer that must gather every input before the call.

PASS_TIME_AND_RANDOM_IN — Pass the current time, random values, and environment settings into a calculation as arguments.
A function that calls `Date.now()`, `Math.random()`, or reads `process.env` is not pure, even with no I/O. Its tests pass or fail by the day or the machine, and its results cannot be cached. The cost is longer argument lists.

TREAT_LARGE_LOOPS_AS_HOT — Treat code as a hot path when one call handles 10,000 or more items, or when it runs on every frame, request, or event.
The performance entries below apply only there. Applied everywhere, they replace readable code with loops for no measurable gain.

CHOOSE_SPEED_ON_HOT_PATHS — Choose the faster version over the more functional one on a hot path, when the profiler shows the difference.
Each `map` or spread creates new objects, and the engine must later free them. On a hot path this cleanup causes pauses that slow the slowest requests most. The cost is code that is harder to read and to test in parts.

CHANGE_LOCAL_VALUES_IN_PLACE — Change a value in place freely when the same function created it and has not returned it yet.
Purity is about what callers can see. Copying a private array or object on every step adds work and memory, and protects no one. The cost is a bug the day the value is returned or shared without a copy.

WRITE_DEEP_RECURSION_AS_LOOP — Write recursion that can go deeper than 1,000 calls as a loop or with an explicit stack array.
Only Safari reuses the stack frame for a call in last position, which is called tail call optimization. Chrome, Node.js, and Firefox throw `RangeError: Maximum call stack size exceeded` near 10,000 calls. The cost is a loop that reads less clearly than the recursion it replaces.

PROTECT_DATA_BY_COPYING — Protect shared data by copying it before a change, or with `readonly` types, rather than with `Object.freeze`.
`Object.freeze` locks only the top level, so nested objects still change silently. Deep-freezing a whole store on every update instead blocks the UI during fast typing or dragging. The cost is that nothing stops a write at run time in plain JavaScript.

STORE_HOT_FIELDS_AS_COLUMNS — Store numeric fields of hot-path records in one TypedArray per field, such as `Float64Array`, rather than an array of objects.
Objects sit at scattered places in memory, so a loop over them keeps waiting for memory reads. One flat array per field is read in order and runs several times faster. The cost is index bookkeeping, and a record is no longer one object to pass around.

# Method

FLOW: SPLIT → COMPUTE → WIRE → [PROFILE] → VALIDATE

SPLIT — Split out side effects by listing each one the code needs before writing it, and giving each a place in the outer layer.
Done when every I/O call, time read, random value, global state change, and DOM change has its place. Found later, they already sit inside the calculations and need a rewrite to move out.

COMPUTE — Compute each result in a function that takes plain data and returns new plain data, tested without mocks.
Done when every calculation passes its tests with no mock. A test that needs a mock shows a side effect still inside the core.

WIRE — Wire the outer layer that reads inputs, calls the core, and then performs the side effects.
Done when effects happen only at the start and end of a request or job. Spread through the flow, they leave no small place to test with real services.

PROFILE — Profile a hot path change by measuring memory and time before and after it.
Done when both measurements exist from `node --cpu-prof`, `node --trace-gc`, or the DevTools Performance and Memory panels, and the better version is kept. A rewrite for style alone can add memory cleanup pauses that no test shows.

VALIDATE — Validate the code by running every check in `# Validation`, fixing each failure, and running them again until all pass.
Done when one full run passes every check.

# Output Shape

USE_COPYING_ARRAY_METHODS — Use `toSorted`, `toReversed`, `toSpliced`, and `with` on any array the function received as an argument.
`sort`, `reverse`, and `splice` change the caller's array in place. The caller's data then changes far from the cause, and caches built on it return wrong results. The cost is one new array per call, and these methods need Node.js 20 or a 2023 browser.

REPLACE_CHAINS_ON_HOT_PATHS — Replace a chain of `map`, `filter`, and `reduce` on a hot path with one `for...of` loop.
Each step in a chain builds a full new array. Two steps over one million items build two arrays of one million items that are thrown away at once. The cost is a loop whose steps can no longer be named and tested one by one.

USE_EARLY_EXIT_SEARCH — Use `find`, `some`, `every`, or a `for...of` loop with `break` when a search can stop before the end.
`forEach` and `map` always visit every item, so a match at the start still costs a full scan.

ADD_KEYS_TO_ACCUMULATOR — Add keys to a reducer's own accumulator in place, or fill a `Map`, rather than returning `{ ...acc, [key]: value }`.
The spread copies every key collected so far on each step. For 10,000 items that is about 50 million copies, and large inputs run out of memory. The cost is a reducer that is no longer pure inside, though no caller can see it.

USE_REDUCE_ONLY_FOR_FOLDS — Use `reduce` only to combine a list into one value, such as a sum or a maximum.
For lookups and groups, `Object.fromEntries`, `Object.groupBy`, and `Map.groupBy` say what they build. A `reduce` with branches and object building hides the logic and weakens TypeScript types.

PASS_REDUCE_INITIAL_VALUE — Pass an initial value to every `reduce` call.
Without it, `reduce` throws a `TypeError` on an empty array, and empty input often appears first in production.

CREATE_OBJECTS_IN_ONE_SHAPE — Create each kind of object with all its properties in the same order, using `null` for missing values.
The V8 engine keeps an internal record of each property layout, and code that sees many layouts runs slower. Adding properties under `if` statements creates a new layout for each combination. The cost is `null` fields that every reader must handle.

KEY_CACHES_BY_PRIMITIVES — Key a memoization cache by primitive values, such as an id or a joined string, rather than by a newly built object.
Two objects with the same fields are never `===` equal. A cache keyed by them misses on every call and keeps growing. The cost is a key builder to keep in step with the fields that matter.

KEEP_PIPES_SHORT — Keep a `pipe` or `compose` call to at most 6 functions, and split a longer chain into named steps with explicit types.
In long chains TypeScript quietly gives up and infers `unknown` or `any`. Type errors then pass, and editor suggestions stop working. The cost is more named helper values.

RUN_ASYNC_WITH_LIMIT — Run async work over a list through a fixed limit, such as 10 at a time with `p-limit`, when the list length comes from data.
`Promise.all` over the whole list starts every request at once. Large lists use up connections and memory, and remote services answer with rate-limit errors. The cost is a slower run on a small list than starting everything at once.

PROCESS_LARGE_INPUT_AS_STREAM — Process files, response bodies, and query results that can exceed 10 MB piece by piece, with `for await...of` or `stream.pipeline`.
Collecting them into one array or string first can crash the process when it runs out of memory. `stream.pipeline` also pauses reading while the writer catches up. The cost is code that cannot sort or look back without keeping its own buffer.

# Validation

PURITY_CHECK — Confirm no core function performs I/O, touches the DOM, or reads `Date.now()`, `new Date()`, `Math.random()`, or `process.env`.
MOCK_CHECK — Confirm no core test uses a mock, spy, or stub.
ARGUMENT_CHECK — Verify no function calls `sort`, `reverse`, `splice`, `push`, or assigns a property on an object or array it received as an argument.
RECURSION_CHECK — Confirm no recursive function can go deeper than 1,000 calls on real input.
ACCUMULATOR_CHECK — Confirm no reducer returns a spread copy of its accumulator.
REDUCE_CHECK — Verify every `reduce` call passes an initial value and combines the list into one value rather than building a lookup.
HOT_PATH_CHECK — Confirm every hot path runs in one pass, with no chained `map`, `filter`, or `reduce`.
PROFILE_CHECK — Confirm every hot path change has profiler numbers from before and after it.
SHAPE_CHECK — Verify every factory function returns an object literal that sets all its properties in a fixed order.
FREEZE_CHECK — Confirm no code relies on `Object.freeze` to protect nested data, and no store deep-freezes its state on every update.
MEMO_CHECK — Verify every memoization cache is keyed by primitive values.
PIPE_CHECK — Confirm no `pipe` or `compose` call holds more than 6 functions.
CONCURRENCY_CHECK — Confirm every `Promise.all` over a list built from data runs through a concurrency limit.
STREAM_CHECK — Confirm no input that can exceed 10 MB is collected whole into an array or string before processing.
BUILD_CHECK — Run the project's lint and test scripts, and confirm both pass.
