# Customizing the Navigation Bar in SwiftUI
<br>
This blog post explores how to customize the navigation bar's background and title color in SwiftUI. You might wonder why such a basic task requires a dedicated blog post. The reason is simple: SwiftUI, especially in its early iterations, does not offer a straightforward, out-of-the-box solution for this functionality.
<br><br>

## Background
<br>
Prior to iOS 16, SwiftUI did not provide native modifiers for customizing navigation bar appearance. Developers frequently relied on UIKit to achieve this customization, leveraging SwiftUI's interoperability with UIKit.
<br><br>

### Using `UINavigationBar, UINavigationBarAppearance`
<br>

A common method before iOS 16 involved modifying the`UINavigationBar` appearance within a view's initializer:

```swift
struct ContentView: View {
    init() {
        let appearance = UINavigationBarAppearance()
        appearance.configureWithOpaqueBackground()
        appearance.backgroundColor = UIColor.systemBlue
        appearance.titleTextAttributes = [.foregroundColor: UIColor.white]
        appearance.largeTitleTextAttributes = [.foregroundColor: UIColor.white]

        UINavigationBar.appearance().standardAppearance = appearance
        UINavigationBar.appearance().compactAppearance = appearance
        UINavigationBar.appearance().scrollEdgeAppearance = appearance
    }

    var body: some View {
        NavigationView {
            Text("Hello, World!")
                .navigationTitle("My App")
        }
    }
}
```

While functional, this approach applies the customization globally and is not reusable across individual views without code repetition. Attempting to wrap this configuration within a`ViewModifier` directly does not yield the desired results.

We could create another BaseView and add this logic there, using it as a parent view for all the other views we plan to use in our project.

However, I don't want that behavior. I just want a modifier that changes the navigation bar color and title color.
<br><br>

### NavigationBarViewModifier

Here's a more flexible and reusable solution that works on iOS 13 and above:

```swift
import SwiftUI
import UIKit

struct NavigationBarViewModifier: ViewModifier {
    let title: String
    let foregroundColor: Color
    let backgroundColor: Color
    let displayMode: NavigationBarItem.TitleDisplayMode

    func body(content: Content) -> some View {
        content
            .navigationBarTitle(title, displayMode: displayMode)
            .configureNavigationBar {
                let appearance = UINavigationBarAppearance()
                appearance.shadowColor = .clear
                appearance.configureWithOpaqueBackground()
                appearance.titleTextAttributes = [.foregroundColor: UIColor(foregroundColor)]
                appearance.backgroundColor = UIColor(backgroundColor)

                $0.navigationBar.standardAppearance = appearance
                $0.navigationBar.scrollEdgeAppearance = appearance
                $0.navigationBar.compactAppearance = appearance
            }
    }
}

private extension View {
    func configureNavigationBar(configure: @escaping (UINavigationController) -> Void) -> some View {
        modifier(NavigationConfigurationViewModifier(configure: configure))
    }
}

extension View {
    func navigationBarStyle(
        title: String,
        foregroundColor: Color = .white,
        backgroundColor: Color = .blue,
        displayMode: NavigationBarItem.TitleDisplayMode = .inline
    ) -> some View {
        modifier(NavigationBarViewModifier(
            title: title,
            foregroundColor: foregroundColor,
            backgroundColor: backgroundColor,
            displayMode: displayMode
        ))
    }
}

struct NavigationConfigurationViewModifier: ViewModifier {
    let configure: (UINavigationController) -> Void

    func body(content: Content) -> some View {
        content.background(NavigationConfigurator(configure: configure))
    }
}

private struct NavigationConfigurator: UIViewControllerRepresentable {
    let configure: (UINavigationController) -> Void

    func makeUIViewController(
        context: Context
    ) -> NavigationConfigurationViewController {
        NavigationConfigurationViewController(configure: configure)
    }

    func updateUIViewController(
        _ uiViewController: NavigationConfigurationViewController,
        context: Context
    ) { }
}

private final class NavigationConfigurationViewController: UIViewController {
    let configure: (UINavigationController) -> Void

    init(configure: @escaping (UINavigationController) -> Void) {
        self.configure = configure
        super.init(nibName: nil, bundle: nil)
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()

        if let navigationController = navigationController {
            configure(navigationController)
        }
    }
}
```

This approach modifies the navigation bar after the view has been initialized. As a result, users might briefly observe the default navigation bar appearance before your customizations are applied, particularly if the view requires additional loading time.
<br><br>

### Improvements in iOS 16+

Starting with iOS 16, SwiftUI introduced a more native way to style navigation bars:

```swift
.navigationTitle("My App")
.toolbarBackground(Color.blue, for: .navigationBar)
.toolbarBackground(.visible, for: .navigationBar)
```

However, this newer API has its own set of limitations:

* It is only available on iOS 16 and later.
* It offers limited styling options; properties like title color, font, and size cannot be changed directly using this method.
* The `toolbarBackground` modifier expects a `ColorScheme`, not a `Color`.

At the time of writing, there is no single, perfect solution for comprehensively styling the navigation bar across all iOS versions in SwiftUI. UIKit interoperability remains essential for achieving full customization capabilities.

I’m genuinely curious why such a basic feature was missing from the initial version of SwiftUI. However, it’s not really surprising— the issue wasn’t just the lack of modifiers for the navigation bar; the navigation system itself was flawed and, in some ways, still is. I will explain this in more detail in a separate blog post.