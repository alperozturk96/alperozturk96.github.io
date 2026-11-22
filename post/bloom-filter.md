Sometimes we need to check existence of data inside a dataset. In many cases correctness is critical. But what if the dataset is huge and absolute correctness is not mandatory? What if a very small probability of error is acceptable, and performance and memory efficiency matter more?

In those situations, traditional data structures may not be the best choice. This is where probabilistic data structures like Bloom filters become very useful.

# Problem

Recently I needed to check the existence of a `String` inside a very large list of `String` values (around 300K elements). Approach like this, simply store them in an array and check not going to be good.

- Lookup with `array.contains` is **O(n)**.
- Storing all strings consumes noticeable memory.

In my case, correctness of this check was not critical. A rare false positive would not negatively affect the user experience. So instead of insisting on 100% accuracy, I preferred a faster and more space-efficient solution.

# Solution

During my research I came across the Bloom filter data structure.

A Bloom filter is a probabilistic data structure used to test whether an element is a member of a set. It can tell you:

- **Not in the set**
- **Possibly in the set**

The key idea is simple:

1. Take the hash of an item multiple times.
2. Each hash maps to an index in a bit array.
3. Set those indexes to `true`.

A bit array (bitset) is essentially an array of booleans. For example, if the calculated hashes for an item are 85, 63 and 11, then we set those indexes to `true`.

When checking for existence, instead of scanning the whole list, we:

- Recalculate the same hashes.
- Check whether all corresponding indexes are `true`.

If any of them is `false`, the item is not in the set. If all are `true`, the item is probably in the set.

# Implementation

Below is a simple Swift implementation. For simplicity, I used a boolean array as a bitset.

```swift

class BloomFilter {
    private let size: Int
    private let hashCount: Int
    var bitArray: [Bool]
    
    init(size: Int, hashCount: Int) {
        self.size = size
        self.hashCount = hashCount
        self.bitArray = [Bool](repeating: false, count: size)
    }

    func add(_ value: String) {
        for i in 0..<hashCount {
            let hashValue = hash(value, seed: i)
            bitArray[hashValue] = true
        }
    }

    func mightContain(_ value: String) -> Bool {
        for i in 0..<hashCount {
            let hashValue = hash(value, seed: i)
            if !bitArray[hashValue] {
                return false
            }
        }
        return true
    }

    private func hash(_ value: String, seed: Int) -> Int {
        var result = seed
        for char in value {
            result = 31 &* result &+ asciiValueInt(char)
        }
        return abs(result % size)
    }

    private func asciiValueInt(_ char: Character) -> Int {
        return Int(char.asciiValue ?? 0)
    }
}

```

During checking we simply verify whether the calculated hash indexes are set to `true`. We never compare full strings again and do not store the original data. That is where the performance gain comes from.

# Test

```swift

func test() {
    let bloom = BloomFilter(size: 1000, hashCount: 3)

    bloom.add("apple")
    bloom.add("banana")
    bloom.add("cherry")

    assert(bloom.mightContain("apple") == true, "Error: apple should be present")
    assert(bloom.mightContain("banana") == true, "Error: banana should be present")
    assert(bloom.mightContain("cherry") == true, "Error: cherry should be present")
    assert(bloom.mightContain("durian") == false, "Error: durian should NOT be present")
}

```

# Measure

I ran the following benchmark to compare a normal array lookup with a Bloom filter lookup.

Results on my machine:

Array lookup time: 212.65s  
 Bloom filter lookup time: 0.12s  
 Array memory estimate: 2430 KB  
 Bloom filter memory estimate: 976 KB

The difference is significant. The array lookup is linear and repeatedly scans the list. The Bloom filter performs a fixed number of hash operations and bit checks.

If we had used a `Set<String>` instead of an array, lookup would also be approximately **O(1)**. However, a set still stores the full strings in memory, while a Bloom filter only stores bits. So the real advantage appears when memory footprint matters.

```swift

func benchmark() {
    let n = 100_000
    let bloomSize = 1_000_000
    let hashCount = 5

    var array = [String]()
    let bloom = BloomFilter(size: bloomSize, hashCount: hashCount)

    for i in 0..<n {
        let item = "item\(i)"
        array.append(item)
        bloom.add(item)
    }

    let arrayStart = CFAbsoluteTimeGetCurrent()
    for i in 0..<n {
        _ = array.contains("item\(i)")
    }
    let arrayTime = CFAbsoluteTimeGetCurrent() - arrayStart

    let bloomStart = CFAbsoluteTimeGetCurrent()
    for i in 0..<n {
        _ = bloom.mightContain("item\(i)")
    }
    let bloomTime = CFAbsoluteTimeGetCurrent() - bloomStart

    let arrayMemory = memoryUsedByArray(array)
    let bloomMemory = bloom.bitArray.count * MemoryLayout<Bool>.size

    print("Array lookup time: \(arrayTime)s")
    print("Bloom filter lookup time: \(bloomTime)s")
    print("Array memory estimate: \(arrayMemory / 1024) KB")
    print("Bloom filter memory estimate: \(bloomMemory / 1024) KB")
}

func memoryUsedByArray(_ arr: [String]) -> Int {
    let stringSize = arr.reduce(0) { $0 + $1.utf8.count }
    let pointerOverhead = arr.count * MemoryLayout<String>.size
    return stringSize + pointerOverhead
}

```

# Conclusion

If the result of checking does not need to be perfectly accurate and you prioritize speed and memory efficiency, a Bloom filter is a very practical choice.

It is especially useful when dealing with very large datasets and when eliminating unnecessary full lookups can significantly improve responsiveness.
