Sometimes we need to execute a chain of tasks that are independent, from each other but collectively form a single process. In this blogpost I will show you how to do it in Swift.

Imagine a process that must be completed through multiple tasks. Once each task executes successfully, the entire process can be considered complete.

For example, consider a process divided into four tasks:

Task A → Task B → Task C → Task D.

Traditionally, task A must finish before Task B starts, and so on. This is sequential execution, but can we run tasks in parallel?

The answer is yes. While Task C is running for one piece of input data, we can begin Task A for another. Each input still follows the required sequential flow, but different inputs can occupy different stages at the same time. For example, as soon as Task A completes for input 1, Task B can start processing it, and Task A can immediately begin working on input 2. This significantly improves overall throughput.

In other words, rather than waiting for input 1 to fully complete the entire A → B → C → D sequence before starting on the next input, we allow multiple inputs to progress through different stages concurrently.

# Implementation

Let’s consider a real-world example in the context of air travel. Passengers go through multiple stages: check-in, security screening, passport control, and boarding. Each stage is independent, and staff only need to focus on their own task, not the whole process.

To implement this, we need to connect tasks through inputs and outputs. Each task receives an input and produces an output for the next task. I will demonstrate this in Swift using a protocol with associated types, but other languages can achieve the same result using generic interfaces.

```swift

protocol Procedure {
    associatedtype Input
    associatedtype Output

    func run(_ input: Input) async -> Output
}

```

Next, we create tasks that conform to this protocol.

```swift

struct CheckIn: Procedure {
    typealias Input = Passport
    typealias Output = Result<BoardingPass, Error>
    let flightNumber: String

    func run(_ input: Passport) async -> Output {
        print("[\(timestamp())] Check-in started: \(input.fullName)")
        try? await Task.sleep(nanoseconds: 10_000_000_000)
        if input.isExpired { return .failure(CheckInError.passportExpired) }
        let bp = BoardingPass(passenger: input.fullName, flightNumber: flightNumber, gate: "A12", boardingTime: Date())
        print("[\(timestamp())] Check-in completed: \(input.fullName)")
        return .success(bp)
    }

    enum CheckInError: Error, LocalizedError { case passportExpired; var errorDescription: String? { "Passport expired" } }
}

struct SecurityScreening: Procedure {
    typealias Input = Backpack
    typealias Output = Result<Bool, Error>

    func run(_ input: Backpack) async -> Output {
        print("[\(timestamp())] 🔍 Security scanning started: \(input.owner)")
        try? await Task.sleep(nanoseconds: 5_000_000_000)
        let dangerous = input.items.filter { $0.isDangerous }.map { $0.name }
        if !dangerous.isEmpty { return .failure(SecurityError.dangerousItemsDetected(dangerous)) }
        let total = input.items.reduce(0.0) { $0 + $1.weight }
        if total > 23 { return .failure(SecurityError.overweightBaggage(total)) }
        print("[\(timestamp())] 🔍 Security scanning completed: \(input.owner)")
        return .success(true)
    }

    enum SecurityError: Error, LocalizedError {
        case dangerousItemsDetected([String]), overweightBaggage(Double)
        var errorDescription: String? {
            switch self {
            case .dangerousItemsDetected(let items): return "Dangerous items: \(items.joined(separator: ", "))"
            case .overweightBaggage(let w): return "Overweight: \(w)kg"
            }
        }
    }
}

struct PassportControl: Procedure {
    typealias Input = (Passport, BoardingPass)
    typealias Output = Result<Bool, Error>

    func run(_ input: Input) async -> Output {
        print("[\(timestamp())]  🛂 Passport control started: \(input.0.fullName)")
        try? await Task.sleep(nanoseconds: 4_000_000_000)
        if input.0.isExpired { return .failure(PassportControlError.passportExpired) }
        print("[\(timestamp())]  🛂 Passport control completed: \(input.0.fullName)")
        return .success(true)
    }

    enum PassportControlError: Error, LocalizedError { case passportExpired; var errorDescription: String? { "Passport expired" } }
}

struct Boarding: Procedure {
    typealias Input = (Passport, BoardingPass)
    typealias Output = Result<Bool, Error>
    let currentGate: String

    func run(_ input: Input) async -> Output {
        print("[\(timestamp())] 🎫 Boarding check started: \(input.0.fullName) → Gate \(input.1.gate)")
        try? await Task.sleep(nanoseconds: 3_000_000_000)
        if input.1.gate != currentGate { return .failure(BoardingError.wrongGate) }
        print("[\(timestamp())] 🎫 Boarding check completed: \(input.0.fullName) → Gate \(input.1.gate)")
        return .success(true)
    }

    enum BoardingError: Error, LocalizedError { case wrongGate; var errorDescription: String? { "Wrong gate" } }
}

```

After creating individual tasks, we can build a pipeline to connect them and execute passengers sequentially through stages, but in parallel wherever possible.

```swift

actor PassengerPipeline {
    private let generator = PassengerGenerator()

    func run() async {
        let passengers = generator.generatePassengers(count: 20)
        print("\n📋 Generated \(passengers.count) passengers")

        // Queues for each stage
        let checkInQueue = AsyncQueue<Passenger>()
        let securityQueue = AsyncQueue<PassengerResult>()
        let passportQueue = AsyncQueue<PassengerResult>()
        let boardingQueue = AsyncQueue<PassengerResult>()

        // Stage 1: Check-in
        Task.detached {
            for _ in 0..<passengers.count {
                let passenger = await checkInQueue.pop()
                let checkIn = CheckIn(flightNumber: "FL1212")
                let result: PassengerResult
                switch await checkIn.run(passenger.passport) {
                case .success(let bp):
                    result = PassengerResult(passenger: passenger, success: true, failedAt: nil, error: nil, boardingPass: bp)
                case .failure(let error):
                    result = PassengerResult(passenger: passenger, success: false, failedAt: .checkIn, error: error, boardingPass: nil)
                }
                await securityQueue.push(result)
            }
        }

        // Stage 2: Security
        Task.detached {
            for _ in 0..<passengers.count {
                let result = await securityQueue.pop()
                let finalResult: PassengerResult
                if result.success, let bp = result.boardingPass {
                    let security = SecurityScreening()
                    switch await security.run(result.passenger.backpack) {
                    case .success:
                        finalResult = result
                    case .failure(let error):
                        finalResult = PassengerResult(passenger: result.passenger, success: false, failedAt: .securityScreening, error: error, boardingPass: bp)
                    }
                } else {
                    finalResult = result
                }
                await passportQueue.push(finalResult)
            }
        }

        // Stage 3: Passport Control
        Task.detached {
            for _ in 0..<passengers.count {
                let result = await passportQueue.pop()
                let finalResult: PassengerResult
                if result.success, let bp = result.boardingPass {
                    let passportControl = PassportControl()
                    switch await passportControl.run((result.passenger.passport, bp)) {
                    case .success:
                        finalResult = result
                    case .failure(let error):
                        finalResult = PassengerResult(passenger: result.passenger, success: false, failedAt: .passportControl, error: error, boardingPass: bp)
                    }
                } else {
                    finalResult = result
                }
                await boardingQueue.push(finalResult)
            }
        }

        // Stage 4: Boarding
        Task.detached {
            for _ in 0..<passengers.count {
                let result = await boardingQueue.pop()
                let finalResult: PassengerResult
                if result.success, let bp = result.boardingPass {
                    let boarding = Boarding(currentGate: "A12")
                    switch await boarding.run((result.passenger.passport, bp)) {
                    case .success:
                        finalResult = result
                    case .failure(let error):
                        finalResult = PassengerResult(passenger: result.passenger, success: false, failedAt: .boarding, error: error, boardingPass: bp)
                    }
                } else {
                    finalResult = result
                }

                if finalResult.success {
                    print("✅ Passenger \(finalResult.passenger.passport.fullName) completed all steps.")
                } else {
                    print("❌ Passenger \(finalResult.passenger.passport.fullName) failed at \(finalResult.failedAt!.rawValue): \(finalResult.error!.localizedDescription)")
                }
            }
        }

        // Feed passengers to first stage
        for passenger in passengers {
            await checkInQueue.push(passenger)
        }
    }
}

actor AsyncQueue<Element> {
    private var items: [Element] = []
    private var continuations: [CheckedContinuation<Element, Never>] = []

    func push(_ item: Element) {
        if let cont = continuations.first {
            continuations.removeFirst()
            cont.resume(returning: item)
        } else {
            items.append(item)
        }
    }

    func pop() async -> Element {
        if let item = items.first {
            items.removeFirst()
            return item
        } else {
            return await withCheckedContinuation { cont in
                continuations.append(cont)
            }
        }
    }
}
    
```

Output demonstrates how each passenger moves through the pipeline stages without unnecessary waiting:

```swift

📋 Generated 20 passengers
[20:52:56.934] Check-in started: Mary Ramirez
[20:53:07.476] Check-in completed: Mary Ramirez
[20:53:07.477] Check-in started: Elizabeth Moore
[20:53:07.477] 🔍 Security scanning started: Mary Ramirez
[20:53:12.757] 🔍 Security scanning completed: Mary Ramirez
[20:53:12.758] 🛂 Passport control started: Mary Ramirez
[20:53:16.993] 🛂 Passport control completed: Mary Ramirez
[20:53:16.993] 🎫 Boarding check started: Mary Ramirez → Gate A12
[20:53:17.993] Check-in completed: Elizabeth Moore
[20:53:17.994] 🔍 Security scanning started: Elizabeth Moore
[20:53:17.994] Check-in started: Thomas Brown
[20:53:20.126] 🎫 Boarding check completed: Mary Ramirez → Gate A12
✅ Passenger Mary Ramirez completed all steps.
[20:53:23.309] 🔍 Security scanning completed: Elizabeth Moore
[20:53:23.309] 🛂 Passport control started: Elizabeth Moore
[20:53:27.472] 🛂 Passport control completed: Elizabeth Moore
[20:53:27.472] 🎫 Boarding check started: Elizabeth Moore → Gate A12
[20:53:28.528] Check-in completed: Thomas Brown
[20:53:28.529] Check-in started: Linda Wilson
[20:53:28.529] 🔍 Security scanning started: Thomas Brown
[20:53:30.474] 🎫 Boarding check completed: Elizabeth Moore → Gate A12
✅ Passenger Elizabeth Moore completed all steps.
[20:53:33.647] 🔍 Security scanning completed: Thomas Brown
[20:53:33.648] 🛂 Passport control started: Thomas Brown
[20:53:37.697] 🛂 Passport control completed: Thomas Brown
[20:53:37.698] 🎫 Boarding check started: Thomas Brown → Gate A12
[20:53:38.990] Check-in completed: Linda Wilson
[20:53:38.991] Check-in started: Michael Wilson
[20:53:38.991] 🔍 Security scanning started: Linda Wilson
[20:53:40.880] 🎫 Boarding check completed: Thomas Brown → Gate A12
✅ Passenger Thomas Brown completed all steps.
[20:53:43.993] 🔍 Security scanning completed: Linda Wilson
[20:53:43.994] 🛂 Passport control started: Linda Wilson
[20:53:48.247] 🛂 Passport control completed: Linda Wilson
[20:53:48.248] 🎫 Boarding check started: Linda Wilson → Gate A12
[20:53:49.431] Check-in completed: Michael Wilson
[20:53:49.431] Check-in started: Elizabeth Robinson
[20:53:49.432] 🔍 Security scanning started: Michael Wilson
[20:53:51.344] 🎫 Boarding check completed: Linda Wilson → Gate A12
✅ Passenger Linda Wilson completed all steps.
[20:53:54.628] 🔍 Security scanning completed: Michael Wilson
[20:53:54.629] 🛂 Passport control started: Michael Wilson
[20:53:58.888] 🛂 Passport control completed: Michael Wilson
[20:53:58.889] 🎫 Boarding check started: Michael Wilson → Gate A12
[20:54:00.002] Check-in completed: Elizabeth Robinson
[20:54:00.004] Check-in started: Daniel Young
[20:54:00.005] 🔍 Security scanning started: Elizabeth Robinson
[20:54:01.990] 🎫 Boarding check completed: Michael Wilson → Gate A12
✅ Passenger Michael Wilson completed all steps.
[20:54:05.265] 🔍 Security scanning completed: Elizabeth Robinson
[20:54:05.265] 🛂 Passport control started: Elizabeth Robinson
[20:54:09.475] 🛂 Passport control completed: Elizabeth Robinson
[20:54:09.476] 🎫 Boarding check started: Elizabeth Robinson → Gate A12
[20:54:10.471] Check-in completed: Daniel Young
[20:54:10.472] Check-in started: Susan Davis
[20:54:10.472] 🔍 Security scanning started: Daniel Young
[20:54:12.584] 🎫 Boarding check completed: Elizabeth Robinson → Gate A12
✅ Passenger Elizabeth Robinson completed all steps.
[20:54:15.477] 🔍 Security scanning completed: Daniel Young
[20:54:15.478] 🛂 Passport control started: Daniel Young
[20:54:19.713] 🛂 Passport control completed: Daniel Young
[20:54:19.714] 🎫 Boarding check started: Daniel Young → Gate A12
[20:54:20.993] Check-in completed: Susan Davis
[20:54:20.994] Check-in started: James Lee
[20:54:20.994] 🔍 Security scanning started: Susan Davis
[20:54:22.754] 🎫 Boarding check completed: Daniel Young → Gate A12
✅ Passenger Daniel Young completed all steps.
[20:54:26.161] 🔍 Security scanning completed: Susan Davis
[20:54:26.162] 🛂 Passport control started: Susan Davis
[20:54:30.425] 🛂 Passport control completed: Susan Davis
[20:54:30.426] 🎫 Boarding check started: Susan Davis → Gate A12
[20:54:31.473] Check-in completed: James Lee
[20:54:31.474] Check-in started: Nancy Thomas
[20:54:31.474] 🔍 Security scanning started: James Lee
[20:54:33.587] 🎫 Boarding check completed: Susan Davis → Gate A12
✅ Passenger Susan Davis completed all steps.
[20:54:36.753] 🔍 Security scanning completed: James Lee
[20:54:36.754] 🛂 Passport control started: James Lee
[20:54:40.991] 🛂 Passport control completed: James Lee
[20:54:40.992] 🎫 Boarding check started: James Lee → Gate A12
[20:54:41.990] Check-in completed: Nancy Thomas
[20:54:41.991] Check-in started: Daniel Walker
[20:54:41.991] 🔍 Security scanning started: Nancy Thomas
[20:54:43.994] 🎫 Boarding check completed: James Lee → Gate A12
✅ Passenger James Lee completed all steps.
    
```

# Conclusion

The pipeline pattern is very useful for processes composed of independent stages. It allows tasks to run efficiently, improving performance.
