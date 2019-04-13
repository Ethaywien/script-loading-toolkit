
/**
 * Returns a function that pipes the input from start() to end(), resolving the value in between and returns the output of end().
 * 
 * @param  {(input:T1)=>T2|Promise<T2>} start - Beggining function to take the input
 * @param  {(arg:T2)=>T3} end - End function to produce the output
 * @returns {(input: T1) => Promise<T3>} Piped function.
 */
export const pipeResolver = 
    <T1, T2 = T1, T3 = void>(start: (input: T1) => T2 | Promise<T2>, end: (arg: T2) => T3): (input: T1) => Promise<T3> => 
        (input: T1): Promise<T3> => 
            Promise.resolve(start(input)).then(end);