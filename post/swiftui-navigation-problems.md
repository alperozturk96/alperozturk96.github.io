There's no doubt that building UIs with SwiftUI is fast and enjoyable. However, the developer experience isn't always seamless. One of the most notable pain points is navigation. Developers coming from UIKit where navigation is highly flexible and under your full control may find SwiftUI’s navigation limiting and frustrating at times.

# NavigationLink

Back in iOS 13, navigation was primarily handled using  [NavigationView](<https://developer.apple.com/documentation/swiftui/navigationview>)  alongside  [NavigationLink](<https://developer.apple.com/documentation/swiftui/navigationlink>)  . This approach encouraged a more declarative, state-driven navigation model instead of programmatic control. While it aligned with SwiftUI’s philosophy, it introduced several limitations and quirks that made it difficult to implement dynamic or conditional navigation flows.

# Using NavigationLink Inside a List

One common issue occurs when using  [NavigationLink](<https://developer.apple.com/documentation/swiftui/navigationlink>)  inside a  [List](<https://developer.apple.com/documentation/swiftui/list>)  to navigate to a destination view (e.g. DetailView). SwiftUI eagerly initializes all destination views for each item in the list. Yes, it sounds surprising but it’s true. Normally, we would expect the destination view to be initialized only when the user takes an action to navigate to it. SwiftUI evaluates all destinations up front, potentially leading to unnecessary computation and side effects.

```swift

import SwiftUI

@main
struct ExampleApp: App {
    var body: some Scene {
        WindowGroup {
            NavigationView {
                HomeView()
            }
        }
    }
}

struct HomeView: View {
    let items = (1...100).map { "Item \($0)" }

    var body: some View {
        VStack {
            List(items, id: \.self) { item in
                NavigationLink(destination: HomeDetailView(item: item)) {
                    Text(item)
                }
            }
        }
        .navigationTitle("Home")
    }
}

struct HomeDetailView: View {

    private let item: String

    init(item: String) {
        print("HomeDetailView initialized")
        self.item = item
    }

    var body: some View {
        Text("\(item)")
    }
}

```

If you run the exact code in Xcode, you’ll observe the following output.

```swift

HomeDetailView initialized
HomeDetailView initialized
HomeDetailView initialized
HomeDetailView initialized
HomeDetailView initialized
HomeDetailView initialized
HomeDetailView initialized
HomeDetailView initialized
HomeDetailView initialized
HomeDetailView initialized
HomeDetailView initialized
HomeDetailView initialized
HomeDetailView initialized
HomeDetailView initialized
HomeDetailView initialized
...

```

# Pushing the Same View Multiple Times & Dynamically Controlling Navigation

Imagine that after completing an operation such as a network request you want to navigate to a different view. The typical SwiftUI approach involves binding a value to a  [NavigationLink](<https://developer.apple.com/documentation/swiftui/navigationlink>)  . This can be done using a  [@State](<https://developer.apple.com/documentation/swiftui/state>)  property type or a  [@Published](<https://developer.apple.com/documentation/combine/published>)  property inside an  [ObservableObject](<https://developer.apple.com/documentation/combine/observableobject>)  .

Some might describe this pattern as “programmatic” navigation, but in practice, it’s only partially true. What we’re really doing is updating some state, which in turn triggers SwiftUI to navigate. The flow looks something like this:

A value is set → a published value changes → SwiftUI detects the change in the view model → navigation is triggered.

We’re not directly performing a navigation action instead, we rely on the observing mechanism and bindings to make it happen.

This approach is debated among developers. Some appreciate the declarative nature, while others especially those coming from UIKit miss having direct control over navigation. To be clear, this isn't about being against declarative approach, but rather about the ability to trigger navigation directly when needed.

Since iOS 16, using `NavigationLink(isActive:)` is deprecated, and SwiftUI introduced  [NavigationStack](<https://developer.apple.com/documentation/swiftui/navigationstack>)  with  [NavigationPath](<https://developer.apple.com/documentation/swiftui/navigationpath>)  for a more flexible and scalable solution. We'll explore that shortly.

Another problem with the old approach is that if the bound state toggles too quickly due to a race condition or something like a double-tap, the same destination view can be pushed multiple times. Although it may be difficult to reproduce in this simple demo project, this issue has been widely discussed in the community and remains a common pain point.

To demonstrate the problem, I triggered a double-tap on the navigation button and was able to reproduce the duplicate push behavior.

## Views

```swift

import SwiftUI

@main
struct ExampleApp: App {
    var body: some Scene {
        WindowGroup {
            NavigationView {
                HomeView()
            }
        }
    }
}

struct HomeView: View {
    @StateObject private var viewModel = HomeViewModel()

    var body: some View {
        VStack {
            Button("Complete Payment") {
                Task {
                    await viewModel.completePayment()
                }
            }

            NavigationLink(
                destination: HomeDetailView(item: "Payment Completed"),
                isActive: $viewModel.isPaymentCompleted
            ) {
                EmptyView()
            }
        }
        .navigationTitle("Home")
    }
}

struct HomeDetailView: View {

    private let item: String

    init(item: String) {
        print("HomeDetailView initialized")
        self.item = item
    }

    var body: some View {
        Text("\(item)")
    }
}

```

## ViewModel

```swift

import Foundation

@MainActor
final class HomeViewModel: ObservableObject {
    @Published var isPaymentCompleted: Bool = false

    func completePayment() async {
        isPaymentCompleted = false
        try? await Task.sleep(nanoseconds: 1_000_000_000)
        isPaymentCompleted = true
    }
}

```

## Pushing the Same View Due to Double Tap

<video class="video" controls="">
    <source src="/asset/swiftui-navigation-problems/double_tap.mp4" type="video/mp4">
    Your browser does not support the video tag.
</video>

# Improvements in iOS 16

With iOS 16, Apple introduced a much improved navigation API in SwiftUI, addressing many of the long standing concerns developers had voiced over previous versions. The older navigation approach based on  [NavigationView](<https://developer.apple.com/documentation/swiftui/navigationview>)  and  [NavigationLink](<https://developer.apple.com/documentation/swiftui/navigationlink>)  has effectively been superseded by  [NavigationStack](<https://developer.apple.com/documentation/swiftui/navigationstack>)  ,  [NavigationSplitView](<https://developer.apple.com/documentation/swiftui/navigationsplitview>)  ,and the  [navigationDestination(for:destination:)](<https://developer.apple.com/documentation/swiftui/view/navigationdestination(for:destination:)>)  view modifier.

## NavigationDestination

To support a fully programmatic navigation model, we can define a  [Hashable](<https://developer.apple.com/documentation/swift/hashable>)  enum representing our navigation destinations. This allows us to model navigation paths explicitly and compare destinations, enabling us to prevent duplicate views from being pushed onto the stack.

For instance, in the case of a payment flow, we might define a destination like `.paymentDetail(PaymentDetails)`. The `PaymentDetails` struct containing a unique identifier ensures that each navigation event is uniquely represented.

```swift

import Foundation

enum NavigationDestination: Hashable {
    case paymentDetail(PaymentDetails)

    func hash(into hasher: inout Hasher) {
        hasher.combine(self.hashValue)
    }

    static func == (lhs: NavigationDestination, rhs: NavigationDestination) -> Bool {
        switch (lhs, rhs) {
        case (.paymentDetail(let lhsValue), .paymentDetail(let rhsValue)):
            return lhsValue.id == rhsValue.id
        }
    }
}

struct PaymentDetails: Hashable, Identifiable {
    var id: UUID
    var name: String
    var amount: Int
}

```

## Views

With this setup, we use  [NavigationStack](<https://developer.apple.com/documentation/swiftui/navigationstack>)  in conjunction with an array of navigation destinations. When a user action occurs, we construct the destination and check if it already exists in the path before appending it. This guards against issues like duplicate navigation caused by rapid taps or race conditions.

```swift


@main
struct ExampleApp: App {
    @State private var path: [NavigationDestination] = .init()

    var body: some Scene {
        WindowGroup {
            NavigationStack(path: $path, root: {
                HomeView(path: $path)
            })
        }
    }
}

struct HomeView: View {
    @StateObject private var viewModel = HomeViewModel()
    @Binding var path: [NavigationDestination]

    var body: some View {
        VStack {
            Button("Complete Payment") {
                Task {
                    let paymentDetails = await viewModel.completePayment()
                    let destination = NavigationDestination.paymentDetail(paymentDetails)
                    if path.contains(destination) {
                        return
                    }
                    path.append(destination)
                }
            }
        }
        .navigationDestination(for: NavigationDestination.self) { destination in
            switch destination {
            case .paymentDetail(let paymentDetails):
                PaymentDetailView(paymentDetails)
            }
        }
        .navigationTitle("Home")
    }
}

```

# My Thoughts

Before I share my personal opinion, I want to be clear: I’m not claiming that the current SwiftUI navigation system is wrong. With the recent improvements, it’s possible to build clean, robust, and maintainable navigation flows. However, I do question whether it could be simpler.

Why do we need  [NavigationPath](<https://developer.apple.com/documentation/swiftui/navigationpath>)  and the  [navigationDestination(for:destination:)](<https://developer.apple.com/documentation/swiftui/view/navigationdestination(for:destination:)>)  view modifier? At the end of the day, most of our needs are relatively straightforward: push a new view, pop back, return to the root, or pop to a specific view.  [UINavigationController](<https://developer.apple.com/documentation/uikit/uinavigationcontroller>)  already solved these problems long time ago in UIKit.

In SwiftUI, we now need to define a  [Hashable](<https://developer.apple.com/documentation/swift/hashable>)  enum for destinations and write multiple  [navigationDestination(for:destination:)](<https://developer.apple.com/documentation/swiftui/view/navigationdestination(for:destination:)>)  modifiers to declare what each destination should present. There are many variations of this pattern in the community some use a single modifier, others encapsulate route logic inside enums, and some abstract it further. As mentioned earlier, with good structure, it can be made elegant. But the question remains: is this really the simplest path?

# Navigator

**Navigator** is a lightweight wrapper I created around UIKit’s `UINavigationController`. It allows you to use SwiftUI views and provides imperative navigation control, such as:

- Push any view
- Pop back to the previous view
- Pop to a specific view
- Pop to the root view
- Clear the entire navigation stack
- Set a custom navigation stack

To use it, simply place your root SwiftUI view inside a `NavigationView` or `NavigationStack`, then perform navigation via the  [Navigator](<https://github.com/alperozturk96/Navigator>)  using optional string-based identifiers. It’s minimal, flexible, and reminiscent of UIKit's straightforward navigation model.

```swift

import SwiftUI
import Navigator

@main
struct ExampleApp: App {
    var body: some Scene {
        WindowGroup {
            NavigationStack {
                HomeView()
            }
        }
    }
}

struct HomeView: View {
    @StateObject private var viewModel = HomeViewModel()

    var body: some View {
        VStack {
            Button("Complete Payment") {
                Task {
                    let paymentDetails = await viewModel.completePayment()
                    let destination = PaymentDetailView(item: paymentDetails)
                    Navigator.shared.push(destination, identifier: "PaymentDetailView")
                }
            }
        }
        .navigationTitle("Home")
    }
}

struct PaymentDetailView: View {

    private let item: PaymentDetails

    init(item: PaymentDetails) {
        print("PaymentDetailView initialized")
        self.item = item
    }

    var body: some View {
        Text(item.name)
    }
}

```

# Conclusion

In this post, I’ve summarized SwiftUI’s navigation evolution, highlighted key problems, and presented my  [Navigator](<https://github.com/alperozturk96/Navigator>)  solution. I'm not suggesting this approach as a production ready or superior solution, but rather as an alternative concept. At the end of the day, I enjoy writing and sharing code, and this was a fun exercise in rethinking SwiftUI navigation.
