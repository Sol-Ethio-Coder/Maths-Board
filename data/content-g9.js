/* Grade 9 lesson notes and quizzes. Add new lessons by copying a block and changing its id (see README, "Add a lesson").
   Notes block types: h, p, def, list, table, ex, warn, recap.   Quiz question: { q, o:[options], a:index of the right option, why } */
window.MB_CONTENT = window.MB_CONTENT || {};
Object.assign(window.MB_CONTENT, {

"g9-u1-l01": {
  minutes: 9,
  objective: "Write a set and say whether an object is an element of it.",
  notes: [
    { h: "Key ideas" },
    { def: ["Set", "A well-defined collection of objects. Well-defined means everyone agrees what is inside and what is outside."] },
    { def: ["Element", "An object that belongs to a set."] },
    { p: "We write a set with curly brackets and name it with a capital letter, for example A = {1, 2, 3}." },
    { table: [["Symbol", "Read as", "Example"], ["∈", "is an element of", "2 ∈ {1, 2, 3}"], ["∉", "is not an element of", "5 ∉ {1, 2, 3}"], ["n(A)", "number of elements of A", "n({a, b, c}) = 3"]] },
    { p: "The order of elements does not matter, and an element is never written twice: {3, 4, 5} and {5, 3, 4} are the same set." },
    { h: "Worked examples" },
    { ex: { q: "A is the set of even numbers less than 10. Write A and decide: is 4 ∈ A? Is 5 ∈ A?", steps: ["List the even numbers less than 10: 2, 4, 6, 8."], a: "A = {2, 4, 6, 8}. 4 ∈ A, and 5 ∉ A." } },
    { ex: { q: "B is the set of months in the Gregorian calendar (January to December) that have 30 days. Write B.", steps: ["Check each month: April, June, September and November have 30 days."], a: "B = {April, June, September, November}, so n(B) = 4." } },
    { ex: { q: "Is “the tall students in our class” a set?", steps: ["Ask: does everyone agree who is inside?", "“Tall” is not exact: how tall is tall?"], a: "No. It is not well-defined, so it is not a set." } },
    { warn: "Never write an element twice. The vowels of MATHEMATICS are {A, E, I}, not {A, E, A, I}." },
    { recap: ["A set is a well-defined collection of objects.", "The objects inside are called elements.", "Use ∈ (is an element of) and ∉ (is not an element of)."] }
  ],
  quiz: [
    { q: "Which of these is a set?", o: ["The tall students in a class", "The prime numbers less than 10", "Good songs", "Beautiful flowers"], a: 1, why: "Only the prime numbers less than 10 (2, 3, 5, 7) are well-defined. Words like tall, good and beautiful are matters of opinion." },
    { q: "Let A = {2, 4, 6, 8}. Which statement is true?", o: ["5 ∈ A", "6 ∈ A", "8 ∉ A", "4 ∉ A"], a: 1, why: "6 is listed in A, so 6 ∈ A." },
    { q: "How many elements does {a, b, c, d, e} have?", o: ["4", "5", "6", "1"], a: 1, why: "Count the listed elements: a, b, c, d, e. There are 5." },
    { q: "Write the set of vowels in the word MATHEMATICS.", o: ["{A, E, A, I}", "{A, E, I}", "{A, E, I, O, U}", "{M, T, H}"], a: 1, why: "The vowels used are A, E and I. We write each element once." },
    { q: "Is {3, 4, 5} the same set as {5, 3, 4}?", o: ["Yes, the order does not matter", "No, the order is different", "Only if both are written in a Venn diagram", "No, they have different numbers"], a: 0, why: "Sets are equal when they have the same elements. Order does not matter." },
    { q: "E = {1, 2, 2, 3}. How many elements does E have?", o: ["4", "3", "2", "1"], a: 1, why: "The repeated 2 counts once. E = {1, 2, 3}, so it has 3 elements." }
  ]
},

"g9-u1-l02": {
  minutes: 9,
  objective: "Describe a set in three ways: by listing, by a rule, and with a Venn diagram.",
  notes: [
    { h: "Three ways to describe a set" },
    { table: [["Method", "How it looks", "Example"], ["Roster (listing)", "List the elements in curly brackets", "A = {1, 2, 3, 4, 5}"], ["Rule (set-builder)", "State a property: x such that …", "A = {x : x is a positive integer less than 6}"], ["Venn diagram", "Draw a closed curve and write the elements inside", "A circle labelled A with 1, 2, 3, 4, 5 inside"]] },
    { p: "In the rule method the colon “:” is read “such that”. {x : x is a positive integer less than 6} reads “the set of all x such that x is a positive integer less than 6”." },
    { p: "Use the roster method for short sets and the rule method when the set is long or infinite." },
    { h: "Worked examples" },
    { ex: { q: "Write A = {x : x is a positive integer less than 6} by listing its elements.", steps: ["Positive integers less than 6 are 1, 2, 3, 4, 5."], a: "A = {1, 2, 3, 4, 5}" } },
    { ex: { q: "Describe {2, 4, 6, 8, 10} using a rule.", steps: ["What do the numbers have in common? They are even positive integers.", "The largest is 10."], a: "{x : x is an even positive integer, x ≤ 10}" } },
    { ex: { q: "Write C = {x : x² = 9} by listing its elements.", steps: ["x² = 9 means x = 3 or x = −3."], a: "C = {−3, 3}" } },
    { warn: "Check every number that fits the rule, including negatives. For x² = 9, writing only {3} is wrong." },
    { recap: ["Three ways: roster, rule, Venn diagram.", "“:” means “such that”.", "Always test every possible value, including negatives and the end points."] }
  ],
  quiz: [
    { q: "Write {x : x is a positive integer less than 5} by listing.", o: ["{1, 2, 3, 4}", "{1, 2, 3, 4, 5}", "{0, 1, 2, 3, 4}", "{5}"], a: 0, why: "Positive integers less than 5 are 1, 2, 3 and 4. The number 5 is not less than 5." },
    { q: "Which rule describes {1, 3, 5, 7, 9}?", o: ["{x : x is an odd positive integer less than 10}", "{x : x is an even positive integer less than 10}", "{x : x is a prime number less than 10}", "{x : x is a positive integer less than 10}"], a: 0, why: "All the listed numbers are odd and positive, and the largest is 9, which is less than 10." },
    { q: "Write {x : x² = 16} by listing.", o: ["{4}", "{−4, 4}", "{16}", "{−16, 16}"], a: 1, why: "Both 4 × 4 and (−4) × (−4) equal 16, so x = 4 or x = −4." },
    { q: "Write {x : x is an integer, −3 ≤ x < 2} by listing.", o: ["{−3, −2, −1, 0, 1}", "{−2, −1, 0, 1, 2}", "{−3, −2, −1, 0, 1, 2}", "{−2, −1, 0, 1}"], a: 0, why: "−3 is included (≤) but 2 is not (<). The integers are −3, −2, −1, 0, 1." },
    { q: "Which list is {x : x is a prime number between 10 and 30}?", o: ["{11, 13, 15, 17, 19}", "{11, 13, 17, 19, 23, 29}", "{12, 14, 16, 18}", "{11, 13, 17, 19, 21, 23}"], a: 1, why: "Primes between 10 and 30: 11, 13, 17, 19, 23, 29. The numbers 15 and 21 are not prime." },
    { q: "Which is NOT one of the three ways to describe a set?", o: ["Roster method", "Rule method", "Venn diagram", "Rounding method"], a: 3, why: "We use the roster method, the rule method and Venn diagrams." }
  ]
},

"g9-u1-l03": {
  minutes: 10,
  objective: "Use subset symbols, list all subsets of a set, and recognise the empty set and the universal set.",
  notes: [
    { h: "Key ideas" },
    { def: ["Subset (A ⊆ B)", "Every element of A is also an element of B."] },
    { def: ["Proper subset (A ⊂ B)", "A ⊆ B and A ≠ B. B has at least one element that A does not have."] },
    { def: ["Empty set (∅ or { })", "The set with no elements. It is a subset of every set."] },
    { def: ["Universal set (U)", "The big set that contains all the elements we are talking about."] },
    { table: [["Symbol", "Meaning", "Example"], ["⊆", "is a subset of", "{1, 2} ⊆ {1, 2, 3}"], ["⊂", "is a proper subset of", "{1, 2} ⊂ {1, 2, 3}"], ["⊄", "is not a subset of", "{1, 4} ⊄ {1, 2, 3}"], ["∅", "empty set", "∅ ⊆ A for every set A"]] },
    { p: "**Counting subsets.** A set with n elements has 2ⁿ subsets, and 2ⁿ − 1 proper subsets." },
    { h: "Worked examples" },
    { ex: { q: "A = {1, 2, 3} and B = {1, 2, 3, 4, 5}. Is A ⊂ B? Is B ⊆ A?", steps: ["Every element of A is in B, and B has more elements.", "4 is in B but not in A."], a: "A ⊂ B, and B ⊄ A." } },
    { ex: { q: "List all subsets of {a, b, c}.", steps: ["No elements: ∅.", "One element: {a}, {b}, {c}.", "Two elements: {a, b}, {a, c}, {b, c}.", "Three elements: {a, b, c}."], a: "8 subsets (1 + 3 + 3 + 1 = 8 = 2³)." } },
    { ex: { q: "How many subsets and proper subsets does a set with 5 elements have?", steps: ["Subsets: 2⁵ = 32.", "Proper subsets: remove the set itself: 32 − 1 = 31."], a: "32 subsets and 31 proper subsets." } },
    { warn: "Do not mix up ∈ and ⊆. For A = {1, 2, 3}: 2 ∈ A (2 is an element) but {2} ⊆ A (the set containing 2 is a subset). Also, ∅ is not {0}: {0} has one element, ∅ has none." },
    { recap: ["A ⊆ B means every element of A is in B.", "∅ is a subset of every set.", "A set with n elements has 2ⁿ subsets."] }
  ],
  quiz: [
    { q: "How many subsets does {a, b, c} have?", o: ["3", "6", "8", "9"], a: 2, why: "2³ = 8. They are ∅, three one-element sets, three two-element sets and {a, b, c}." },
    { q: "Which statement is always true?", o: ["∅ ⊆ A for every set A", "∅ = {0}", "A ⊂ A", "∅ has one element"], a: 0, why: "The empty set has no elements, so no element of ∅ can fail to be in A. It is a subset of every set." },
    { q: "A = {1, 2} and B = {1, 2, 3}. Which is correct?", o: ["B ⊂ A", "A ⊂ B", "A = B", "A ∈ B"], a: 1, why: "Every element of A is in B, and B has an extra element (3), so A is a proper subset of B." },
    { q: "For A = {1, 2, 3}, which statement is correct?", o: ["2 ⊆ A", "{2} ∈ A", "2 ∈ A and {2} ⊆ A", "2 ∉ A"], a: 2, why: "2 is an element of A, and the set {2} is a subset of A." },
    { q: "A set has 5 elements. How many proper subsets does it have?", o: ["25", "31", "32", "10"], a: 1, why: "It has 2⁵ = 32 subsets. Removing the set itself gives 31 proper subsets." },
    { q: "A set has 64 subsets. How many elements does it have?", o: ["5", "6", "7", "32"], a: 1, why: "2⁶ = 64, so the set has 6 elements." }
  ]
},

"g9-u1-l04": {
  minutes: 10,
  objective: "Find the union and intersection of two sets, and use n(A ∪ B) = n(A) + n(B) − n(A ∩ B).",
  notes: [
    { h: "Key ideas" },
    { def: ["Union (A ∪ B)", "All elements that are in A, or in B, or in both. Write common elements once."] },
    { def: ["Intersection (A ∩ B)", "Only the elements that are in both A and B."] },
    { def: ["Disjoint sets", "Two sets with no common element: A ∩ B = ∅."] },
    { p: "Memory tip: the symbol ∩ looks like the letter n in “iNtersection”." },
    { p: "**Counting rule:** n(A ∪ B) = n(A) + n(B) − n(A ∩ B). We subtract the overlap so it is not counted twice." },
    { h: "Worked examples" },
    { ex: { q: "A = {1, 2, 3, 4} and B = {3, 4, 5, 6}. Find A ∪ B and A ∩ B.", steps: ["Union: gather everything, writing 3 and 4 once.", "Intersection: only what is in both sets."], a: "A ∪ B = {1, 2, 3, 4, 5, 6}; A ∩ B = {3, 4}." } },
    { ex: { q: "A = {2, 4, 6, 8, 10} and B = {3, 6, 9, 12}. Find n(A ∪ B).", steps: ["A ∩ B = {6}, so n(A ∩ B) = 1.", "n(A) = 5 and n(B) = 4.", "n(A ∪ B) = 5 + 4 − 1."], a: "n(A ∪ B) = 8." } },
    { ex: { q: "In a class of 30, 18 play football, 14 play volleyball and 6 play both. How many play at least one? How many play neither?", steps: ["At least one: 18 + 14 − 6 = 26.", "Neither: 30 − 26 = 4."], a: "26 play at least one sport and 4 play neither." } },
    { warn: "In a union, do not write common elements twice. {1, 2, 3, 3, 4, 4, 5, 6} is wrong; write {1, 2, 3, 4, 5, 6}." },
    { recap: ["Union: in A or B (or both).", "Intersection: in both A and B.", "n(A ∪ B) = n(A) + n(B) − n(A ∩ B)."] }
  ],
  quiz: [
    { q: "A = {1, 2, 3} and B = {3, 4, 5}. What is A ∩ B?", o: ["{3}", "{1, 2, 3, 4, 5}", "{1, 2}", "∅"], a: 0, why: "Only 3 is in both sets." },
    { q: "For the same sets, what is A ∪ B?", o: ["{3}", "{1, 2, 3, 3, 4, 5}", "{1, 2, 3, 4, 5}", "{1, 2, 4, 5}"], a: 2, why: "Gather all elements and write 3 once." },
    { q: "n(A) = 12, n(B) = 9 and n(A ∩ B) = 4. Find n(A ∪ B).", o: ["25", "17", "21", "13"], a: 1, why: "12 + 9 − 4 = 17." },
    { q: "P = {a, b} and Q = {c, d}. Which statement is correct?", o: ["P ∩ Q = {a, b, c, d}", "P ∩ Q = ∅, so P and Q are disjoint", "P ∪ Q = ∅", "P ∩ Q = {a, c}"], a: 1, why: "They have no common element, so the intersection is empty and the sets are disjoint." },
    { q: "In a class of 30, 18 play football, 14 play volleyball and 6 play both. How many play at least one sport?", o: ["32", "26", "20", "38"], a: 1, why: "18 + 14 − 6 = 26." },
    { q: "Which statement is always true?", o: ["A ∩ B ⊆ A", "A ∪ B ⊆ A", "A ∩ B = A ∪ B", "A ∪ B = ∅"], a: 0, why: "Everything in A ∩ B is in both sets, so it is certainly in A." }
  ]
},

"g9-u1-l05": {
  minutes: 9,
  objective: "Find the complement of a set and the difference of two sets.",
  notes: [
    { h: "Key ideas" },
    { def: ["Complement (A′)", "All elements of the universal set U that are not in A."] },
    { def: ["Difference (A − B)", "The elements that are in A but not in B. This is the same as A ∩ B′."] },
    { table: [["Rule", "Meaning"], ["A ∪ A′ = U", "A and its complement together make the whole universal set"], ["A ∩ A′ = ∅", "A and its complement have nothing in common"], ["(A′)′ = A", "The complement of the complement is the set itself"], ["n(A′) = n(U) − n(A)", "Count of elements outside A"]] },
    { h: "Worked examples" },
    { ex: { q: "U = {1, 2, 3, …, 10} and A = {2, 4, 6, 8, 10}. Find A′.", steps: ["List the elements of U that are not in A."], a: "A′ = {1, 3, 5, 7, 9}." } },
    { ex: { q: "A = {1, 2, 3, 4, 5} and B = {4, 5, 6, 7}. Find A − B and B − A.", steps: ["A − B: elements of A that are not in B: 1, 2, 3.", "B − A: elements of B that are not in A: 6, 7."], a: "A − B = {1, 2, 3} and B − A = {6, 7}. They are different sets." } },
    { ex: { q: "n(U) = 40 and n(A) = 15. Find n(A′).", steps: ["n(A′) = n(U) − n(A) = 40 − 15."], a: "n(A′) = 25." } },
    { warn: "A − B and B − A are usually different. A complement only makes sense after you say what the universal set U is." },
    { recap: ["A′ = everything in U outside A.", "A − B = in A but not in B.", "n(A′) = n(U) − n(A)."] }
  ],
  quiz: [
    { q: "U = {1, 2, 3, 4, 5, 6, 7, 8} and A = {2, 4, 6, 8}. What is A′?", o: ["{2, 4, 6, 8}", "{1, 3, 5, 7}", "{1, 2, 3, 4}", "∅"], a: 1, why: "A′ is the elements of U that are not in A: 1, 3, 5, 7." },
    { q: "A = {1, 2, 3, 4, 5} and B = {4, 5, 6}. Find A − B.", o: ["{6}", "{4, 5}", "{1, 2, 3}", "{1, 2, 3, 6}"], a: 2, why: "Remove from A everything that is also in B." },
    { q: "For the same sets, find B − A.", o: ["{6}", "{1, 2, 3}", "{4, 5}", "{1, 2, 3, 6}"], a: 0, why: "Only 6 is in B and not in A." },
    { q: "n(U) = 50 and n(A) = 18. Find n(A′).", o: ["68", "32", "18", "28"], a: 1, why: "50 − 18 = 32." },
    { q: "Which statement is always true?", o: ["A ∩ A′ = U", "A ∪ A′ = U", "A − A = A", "A′ = A"], a: 1, why: "A together with its complement makes up the whole universal set." },
    { q: "When is A − B = B − A?", o: ["Always", "Never", "Only when A = B", "Only when A is empty"], a: 2, why: "If the two differences are equal, no element can be in only one of the sets, so A = B." }
  ]
},

"g9-u1-l06": {
  minutes: 11,
  objective: "Solve real-life counting problems with two-set Venn diagrams, and start three-set problems from the middle.",
  notes: [
    { h: "Method for two sets" },
    { list: ["Draw two overlapping circles inside a rectangle (the universal set).", "Fill the overlap first (the number in both).", "Subtract the overlap from each total to find “only A” and “only B”.", "Add everything up, then find “neither” = total − at least one."] },
    { table: [["Region", "How to find it"], ["Both", "n(A ∩ B)"], ["Only A", "n(A) − n(A ∩ B)"], ["Only B", "n(B) − n(A ∩ B)"], ["At least one", "n(A) + n(B) − n(A ∩ B)"], ["Neither", "n(U) − n(A ∪ B)"]] },
    { h: "Worked examples" },
    { ex: { q: "Of 40 students, 25 drink tea, 20 drink coffee and 10 drink both. Find: (a) at least one, (b) neither, (c) only tea, (d) only coffee.", steps: ["(a) 25 + 20 − 10 = 35.", "(b) 40 − 35 = 5.", "(c) 25 − 10 = 15.", "(d) 20 − 10 = 10."], a: "35 drink at least one; 5 neither; 15 only tea; 10 only coffee. (Check: 15 + 10 + 10 + 5 = 40.)" } },
    { ex: { q: "In a group of 60, 35 speak Amharic, 30 speak English and 12 speak neither. How many speak both?", steps: ["At least one language: 60 − 12 = 48.", "Both = 35 + 30 − 48."], a: "17 people speak both languages." } },
    { ex: { q: "Three sports. n(F ∩ V ∩ B) = 3, n(F ∩ V) = 7, n(V ∩ B) = 6, n(F ∩ B) = 5, n(F) = 15, n(V) = 14, n(B) = 12. How many play at least one?", steps: ["Start in the middle: all three = 3.", "Exactly two: F and V only = 7 − 3 = 4; V and B only = 6 − 3 = 3; F and B only = 5 − 3 = 2.", "Only one: F only = 15 − 4 − 2 − 3 = 6; V only = 14 − 4 − 3 − 3 = 4; B only = 12 − 3 − 2 − 3 = 4.", "Add all seven regions: 6 + 4 + 4 + 4 + 3 + 2 + 3."], a: "26 students play at least one sport." } },
    { warn: "Always check that the numbers in all regions add up to the total. In three-set problems, fill the middle region first." },
    { recap: ["Fill the overlap first.", "Only A = n(A) − n(A ∩ B).", "Neither = total − at least one."] }
  ],
  quiz: [
    { q: "n(A) = 20, n(B) = 15 and n(A ∩ B) = 5. Find n(A ∪ B).", o: ["35", "30", "40", "25"], a: 1, why: "20 + 15 − 5 = 30." },
    { q: "In a class of 45, 30 like maths, 25 like science and 12 like both. How many like neither?", o: ["2", "7", "12", "0"], a: 0, why: "At least one: 30 + 25 − 12 = 43. Neither: 45 − 43 = 2." },
    { q: "In the same class, how many like only maths?", o: ["30", "18", "12", "13"], a: 1, why: "Only maths = 30 − 12 = 18." },
    { q: "n(A ∪ B) = 50, n(A) = 32 and n(B) = 28. Find n(A ∩ B).", o: ["10", "18", "60", "22"], a: 0, why: "n(A ∩ B) = 32 + 28 − 50 = 10." },
    { q: "Of 100 people, 60 drink tea, 45 drink coffee and 20 drink neither. How many drink both?", o: ["5", "15", "25", "35"], a: 2, why: "At least one: 100 − 20 = 80. Both = 60 + 45 − 80 = 25." },
    { q: "In a three-set Venn diagram, which region should you fill first?", o: ["Only A", "The region where all three sets overlap", "Outside all circles", "Only C"], a: 1, why: "Start from the middle (all three) and work outwards, subtracting as you go." }
  ]
}

});
