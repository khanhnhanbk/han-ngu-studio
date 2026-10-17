import { describe, expect, it } from "vitest";

import { Heap, compareTuples } from "./heap";

const num = (a: number, b: number) => a - b;

describe("Heap", () => {
  it("pops sorted for random input with duplicates", () => {
    const h = new Heap<number>(num);
    const xs = Array.from({ length: 200 }, (_, i) => (i * 7919) % 31);
    xs.forEach((x) => h.push(x));
    const out: number[] = [];
    while (h.size) out.push(h.pop() as number);
    expect(out).toEqual([...xs].sort(num));
  });
  it("supports interleaved push/pop, peek and empty pop", () => {
    const h = new Heap<number>(num);
    expect(h.pop()).toBeUndefined();
    h.push(5);
    h.push(2);
    expect(h.peek()).toBe(2);
    expect(h.pop()).toBe(2);
    h.push(1);
    h.push(9);
    expect([h.pop(), h.pop(), h.pop(), h.pop()]).toEqual([1, 5, 9, undefined]);
  });
});

describe("compareTuples", () => {
  it("respects each position", () => {
    expect(compareTuples([0, 9], [1, 0])).toBe(-1);
    expect(compareTuples([1, 0], [0, 9])).toBe(1);
    expect(compareTuples([1, 2, 3], [1, 2, 4])).toBe(-1);
    expect(compareTuples([1, 2, 3], [1, 2, 3])).toBe(0);
    expect(compareTuples([10], [9])).toBe(1); // numeric, not string
  });
});
