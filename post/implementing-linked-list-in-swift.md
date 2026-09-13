Swift doesn't have a built-in LinkedList, so I wanted to implement one for fun :)

A linked list basically consists of nodes. Each node contains two things: a value and a reference to the next node. I'm excluding doubly linked lists and a tail reference for now to keep the implementation simple.

The next property is used to access the next node, which can be stored at a different location in memory. Unlike an array, a linked list doesn't require all of its elements to be stored in one contiguous block of memory.

# Implementation

First, we need a Node structure:

```swift
final class Node<T> {
    let value: T
    var next: Node?

    init(value: T, next: Node? = nil) {
        self.value = value
        self.next = next
    }

    func describe() {
        print("value: \(value), next: \(next?.value, default: "nil")")
    }
}
```

The linked list itself will have a head. This head is the entry point we use to access, delete, and add items.

We also need the list to be generic and Equatable so we can compare values when performing operations such as removing a node with a specific value.

```swift
final class LinkedList<T: Equatable> {
    private var head: Node<T>?
    ...
}
```

# Insert

First, we create a new node. If head is nil, there is nothing else to do, so we can make the new node the head directly.

Otherwise, we reach the last node and then set it's next property to the new node.

```swift
final class LinkedList<T: Equatable> {
    private var head: Node<T>?
    
    func insert(_ value: T) {
        let newNode = Node(value: value)
        
        guard let head else {
            self.head = newNode
            return
        }
        
        var current = head
        
        // reach end of the list
        while let next = current.next {
            current = next
        }
        
        // add new node
        current.next = newNode
    }
}
```

# Get

The get operation follows a similar approach. Using while let, we can unwrap each non-nil node and check whether its value matches the value we're looking for.

If it doesn't, we move to the next node and continue until we find a match or reach the end of the list.

```swift
final class LinkedList<T: Equatable> {
    private var head: Node<T>?
    
    func get(_ value: T) -> Node<T>? {
        var current = head
        
        while let node = current {
            if node.value == value {
                return node
            }
            
            current = node.next
        }
        
        return nil
    }
}
```

# Remove

First, we check whether the list has a head. If it doesn't, there is nothing to remove.

If the head itself contains the value we're looking for, we can simply move head to the next node. The old head is no longer referenced by the list, so ARC can clean it up when there are no other references to it.

For the rest of the list, we keep track of the current node and inspect it's next node. If the next node contains the value we're looking for, we skip it by setting current.next to next.next.

```swift
final class LinkedList<T: Equatable> {
    private var head: Node<T>?
    
    func remove(_ value: T) {
        guard let head else {
            return
        }
        
        // move head to the next
        if head.value == value {
            self.head = head.next
            return
        }
        
        var current = head
        
        while let next = current.next {
            // move next to the next's next
            if next.value == value {
                current.next = next.next
                return
            }
            
            current = next
        }
    }
}
```

# Helper methods

If we set head to nil, the list no longer has a reference to any of its nodes. There are no other references to those nodes, ARC will take care of releasing them.

isEmpty is just a check against head, contains can reuse our existing get method.

The describe method is simply there to make it easier to see what the list looks like.

```swift
final class LinkedList<T: Equatable> {
    private var head: Node<T>?
    
    func removeAll() {
        head = nil
    }
    
    func isEmpty() -> Bool {
        return head == nil
    }
    
    func contains(_ value: T) -> Bool {
        return get(value) != nil
    }
    
    func describe() {
        guard let head else {
            print("list is empty")
            return
        }
        
        var current = head
        current.describe()
        
        while let next = current.next {
            current = next
            current.describe()
        }
    }
}
```

# Final Implementation

```swift
final class Node<T> {
    let value: T
    var next: Node?
    
    init(value: T, next: Node? = nil) {
        self.value = value
        self.next = next
    }
    
    func describe() {
        print("value: \(value), next: \(next?.value, default: "nil")")
    }
}

final class LinkedList<T: Equatable> {
    private var head: Node<T>?
    
    func removeAll() {
        head = nil
    }
    
    func isEmpty() -> Bool {
        return head == nil
    }
    
    func contains(_ value: T) -> Bool {
        return get(value) != nil
    }
    
    func insert(_ value: T) {
        let newNode = Node(value: value)
        
        guard let head else {
            self.head = newNode
            return
        }
        
        var current = head
        
        // reach end of the list
        while let next = current.next {
            current = next
        }
        
        // add new node
        current.next = newNode
    }
    
    func get(_ value: T) -> Node<T>? {
        var current = head
        
        while let node = current {
            if node.value == value {
                return node
            }
            
            current = node.next
        }
        
        return nil
    }
    
    func remove(_ value: T) {
        guard let head else {
            return
        }
        
        // move head to the next
        if head.value == value {
            self.head = head.next
            return
        }
        
        var current = head
        
        while let next = current.next {
            // move next to the next's next
            if next.value == value {
                current.next = next.next
                return
            }
            
            current = next
        }
    }
    
    func describe() {
        guard let head else {
            print("list is empty")
            return
        }
        
        var current = head
        current.describe()
        
        while let next = current.next {
            current = next
            current.describe()
        }
    }
}
```
