/// <reference types="node" />

// Usage: ts-node scripts.generate.ts

import assert = require("assert");
import fs = require("fs");

const callbackParameterName = arrayToFunction(["a", "b", "c", "d", "e"]);
const callbackParameterTypeName = arrayToFunction(["A", "B", "C", "D", "E"]);
const parameterName = arrayToFunction(["p0", "p1", "p2", "p3"]);
const parameterTypeName = arrayToFunction(["P0", "P1", "P2", "P3"]);

fs.writeFileSync("index.d.ts", generateAll());

function generateBackoffInstance() {
    let s = "export interface BackoffInstance {";
    for (let nCallbackParameters = 1; nCallbackParameters < 5; nCallbackParameters++) {
        for (let nParameters = 0; nParameters < 4; nParameters++) {
            for (const intermediate of [false, true]) {
                s += "\n\t";
                s += generateSingle(nCallbackParameters, nParameters, intermediate);
            }
        }
    }
    s += "\n}";
    return s;
}

function generateSingle(nCallbackParameters: number, nParameters: number, intermediate: boolean): string {
    let s = "<";
    s += join(nCallbackParameters, callbackParameterTypeName);
    if (nParameters) {
        s += ", ";
        s += join(nParameters, parameterTypeName);
    }
    s += ">(\n\t\tfn: ("
    for (let i = 0; i < nParameters; i++) {
        s += `${parameterName(i)}: ${parameterTypeName(i)}, `;
    }
    s += "callback: (";
    s += join(nCallbackParameters, i => `${callbackParameterName(i)}: ${callbackParameterTypeName(i)}`);
    s += ") => void) => void,\n\t\t";

    for (let i = 0; i < nParameters; i++) {
        s += `${parameterName(i)}: ${parameterTypeName(i)},\n\t\t`;
    }

    if (intermediate) {
        s += "intermediate: BackoffIntermediate<A>,\n\t\t";
    }

    s += "callback: (";
    switch (nCallbackParameters) {
        case 1:
            s += "a: A, b: null, priorErrors: A[] | undefined";
            break;
        case 2:
            s += "a: A, b: B | null | undefined, priorErrors: A[] | undefined";
            break;
        default:
            s += join(nCallbackParameters, i => {
                switch (i) {
                    case 0:
                        return "a: A";
                    case 1:
                        return "b: B | null | undefined";
                    case 2:
                        return "priorErrorsOrC: C | A[] | undefined";
                    default:
                        return `${callbackParameterName(i)}: ${callbackParameterTypeName(i)} | undefined`;
                }
            });
            break;
    }

    s += ") => void): void;";
    return s;
}

function join(length: number, generate: (i: number) => string, joiner = ", "): string {
    return mkArray(length, generate).join(joiner);
}

function mkArray<T>(length: number, generate: (i: number) => T): T[] {
    const a = new Array(length);
    for (let i = 0; i < length; i++) {
        a[i] = generate(i);
    }
    return a;
}

function arrayToFunction<T>(array: readonly T[]): (index: number) => T {
    return index => {
        const value = array[index];
        assert(!!value);
        return value;
    };
}

function generateAll(): string {
    return `// Type definitions for oibackoff 1.0
// Project: https://github.com/chilts/oibackoff
// Definitions by: Joshua DeVinney <https://github.com/geoffreak>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped

// Generated by DefinitelyTyped/types/oibackoff/scripts/generate.ts

export function backoff(opts?: BackoffOptions): BackoffInstance;

export interface BackoffOptions {
    maxTries?: number;
    algorithm?: 'incremental' | 'exponential' | 'fibonacci';
    delayRatio?: number;
    maxDelay?: number;
}

export type BackoffIntermediate<A> = (err: A, tries: number, delay: number) => boolean;

export function incremental(n: number): number;
export function exponential(n: number): number;
export function fibonacci(n: number): number;

${generateBackoffInstance()}
`;
}
