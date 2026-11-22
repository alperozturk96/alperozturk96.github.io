You’ve probably heard of memory leaks before and applied a bunch of methods to prevent them during your iOS development journey. In this blogpost, we’ll discuss what memory leaks are, why they matter, and how Swift’s ARC helps us manage memory effectively.

# What's Memory Leak?

When we allocate variables or objects, the system reserves memory for them. Once we are done with these objects, that memory should be released so it can be reused. A memory leak happens when this deallocation does not occur, leaving memory occupied even though the object is no longer needed.

Over time, unreleased objects accumulate and consume system resources unnecessarily. Even if the leak is small, repeated occurrences can lead to degraded performance or, in severe cases, app termination by the system due to memory pressure.

# Are Memory Leaks Really That Important?

The impact depends on size and frequency. For example, leaking a simple class instance of 8 KB a few times probably won’t crash your app. But if that class participates in a chain of references or is used in a repetitive process like polling, memory usage can quickly grow out of control, harming performance and user experience.

Another challenge is unpredictability. Complex apps often have execution flows you can’t fully foresee. As engineers, it’s our responsibility to build scalable, maintainable, and robust architectures that manage memory reliably in all scenarios.

# What is ARC?

**Automatic Reference Counting**  [(ARC)](<https://docs.swift.org/swift-book/documentation/the-swift-programming-language/automaticreferencecounting/>)  is Swift’s memory management system. Every time we create a new instance of a class or actor, ARC allocates memory for it and keeps a count of strong references. When the reference count drops to zero, ARC automatically deallocates the object.

- Each new strong reference increments the count
- Each released strong reference decrements the count
- If a cycle exists (two objects strongly reference each other), the count never reaches zero and ARC cannot free the memory

# Value And Reference Types

In Swift programming language, we have two types, value and reference types. Value types create a new copy when assigned, while reference types share the same underlying instance in memory.

In the code below, we use a struct. When we assign `firstCar` to `secondCar`, a new copy is made. Changing `secondCar` does not affect `firstCar`.

```swift

struct Car {
    var modelname: String
    let hp: Int
}

let firstCar = Car(modelname: "FirstCar", hp: 110)
var secondCar = firstCar

secondCar.modelname = "SecondCar"

print(firstCar.modelname) // FirstCar
print(secondCar.modelname) // SecondCar

```

With classes, however, both variables point to the same memory. Updating one, updates the other as well, since they are just two references to the same instance.

```swift

class Car {
    var modelname: String
    let hp: Int

    init(modelname: String, hp: Int) {
        self.modelname = modelname
        self.hp = hp
    }
}

let firstCar = Car(modelname: "FirstCar", hp: 110)
var secondCar = firstCar

secondCar.modelname = "SecondCar"

print(firstCar.modelname) // SecondCar
print(secondCar.modelname) // SecondCar

```

# Relationships Between Reference Types

In Swift, references can be **strong**, **weak**, or **unowned**. These determine how ARC counts references and when objects can be deallocated.

By understanding these relationships, you gain control over object lifetimes and can prevent memory leaks.

## Strong

By default, references are *strong*. A strong reference increases the retain count, keeping the object alive as long as there is at least one strong reference to it.

```swift

class Car {
    var modelname: String
    let hp: Int

    init(modelname: String, hp: Int) {
        self.modelname = modelname
        self.hp = hp
    }
}

class Owner {
    let car: Car

    init(car: Car) {
        self.car = car
    }
}

```

## Weak

Declaring a reference as "weak" means that  [it does not participate](<https://developer.apple.com/videos/play/wwdc2021/10216/?time=380>)  in reference counting. Weak references are always `Optional` and automatically set to `nil` when the referenced object is deallocated. This makes them safe to use when the referenced object may go away before the holder.

```swift

class Car {
    var modelname: String
    let hp: Int

    init(modelname: String, hp: Int) {
        self.modelname = modelname
        self.hp = hp
    }
}

class Owner {
    weak var car: Car?

    init(car: Car) {
        self.car = car
    }
}

```

For example, you can use a weak reference type in the delegation, pattern.

```swift

protocol ImageProcessingDelegate: AnyObject {
    func process(_ data: Data)
}

class ImageProcessor {
    weak var delegate: ImageProcessingDelegate?

    func prepareImageAndProcess(_ url: String) {
        // prepare logic
        // ...
        // ...
        let data = Data()
        delegate?.process(data)
    }
}

final class ViewController: UIViewController {
    private let imageProcessor = ImageProcessor()

    override func viewDidLoad() {
        super.viewDidLoad()
        imageProcessor.delegate = self
        imageProcessor.prepareImageAndProcess("some_image_url")
    }
}

extension ViewController: @MainActor ImageProcessingDelegate {
    func process(_ data: Data) {
        // process logic ...
    }
}

```

## Unowned

An `unowned` reference also does not participate the retain count, but unlike `weak`, it is non-optional. ARC does not set it to `nil` when the object is freed. Accessing it after deallocation will cause a runtime crash. That’s why `unowned` is only safe when the lifetime of the referenced object is guaranteed to be same or longer than the one holding it.

```swift

class CreditCard {
    let number: String
    unowned let customer: Customer

    init(number: String, customer: Customer) {
        self.number = number
        self.customer = customer
    }
}

class Customer {
    let name: String
    var card: CreditCard?

    init(name: String) {
        self.name = name
    }
}

```

# Common Leak Scenarios and Solutions

## Strong Cycles Between Objects

In the following code, `Car` has a reference to `Owner` and `Owner` has a reference to `Car`. Both are strong, so neither object’s retain count can ever reach zero. As a result, their `deinit` methods never run.

```swift

class Car {
    var modelname: String
    let hp: Int
    var owner: Owner?

    init(modelname: String, hp: Int) {
        self.modelname = modelname
        self.hp = hp
    }

    deinit { print("Car deallocated") }
}

class Owner {
    let car: Car

    init(car: Car) {
        self.car = car
    }

    deinit { print("Owner deallocated") }
}

var owner: Owner? = Owner(car: Car(modelname: "Car", hp: 100))
owner?.car.owner = owner
owner = nil

```

To solve this, mark one side as `weak` or `unowned`, depending on the ownership model. Then ARC can correctly deallocate both objects.

## Closures Capturing self

Another very common source of leaks is closures capturing `self` strongly. For example, this `ViewModel` may live longer than intended if it’s captured by a long-running task. If the user navigates away, the view is destroyed, but the `ViewModel` is kept alive by the closure.

```swift

class ViewModel {
    var data: [String] = []
    var timer: Timer?

    func longRunningTask() {
        DispatchQueue.main.asyncAfter(deadline: .now() + 5) {
            self.data.append("Loaded")
        }
    }

    func startTimer() {
        timer = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) {
            self.tick()
        }
    }

    func asyncTask() {
        Task {
            await self.fetch()
        }
    }

    private func tick() {
        data.append("Tick")
    }

    private func fetch() async {
        try? await Task.sleep(nanoseconds: 1_000_000_000)
        data.append("Fetched")
    }
}

```

The fix is to capture `self` weakly inside closures. This ensures that when the `ViewModel` is no longer needed, it can be deallocated even if the closure hasn’t executed yet.

```swift

class ViewModel {
    var data: [String] = []
    var timer: Timer?

    func longRunningTask() {
        DispatchQueue.main.asyncAfter(deadline: .now() + 5) { [weak self] in
            self?.data.append("Loaded")
        }
    }

    func startTimer() {
        timer = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { [weak self] _ in
            self?.tick()
        }
    }

    func asyncTask() {
        Task { [weak self] in
            await self?.fetch()
        }
    }

    private func tick() {
        data.append("Tick")
    }

    private func fetch() async {
        try? await Task.sleep(nanoseconds: 1_000_000_000)
        data.append("Fetched")
    }

    deinit {
        timer?.invalidate()
        print("ViewModel deallocated")
    }
}

```

Timers strongly retain their targets (in this example, the closure), so it's critical to invalidate them in deinit (as shown above) to prevent the timer from keeping the ViewModel alive indefinitely.

Any class can leak if its references are not managed correctly. For instance, a transaction history class linked to a user object, which in turn references other objects, can easily form cycles if ownership is not carefully designed.

To build a good architecture, we should ask ourselves the following questions:

- Is there a long-running process keeping references alive (e.g., timers, tasks, observers)?
- Do we really need a class here, or would a value type such as a `struct` be sufficient?
- What is the intended lifecycle of this class—when should it be initialized, and when must it be guaranteed to deinitialize?

Classes like `NotificationCenter`, `Timer` and background tasks, event-driven architectures are particularly prone to leaks if not designed with clear ownership and lifecycle management. Careful handling of these is essential for predictable and stable memory behavior.

# Conclusion

Memory leaks may start small, but if ignored, they accumulate and harm your app’s performance and stability. By understanding ARC and carefully managing `strong`, `weak`, and `unowned` references, you can design safer, more scalable, and more maintainable applications.
