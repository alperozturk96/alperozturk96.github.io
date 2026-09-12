You’ve probably heard of **inline functions**, let’s go a little deeper and take a look at what they actually do and why they can be useful.

# Function Call Overhead

Before talking about inline functions, let’s first understand **why inlining exists in the first place**.

The exact implementation is not same in every programming language, but the underlying concept is similar. Languages such as **Kotlin and Swift** provide mechanisms for inlining functions, although the details and compiler behavior differ between them.

When a function is called, the generated machine code may need to perform additional work to transfer execution to the function and return back to the caller.

This is what we generally refer to as **function call overhead**.
However, it’s important to put this into perspective: we are usually talking about a **very small amount of work**.

Calling a function a few times is generally not a problem. But imagine a very small function being called millions of times for example, once for every element in a large collection, inside a performance-critical loop. In that situation, even a small amount of overhead can become measurable.

This is one of the situations where inlining can be useful.

# Inline Functions

So what does an inline function actually do?
Instead of generating a normal function call at a particular call site, the compiler can replace that call with the function’s body.

For example, without inlining we might have:

```text
caller
   ↓
function call
   ↓
function
   ↓
return
```

With inlining, the compiler can transform it into something closer to:

```text
caller
   ↓
function body directly
```

This means there is no separate function-call boundary at that call site.

# Why Don't We Always Inline Functions?

If inlining can make function calls faster, why don't we just inline everything?
Because inlining also has a cost.
When a function is inlined at multiple call sites, its machine-code body can effectively be duplicated. This can increase the size of the generated binary.
A larger binary can have other performance consequences as well for example, it can put more pressure on instruction caches and potentially hurt performance.
That's why blindly inlining every function isn't necessarily a good idea.

In general, **small and frequently executed functions** are better candidates for inlining, while large functions can make the resulting code significantly bigger if they are inlined at many different call sites.

Modern compilers are usually quite good at making these decisions themselves. They can decide to inline a function automatically based on factors such as function size, call frequency, optimization settings, and the surrounding code.

In Swift, attributes such as `@inline(never)` and `@inline(__always)` can also influence these decisions.

The following Swift example gives us two functions with similar behavior, but different inlining hints:

```swift
@inline(never)
func notInlined(_ x: Int) -> Int {
    return x * 2 + 1
}

@inline(__always)
func inlined(_ x: Int) -> Int {
    return x * 2 + 2
}

print(notInlined(10))
print(inlined(10))
```

We can compile it with optimizations enabled:

```bash
swiftc -O main.swift -o /tmp/test
```

Then run the executable:

```bash
/tmp/test
```

The output is:

```text
21
22
```

And you can inspect the generated machine code:

```bash
xcrun llvm-objdump -d /tmp/test
```

Keep in mind that the compiler is already doing a lot of this optimization automatically.
