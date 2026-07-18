Let's examine yet another great language feature from Swift.

# Copyable

By default, Swift types implicitly conform to the Copyable protocol. 
This applies to structs, classes, actors, enums, and other types.
Basically, whenever you assign one value to another, Swift allows that value to have
independent value.

```swift
let user = User(id: 1, name: "Leo")
let user2 = user
```

user2 behaves as an independent value with the same data as user.


For example:

```swift
struct User { }

struct User: Copyable { }
```

These two structs have the same behavior because Copyable is already implicit. For normal data types
this behavior is exactly what we want.


# ~Copyable

But sometimes we have values where duplication does not make sense. For those cases Swift provides ~Copyable.
The ~ symbol means not. ~Copyable is not about preventing duplication of data. It is about
preventing duplication of ownership.

```swift
struct Socket: ~Copyable {
    // let's assume, fd represents an OS-owned socket resource
    let fd: Int
    
    func close() {
        print("closing \(fd)")
    }
}
```

Now Swift will not allow accidental duplication. This is not a copy. Because the type is noncopyable,
Swift performs a move and transfers ownership to socket2.

```swift
let socket = Socket(fd: 1)
let socket2 = socket
socket.close() // The original variable cannot be used anymore.
```

And this will compile and work.

```swift
let socket = Socket(fd: 1)
let socket2 = socket
socket2.close()
```

## The problem with normal methods

This prevents copying, but we still have another problem. The function can be called multiple times:

```swift
let socket = Socket(fd: 1)
let socket2 = socket
socket2.close()
socket2.close()
socket2.close()
```

But closing a resource is usually a one-time operation.

Calling close multiple times may cause unexpected behavior:

- double cleanup
- invalid resource usage
- hidden bugs in larger systems

So we need a way to say:

"After this operation, ownership is finished."

# consuming

This is where consuming comes in. A consuming method takes ownership of the value. After the call,
the original value is considered consumed and cannot be used again.

```swift
struct Socket: ~Copyable {
    let fd: Int
    
    consuming func close() {
        print("closing \(fd)")
    }
}
```

The second call does not compile because 'socket2' consumed more than once. This gives us a powerful
guarantee

- ~Copyable prevents multiple owners.
- consuming prevents using the owner after ownership is transferred.

Together they allow Swift to model unique resources safely.

```swift
let socket = Socket(fd: 1)
let socket2 = socket
socket2.close()
socket2.close()
```

# consume operator

There is also an explicit way to transfer ownership using the consume operator.

```swift
struct Connection: ~Copyable {
    let id: Int
}

let connection = Connection(id: 1)

let connection2 = consume connection
```

**This means:**

Move this value into connection2 and mark connection as consumed. After this you cannot call
`connection.id` because connection has been consumed and is no longer a valid value that can be used.

